// آزمون‌های تمرین ۳. همهٔ header‌ها را خودمان می‌نویسیم؛ برای همین از node:http استفاده می‌کنیم، نه fetch.
import http from 'node:http'

export function request(port, method, path, { headers = {}, body } = {}) {
  return new Promise((ok, fail) => {
    const h = { ...headers }
    if (body !== undefined) { h['Content-Type'] = 'application/x-www-form-urlencoded'; h['Content-Length'] = Buffer.byteLength(body) }
    const req = http.request({ host: '127.0.0.1', port, method, path, headers: h }, (res) => {
      let data = ''; res.setEncoding('utf8'); res.on('data', c => (data += c)); res.on('end', () => ok({ status: res.statusCode, headers: res.headers, body: data }))
    })
    req.on('error', fail); req.setTimeout(3000, () => req.destroy(new Error('timeout')))
    req.end(body)
  })
}
export const sessionCookie = res => (res.headers['set-cookie'] || []).find(c => !/max-age=0/i.test(c)) || ''
export const pair = c => c.split(';')[0]                       // name=value
export const balance = t => Number((t.match(/balance=(\d+)/) || [])[1])

export async function run(port, { csrf = false, quiet = false } = {}) {
  const results = []
  const t = async (name, fn) => { try { const r = await fn(); results.push([name, r === true, r === true ? '' : r]) } catch (e) { results.push([name, false, e.message]) } }
  let c1 = ''

  await t('GET /me بدون کوکی → 401', async () => (await request(port, 'GET', '/me')).status === 401 || 'کد وضعیت 401 نبود')
  await t('POST /login → Set-Cookie با HttpOnly و Path=/', async () => {
    const r = await request(port, 'POST', '/login', { body: 'user=ali' }); c1 = sessionCookie(r)
    if (![200, 303].includes(r.status)) return `کد وضعیت ${r.status}`
    if (!c1) return 'Set-Cookie نیامد'
    if (!/;\s*httponly/i.test(c1)) return 'HttpOnly ندارد'
    return /;\s*path=\//i.test(c1) || 'Path=/ ندارد'
  })
  await t('کوکی SameSite دارد (Lax یا Strict)', async () => /;\s*samesite=(lax|strict)/i.test(c1) || `Set-Cookie: ${c1}`)
  await t('شناسهٔ نشست تصادفی و بلند است', async () => {
    const v = pair(c1).split('=')[1] || ''
    if (/ali/i.test(v)) return 'نام کاربر در شناسه است'
    const r2 = await request(port, 'POST', '/login', { body: 'user=ali' })
    if (pair(sessionCookie(r2)) === pair(c1)) return 'دو ورود یک شناسه گرفتند'
    return v.length >= 22 || `طول شناسه ${v.length}؛ ۱۶ بایت تصادفی دست‌کم ۲۲ نویسه است`
  })
  await t('GET /me با کوکی → 200 و user=ali balance=1000', async () => {
    const r = await request(port, 'GET', '/me', { headers: { Cookie: pair(c1) } })
    return (r.status === 200 && /user=ali/.test(r.body) && balance(r.body) === 1000) || `${r.status} ${r.body.trim()}`
  })
  await t('POST /transfer بدون کوکی → 401', async () => (await request(port, 'POST', '/transfer', { body: 'to=sara&amount=100' })).status === 401 || 'کد وضعیت 401 نبود')
  await t('POST /transfer با کوکی → موجودی ۹۰۰', async () => {
    const r = await request(port, 'POST', '/transfer', { headers: { Cookie: pair(c1) }, body: 'to=sara&amount=100' })
    const me = await request(port, 'GET', '/me', { headers: { Cookie: pair(c1) } })
    return (r.status === 200 && balance(me.body) === 900) || `${r.status}؛ موجودی ${balance(me.body)}`
  })
  if (csrf) {
    for (const site of ['cross-site', 'same-site']) {
      await t(`چالش: POST /transfer با Sec-Fetch-Site: ${site} → 403 و موجودی دست‌نخورده`, async () => {
        const r = await request(port, 'POST', '/transfer', { headers: { Cookie: pair(c1), 'Sec-Fetch-Site': site, Origin: 'http://localhost:9000' }, body: 'to=mallory&amount=100' })
        const me = await request(port, 'GET', '/me', { headers: { Cookie: pair(c1) } })
        return (r.status === 403 && balance(me.body) === 900) || `${r.status}؛ موجودی ${balance(me.body)}`
      })
    }
    await t('چالش: POST /transfer با Sec-Fetch-Site: same-origin → 200', async () => {
      const r = await request(port, 'POST', '/transfer', { headers: { Cookie: pair(c1), 'Sec-Fetch-Site': 'same-origin' }, body: 'to=sara&amount=100' })
      return r.status === 200 || `کد وضعیت ${r.status}`
    })
    await t('چالش: GET /api/me از origin مجاز → اجازهٔ CORS دقیق', async () => {
      const r = await request(port, 'GET', '/api/me', { headers: { Cookie: pair(c1), Origin: 'http://localhost:9000' } })
      if (r.headers['access-control-allow-origin'] !== 'http://localhost:9000') return `Access-Control-Allow-Origin: ${r.headers['access-control-allow-origin']}`
      if (r.headers['access-control-allow-credentials'] !== 'true') return 'Access-Control-Allow-Credentials نیست'
      return /origin/i.test(r.headers.vary || '') || 'Vary: Origin نیست'
    })
    await t('چالش: GET /api/me از origin دیگر → بدون اجازهٔ CORS', async () => {
      const r = await request(port, 'GET', '/api/me', { headers: { Cookie: pair(c1), Origin: 'http://127.0.0.1:9000' } })
      if (r.status !== 200) return `کد وضعیت ${r.status}؛ /api/me با نشست معتبر باید 200 بدهد`
      return r.headers['access-control-allow-origin'] === undefined || `Access-Control-Allow-Origin: ${r.headers['access-control-allow-origin']}`
    })
  }
  await t('POST /logout → همان کوکی دیگر کار نمی‌کند', async () => {
    await request(port, 'POST', '/logout', { headers: { Cookie: pair(c1) } })
    return (await request(port, 'GET', '/me', { headers: { Cookie: pair(c1) } })).status === 401 || 'بعد از خروج هنوز 200 می‌دهد؛ نشست در سرور پاک نشده'
  })
  if (!quiet) for (const [name, ok, why] of results) console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `   ← ${why}`}`)
  const ok = results.filter(r => r[1]).length
  if (!quiet) console.log(`\n${ok} از ${results.length}`)
  return { ok, total: results.length, results: results.map(([name, pass, why]) => ({ name, pass, why })) }
}
