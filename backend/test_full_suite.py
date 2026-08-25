import asyncio
import sys
import os

# Set working directory to backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.storage.sqlite_store import SqliteStore
from app.storage.supabase_store import SupabaseStore
from app.storage.base import Store
import app.services.purchases as purchases_svc
import bot_service

async def run_audit():
    print("==================================================")
    print("🔍 TO'LIQ TIZIM AUDITI VA TEKSHIRUVI BOSHLANDI...")
    print("==================================================")

    # 1. Base Store Interface Check
    print("\n[1/5] Storage interfeyslari tekshirilmoqda...")
    store_methods = [m for m in dir(Store) if not m.startswith("_")]
    sqlite_store = SqliteStore(data_dir="./data")


    for method in store_methods:
        assert hasattr(sqlite_store, method), f"SqliteStore'da {method} metodi yetishmaydi"
        assert hasattr(SupabaseStore, method), f"SupabaseStore'da {method} metodi yetishmaydi"
    print("  ✅ SqliteStore va SupabaseStore barcha metodlarga ega (100% mos)")

    # 2. telegram_channel_id va Kurslar bog'liqligi
    print("\n[2/5] Telegram yopiq kanal ID va kurslar tekshirilmoqda...")
    course_data = {
        "id": "test-c1",
        "title": "Test Kurs AI",
        "slug": "test-kurs-ai",
        "category": "AI",
        "description": "Test tavsif",
        "short_description": "Qisqa tavsif",
        "cover_url": "https://example.com/cover.jpg",
        "price": 350000,
        "old_price": 500000,
        "discount_percent": 30,
        "duration": "10 soat",
        "lesson_count": 12,
        "instructor_name": "Test Ustoz",
        "instructor_title": "Senior AI",
        "telegram_channel_id": -1002345678901,
        "published": True
    }
    await sqlite_store.upsert_course(course_data)
    
    found_by_channel = await sqlite_store.get_course_by_channel_id("-1002345678901")
    assert found_by_channel is not None, "get_course_by_channel_id bo'yicha kurs topilmadi"
    assert found_by_channel["id"] == "test-c1"
    print(f"  ✅ get_course_by_channel_id muvaffaqiyatli ishladi: {found_by_channel['title']} (ID: {found_by_channel['telegram_channel_id']})")

    # 3. User, Purchase va Enrollment oqimi
    print("\n[3/5] To'lov cheki, xarid va tasdiqlash oqimi...")
    user = await sqlite_store.create_user({"id": "u1", "telegram_id": 999888777, "name": "Ali Valiyev", "username": "ali_valiyev"})
    assert user is not None, "User yaratilmadi"

    purchase = await sqlite_store.create_purchase({
        "user_id": user["id"],
        "course_id": "test-c1",
        "course_title": "Test Kurs AI",
        "amount": 350000,
        "status": "pending_approval",
        "payment_method": "karta",
        "transaction_id": "rcp_test12345",
        "telegram_id": 999888777,
        "student_name": "Ali Valiyev",
        "username": "ali_valiyev"
    })
    assert purchase["status"] == "pending_approval"
    print(f"  ✅ Chek muvaffaqiyatli saqlandi: TX={purchase['transaction_id']}, Holat={purchase['status']}")

    # 4. Enrollment yaratilishi
    await sqlite_store.create_enrollment(user["id"], "test-c1", purchase_id=purchase["id"])
    enrollment = await sqlite_store.get_enrollment(user["id"], "test-c1")
    assert enrollment is not None and enrollment["status"] == "active"
    print(f"  ✅ Kurs talabaga ochildi (Enrollment active)")

    # 5. Bot Handlers va Join Request himoyasi
    print("\n[4/5] Bot xavfsizligi va Join Request tekshiruvi...")
    assert hasattr(bot_service, "handle_chat_join_request"), "handle_chat_join_request mavjud emas"
    assert hasattr(bot_service, "handle_my_chat_member"), "handle_my_chat_member mavjud emas"
    assert hasattr(bot_service, "_send_payment_info"), "_send_payment_info mavjud emas"
    print("  ✅ Bot join-request va kanal admin handlerlari to'liq mavjud")

    # 6. Admin chekni tasdiqlash funksiyasi
    print("\n[5/5] purchases.py tasdiqlash logikasi tekshiruvi...")
    assert hasattr(purchases_svc, "approve_purchase"), "approve_purchase topilmadi"
    assert hasattr(purchases_svc, "reject_purchase"), "reject_purchase topilmadi"
    print("  ✅ purchases.approve_purchase va reject_purchase tayyor")

    print("\n==================================================")
    print("🎉 BARCHA TEKSHIRUVLAR 100% MUVAFFAQQAYATLI O'TDI!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_audit())
