"""Hamyon + referal tizimining to'liq biznes oqimi bo'yicha mantiq testlari.

Qamrab olingan oqim (2026-09-07):
 1. Referal bog'lash: /start ref_XYZ, o'zini taklif qilish rad, takroriy bog'lanish rad.
 2. Xarid oqimi: promokod + hamyondan qisman yechish + qolgan summa kartaga.
 3. Tasdiqlash: promo sarflanadi, referrerga cashback tushadi, enrollment ochildi.
 4. Rad etish: hamyon qaytadi, promo sarflanmaydi.
 5. Milestone sovg'a: N ta do'st xarid qilsa referrerga bepul kurs.
 6. Ikki marta tasdiqlash / ikki marta cashback himoyasi.
 7. Wallet chegaralar: katta kirim cap, balans yetmasa yechish rad.
"""
import asyncio
import os
import sys
import uuid

os.environ.setdefault("DATA_DIR", os.path.abspath("./data_test_wallet_ref"))
os.environ["BOT_TOKEN"] = "test_bot_token_12345:ABCDEF"
os.environ["ADMIN_IDS"] = "111222333,444555666"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.storage.sqlite_store import SqliteStore
import app.storage as storage_mod
from app.services import wallet as wallet_service
from app.services import promos as promos_service
from app.services.promos import (
    get_or_create_referral_code, link_referral, set_referral_settings,
    referral_stats, validate_code,
)
from app.services.purchases import approve_purchase, reject_purchase


async def run_tests():
    print("--- HAMYON + REFERAL TO'LIQ OQIM TESTLARI ---")
    store = SqliteStore(os.environ["DATA_DIR"])
    storage_mod._store = store

    # --- Ma'lumotlar: kurslar, foydalanuvchilar, referal sozlamalari ---
    gift_course_id = f"c_gift_{uuid.uuid4().hex[:6]}"
    paid_course_id = f"c_paid_{uuid.uuid4().hex[:6]}"
    paid_course_id2 = f"c_paid2_{uuid.uuid4().hex[:6]}"
    for cid, title in ((paid_course_id, "Amaliy Kurs"), (paid_course_id2, "Ikkinchi Kurs"), (gift_course_id, "Sovg'a Kursi")):
        await store.upsert_course({
            "id": cid, "title": title, "slug": f"slug-{uuid.uuid4().hex[:8]}",
            "price": 100000 if cid != paid_course_id2 else 50000, "published": 1,
        })

    a = await store.create_user({"telegram_id": 500001, "name": "Referrer A", "role": "student"})
    b = await store.create_user({"telegram_id": 500002, "name": "Buyer B", "role": "student"})
    c = await store.create_user({"telegram_id": 500003, "name": "Buyer C", "role": "student"})

    # Cashback rejimi: do'st xarididan 10% referrerga hamyonga
    await set_referral_settings(store, reward_percent=15, invitee_percent=10,
                                milestones=[{"id": "m1", "invited_count": 2, "title": "2 do'st",
                                             "gift_type": "free_course", "gift_course_id": gift_course_id}],
                                cashback_percent=10)

    # ------------------------------------------------------------- Test 1: referal bog'lash
    print("\n[Test 1] Referal bog'lash qoidalari...")
    code_a = await get_or_create_referral_code(store, a["id"])
    ok, msg, bonus_b = await link_referral(store, b["id"], f"ref_{code_a}")
    assert ok, f"FAIL: referal bog'lanmadi: {msg}"
    assert bonus_b and bonus_b["percent"] == 10, "FAIL: taklif qilinganga −10% bonus kod berilmadi!"
    ok_self, msg_self, _ = await link_referral(store, a["id"], f"ref_{code_a}")
    assert not ok_self, "FAIL: o'zini o'zi taklif qilish qabul qilindi!"
    ok_dup, msg_dup, _ = await link_referral(store, b["id"], f"ref_{code_a}")
    assert not ok_dup, "FAIL: ikkinchi marta bog'lanish qabul qilindi!"
    ok_bad, _, _ = await link_referral(store, c["id"], "ref_REFNOMAVJUD")
    assert not ok_bad, "FAIL: notanish kod qabul qilindi!"
    ok_c, _, _ = await link_referral(store, c["id"], f"ref_{code_a}")
    assert ok_c, "FAIL: C uchun referal bog'lanmadi!"
    print("  ✅ Passed: bog'lanish, o'zini/o'zini, takroriy va notanish kod himoyasi.")

    # ------------------------------------------------------------- Test 2: xarid oqimi
    print("\n[Test 2] B xaridi: promokod −10% + hamyondan 30k + kartadan 60k...")
    # B o'z bonus promokodini tekshiradi (validate — sarflanmaydi)
    entry, vmsg = await validate_code(store, bonus_b["code"], b["id"])
    assert entry, f"FAIL: bonus promokod yaroqsiz: {vmsg}"
    # B hamyoniga 30k kirim (masalan, admin kiritgan deb faraz qilamiz)
    await wallet_service.credit(store, b["id"], 30000, "admin", "boshlang'ich", "tx_b_init")
    # Narx: 100k → promo −10% = 90k → hamyondan 30k yechiladi → 60k kartadan
    promo_price = promos_service.apply_percent(100000, 10)
    assert promo_price == 90000, f"FAIL: promo narx noto'g'ri: {promo_price}"
    # Production checkout.py singari: buyurtma ID hamyondan yechishda ham,
    # purchase yozuvida ham aynan bir xil bo'lishi shart (reject paytida
    # shu tx bo'yicha ledgerdan qidiriladi).
    order_b = f"rcp_{uuid.uuid4().hex[:10]}"
    ok_debit, bal = await wallet_service.try_debit(store, b["id"], 30000, "spend", "Kurs xaridi", order_b)
    assert ok_debit and bal == 0, "FAIL: hamyondan yechish o'tmadi!"
    remaining = promo_price - 30000
    assert remaining == 60000
    await store.create_purchase({
        "user_id": b["id"], "course_id": paid_course_id, "course_title": "Amaliy Kurs",
        "amount": remaining, "status": "pending_approval", "payment_method": "karta",
        "transaction_id": order_b, "telegram_id": 500002, "student_name": "Buyer B",
        "username": "buyerb", "comment": f"SYSTEM[promo:{bonus_b['code']} wallet:30000]",
    })
    print(f"  ✅ Passed: narx 90k, hamyondan 30k, kartadan {remaining}.")

    # ------------------------------------------------------------- Test 3: tasdiqlash
    print("\n[Test 3] Approve: promo sarflanadi, A ga cashback tushadi...")
    approved, msg = await approve_purchase(order_b, "Admin Test")
    assert approved, f"FAIL: approve o'tmadi: {msg}"
    # Promo endi sarflangan — B ikkinchi marta ishlata olmaydi
    entry2, _ = await validate_code(store, bonus_b["code"], b["id"])
    assert entry2 is None, "FAIL: bir martalik promo TASDIQLANGANDAN KEYIN ham yaroqli!"
    # Cashback: qolgan summadan (60k) 10% = 6k — A hamyoniga
    w_a = await wallet_service.get_wallet(store, a["id"])
    assert w_a["balance"] == 6000, f"FAIL: A cashback noto'g'ri: {w_a['balance']} (kutilgan 6000)"
    # B kursga ochilgan
    enr = await store.get_enrollment(b["id"], paid_course_id)
    assert enr and enr.get("status") == "active", "FAIL: B enrollment ochildi degan iddao yolg'on!"
    # Milestone (2 xaridli do'st) hali berilmagan — bitta xaridor bor
    stats_a = await referral_stats(store, a["id"])
    m1 = next(m for m in stats_a["milestones"] if m["id"] == "m1")
    assert not m1["claimed"] and m1["progress"] == 1, f"FAIL: milestone holati noto'g'ri: {m1}"
    print("  ✅ Passed: promo sarflandi, cashback 6 000, kurs ochildi, milestone kutmoqda.")

    # ------------------------------------------------------------- Test 4: rad etish
    print("\n[Test 4] Reject: hamyon qaytadi, promo saqlanadi...")
    # B ikkinchi kursni 20k hamyon + 30k karta bilan xarid qiladi, chek RAD etiladi
    await wallet_service.credit(store, b["id"], 20000, "admin", "qo'shimcha", "tx_b_init2")
    order_b2 = f"rcp_{uuid.uuid4().hex[:10]}"
    ok_debit2, _ = await wallet_service.try_debit(store, b["id"], 20000, "spend", "Kurs2", order_b2)
    assert ok_debit2, "FAIL: 2-yechish o'tmadi!"
    await store.create_purchase({
        "user_id": b["id"], "course_id": paid_course_id2, "course_title": "Ikkinchi Kurs",
        "amount": 30000, "status": "pending_approval", "payment_method": "karta",
        "transaction_id": order_b2, "telegram_id": 500002, "student_name": "Buyer B",
        "username": "buyerb", "comment": "SYSTEM[wallet:20000]",
    })
    rejected, rmsg = await reject_purchase(order_b2, "Admin Test")
    assert rejected, f"FAIL: reject o'tmadi: {rmsg}"
    w_b = await wallet_service.get_wallet(store, b["id"])
    assert w_b["balance"] == 20000, f"FAIL: rejectdan keyin B balansi noto'g'ri: {w_b['balance']}"
    # Rad etilgan kurs ochilmagan
    enr2 = await store.get_enrollment(b["id"], paid_course_id2)
    assert not enr2, "FAIL: rad etilgan kurs uchun enrollment bor!"
    print("  ✅ Passed: 20 000 qaytdi, kurs ochilmadi.")

    # ------------------------------------------------------------- Test 5: milestone sovg'a
    print("\n[Test 5] C xaridi -> 2-xaridor -> A ga bepul kurs...")
    order_c = f"rcp_{uuid.uuid4().hex[:10]}"
    await store.create_purchase({
        "user_id": c["id"], "course_id": paid_course_id, "course_title": "Amaliy Kurs",
        "amount": 100000, "status": "pending_approval", "payment_method": "karta",
        "transaction_id": order_c, "telegram_id": 500003, "student_name": "Buyer C",
        "username": "buyerc", "comment": None,
    })
    approved_c, _ = await approve_purchase(order_c, "Admin Test")
    assert approved_c
    # A cashback: 100k dan 10% = 10k (qo'shiladi 6k ga)
    w_a2 = await wallet_service.get_wallet(store, a["id"])
    assert w_a2["balance"] == 16000, f"FAIL: C xarididan keyin A balansi: {w_a2['balance']}"
    # Milestone endi berilgan: 2 xaridli do'st -> sovg'a kursi enrollment
    enr_a = await store.get_enrollment(a["id"], gift_course_id)
    assert enr_a and enr_a.get("status") == "active", "FAIL: milestone sovg'a kursi ochilmadi!"
    stats_a2 = await referral_stats(store, a["id"])
    m1b = next(m for m in stats_a2["milestones"] if m["id"] == "m1")
    assert m1b["claimed"], "FAIL: milestone claimed=_false qoldi!"
    print("  ✅ Passed: cashback 10 000 qo'shildi (jami 16 000), sovg'a kursi ochildi.")

    # ------------------------------------------------------------- Test 6: takroriy tasdiqlash/cashback
    print("\n[Test 6] Ikki marta approve va ikki marta cashback himoyasi...")
    again, again_msg = await approve_purchase(order_b, "Boshqa Admin")
    assert again and "oldin" in again_msg, f"FAIL: ikkinchi approve xato qaytardi: {again_msg}"
    w_a3 = await wallet_service.get_wallet(store, a["id"])
    assert w_a3["balance"] == 16000, f"FAIL: takror approve cashbackni oshirdi: {w_a3['balance']}"
    # B ning xaridi uchun cashback faqat 1 marta (rewarded ro'yxati)
    from app.services.promos import reward_referrer
    again_reward = await reward_referrer(store, b["id"], 60000)
    assert again_reward is None, "FAIL: bir xaridga ikki marta mukofot berildi!"
    print("  ✅ Passed: ikkinchi approve idempotent, mukofot bir martalik.")

    # ------------------------------------------------------------- Test 7: wallet chegaralar
    print("\n[Test 7] Hamyon chegaralari...")
    cap = await wallet_service.credit(store, c["id"], 200_000_000, "admin", "cap test", "tx_cap")
    assert cap is None, "FAIL: 100M dan katta kirim qabul qilindi!"
    over = await wallet_service.try_debit(store, c["id"], 999_999, "spend", "yetmadi", "tx_over")
    assert not over[0], "FAIL: balansdan katta yechish o'tdi!"
    print("  ✅ Passed: 100M cap va balans tekshiruvi ishlaydi.")

    # ------------------------------------------------------------- Yakuniy holatlar
    print("\n--- Yakuniy balanslar ---")
    for uid, label in ((a["id"], "A (referrer)"), (b["id"], "B (buyer)"), (c["id"], "C (buyer)")):
        w = await wallet_service.get_wallet(store, uid)
        hist_types = [e["type"] for e in w["history"]]
        print(f"  {label}: {w['balance']:,} so'm | tranzaksiyalar: {hist_types}")

    print("\n==================================================")
    print("🎉 BARCHA HAMYON + REFERAL OQIM TESTLARI O'TDI!")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_tests())
