import os
import sys
import uuid
from fastapi.testclient import TestClient

# Ensure backend path in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from app.storage.sqlite_store import SqliteStore
import app.storage as storage_mod
from app.core.security import create_access_token

def test_api_suite():
    # Setup test store
    store = SqliteStore("./data")
    storage_mod._store = store

    client = TestClient(app)

    # 1. Health endpoint
    print("[1] Testing /health...")
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["version"] == "2.0.0"
    print("  ✅ /health passed")

    # 2. Payment info
    print("\n[2] Testing /api/checkout/payment-info...")
    r = client.get("/api/checkout/payment-info")
    assert r.status_code == 200
    data = r.json()
    assert "card_number" in data
    assert "admins" in data
    print("  ✅ /api/checkout/payment-info passed")

    # 3. Public courses
    print("\n[3] Testing /api/courses...")
    r = client.get("/api/courses")
    assert r.status_code == 200
    courses = r.json()
    assert isinstance(courses, list)
    assert len(courses) > 0
    test_course = courses[0]
    print(f"  ✅ /api/courses returned {len(courses)} courses")

    # 4. Public banners
    print("\n[4] Testing /api/banners...")
    r = client.get("/api/banners")
    assert r.status_code == 200
    assert "banners" in r.json()
    print("  ✅ /api/banners passed")

    # 5. Student auth & dashboard
    print("\n[5] Testing authenticated student dashboard...")
    user_id = f"student_{uuid.uuid4().hex[:6]}"
    token = create_access_token({
        "sub": user_id,
        "telegram_id": 77777777,
        "name": "E2E Talaba",
        "username": "e2e_student",
        "role": "student"
    })
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get("/api/student/dashboard", headers=headers)
    assert r.status_code == 200
    dash = r.json()
    assert "enrolled_courses" in dash
    assert dash["user_name"] == "E2E Talaba"
    print("  ✅ /api/student/dashboard passed")

    # 6. Checkout submit-receipt without image when amount > 0 -> 400
    print("\n[6] Testing submit-receipt validation without image when amount > 0...")
    r = client.post("/api/checkout/submit-receipt", json={
        "course_id": test_course["id"],
        "payment_method": "karta",
        "receipt_image": "",
        "comment": "test without receipt",
    }, headers=headers)
    assert r.status_code == 400
    print(f"  ✅ Rejection successful: {r.json()['detail']}")

    # 7. Checkout submit-receipt with 100% wallet coverage -> auto-enroll
    print("\n[7] Testing submit-receipt with 100% wallet coverage (auto-enrolled)...")
    # First credit student wallet with full course price
    from app.services import wallet as wallet_service
    import asyncio
    asyncio.run(wallet_service.credit(store, user_id, test_course["price"] + 50000, "topup", "e2e test", "tx_e2e_w"))
    
    r = client.post("/api/checkout/submit-receipt", json={
        "course_id": test_course["id"],
        "use_wallet": True,
        "wallet_amount": test_course["price"],
        "comment": "Paying 100% via wallet",
    }, headers=headers)
    assert r.status_code == 200
    res = r.json()
    assert res.get("auto_enrolled") is True, f"Expected auto_enrolled=True, got {res}"
    print("  ✅ 100% wallet purchase auto-enrolled successfully!")

    print("\n==================================================")
    print("🎉 ALL ENDPOINT INTEGRATION TESTS PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    test_api_suite()
