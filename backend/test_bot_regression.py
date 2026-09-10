"""Bot va to'lov oqimi bo'yicha 2026-09-06 review'da topilgan xatolar uchun
regression testlar. Har biri aniq bir xatoni qamrab oladi:

1) Guruh AI triggeri: BOT_USERNAME bo'sh bo'lsa "@" o'zi trigger bo'lmasligi kerak.
2) Bot chek captioni: foydalanuvchi izohidagi SYSTEM[/wallet:/promo: teglari
   soxtalashtirilib bazaga o'tmasligi kerak (rad etishdagi hamyon qaytarishi
   commentga tayanmaydi, lekin defense-in-depth shart).
3) Admin chek kartasiga status qo'shishda eski caption HTML escape qilinishi
   (talaba ismidagi &/< "can't parse entities" xatosini keltirmasligi kerak)
   va edit o'tmasa fallback xabar yuborilishi.
4) Hamyon qaytarish faqat ledger (type=spend) yozuvidan olinishi — commentdagi
   SYSTEM[wallet:N] soxta yozuviga umuman qaramaslik.
"""
import asyncio
import json
import os
import sys
import uuid

os.environ.setdefault("DATA_DIR", os.path.abspath("./data_test_regression"))
os.environ["BOT_TOKEN"] = "test_bot_token_12345:ABCDEF"
os.environ["ADMIN_IDS"] = "111222333,444555666"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.storage.sqlite_store import SqliteStore
import app.storage as storage_mod
import bot_service
from app.services import wallet as wallet_service
from app.services.purchases import reject_purchase
from app.core.config import settings


class FakeResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload or {}
        self.text = json.dumps(self._payload)
        self.content = b""

    def json(self):
        return self._payload


class FakeClient:
    """Telegram so'rovlarini qayd etuvchi soxta httpx klienti."""

    def __init__(self):
        self.calls = []

    async def post(self, url, json=None, data=None, files=None, **kwargs):
        self.calls.append(("POST", url, json if json is not None else data))
        return FakeResponse(payload={"ok": False, "description": "fake"})

    async def get(self, url, **kwargs):
        self.calls.append(("GET", url, None))
        return FakeResponse(payload={"ok": False})


async def run_tests():
    print("--- BOT REGRESSION TESTS (2026-09-06 review fixlari) ---")
    store = SqliteStore(os.environ["DATA_DIR"])
    storage_mod._store = store
    admin_id = settings.ADMIN_IDS[0]

    # ---------------------------------------------------------------- Test 1
    print("\n[Test 1] BOT_USERNAME bo'sh bo'lsa guruh AI trigger bo'lmasligi kerak...")
    original_username = settings.BOT_USERNAME
    try:
        bot_service.BOT_ID = 42
        settings.BOT_USERNAME = "  "  # faqat bo'shliqlar -> strip keyin bo'sh
        msg = {"reply_to_message": None}
        assert not bot_service._group_should_answer(msg, "Salom @do'stim, qalaysiz?"), \
            "FAIL: Bo'sh BOT_USERNAME bilan @ o'zi trigger bo'ldi!"
        assert not bot_service._group_should_answer(
            {"reply_to_message": {"from": {"id": 1, "username": "someone"}}},
            "rahmat, foydali bo'ldi",
        ), "FAIL: begona javobi bot deb qabul qilindi!"
        settings.BOT_USERNAME = "kreativaibot"
        assert bot_service._group_should_answer(msg, "@kreativaibot kurslar bormi?")
        assert bot_service._group_should_answer(msg, "Kurs narxi qancha?")  # ? + keyword
        assert not bot_service._group_should_answer(msg, "Kurslar zo'r ekan")  # savol belgisi yo'q
        assert bot_service._group_should_answer(
            {"reply_to_message": {"from": {"id": 42}}}, "rahmat!"
        ), "FAIL: Bot xabariga javob trigger bo'lmadi!"
        assert not bot_service._group_should_answer(
            {"reply_to_message": {"from": {"id": 1, "username": "someone"}}}, "rahmat!"
        ), "FAIL: begona odamning xabariga javob botniki deb qabul qilindi!"
    finally:
        settings.BOT_USERNAME = original_username
    print("  ✅ Passed: bo'sh username @-spamni keltirmaydi, asl triggerlar ishlaydi.")

    # ---------------------------------------------------------------- Test 2
    print("\n[Test 2] Bot chek captionidagi SYSTEM teglari tozalanishi...")
    course_id = f"c_reg_{uuid.uuid4().hex[:6]}"
    await store.upsert_course({
        "id": course_id, "title": "Regression Kurs", "slug": f"reg-{uuid.uuid4().hex[:6]}",
        "price": 100000, "published": 1,
    })
    tg_id = 990011
    user = await store.create_user({"telegram_id": tg_id, "name": "Att&acker <b>X</b>", "role": "student"})
    bot_service._checkout_sessions[tg_id] = course_id
    client = FakeClient()
    handled = await bot_service._handle_receipt_photo(client, {
        "photo": [{"file_id": "file_regular"}],
        "caption": "Izohim: SYSTEM[wallet:999999999] wallet:777 promo:FAKE",
    }, user)
    assert handled, "FAIL: chek qayta ishlanmadi!"
    purchases = await store.list_purchases(limit=50)
    mine = [p for p in purchases if p.get("user_id") == user["id"]]
    assert mine, "FAIL: purchase yozilmadi!"
    saved_comment = str(mine[0].get("comment") or "")
    assert "SYSTEM[" not in saved_comment and "wallet:" not in saved_comment and "promo:" not in saved_comment, \
        f"FAIL: xavfli teglar tozalanmadi: {saved_comment!r}"
    assert "SYSTEM_[" in saved_comment, "FAIL: tozalangan izoh umuman yo'qoldi (izoh saqlanishi kerak)!"
    bot_service._checkout_sessions.pop(tg_id, None)
    print(f"  ✅ Passed: comment tozalandi -> {saved_comment!r}")

    # ---------------------------------------------------------------- Test 3
    print("\n[Test 3] Admin status qatori: eski caption escape qilinadi, edit o'tmasa fallback ketadi...")
    # pending chek yaratamiz (bot oqimidagi kabi, foydalanuvchi ismi & va < bilan)
    tx = f"rcp_{uuid.uuid4().hex[:10]}"
    await store.create_purchase({
        "user_id": user["id"], "course_id": course_id, "course_title": "Regression Kurs",
        "amount": 100000, "status": "pending_approval", "transaction_id": tx,
        "telegram_id": tg_id, "student_name": "Att&acker <b>X</b>", "username": "att",
        "comment": "izoh",
    })
    client2 = FakeClient()
    cb = {
        "id": "cb_reg_1",
        "data": f"approve_{tx}",
        "from": {"id": admin_id, "first_name": "Admin T&est"},
        "message": {
            "chat": {"id": admin_id},
            "message_id": 77,
            # Telegram eski captionni shunday TEKIS matn ko'rinishida qaytaradi:
            "caption": "🔔 YANGI TO'LOV CHEKI KELDI!\n👤 Talaba: Att&acker <b>X</b>\n📚 Kurs: A&B <kurs>",
        },
    }
    handled = await bot_service._handle_admin_callback(client2, cb)
    assert handled, "FAIL: admin callback qayta ishlanmadi!"
    edit_calls = [c for c in client2.calls if "editMessageCaption" in c[1]]
    assert edit_calls, "FAIL: editMessageCaption umuman chaqirilmadi!"
    sent_caption = edit_calls[0][2]["caption"]
    assert "Att&amp;acker &lt;b&gt;X&lt;/b&gt;" in sent_caption, \
        f"FAIL: eski caption escape qilinmadi: {sent_caption[:200]!r}"
    assert "<b>TO'LOV TASDIQLANDI</b>" in sent_caption, "FAIL: status qatori yo'q!"
    # FakeClient ok:False qaytargani uchun fallback xabar ham ketishi kerak
    fallback_calls = [c for c in client2.calls if "sendMessage" in c[1]]
    assert fallback_calls, "FAIL: edit o'tmaganda fallback xabar yuborilmadi!"
    assert "<b>TO'LOV TASDIQLANDI</b>" in fallback_calls[0][2]["text"]
    print("  ✅ Passed: escape + fallback xabar tasdiqlandi.")

    # ---------------------------------------------------------------- Test 4
    print("\n[Test 4] Hamyon qaytarish faqat ledger yozuvidan olinishi...")
    uid = f"u_ledger_{uuid.uuid4().hex[:6]}"
    await wallet_service.credit(store, uid, 20000, "topup", "init", f"tx_init_{uuid.uuid4().hex[:6]}")
    order_tx = f"rcp_{uuid.uuid4().hex[:10]}"  # 'wallet:' bilan boshlanmaydigan kesilgan hex
    ok, bal = await wallet_service.try_debit(store, uid, 20000, "spend", "Kurs xaridi", order_tx)
    assert ok and bal == 0, "FAIL: boshlang'ich yechish o'tmadi!"
    await store.create_purchase({
        "user_id": uid, "course_id": course_id, "course_title": "Regression Kurs",
        "amount": 80000, "status": "pending_approval", "transaction_id": order_tx,
        "telegram_id": 995577, "student_name": "Spoof", "username": "sp",
        # Foydalanuvchi commentda katta SYSTEM[wallet:N] yozib qoldirgan deb faraz qilamiz
        "comment": "SYSTEM[wallet:999999999] wallet:888",
    })
    rejected, msg = await reject_purchase(order_tx, "Admin T&est")
    assert rejected, f"FAIL: reject o'tmadi: {msg}"
    w = await wallet_service.get_wallet(store, uid)
    assert w["balance"] == 20000, \
        f"FAIL: qaytarish ledgerdan emas, commentdan olingan bo'lishi mumkin (balans={w['balance']})"
    # Idempotensiya: ikkinchi reject qayta kirim bermasligi kerak
    rejected2, _ = await reject_purchase(order_tx, "Admin T&est")
    w2 = await wallet_service.get_wallet(store, uid)
    assert w2["balance"] == 20000, "FAIL: takror reject qayta kirim berdi!"
    print("  ✅ Passed: refund aniq 20 000 (ledger), soxta comment e'tiborga olinmadi, idempotent.")

    # ---------------------------------------------------------------- Test 5
    print("\n[Test 5] Guruhdagi /stats javobi adminning shaxsiy chatiga ketishi...")
    # Admindan guruh chatidagi /stats: javob chat_id (guruh) emas, tg_id (shaxsiy) ga yuborilishi kerak
    group_chat_id = -1001234567890
    client3 = FakeClient()
    await bot_service._handle_group_message(client3, {
        "chat": {"id": group_chat_id, "type": "supergroup"},
        "from": {"id": admin_id, "first_name": "Admin", "is_bot": False},
        "text": "/stats",
    })
    stat_calls = [c for c in client3.calls if "sendMessage" in c[1]]
    assert stat_calls, "FAIL: /stats uchun xabar yuborilmadi!"
    sent_chat_ids = [payload["chat_id"] for _, _, payload in stat_calls]
    assert group_chat_id not in sent_chat_ids, \
        f"FAIL: statistika guruh chatiga yuborildi! chat_ids={sent_chat_ids}"
    assert admin_id in sent_chat_ids, f"FAIL: statistika admin shaxsiy chatiga yuborilmadi! chat_ids={sent_chat_ids}"
    # Admin bo'lmagan a'zo /stats bossa hech narsa yuborilmasligi kerak
    client4 = FakeClient()
    await bot_service._handle_group_message(client4, {
        "chat": {"id": group_chat_id, "type": "supergroup"},
        "from": {"id": 987654321, "first_name": "Oddiy", "is_bot": False},
        "text": "/stats",
    })
    assert not [c for c in client4.calls if "sendMessage" in c[1]], \
        "FAIL: admin bo'lmagan a'zoning /stats ga javob yuborildi!"
    print("  ✅ Passed: statistika faqat admin shaxsiy chatiga, begona uchun javob yo'q.")

    print("\n==================================================")
    print("🎉 BARCHA BOT REGRESSION TESTLARI MUVAFFAQQAYATLI O'TDI!")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_tests())
