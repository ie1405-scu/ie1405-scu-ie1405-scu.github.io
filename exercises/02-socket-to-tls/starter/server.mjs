// نقطهٔ شروع تمرین ۲ (Node 22). فقط net و tls و crypto؛ ماژول http و کتابخانه‌های HTTP مجاز نیستند.
//   node server.mjs 8000            HTTP
//   node server.mjs 8443 --tls      همان سرور روی TLS
import net from 'node:net'
import tls from 'node:tls'
import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'

const port = Number(process.argv[2] || 8000)
const secure = process.argv.includes('--tls')
const SAMESITE = process.env.SAMESITE || 'Lax'      // مقدار off یعنی بدون این attribute
const START = 2000000                               // موجودی اولیهٔ هر کاربر، به تومان

function onConnection(sock) {
  let buf = Buffer.alloc(0)
  sock.on('error', () => {})
  sock.on('data', (d) => {
    buf = Buffer.concat([buf, d])
    // گام ۱
    // TODO ۱: تا وقتی '\r\n\r\n' در buf هست، یک پیام کامل جدا کنید:
    //         خط درخواست، فیلدها (نام فیلد به بزرگی و کوچکی حرف حساس نیست)، و بدنه به اندازهٔ Content-Length.
    //         اگر بدنه هنوز کامل نرسیده، صبر کنید تا data بعدی برسد.
    // TODO ۲: پاسخ را بسازید: خط وضعیت، فیلدها با Content-Length به بایت، خط خالی، بدنه
    // TODO ۳: اگر Connection: close بود، بعد از پاسخ sock.end()؛ وگرنه سراغ درخواست بعدی در buf بروید
    // گام ۲
    // TODO ۴: فیلد Cookie را بخوانید؛ شناسهٔ نشست را با crypto.randomBytes(16) بسازید و نشست‌ها را در یک Map نگه دارید
    // TODO ۵: برای هر درخواست یک خط لاگ: متد، مسیر، نشست داشت یا نه، Origin و Sec-Fetch-Site
  })
}

// گام ۳
// TODO ۶: اگر secure بود، به‌جای net.createServer از tls.createServer استفاده کنید،
//         با گواهی و کلید از process.env.TLS_CERT و process.env.TLS_KEY (پیش‌فرض cert.pem و key.pem)
const server = net.createServer(onConnection)
server.listen(port, () => console.log(`http://localhost:${port}/`))
