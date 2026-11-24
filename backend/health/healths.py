import os
import socket
from django.db import connection
from django.http import JsonResponse

def health(request):
    checks = {}
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "error"
    try:
        host = os.getenv("REDIS_HOST", "redis")
        port = int(os.getenv("REDIS_PORT", "6379"))
        with socket.create_connection((host, port), timeout=2) as s:
            s.sendall(b"PING\r\n")
            checks["redis"] = "ok" if s.recv(16).startswith(b"+PONG") else "error"
    except OSError:
        checks["redis"] = "error"

    ok = all(v == "ok" for v in checks.values())
    return JsonResponse({"status": "ok" if ok else "error", **checks}, status=200 if ok else 503)