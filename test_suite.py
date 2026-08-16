"""
Production API test suite — backend/.env dan kalitlarni o'qiydi (kodda maxfiy kalit yo'q).
Ishga tushirish: python test_suite.py [base_url]
"""
import urllib.request
import urllib.parse
import urllib.error
import json
import hmac
import hashlib
import time
import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "backend", ".env"))
except ImportError:
    pass

base_url = sys.argv[1] if len(sys.argv) > 1 else os.getenv("API_BASE_URL", "https://kurslar-backend-api.onrender.com")
bot_token = os.getenv("BOT_TOKEN", "")

def make_init_data(user_id: int, first_name: str, username: str) -> str:
    user_json = json.dumps({"id": user_id, "first_name": first_name, "username": username})
    auth_date = str(int(time.time()))
    data_check_string = f"auth_date={auth_date}\nuser={user_json}"
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return f"auth_date={auth_date}&user={urllib.parse.quote(user_json)}&hash={calculated_hash}"

def api(method: str, path: str, body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        f"{base_url}{path}",
        data=json.dumps(body).encode() if body is not None else None,
        headers=headers, method=method
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except Exception:
            return e.code, {}

def main():
    ok_count, fail_count = 0, 0
    def check(name, cond, detail=""):
        nonlocal ok_count, fail_count
        print(("  ✅ " if cond else "  ❌ ") + name + (f" {detail}" if not cond and detail else ""))
        ok_count, fail_count = (ok_count + 1, fail_count) if cond else (ok_count, fail_count + 1)

    print(f"Target: {base_url}")
    print("=== 1. HEALTH CHECK ===")
    st, data = api("GET", "/health")
    check("health 200", st == 200, str(data))
    print(f"  Storage backend: {data.get('storage')}")

    print("=== 2. KURSLAR ===")
    st, courses = api("GET", "/api/courses")
    check("kurslar ro'yxati", st == 200 and len(courses) > 0, f"st={st}")
    for c in courses:
        print(f"   - {c.get('title')}: {c.get('price')} so'm")

    print("=== 3. ADMIN AUTH (Yaxshi Bola) ===")
    st, auth1 = api("POST", "/api/auth/telegram", {"init_data": make_init_data(8544023815, "Yaxshi Bola", "yomonboia")})
    check("HMAC auth 200", st == 200, str(auth1))
    token1 = auth1.get("access_token")
    check("superadmin roli", auth1.get("user", {}).get("role") == "superadmin")
    st, stats = api("GET", "/api/admin/dashboard-stats", token=token1)
    check("admin stats 200", st == 200, str(stats))
    if st == 200:
        print(f"   Tushum: {stats.get('total_revenue')} so'm | Talabalar: {stats.get('total_students')} | Kutilayotgan cheklar: {stats.get('pending_receipts_count')}")

    print("=== 4. ADMIN AUTH (Zuhra Olimova) ===")
    st, auth2 = api("POST", "/api/auth/telegram", {"init_data": make_init_data(8112688757, "Zuhra Olimova", "sokin_notalar")})
    check("HMAC auth 200", st == 200, str(auth2))
    token2 = auth2.get("access_token")
    st, pend = api("GET", "/api/admin/pending-receipts", token=token2)
    check("pending-receipts 200", st == 200, str(pend))

    print("=== 5. XAVFSIZLIK TEKSHIRUVLARI ===")
    st, _ = api("POST", "/api/auth/telegram", {"init_data": "auth_date=123&user=hacker&hash=fake"})
    check("soxta initData rad etiladi (401)", st == 401, f"st={st}")
    st, _ = api("POST", "/api/auth/login", {"login": "admin1", "password": "wrong_password"})
    check("xato parol bilan admin kirish 401", st == 401, f"st={st}")
    st, _ = api("POST", "/api/auth/login", {"login": "randomstudent", "password": "x"})
    check("talaba direct-login 403", st == 403, f"st={st}")
    st, _ = api("GET", "/api/admin/dashboard-stats")
    check("tokensiz admin API 401", st == 401, f"st={st}")

    print("=== 6. TALABA OQIMI ===")
    st, student = api("POST", "/api/auth/telegram", {"init_data": make_init_data(999000111, "Test", "test_check_user")})
    check("talaba auth", st == 200, str(student))
    stok = student.get("access_token")
    st, dash = api("GET", "/api/student/dashboard", token=stok)
    check("dashboard 200 (avtomatik kurs yo'q)", st == 200 and dash.get("enrolled_courses") == [], str(dash)[:100])
    if courses:
        st, detail = api("GET", f"/api/courses/{courses[0]['id']}", token=stok)
        check("is_enrolled=False (avtomatik ochilmaydi)", st == 200 and detail.get("is_enrolled") is False)
    st, _ = api("POST", "/api/checkout/submit-receipt", {"course_id": "x", "payment_method": "payme", "receipt_image": "data:image/png;base64,aaa"})
    check("anonym chek 401/403", st in (401, 403), f"st={st}")

    print()
    print(f"NATIJA: {ok_count} muvaffaqiyat, {fail_count} muvaffaqiyatsiz")
    return fail_count

if __name__ == "__main__":
    sys.exit(main())
