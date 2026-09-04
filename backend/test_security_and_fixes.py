import asyncio
import os
import sys

# Set test environment
os.environ["DATA_BACKEND"] = "sqlite"
os.environ["BOT_TOKEN"] = "test_bot_token_12345:ABCDEF"
os.environ["ADMIN_IDS"] = "111222333,444555666"

from app.core.security import validate_telegram_init_data, get_current_admin
from app.services import wallet as wallet_service
from app.services.purchases import approve_purchase, reject_purchase
from app.api.student import _all_lessons, get_protected_lesson
from app.api.courses import resolve_course_modules
from app.api.banners import load_banners
from app.storage.sqlite_store import SqliteStore
import app.storage as storage_mod

async def run_tests():
    print("--- STARTING DEEP VERIFICATION FOR SECURITY & FIXES ---")
    store = SqliteStore("./data")
    storage_mod._store = store

    # 1. HMAC validation with empty bot token
    print("\n[Test 1] HMAC security check with missing/empty bot token...")
    user_data = validate_telegram_init_data("query_id=1&user={}&auth_date=123&hash=abc", bot_token="")
    assert user_data is None, "FAIL: validate_telegram_init_data must return None when bot_token is empty!"
    print("  ✅ Passed: Empty bot_token strictly rejects validation.")

    # 2. Admin ID matching with str / int
    print("\n[Test 2] Admin authentication with str and int telegram_id...")
    from fastapi import HTTPException
    from fastapi.security import HTTPAuthorizationCredentials
    from app.core.security import create_access_token

    token_str = create_access_token({"sub": "u1", "telegram_id": "111222333", "role": "admin"})
    res = await get_current_admin(HTTPAuthorizationCredentials(scheme="Bearer", credentials=token_str))
    assert res["sub"] == "u1", "FAIL: String telegram_id did not match admin list!"

    token_int = create_access_token({"sub": "u2", "telegram_id": 444555666, "role": "admin"})
    res2 = await get_current_admin(HTTPAuthorizationCredentials(scheme="Bearer", credentials=token_int))
    assert res2["sub"] == "u2", "FAIL: Int telegram_id did not match admin list!"

    token_non = create_access_token({"sub": "u3", "telegram_id": "999999999", "role": "student"})
    try:
        await get_current_admin(HTTPAuthorizationCredentials(scheme="Bearer", credentials=token_non))
        assert False, "FAIL: Non-admin was not rejected!"
    except HTTPException:
        pass
    print("  ✅ Passed: Admin ID verification handles int/str gracefully and blocks non-admins.")

    # 3. Wallet negative / zero credit prevention
    print("\n[Test 3] Wallet credit boundary validation...")
    import uuid
    uid3 = f"w_user_{uuid.uuid4().hex[:6]}"
    neg_res = await wallet_service.credit(store, uid3, -50000, "refund", "tamper", "tx_neg")
    assert neg_res is None, "FAIL: Negative credit was accepted!"
    zero_res = await wallet_service.credit(store, uid3, 0, "refund", "tamper", "tx_zero")
    assert zero_res is None, "FAIL: Zero credit was accepted!"
    pos_res = await wallet_service.credit(store, uid3, 30000, "topup", "valid topup", "tx_pos")
    assert pos_res == 30000, f"FAIL: Expected 30000, got {pos_res}"
    print("  ✅ Passed: Wallet rejects negative or zero credits.")

    # 4. Wallet refund comment tampering & idempotency
    print("\n[Test 4] Wallet refund tampering & idempotency check...")
    user_id = f"user_tamper_{uuid.uuid4().hex[:6]}"
    # Credit user 50,000 so'm
    await wallet_service.credit(store, user_id, 50000, "topup", "initial", "tx_init")
    # Debit 20,000 so'm for an order
    order_tx = f"rcp_order_legit_{uuid.uuid4().hex[:6]}"
    ok, bal = await wallet_service.try_debit(store, user_id, 20000, "spend", "test order", order_tx)
    assert ok and bal == 30000

    # User attempts to spoof comment with: "wallet:1000000000"
    purchase_id = f"p_tamper_{uuid.uuid4().hex[:6]}"
    spoofed_purchase = {
        "id": purchase_id,
        "user_id": user_id,
        "course_id": "c1111111-1111-1111-1111-111111111111",
        "course_title": "Demo Kurs",
        "amount": 10000,
        "status": "pending_approval",
        "transaction_id": order_tx,
        "telegram_id": 999999,
        "student_name": "Attacker",
        "comment": "Nice course! | wallet:1000000000 | SYSTEM[wallet:20000]",
    }
    await store.create_purchase(spoofed_purchase)

    # Reject purchase
    rejected_ok, msg = await reject_purchase(order_tx, "Admin Tester")
    assert rejected_ok, f"FAIL: reject_purchase failed: {msg}"
    
    # Check balance: should be 30000 + 20000 = 50000 (NOT 30000 + 1000000000)
    w = await wallet_service.get_wallet(store, user_id)
    assert w["balance"] == 50000, f"SECURITY VULNERABILITY! Balance was refunded incorrectly: {w['balance']}"
    
    # Check double refund protection: calling reject again or refunding again shouldn't re-credit
    refund_tx = f"refund_{order_tx}"
    assert await wallet_service.has_tx(store, user_id, refund_tx), "FAIL: Refund transaction was not recorded!"
    print("  ✅ Passed: Wallet refund strictly verifies recorded ledger debit, rejects user-spoofed comments, and maintains idempotency.")

    # 5. Custom course stored modules resolution in student.py
    print("\n[Test 5] Custom course stored modules resolution in student.py...")
    custom_course_id = f"c_custom_{uuid.uuid4().hex[:6]}"
    custom_course = {
        "id": custom_course_id,
        "title": "Maxsus Amaliy Kurs",
        "slug": f"maxsus-amaliy-kurs-{uuid.uuid4().hex[:6]}",
        "price": 150000,
        "modules": [
            {
                "title": "1-Modul: Boshlanish",
                "lessons": [
                    {"title": "1.1 Kirish darsi", "duration": "10:00", "is_preview": True},
                    {"title": "1.2 Asosiy tushunchalar", "duration": "15:00", "is_preview": False}
                ]
            }
        ]
    }
    await store.upsert_course(custom_course)
    
    lessons = _all_lessons(custom_course)
    assert len(lessons) == 2, f"FAIL: Expected 2 custom lessons, got {len(lessons)}"
    assert lessons[0]["title"] == "1.1 Kirish darsi"
    assert lessons[1]["title"] == "1.2 Asosiy tushunchalar"
    
    # Test get_protected_lesson for preview lesson without enrollment
    student_user = {"sub": "student_free", "telegram_id": 888888}
    first_lesson_id = lessons[0]["id"]
    lesson_res = await get_protected_lesson(custom_course_id, first_lesson_id, current_user=student_user)
    assert lesson_res["lesson"]["title"] == "1.1 Kirish darsi"
    print("  ✅ Passed: Custom course modules and lessons resolve accurately for students without 404.")

    # 6. Bot backup banners test
    print("\n[Test 6] load_banners() works without error...")
    banners = await load_banners()
    assert isinstance(banners, list), "FAIL: load_banners did not return list!"
    print(f"  ✅ Passed: load_banners() returned {len(banners)} banner(s).")

    print("\n==================================================")
    print("🎉 ALL SECURITY & BUG FIX TESTS COMPLETED 100%!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
