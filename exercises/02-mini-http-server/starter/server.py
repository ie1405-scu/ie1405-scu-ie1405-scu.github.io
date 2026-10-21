# نقطهٔ شروع تمرین ۲ (Python 3.11+). فقط ماژول socket؛ http.server و کتابخانه‌های HTTP مجاز نیستند.
# اجرا: python3 server.py 8080
import socket
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


def handle(conn: socket.socket) -> None:
    buf = b""
    while True:
        data = conn.recv(65536)
        if not data:
            return
        buf += data
        # TODO ۱: تا وقتی b"\r\n\r\n" در buf هست، یک پیام کامل جدا کنید:
        #         خط درخواست، فیلدها (نام فیلد به بزرگی و کوچکی حرف حساس نیست)، و بدنه به اندازهٔ Content-Length
        # TODO ۲: پاسخ را بسازید: خط وضعیت، فیلدها با Content-Length به بایت، خط خالی، بدنه
        # TODO ۳: اگر Connection: close بود، بعد از پاسخ اتصال را ببندید؛ وگرنه منتظر درخواست بعدی بمانید


with socket.create_server(("127.0.0.1", PORT)) as srv:
    print(f"http://127.0.0.1:{PORT}/")
    while True:
        conn, _ = srv.accept()
        with conn:
            handle(conn)
