"""
Lokal smoke test — butun biznes oqimini tekshiradi:
auth -> kurslar -> chek yuborish -> admin tasdiqlash -> kurs ochilishi -> progress -> sertifikat
Ishga tushirish: BOT_TOKEN= DATA_DIR=./data_test python smoke_test.py
"""
import json
import time
import urllib.request
import urllib.error
import base64
import struct
import zlib

BASE = "http://127.0.0.1:8123"

def req(method, path, body=None, token=None, expect=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(f"{BASE}{path}", data=json.dumps(body).encode() if body else None,
                               headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            data = json.loads(resp.read().decode())
            if expect and resp.status != expect:
                raise AssertionError(f"{path}: kutilgan {expect}, keldi {resp.status}")
            return resp.status, data
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")

def tiny_png() -> str:
    # 1x1 qizil piksel PNG
    sig = b"\x89PNG\r\n\x1a\n"

    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    idat = zlib.compress(b"\x00\xff\x00\x00")
    return "data:image/png;base64," + base64.b64encode(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")).decode()

def main():
    ok, fail = 0, 0
    def check(name, cond, detail=""):
        nonlocal ok, fail
        if cond:
            ok += 1
            print(f"  ✅ {name}")
        else:
            fail += 1
            print(f"  ❌ {name} {detail}")

    print("=== 1. Health & Storage ===")
    st, data = req("GET", "/health")
    check("health 200", st == 200, str(data))
    check("storage backend aniqlangan", data.get("storage") in ("sqlite", "supabase"), str(data))

    print("=== 2. Kurslar ===")
    st, courses = req("GET", "/api/courses")
    check("4 ta kurs", st == 200 and len(courses) == 4, f"st={st} n={len(courses)}")
    ai = next((c for c in courses if c["slug"] == "ai-prompt-engineering-pro"), None)
    check("AI kurs bor", ai is not None)

    print("=== 3. Talaba auth (dev-mode, HMAC o'tkazib yuboriladi) ===")
    st, auth = req("POST", "/api/auth/telegram", {"telegram_user": {"id": 111222333, "first_name": "Test", "last_name": "Talaba", "username": "test_talaba"}})
    check("auth 200", st == 200, str(auth))
    token = auth.get("access_token")
    check("token berildi", bool(token))

    print("=== 4. Avtomatik kurs berilmasligi (security) ===")
    st, detail = req("GET", f"/api/courses/{ai['id']}", token=token)
    check("is_enrolled=False (avtomatik ochilmaslik)", st == 200 and detail.get("is_enrolled") is False, str(detail.get("is_enrolled")))

    print("=== 5. Himoyalangan darsga ruxsat yo'qligi (security) ===")
    lessons = [l for m in detail["modules"] for l in m["lessons"]]
    paid_lesson = next(l for l in lessons if not l.get("is_preview"))
    st, _ = req("GET", f"/api/student/courses/{ai['id']}/lessons/{paid_lesson['id']}", token=token)
    check("pullik dars 403", st == 403, f"st={st}")
    preview_lesson = next(l for l in lessons if l.get("is_preview"))
    st, _ = req("GET", f"/api/student/courses/{ai['id']}/lessons/{preview_lesson['id']}", token=token)
    check("preview dars 200", st == 200, f"st={st}")

    print("=== 6. Parolsiz admin kirish bloklanishi (security) ===")
    st, _ = req("POST", "/api/auth/login", {"login": "admin1", "password": "xato_parol"})
    check("xato parol 401", st == 401, f"st={st}")
    st, _ = req("POST", "/api/auth/login", {"login": "randomstudent", "password": "123"})
    check("talaba direct-login 403", st == 403, f"st={st}")

    print("=== 7. To'g'ri parol bilan admin kirish ===")
    from dotenv import load_dotenv
    import os
    load_dotenv()
    p1 = os.getenv("ADMIN_1_PASSWORD", "")
    st, admin_auth = req("POST", "/api/auth/login", {"login": "admin1", "password": p1})
    check("admin login 200", st == 200, str(admin_auth))
    admin_token = admin_auth.get("access_token")
    check("admin roli superadmin", admin_auth.get("user", {}).get("role") == "superadmin")

    print("=== 8. O'lik token bilan admin API bloklanishi (security) ===")
    st, _ = req("GET", "/api/admin/dashboard-stats", token=token)  # talaba tokeni
    check("talaba uchun admin API 403", st == 403, f"st={st}")

    print("=== 9. Admin stats ===")
    st, stats = req("GET", "/api/admin/dashboard-stats", token=admin_token)
    check("stats 200", st == 200, str(stats)[:100])
    check("storage maydoni bor", "storage_backend" in stats)

    print("=== 10. Chek yuborish (R2 + baza) ===")
    st, receipt = req("POST", "/api/auth/telegram", {"telegram_user": {"id": 111222333, "first_name": "Test", "username": "test_talaba"}})
    token = receipt.get("access_token")
    st, sub = req("POST", "/api/checkout/submit-receipt", {
        "course_id": ai["id"],
        "payment_method": "payme",
        "receipt_image": tiny_png(),
        "comment": "Smoke test cheki"
    }, token=token)
    check("submit-receipt 200", st == 200, str(sub))
    order_id = sub.get("order_id")

    print("=== 11. Anonim chek yuborish bloklanishi (security) ===")
    st, _ = req("POST", "/api/checkout/submit-receipt", {
        "course_id": ai["id"], "payment_method": "payme", "receipt_image": tiny_png()
    })
    check("anonym 401/403", st in (401, 403), f"st={st}")

    print("=== 12. Admin pending ro'yxatida ko'rinishi ===")
    st, pending = req("GET", "/api/admin/pending-receipts", token=admin_token)
    check("pending 200", st == 200)
    check("chek ro'yxatda", any(p.get("order_id") == order_id for p in pending), str([p.get('order_id') for p in pending])[:200])
    p_row = next((p for p in pending if p.get("order_id") == order_id), None)
    check("receipt_image URL bor (R2)", p_row is not None and (p_row.get("receipt_image") or "").startswith("http"), str(p_row and p_row.get("receipt_image"))[:120])
    check("telegram_id saqlangan", p_row is not None and p_row.get("telegram_id") == 111222333, str(p_row and p_row.get("telegram_id")))

    print("=== 13. Tasdiqlash -> kurs ochilishi ===")
    st, appr = req("POST", f"/api/admin/approve-receipt/{order_id}", token=admin_token)
    check("approve 200", st == 200, str(appr))

    st, detail2 = req("GET", f"/api/courses/{ai['id']}", token=token)
    check("endi is_enrolled=True", detail2.get("is_enrolled") is True, str(detail2.get("is_enrolled")))

    st, dash = req("GET", "/api/student/dashboard", token=token)
    check("dashboardda kurs bor", len(dash.get("enrolled_courses", [])) == 1, str(dash)[:150])

    print("=== 14. Pullik dars endi ochiq + progress + bildirishnoma ===")
    st, lesson = req("GET", f"/api/student/courses/{ai['id']}/lessons/{paid_lesson['id']}", token=token)
    check("pullik dars 200", st == 200, f"st={st}")
    st, prog = req("POST", "/api/student/progress", {"course_id": ai["id"], "lesson_id": paid_lesson["id"], "completed": True}, token=token)
    check("progress saqlandi", st == 200 and prog.get("success"), str(prog))
    st, notifs = req("GET", "/api/student/notifications", token=token)
    check("tasdiqlash bildirishnomasi bor", any("tasdiqlandi" in (n.get("title", "")).lower() for n in notifs), str([n.get('title') for n in notifs]))

    print("=== 15. Rad etish oqimi ===")
    st, sub2 = req("POST", "/api/checkout/submit-receipt", {
        "course_id": courses[1]["id"], "payment_method": "click", "receipt_image": tiny_png(), "comment": "ikkinchi test"
    }, token=token)
    oid2 = sub2.get("order_id")
    st, rej = req("POST", f"/api/admin/reject-receipt/{oid2}", token=admin_token)
    check("reject 200", st == 200, str(rej))
    st, dash2 = req("GET", "/api/student/dashboard", token=token)
    check("rad etilgan kurs ochilmagan", len(dash2.get("enrolled_courses", [])) == 1)

    print("=== 16. Admin: students ro'yxati ===")
    st, students = req("GET", "/api/admin/students", token=admin_token)
    check("students 200 va talaba bor", st == 200 and any(s.get("telegram_id") == 111222333 for s in students), f"st={st}")

    print("=== 17. Kurs tahrirlash saqlanadi ===")
    st, upd = req("PUT", f"/api/admin/courses/{ai['id']}", {"price": 495000}, token=admin_token)
    check("PUT 200", st == 200, str(upd))
    st, courses2 = req("GET", "/api/courses")
    ai2 = next(c for c in courses2 if c["slug"] == "ai-prompt-engineering-pro")
    check("narx saqlandi", ai2["price"] == 495000, str(ai2["price"]))
    req("PUT", f"/api/admin/courses/{ai['id']}", {"price": ai["price"]}, token=admin_token)  # qaytarish

    print()
    print(f"NATIJA: {ok} muvaffaqiyat, {fail} muvaffaqiyatsiz")
    return fail

if __name__ == "__main__":
    import sys
    sys.exit(main())
