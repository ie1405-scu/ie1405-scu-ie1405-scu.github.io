# نقطهٔ شروع تمرین ۲ (Python 3.11+). فقط socket و ssl و secrets؛ http.server و کتابخانه‌های HTTP مجاز نیستند.
#   python3 server.py 8000            HTTP
#   python3 server.py 8443 --tls      همان سرور روی TLS
import os
import secrets
import socket
import ssl
import sys
import threading

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
SECURE = "--tls" in sys.argv
SAMESITE = os.environ.get("SAMESITE", "Lax")  # مقدار off یعنی بدون این attribute
START = 2000000                                # موجودی اولیهٔ هر کاربر، به تومان


def handle(conn: socket.socket) -> None:
    buf = b""
    while True:
        try:
            data = conn.recv(65536)
        except OSError:
            return
        if not data:
            return
        buf += data
        # گام ۱
        # TODO ۱: تا وقتی b"\r\n\r\n" در buf هست، یک پیام کامل جدا کنید:
        #         خط درخواست، فیلدها (نام فیلد به بزرگی و کوچکی حرف حساس نیست)، و بدنه به اندازهٔ Content-Length.
        #         اگر بدنه هنوز کامل نرسیده، صبر کنید تا recv بعدی.
        # TODO ۲: پاسخ را بسازید: خط وضعیت، فیلدها با Content-Length به بایت، خط خالی، بدنه
        # TODO ۳: اگر Connection: close بود، بعد از پاسخ return؛ وگرنه سراغ درخواست بعدی در buf بروید
        # گام ۲
        # TODO ۴: فیلد Cookie را بخوانید؛ شناسهٔ نشست را با secrets.token_urlsafe(16) بسازید و نشست‌ها را در یک dict نگه دارید
        # TODO ۵: برای هر درخواست یک خط لاگ: متد، مسیر، نشست داشت یا نه، Origin و Sec-Fetch-Site


def serve(conn: socket.socket) -> None:
    with conn:
        handle(conn)


with socket.create_server(("127.0.0.1", PORT)) as srv:
    # گام ۳
    # TODO ۶: اگر SECURE بود، یک ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER) بسازید،
    #         گواهی و کلید را از os.environ["TLS_CERT"] و os.environ["TLS_KEY"] بار کنید (پیش‌فرض cert.pem و key.pem)
    #         و srv را با context.wrap_socket(srv, server_side=True) بپوشانید.
    print(f"http://localhost:{PORT}/")
    while True:
        try:
            conn, _ = srv.accept()
        except (ssl.SSLError, OSError):
            continue
        threading.Thread(target=serve, args=(conn,), daemon=True).start()
