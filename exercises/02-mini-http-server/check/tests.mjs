// آزمون‌های تمرین ۲. هر آزمون یک درخواست خام می‌فرستد و پاسخ خام را بررسی می‌کند.
// این فایل عمومی است؛ آزمون‌های پنهان در grader/ جداست.
import net from 'node:net'

// یک یا چند تکهٔ خام را می‌فرستد و هرچه تا بسته شدن اتصال یا پایان مهلت برسد برمی‌گرداند
export function raw(port, chunks, { wait = 700, gap = 60 } = {}) {
  return new Promise((resolve) => {
    const out = []; const s = net.connect(port, '127.0.0.1')
    const done = () => { s.destroy(); resolve(Buffer.concat(out)) }
    s.on('data', d => out.push(d)); s.on('error', done); s.on('close', done)
    s.on('connect', async () => {
      for (const c of [].concat(chunks)) { s.write(c); await new Promise(r => setTimeout(r, gap)) }
      setTimeout(done, wait)
    })
  })
}

// پاسخ‌های پشت‌سرهم را با تکیه بر Content-Length از هم جدا می‌کند
export function parse(buf) {
  const res = []; let i = 0
  while (i < buf.length) {
    const end = buf.indexOf('\r\n\r\n', i); if (end < 0) break
    const head = buf.subarray(i, end).toString('latin1').split('\r\n')
    const [, code] = head[0].split(' ')
    const h = {}
    for (const l of head.slice(1)) { const k = l.slice(0, l.indexOf(':')).trim().toLowerCase(); h[k] = l.slice(l.indexOf(':') + 1).trim() }
    const len = Number(h['content-length'] || 0)
    res.push({ status: Number(code), line: head[0], h, body: buf.subarray(end + 4, end + 4 + len) })
    i = end + 4 + len
  }
  return res
}

const R = (s) => s.replace(/\n/g, '\r\n')
export const tests = [
  ['GET / با Host پاسخ 200 و Content-Length درست دارد', async p => {
    const [r] = parse(await raw(p, R('GET / HTTP/1.1\nHost: localhost\nConnection: close\n\n')))
    return r?.status === 200 && Number(r.h['content-length']) === r.body.length
  }],
  ['درخواست HTTP/1.1 بدون Host پاسخ 400 می‌گیرد', async p => {
    const [r] = parse(await raw(p, R('GET / HTTP/1.1\nConnection: close\n\n'))); return r?.status === 400
  }],
  ['در /hello?name=… طول بدنهٔ فارسی به بایت حساب می‌شود', async p => {
    const [r] = parse(await raw(p, R('GET /hello?name=%D8%B9%D9%84%DB%8C HTTP/1.1\nHost: localhost\nConnection: close\n\n')))
    return r?.status === 200 && r.body.toString('utf8').includes('علی') && Number(r.h['content-length']) === r.body.length && /charset=utf-8/i.test(r.h['content-type'] || '')
  }],
  ['HEAD همان header‌های GET را دارد، بدون بدنه', async p => {
    const g = parse(await raw(p, R('GET / HTTP/1.1\nHost: localhost\nConnection: close\n\n')))[0]
    const b = await raw(p, R('HEAD / HTTP/1.1\nHost: localhost\nConnection: close\n\n'))
    const end = b.indexOf('\r\n\r\n'); const h = b.subarray(0, end).toString('latin1')
    return / 200 /.test(h.split('\r\n')[0]) && b.length === end + 4 && new RegExp(`content-length:\\s*${g?.h['content-length']}`, 'i').test(h)
  }],
  ['مسیر ناموجود پاسخ 404 دارد', async p => (parse(await raw(p, R('GET /nope HTTP/1.1\nHost: localhost\nConnection: close\n\n')))[0]?.status === 404)],
  ['متد پشتیبانی‌نشده روی مسیر موجود: 405 همراه Allow', async p => {
    const [r] = parse(await raw(p, R('DELETE / HTTP/1.1\nHost: localhost\nConnection: close\n\n'))); return r?.status === 405 && /GET/.test(r.h.allow || '')
  }],
  ['نشانی /old با 308 به /hello می‌رود', async p => {
    const [r] = parse(await raw(p, R('GET /old HTTP/1.1\nHost: localhost\nConnection: close\n\n'))); return r?.status === 308 && /\/hello$/.test(r.h.location || '')
  }],
  ['در POST /echo بدنه دقیقاً به اندازهٔ Content-Length خوانده می‌شود', async p => {
    const [r] = parse(await raw(p, R('POST /echo HTTP/1.1\nHost: localhost\nContent-Length: 5\nConnection: close\n\n') + 'hello'))
    return r?.status === 200 && r.body.toString() === 'hello'
  }],
  ['دو درخواست پشت‌سرهم روی یک اتصال، دو پاسخ به همان ترتیب', async p => {
    const rs = parse(await raw(p, R('GET /nope HTTP/1.1\nHost: localhost\n\nGET / HTTP/1.1\nHost: localhost\nConnection: close\n\n')))
    return rs.length === 2 && rs[0].status === 404 && rs[1].status === 200
  }],
  ['چالش: Content-Length و Transfer-Encoding با هم، پاسخ 400', async p => {
    const [r] = parse(await raw(p, R('POST /echo HTTP/1.1\nHost: localhost\nContent-Length: 4\nTransfer-Encoding: chunked\n\n0\n\n'))); return r?.status === 400
  }],
  ['چالش: دو Content-Length متفاوت، پاسخ 400', async p => {
    const [r] = parse(await raw(p, R('POST /echo HTTP/1.1\nHost: localhost\nContent-Length: 3\nContent-Length: 5\n\nhello'))); return r?.status === 400
  }],
]

export async function run(port, list = tests) {
  let ok = 0; const results = []
  for (const [name, t] of list) {
    let pass = false
    try { pass = await t(port) } catch { pass = false }
    results.push({ name, pass }); if (pass) ok++
    console.log(`${pass ? '✓' : '✗'} ${name}`)
  }
  console.log(`\n${ok} از ${list.length} آزمون گذشت.`)
  return { ok, total: list.length, results }
}
