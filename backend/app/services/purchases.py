"""
To'lov cheklarini tasdiqlash/rad etishning yagona mantiqi.
Ham admin panel API'si, ham Telegram bot callback tugmalari shu moduldan foydalanadi.
"""
import logging
import httpx
from typing import Dict, Any, Optional, Tuple
from app.core.config import settings
from app.storage import get_store

logger = logging.getLogger(__name__)

TG_API = f"https://api.telegram.org/bot{settings.BOT_TOKEN}"

async def _notify_student(telegram_id: Optional[int], text: str):
    if not telegram_id or not settings.BOT_TOKEN:
        return
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(f"{TG_API}/sendMessage", json={
                "chat_id": telegram_id,
                "text": text,
                "parse_mode": "HTML",
                "reply_markup": {
                    "inline_keyboard": [
                        [{"text": "🚀 Mini Appni Ochish", "web_app": {"url": settings.WEBAPP_URL}}]
                    ]
                }
            })
    except Exception as e:
        logger.error(f"Studentga xabar yuborishda xato (tg_id={telegram_id}): {e}")

async def approve_purchase(transaction_id: str, admin_name: str) -> Tuple[bool, str]:
    """
    Chekni tasdiqlaydi: purchases.status=approved, enrollment yaratadi,
    talabani Telegram va ichki bildirishnoma orqali xabardor qiladi.
    """
    store = get_store()
    purchase = await store.get_purchase_by_tx(transaction_id)
    if not purchase:
        return False, "Buyurtma topilmadi"

    if purchase.get("status") == "approved":
        return True, "Bu chek oldin tasdiqlangan"

    await store.update_purchase(purchase["id"], {"status": "approved", "reviewed_by": admin_name})

    # Kurs huquqini berish (idempotent)
    user_id = purchase.get("user_id")
    course_id = purchase.get("course_id")
    course = await store.get_course(course_id) if course_id else None
    course_title = purchase.get("course_title") or (course or {}).get("title", "Kurs")

    if user_id and course_id:
        await store.create_enrollment(user_id, course_id, purchase_id=purchase.get("id"))
        if user_id:
            await store.create_notification(
                user_id,
                "To'lov tasdiqlandi 🎉",
                f"'{course_title}' kursi hisobingizga biriktirildi! Tasdiqlagan admin: {admin_name}.",
                "success"
            )

    await _notify_student(
        purchase.get("telegram_id"),
        f"🎉 <b>Ajoyib Yangilik! To'lovingiz Tasdiqlandi!</b>\n\n"
        f"Hurmatli talaba, sizning <b>'{course_title}'</b> kursi uchun to'lovingiz "
        f"adminlar tomonidan muvaffaqiyatli tasdiqlandi! 🎓\n\n"
        f"Kurs materiallari va barcha darslar profilingizda to'liq ochildi.\n"
        f"Hoziroq o'rganishni boshlashingiz mumkin 👇"
    )
    return True, "To'lov tasdiqlandi va talabaga kurs ochildi"

async def reject_purchase(transaction_id: str, admin_name: str) -> Tuple[bool, str]:
    """Chekni rad etadi va talabani xabardor qiladi"""
    store = get_store()
    purchase = await store.get_purchase_by_tx(transaction_id)
    if not purchase:
        return False, "Buyurtma topilmadi"

    await store.update_purchase(purchase["id"], {"status": "rejected", "reviewed_by": admin_name})

    if purchase.get("user_id"):
        await store.create_notification(
            purchase["user_id"],
            "To'lov cheki rad etildi",
            f"Yuborgan chekingiz tekshiruvdan o'tmadi. Iltimos qayta to'lov qiling yoki adminlarga yozing: @yomonboia, @sokin_notalar",
            "warning"
        )

    await _notify_student(
        purchase.get("telegram_id"),
        f"⚠️ <b>To'lov chekingiz tasdiqlanmadi</b>\n\n"
        f"Yuborgan to'lov chekingiz tekshiruvdan o'tmadi yoki xato yuborilgan.\n\n"
        f"Iltimos, qayta to'lov qiling yoki yordam uchun adminlarga yozing:\n"
        f"👤 @yomonboia (Yaxshi Bola)\n"
        f"👤 @sokin_notalar (Zuhra Olimova)"
    )
    return True, "Chek rad etildi va talaba xabardor qilindi"
