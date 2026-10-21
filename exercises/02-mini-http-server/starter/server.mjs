// نقطهٔ شروع تمرین ۲ (Node 22). فقط ماژول net؛ http و کتابخانه‌های HTTP مجاز نیستند.
// اجرا: node server.mjs 8080
import net from 'node:net'

const port = Number(process.argv[2] || 8080)

net.createServer((sock) => {
  let buf = Buffer.alloc(0)
  sock.on('data', (d) => {
    buf = Buffer.concat([buf, d])
    // TODO ۱: تا وقتی '\r\n\r\n' در buf هست، یک پیام کامل جدا کنید:
    //         خط درخواست، فیلدها (نام فیلد به بزرگی و کوچکی حرف حساس نیست)، و بدنه به اندازهٔ Content-Length
    // TODO ۲: پاسخ را بسازید: خط وضعیت، فیلدها با Content-Length به بایت، خط خالی، بدنه
    // TODO ۳: اگر Connection: close بود، بعد از پاسخ sock.end()؛ وگرنه منتظر درخواست بعدی بمانید
  })
}).listen(port, () => console.log(`http://127.0.0.1:${port}/`))
