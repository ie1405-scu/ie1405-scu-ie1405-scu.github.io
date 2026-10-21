// تمرین ۳: ورود با کوکی نشست.   node server.mjs 8000   (SAMESITE=Strict node server.mjs 8000)
// ماژول http مجاز است؛ کتابخانهٔ نشست و چارچوب وب نه.
import http from 'node:http'

const port = Number(process.argv[2] || 8000)
const SAMESITE = process.env.SAMESITE || 'Lax'      // Lax | Strict | None | off
const sessions = new Map()                          // شناسهٔ نشست → { user, balance }

const readForm = req => new Promise((ok) => { let b = ''; req.on('data', c => (b += c)); req.on('end', () => ok(new URLSearchParams(b))) })

http.createServer(async (req, res) => {
  // TODO: کوکی sid را از req.headers.cookie بخوانید و نشست را پیدا کنید
  // TODO: یک خط لاگ بنویسید: متد، مسیر، نشست داشت یا نه، Origin و Sec-Fetch-Site
  // TODO: مسیرهای /  و /login و /me و /transfer و /logout
  res.writeHead(501, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('هنوز پیاده نشده\n')
}).listen(port, () => console.log(`http://localhost:${port}  SameSite=${SAMESITE}`))
