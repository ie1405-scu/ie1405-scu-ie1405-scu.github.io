// خودآزمایی تمرین ۳:  node check/check.mjs 8000        (کار پایه)
//                      node check/check.mjs 8000 --csrf (کار پایه و چالش)
// اول سرورتان را روی همین پورت اجرا کنید؛ هر اجرا یک نشست تازه می‌سازد.
import { run } from './tests.mjs'
const port = Number(process.argv[2] || 8000)
const { ok, total } = await run(port, { csrf: process.argv.includes('--csrf') })
process.exit(ok === total ? 0 : 1)
