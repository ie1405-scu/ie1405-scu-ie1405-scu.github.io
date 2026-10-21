// خودآزمایی تمرین ۲:  node check/check.mjs 8080
// اول سرورتان را روی همین پورت اجرا کنید.
import { run } from './tests.mjs'
const port = Number(process.argv[2] || 8080)
const { ok, total } = await run(port)
process.exit(ok === total ? 0 : 1)
