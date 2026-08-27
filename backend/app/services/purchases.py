"""To'lovlarni tasdiqlash va yopiq kanalga xavfsiz kirish mantiqi.

Bu moduldan HTTP admin paneli ham, Telegram callback tugmalari ham foydalanadi.
Status almashinuvi shartli bajariladi: ikki admin bir vaqtda tugmani bossa,
to'lov faqat bir marta tasdiqlanadi va bitta enrollment yaratiladi.
"""
from __future__ import annotations

import html
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

import httpx

from app.core.config import settings
from app.storage import get_store

logger = logging.getLogger(__name__)

# Tasdiqlangandan keyin bot va API odatda bitta jarayonda ishlaydi. Shu kichik
# TTL kesh join requestni bazaga qayta borishsiz darhol qabul qilish imkonini beradi.
_invite_authorization_cache: Dict[str, Dict[str, Any]] = {}
_CACHE_MAX_SIZE = 500


def _prune_invite_cache() -> None:
    """Muddati o'tgan yozuvlarni olib tashlab, kesh hajmini cheklangan saqlaydi."""
    if len(_invite_authorization_cache) < _CACHE_MAX_SIZE:
        return
    now = datetime.now(timezone.utc)
    expired = []
    for link, entry in _invite_authorization_cache.items():
        try:
            if datetime.fromisoformat(str(entry["expires_at"])) <= now:
                expired.append(link)
        except (KeyError, TypeError, ValueError):
            expired.append(link)
    for link in expired:
        _invite_authorization_cache.pop(link, None)
    while len(_invite_authorization_cache) >= _CACHE_MAX_SIZE:
        _invite_authorization_cache.pop(next(iter(_invite_authorization_cache)), None)


def _api_url(method: str) -> str:
    return f"https://api.telegram.org/bot{settings.BOT_TOKEN}/{method}"


async def _notify_student(
    telegram_id: Optional[int], text: str, invite_link: Optional[str] = None
) -> None:
    """Talabaga himoyalangan Telegram xabarini yuboradi; yuborish xatosi oqimni buzmaydi."""
    if not telegram_id or not settings.BOT_TOKEN:
        return

    buttons = []
    if invite_link:
        buttons.append([{"text": "📢 Yopiq dars kanaliga kirish", "url": invite_link}])
    buttons.append(
        [{"text": "🚀 Mini Appda darslarni ko'rish", "web_app": {"url": settings.WEBAPP_URL}}]
    )

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                _api_url("sendMessage"),
                json={
                    "chat_id": telegram_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "protect_content": True,
                    "reply_markup": {"inline_keyboard": buttons},
                },
            )
            if response.status_code != 200:
                logger.warning("Talabaga xabar yuborilmadi: %s", response.text[:250])
    except (httpx.HTTPError, ValueError) as exc:
        logger.error("Talabaga xabar yuborishda xato (tg_id=%s): %s", telegram_id, exc)


async def _create_join_request_link(
    channel_id: Any, purchase: Dict[str, Any]
) -> Tuple[Optional[str], Optional[str]]:
    """Faqat bitta xaridorga tegishli, 72 soatlik join-request havolasini yaratadi."""
    if not settings.BOT_TOKEN or not channel_id:
        return None, None

    try:
        normalized_channel_id = int(str(channel_id).strip())
        expires_at = datetime.now(timezone.utc) + timedelta(hours=72)
        display_name = html.escape(str(purchase.get("student_name") or "Talaba"))
        link_name = f"CA:{purchase.get('telegram_id') or 'student'}:{display_name}"[:32]
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                _api_url("createChatInviteLink"),
                json={
                    "chat_id": normalized_channel_id,
                    "name": link_name,
                    "creates_join_request": True,
                    "expire_date": int(expires_at.timestamp()),
                },
            )
            data = response.json()
            if response.status_code == 200 and data.get("ok"):
                return data["result"].get("invite_link"), expires_at.isoformat()
            logger.warning("Invite link yaratilmadi: %s", response.text[:250])
    except (ValueError, httpx.HTTPError) as exc:
        logger.error("Invite link yaratishda xato: %s", exc)
    return None, None


async def approve_purchase(transaction_id: str, admin_name: str) -> Tuple[bool, str]:
    """Chekni tasdiqlaydi, kursni ochadi va o'g'irlangan linkdan himoya qiladi."""
    store = get_store()
    purchase = await store.get_purchase_by_tx(transaction_id)
    if not purchase:
        return False, "Buyurtma topilmadi"

    status = purchase.get("status")
    if status == "approved":
        return True, "Bu chek oldin tasdiqlangan"
    if status != "pending_approval":
        return False, "Bu chek endi tasdiqlash uchun kutilayotgan holatda emas"

    claimed = await store.transition_purchase_status(
        purchase["id"],
        "pending_approval",
        {"status": "approved", "reviewed_by": admin_name},
    )
    if not claimed:
        latest = await store.get_purchase_by_tx(transaction_id)
        if latest and latest.get("status") == "approved":
            return True, "Bu chek boshqa admin tomonidan oldin tasdiqlangan"
        return False, "Chek holati o'zgargan; ro'yxatni yangilang"

    course_id = purchase.get("course_id")
    user_id = purchase.get("user_id")
    course = await store.get_course(str(course_id)) if course_id else None
    course_title = purchase.get("course_title") or (course or {}).get("title") or "Kurs"

    enrollment_granted = False
    try:
        if user_id and course_id:
            await store.create_enrollment(user_id, course_id, purchase_id=purchase["id"])
            enrollment_granted = True
            await store.create_notification(
                user_id,
                "To'lov tasdiqlandi 🎉",
                f"'{course_title}' kursi hisobingizga biriktirildi. Tasdiqlagan admin: {admin_name}.",
                "success",
            )
    except Exception as exc:
        logger.exception("Enrollment yaratishda xato (purchase=%s): %s", purchase["id"], exc)

    invite_link, expires_at = await _create_join_request_link(
        (course or {}).get("telegram_channel_id"), purchase
    )
    if invite_link:
        try:
            saved = await store.update_purchase(
                purchase["id"],
                {"channel_invite_link": invite_link, "invite_expires_at": expires_at},
            )
            if not saved:
                raise RuntimeError("invite link bazaga saqlanmadi")
            if enrollment_granted:
                _prune_invite_cache()
                _invite_authorization_cache[invite_link] = {
                    "chat_id": str((course or {}).get("telegram_channel_id")),
                    "telegram_id": int(purchase.get("telegram_id") or 0),
                    "expires_at": expires_at,
                    "course_title": course_title,
                }
        except Exception as exc:
            # Link saqlanmasa uni xavfsiz tekshirib bo'lmaydi; talabaga yubormaymiz.
            logger.exception("Invite linkni saqlab bo'lmadi (purchase=%s): %s", purchase["id"], exc)
            invite_link = None

    escaped_title = html.escape(str(course_title))
    channel_text = ""
    if invite_link:
        channel_text = (
            "\n\n🔐 <b>Yopiq dars kanali:</b> quyidagi tugma orqali zayavka yuboring. "
            "Havola 72 soat ishlaydi va faqat sizning Telegram akkauntingizga biriktirilgan."
        )

    await _notify_student(
        purchase.get("telegram_id"),
        "🎉 <b>Ajoyib yangilik! To'lovingiz tasdiqlandi.</b>\n\n"
        f"<b>{escaped_title}</b> kursi profilingizda ochildi.{channel_text}\n\n"
        "Hoziroq o'rganishni boshlashingiz mumkin 👇",
        invite_link=invite_link,
    )
    return True, "To'lov tasdiqlandi va talabaga kurs ochildi"


async def reject_purchase(transaction_id: str, admin_name: str) -> Tuple[bool, str]:
    """Faqat kutilayotgan chekni rad etadi va talabani xabardor qiladi."""
    store = get_store()
    purchase = await store.get_purchase_by_tx(transaction_id)
    if not purchase:
        return False, "Buyurtma topilmadi"
    if purchase.get("status") == "rejected":
        return True, "Bu chek oldin rad etilgan"
    if purchase.get("status") != "pending_approval":
        return False, "Tasdiqlangan chekni rad etib bo'lmaydi"

    claimed = await store.transition_purchase_status(
        purchase["id"],
        "pending_approval",
        {"status": "rejected", "reviewed_by": admin_name},
    )
    if not claimed:
        return False, "Chek holati o'zgargan; ro'yxatni yangilang"

    if purchase.get("user_id"):
        await store.create_notification(
            purchase["user_id"],
            "To'lov cheki rad etildi",
            "Yuborgan chekingiz tekshiruvdan o'tmadi. Iltimos, qayta to'lov qiling yoki adminlarga yozing.",
            "warning",
        )

    await _notify_student(
        purchase.get("telegram_id"),
        "⚠️ <b>To'lov chekingiz tasdiqlanmadi.</b>\n\n"
        "Chek ma'lumotlarini tekshirib, qayta yuboring yoki yordam uchun adminlarga yozing:\n"
        "👤 @yomonboIa\n👤 @sokin_notalar",
    )
    return True, "Chek rad etildi va talaba xabardor qilindi"


async def is_join_request_authorized(
    chat_id: int, telegram_id: int, invite_link: Optional[str]
) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """Join request aynan xaridorning o'z invite-linki bilan kelganini tekshiradi."""
    if not invite_link or not telegram_id:
        return False, None

    cached = _invite_authorization_cache.get(invite_link)
    if cached:
        try:
            not_expired = datetime.fromisoformat(str(cached["expires_at"])) > datetime.now(timezone.utc)
        except (KeyError, TypeError, ValueError):
            not_expired = False
        if not not_expired:
            _invite_authorization_cache.pop(invite_link, None)
        elif (
            str(cached.get("chat_id")) == str(chat_id)
            and int(cached.get("telegram_id") or 0) == int(telegram_id)
        ):
            return True, {"course_title": cached.get("course_title")}
        else:
            return False, {"course_title": cached.get("course_title")}

    store = get_store()
    purchase = await store.get_purchase_by_invite_link(invite_link)
    if not purchase or purchase.get("status") != "approved":
        return False, purchase
    if int(purchase.get("telegram_id") or 0) != int(telegram_id):
        return False, purchase

    course_id = purchase.get("course_id")
    course = await store.get_course(str(course_id)) if course_id else None
    if not course or str(course.get("telegram_channel_id")) != str(chat_id):
        return False, purchase

    expires_at = purchase.get("invite_expires_at")
    if expires_at:
        try:
            normalized = str(expires_at).replace("Z", "+00:00")
            if datetime.fromisoformat(normalized) <= datetime.now(timezone.utc):
                return False, purchase
        except ValueError:
            return False, purchase

    user = await store.get_user_by_tg(telegram_id)
    enrollment = await store.get_enrollment(user["id"], course["id"]) if user else None
    return bool(enrollment and enrollment.get("status") == "active"), purchase


async def revoke_join_request_link(
    client: "httpx.AsyncClient", chat_id: int, invite_link: str
) -> None:
    """Join request tasdiqlangach havolani bekor qiladi — link bir martalik bo'ladi.

    Bekor qilingan link orqali yangi zayavka yuborib bo'lmaydi; kanalga kirgan
    xaridor esa kanalda qoladi. Xato bo'lsa link 72 soatlik muddati bilan
    baribir o'chadi, shuning uchun oqim to'xtamaydi.
    """
    _invite_authorization_cache.pop(invite_link, None)
    if not settings.BOT_TOKEN:
        return
    try:
        response = await client.post(
            _api_url("revokeChatInviteLink"),
            json={"chat_id": chat_id, "invite_link": invite_link},
        )
        data = response.json() if response.status_code == 200 else {}
        if not data.get("ok"):
            logger.warning("Invite link bekor qilinmadi: %s", response.text[:250])
    except (httpx.HTTPError, ValueError) as exc:
        logger.error("Invite linkni bekor qilishda xato: %s", exc)

    store = get_store()
    try:
        purchase = await store.get_purchase_by_invite_link(invite_link)
        if purchase:
            await store.update_purchase(
                purchase["id"], {"invite_expires_at": datetime.now(timezone.utc).isoformat()}
            )
    except Exception as exc:
        logger.warning("Invite link muddati bazada yangilanmadi: %s", exc)


async def get_chat_member_status(channel_id: int, telegram_id: int) -> Optional[str]:
    """Foydalanuvchining kanaldagi holatini qaytaradi (bot admin bo'lishi shart)."""
    if not settings.BOT_TOKEN or not telegram_id:
        return None
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                _api_url("getChatMember"),
                json={"chat_id": channel_id, "user_id": int(telegram_id)},
            )
            data = response.json() if response.status_code == 200 else {}
            if data.get("ok"):
                return (data.get("result") or {}).get("status")
            logger.warning("getChatMember xatosi: %s", response.text[:250])
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("getChatMember so'rovida xato: %s", exc)
    return None


def _channel_member_url(channel_id: int) -> str:
    """A'zolar uchun kanalni to'g'ridan-to'g'ri ochadigan ichki havola."""
    internal = str(channel_id)
    if internal.startswith("-100"):
        internal = internal[4:]
    return f"https://t.me/c/{internal.lstrip('-')}/1"


async def issue_channel_access(
    user_id: str, course_id: str, telegram_id: Optional[int]
) -> Dict[str, Any]:
    """Xaridor uchun kanal havolasi: a'zo bo'lsa kanalni ochadi, aks holda yangi bir martalik link beradi.

    LookupError — kurs topilmadi; PermissionError — foydalanuvchiga link berib bo'lmaydi.
    """
    store = get_store()
    course = await store.get_course(str(course_id))
    if not course:
        raise LookupError("Kurs topilmadi")

    try:
        channel_id = int(str(course.get("telegram_channel_id") or "").strip())
    except ValueError:
        raise PermissionError("Bu kurs uchun yopiq kanal hali sozlanmagan. Adminlarga murojaat qiling.")

    # 1) Allaqachon a'zo — bekor qilingan eski link kerak emas, kanal to'g'ridan-to'g'ri ochiladi.
    status = await get_chat_member_status(channel_id, int(telegram_id or 0))
    if status in {"creator", "administrator", "member"}:
        return {
            "is_member": True,
            "url": _channel_member_url(channel_id),
            "message": "Siz kanalga a'zosiz — darslar kanalda davom etmoqda",
        }

    # 2) A'zo emas — yangi bir martalik join-request havola yaratiladi.
    purchase = await store.get_approved_purchase_for(user_id, str(course_id))
    if purchase and not purchase.get("telegram_id") and telegram_id:
        purchase = {**purchase, "telegram_id": int(telegram_id)}
    if not purchase:
        # Admin tomonidan qo'lda biriktirilgan (xaridsiz) talabalar uchun
        user = await store.get_user(user_id)
        purchase = {
            "telegram_id": int(telegram_id or 0),
            "student_name": (user or {}).get("name") or "Talaba",
            "course_title": course.get("title"),
        }
    if not purchase.get("telegram_id"):
        raise PermissionError("Telegram akkauntingiz bog'lanmagan. Adminlarga murojaat qiling.")

    invite_link, expires_at = await _create_join_request_link(channel_id, purchase)
    if not invite_link:
        raise PermissionError("Taklif havolasini yaratib bo'lmadi. Bir ozdan so'ng qayta urining.")

    if purchase.get("id"):
        try:
            await store.update_purchase(
                purchase["id"],
                {"channel_invite_link": invite_link, "invite_expires_at": expires_at},
            )
        except Exception as exc:
            logger.warning("Yangi invite link bazaga saqlanmadi: %s", exc)

    _prune_invite_cache()
    _invite_authorization_cache[invite_link] = {
        "chat_id": str(channel_id),
        "telegram_id": int(purchase.get("telegram_id") or 0),
        "expires_at": expires_at,
        "course_title": course.get("title") or "kurs",
    }
    return {
        "is_member": False,
        "url": invite_link,
        "message": "Tugmani bosib zayavka yuboring — admin tasdiqlashi bilan kanalda bo'lasiz",
    }
