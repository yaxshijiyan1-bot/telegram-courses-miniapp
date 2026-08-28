"""Course Academy Telegram Bot.

Aiogram ishlatmasdan Telegram Bot API + httpx asosida yozilgan: FastAPI bilan bitta
event loopda ishlaydi, ammo /start, katalog, checkout FSM, chek tasdiqlash, join
request himoyasi va admin buyruqlari to'liq ajratilgan handlerlarga ega.
"""
from __future__ import annotations

import asyncio
import html
import json
import logging
import time
import uuid
from typing import Any, Dict, Optional

import httpx

from app.api.ai import call_openrouter_api
from app.core.config import settings
from app.core.r2 import r2_client
from app.services.pricing import course_pricing
from app.services.purchases import (
    approve_purchase,
    is_join_request_authorized,
    reject_purchase,
    revoke_join_request_link,
)
from app.storage import get_store

logger = logging.getLogger(__name__)

API_URL = f"https://api.telegram.org/bot{settings.BOT_TOKEN}"

# FSM faqat chek yuborishning qisqa oralig'i uchun kerak. Jarayon server qayta
# ishga tushsa toza holatga qaytadi; tasdiqlangan cheklar esa doim bazada qoladi.
_checkout_sessions: Dict[int, str] = {}

# Guruh AI yordamchisi uchun chat bo'yicha tezlik cheklovi (spam/kredit himoyasi)
_GROUP_AI_STATE: Dict[int, Dict[str, Any]] = {}
BOT_ID: Optional[int] = None

# Guruhda AI savol-javobni ishga tushiradigan sotuvga aloqador so'zlar
_GROUP_SALES_KEYWORDS = (
    "kurs", "narx", "narxi", "chegirma", "to'lov", "tolov", "o'qimoq", "o'qimoqchi",
    "o'rgan", "sertifikat", "platforma", "kreativ", "dizayn", "smm", "dasturlash",
    "sun'iy intellekt", "prompt", "nechchi dars", "qancha turadi",
)


def _uzs(amount: Any) -> str:
    try:
        return f"{int(amount or 0):,}".replace(",", " ") + " so'm"
    except (ValueError, TypeError):
        return "0 so'm"


def _escape(value: Any) -> str:
    return html.escape(str(value or ""))


async def _telegram_call(
    client: httpx.AsyncClient, method: str, payload: Dict[str, Any]
) -> Dict[str, Any]:
    """Telegram so'rovini bajaradi va xatoni logga yozadi."""
    try:
        response = await client.post(f"{API_URL}/{method}", json=payload)
        data = response.json()
        if response.status_code != 200 or not data.get("ok"):
            logger.warning("Telegram %s xatosi: %s", method, response.text[:300])
        return data if isinstance(data, dict) else {}
    except (httpx.HTTPError, ValueError) as exc:
        logger.error("Telegram %s so'rovida xato: %s", method, exc)
        return {}


async def send_tg_message(
    client: httpx.AsyncClient,
    chat_id: int,
    text: str,
    reply_markup: Optional[dict] = None,
    protect_content: bool = True,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "protect_content": protect_content,
        "disable_web_page_preview": True,
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return await _telegram_call(client, "sendMessage", payload)


async def send_tg_photo(
    client: httpx.AsyncClient,
    chat_id: int,
    photo: str,
    caption: str,
    reply_markup: Optional[dict] = None,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "chat_id": chat_id,
        "photo": photo,
        "caption": caption[:1024],
        "parse_mode": "HTML",
        "protect_content": True,
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return await _telegram_call(client, "sendPhoto", payload)


async def send_tg_chat_action(client: httpx.AsyncClient, chat_id: int, action: str = "typing") -> None:
    await _telegram_call(client, "sendChatAction", {"chat_id": chat_id, "action": action})


def _resolve_media_url(url: str) -> str:
    """R2 media havolalarini Telegram yubora oladigan to'g'ridan-to'g'ri URL ga aylantiradi.

    /api/media/{key} havolalari 307 redirect qaytaradi, Telegram sendPhoto esa
    redirectlarni kuzatmaydi — shuning uchun kalit bo'yicha presigned URL ochamiz.
    """
    resolved = r2_client.resolve_stream_url(url, expires_in=86400)
    return str(resolved or "").strip()


async def _answer_callback(client: httpx.AsyncClient, query_id: str, text: str = "") -> None:
    payload: Dict[str, Any] = {"callback_query_id": query_id}
    if text:
        payload["text"] = text[:190]
    await _telegram_call(client, "answerCallbackQuery", payload)


async def _ensure_user(tg_user: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Botdan foydalangan odamni users jadvalida yaratadi/yangi ma'lumotini yangilaydi."""
    telegram_id = tg_user.get("id")
    if not telegram_id:
        return None

    store = get_store()
    name = " ".join(
        part for part in (tg_user.get("first_name"), tg_user.get("last_name")) if part
    ).strip() or "Talaba"
    username = tg_user.get("username")
    user = await store.get_user_by_tg(int(telegram_id))
    if user:
        updates = {
            key: value
            for key, value in {"name": name, "username": username}.items()
            if value is not None and user.get(key) != value
        }
        if updates:
            await store.update_user(user["id"], updates)
            user.update(updates)
        return user

    role = "superadmin" if int(telegram_id) in settings.ADMIN_IDS else "student"
    try:
        return await store.create_user(
            {"telegram_id": int(telegram_id), "name": name, "username": username, "role": role}
        )
    except Exception as exc:
        # Ikki update parallel kelgan bo'lsa, ikkinchisi mavjud userni qayta oladi.
        logger.warning("Telegram user yaratilmadi: %s", exc)
        return await store.get_user_by_tg(int(telegram_id))


def _course_keyboard(course: Dict[str, Any], index: int, total: int) -> dict:
    rows = [
        [
            {"text": "⬅️ Oldingi", "callback_data": f"course:{(index - 1) % total}"},
            {"text": f"{index + 1}/{total}", "callback_data": "noop"},
            {"text": "Keyingi ➡️", "callback_data": f"course:{(index + 1) % total}"},
        ],
        [{"text": "💳 To'lov qilish", "callback_data": f"pay:{course['id']}"}],
        [{"text": "🚀 Mini Appda batafsil", "web_app": {"url": f"{settings.WEBAPP_URL}#course_{course['id']}"}}],
    ]
    return {"inline_keyboard": rows}


def _course_caption(course: Dict[str, Any], pricing: Optional[Dict[str, Any]] = None) -> str:
    title = _escape(course.get("title") or "Kurs")
    category = _escape(course.get("category") or "Premium ta'lim")
    instructor = _escape(course.get("instructor_name") or "Kreativ AI ustozlari")

    instructor_title = _escape(course.get("instructor_title") or "Ekspert")
    # Faol "birinchi N kishi" chegirmasi bo'lsa — chegirmali yakuniy narx ko'rsatiladi
    discount_active = bool((pricing or {}).get("discount_active"))
    final_price = (pricing or {}).get("final_price")
    shown_price = final_price if discount_active and final_price is not None else course.get("price")
    shown_old = course.get("price") if discount_active and final_price is not None else course.get("old_price")
    old_price_line = f"\n🏷 <s>{_uzs(shown_old)}</s>" if shown_old and shown_old > (shown_price or 0) else ""
    discount = course.get("discount_percent")
    if discount_active and discount:
        spots = (pricing or {}).get("discount_spots_left")
        discount_line = f"\n🔥 <b>−{int(discount)}% chegirma</b> — birinchi {int(course.get('discount_limit') or 0)} kishi uchun"
        if spots is not None:
            discount_line += f", {int(spots)} ta joy qoldi"
    else:
        discount_line = f" · 🔥 -{discount}%" if discount and not course.get("discount_limit") else ""
    description = _escape(course.get("short_description") or course.get("description") or "")
    if len(description) > 290:
        description = description[:287].rstrip() + "..."
    return (
        f"🎓 <b>{title}</b>\n"
        f"🏷 {category}\n"
        f"📚 {int(course.get('lesson_count') or 0)} ta dars · ⏱ {_escape(course.get('duration') or 'Davomiyligi ko\'rsatiladi')}\n"
        f"💰 <b>{_uzs(shown_price)}</b>{old_price_line}{discount_line}\n"
        f"🎙 <b>{instructor}</b> — {instructor_title}\n"
        f"⭐ {course.get('rating') or 5.0}/5\n\n"
        f"{description}"
    )


async def show_course_card(client: httpx.AsyncClient, chat_id: int, index: int) -> None:
    store = get_store()
    courses = await store.list_courses(published_only=True)
    if not courses:
        await send_tg_message(client, chat_id, "📚 Hozircha kurslar tayyorlanmoqda. Tez orada qayta ko'ring!")
        return

    index %= len(courses)
    course = courses[index]
    try:
        pricing = await course_pricing(store, course)
    except Exception:
        pricing = {"discount_active": False, "discount_spots_left": None, "final_price": course.get("price")}
    keyboard = _course_keyboard(course, index, len(courses))
    caption = _course_caption(course, pricing)
    cover_url = _resolve_media_url(course.get("cover_url") or "")
    if cover_url.startswith(("https://", "http://")):
        result = await send_tg_photo(client, chat_id, cover_url, caption, keyboard)
        if result.get("ok"):
            return
    await send_tg_message(client, chat_id, caption, keyboard)


async def _get_active_card_info() -> Dict[str, str]:
    store = get_store()
    card_num = settings.CARD_NUMBER
    card_holder = settings.CARD_HOLDER
    bank_name = settings.CARD_BANK
    try:
        saved_pay = await store.get_setting("payment_settings")
        if saved_pay:
            data = json.loads(saved_pay)
            if data.get("card_number"):
                card_num = data["card_number"]
            if data.get("card_holder"):
                card_holder = data["card_holder"]
            if data.get("bank_name"):
                bank_name = data["bank_name"]
    except Exception:
        pass
    return {"card_number": card_num, "card_holder": card_holder, "bank_name": bank_name}


async def _send_payment_info(client: httpx.AsyncClient, chat_id: int) -> None:
    card = await _get_active_card_info()
    text = (
        "💳 <b>Kreativ AI — To'lov rekvizitlari</b>\n\n"
        f"🏦 Bank: <b>{_escape(card['bank_name'])}</b>\n"
        f"💳 Karta raqami (nusxalash uchun bosing):\n"
        f"<code>{_escape(card['card_number'])}</code>\n"
        f"👤 Qabul qiluvchi: <b>{_escape(card['card_holder'])}</b>\n\n"
        "💡 <b>To'lov tartibi:</b>\n"
        "1. Karta raqamidan nusxa oling va ilovangizdan pul o'tkazing.\n"
        "2. To'lov chekini skrinshot qilib, shu chatga rasm ko'rinishida yuboring.\n"
        "3. Admin tasdiqlashi bilan darslar va yopiq kanal avtomatik ochiladi."
    )
    rows = [
        [{"text": "🚀 Kreativ AI — Mini App", "web_app": {"url": settings.WEBAPP_URL}}],
        [{"text": "📚 Kurslar Katalogi", "callback_data": "course:0"}],
    ]
    await send_tg_message(
        client,
        chat_id,
        text,
        {"inline_keyboard": rows},
    )


async def _start_checkout(client: httpx.AsyncClient, chat_id: int, user: Dict[str, Any], course_id: str) -> None:
    store = get_store()
    course = await store.get_course(course_id)
    if not course or not course.get("published", True):
        await send_tg_message(client, chat_id, "⚠️ Bu kurs hozir mavjud emas.")
        return
    card = await _get_active_card_info()
    # Chegirma faol bo'lsa bot ham mini-app bilan bir xil yakuniy narxni ko'rsatadi
    try:
        pricing = await course_pricing(store, course)
    except Exception:
        pricing = {"discount_active": False, "discount_spots_left": None, "final_price": course.get("price")}
    amount = pricing["final_price"]
    price_block = f"💰 Summa: <b>{_uzs(amount)}</b>"
    if pricing["discount_active"] and course.get("discount_percent"):
        price_block = (
            f"💰 Summa: <s>{_uzs(course.get('price'))}</s> → <b>{_uzs(amount)}</b>\n"
            f"🔥 <b>−{int(course['discount_percent'])}% chegirma</b> — birinchi {int(course.get('discount_limit') or 0)} kishi uchun"
            + (f", {int(pricing['discount_spots_left'])} ta joy qoldi" if pricing.get("discount_spots_left") is not None else "")
        )
    _checkout_sessions[int(user["telegram_id"])] = course["id"]
    await send_tg_message(
        client,
        chat_id,
        "💳 <b>To'lovni amalga oshirish</b>\n\n"
        f"📚 Kurs: <b>{_escape(course['title'])}</b>\n"
        f"{price_block}\n\n"
        f"🏦 Bank: <b>{_escape(card['bank_name'])}</b>\n"
        f"💳 Karta raqami (nusxalash uchun bosing):\n"
        f"<code>{_escape(card['card_number'])}</code>\n"
        f"👤 Qabul qiluvchi: <b>{_escape(card['card_holder'])}</b>\n\n"
        "To'lovni amalga oshiring va <b>chek skrinshotini rasm ko'rinishida shu chatga yuboring</b>.\n"
        "Admin tekshirishi bilan darslar sizga ochiladi.",
        {"inline_keyboard": [
            [{"text": "🚀 Mini Appda ko'rish", "web_app": {"url": f"{settings.WEBAPP_URL}#course_{course['id']}"}}],
            [{"text": "✖️ Bekor qilish", "callback_data": "checkout:cancel"}]
        ]},
    )



async def _notify_admins_about_receipt(
    client: httpx.AsyncClient, purchase: Dict[str, Any], photo_file_id: str
) -> int:
    """Yangi chekni barcha superadminlarga yuboradi."""
    username = str(purchase.get("username") or "").lstrip("@")
    username_label = f"@{_escape(username)}" if username else "username yo'q"
    caption = (
        "🔔 <b>YANGI TO'LOV CHEKI KELDI!</b>\n\n"
        f"👤 <b>Talaba:</b> {_escape(purchase.get('student_name') or 'Talaba')} ({username_label})\n"
        f"🆔 <b>Telegram ID:</b> <code>{purchase.get('telegram_id') or 0}</code>\n"
        f"📚 <b>Kurs:</b> {_escape(purchase.get('course_title') or 'Kurs')}\n"
        f"💰 <b>Summa:</b> {_uzs(purchase.get('amount'))}\n"
        f"💳 <b>To'lov turi:</b> {_escape(purchase.get('payment_method') or 'card').upper()}\n"
        f"🔢 <b>Buyurtma ID:</b> <code>{_escape(purchase.get('transaction_id'))}</code>\n\n"
        "Chekni tekshirib, tugma orqali qaror qabul qiling."
    )
    keyboard = {
        "inline_keyboard": [
            [
                {"text": "✅ Tasdiqlash", "callback_data": f"approve_{purchase['transaction_id']}"},
                {"text": "❌ Rad etish", "callback_data": f"reject_{purchase['transaction_id']}"},
            ],
            [{"text": "📊 Admin panel", "web_app": {"url": f"{settings.WEBAPP_URL}#admin"}}],
        ]
    }
    notified = 0
    for admin_id in settings.ADMIN_IDS:
        result = await send_tg_photo(client, admin_id, photo_file_id, caption, keyboard)
        if result.get("ok"):
            notified += 1
    return notified


async def _store_telegram_receipt(
    client: httpx.AsyncClient, file_id: str, transaction_id: str
) -> Optional[str]:
    """Telegramdan kelgan chekni R2 ga ko'chiradi, admin paneli ham rasmni ko'ra olishi uchun."""
    try:
        file_data = await _telegram_call(client, "getFile", {"file_id": file_id})
        file_path = (file_data.get("result") or {}).get("file_path")
        if not file_path:
            return None
        response = await client.get(f"https://api.telegram.org/file/bot{settings.BOT_TOKEN}/{file_path}")
        image_bytes = response.content
        if response.status_code != 200 or not image_bytes or len(image_bytes) > 8 * 1024 * 1024:
            return None
        ext = str(file_path).rsplit(".", 1)[-1].lower() if "." in str(file_path) else "jpg"
        if ext not in {"jpg", "jpeg", "png", "webp"}:
            ext = "jpg"
        content_type = "image/jpeg" if ext in {"jpg", "jpeg"} else f"image/{ext}"
        return await asyncio.to_thread(
            r2_client.upload_bytes, f"receipts/{transaction_id}.{ext}", image_bytes, content_type
        ) or None
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Telegram cheki R2 ga ko'chirilmadi: %s", exc)
        return None


async def _handle_receipt_photo(client: httpx.AsyncClient, message: Dict[str, Any], user: Dict[str, Any]) -> bool:
    telegram_id = int(user.get("telegram_id") or 0)
    course_id = _checkout_sessions.get(telegram_id)
    photos = message.get("photo") or []
    if not course_id or not photos:
        return False

    store = get_store()
    course = await store.get_course(course_id)
    if not course:
        _checkout_sessions.pop(telegram_id, None)
        await send_tg_message(client, telegram_id, "⚠️ Kurs topilmadi. Iltimos, katalogdan qayta tanlang.")
        return True

    file_id = photos[-1].get("file_id")
    if not file_id:
        await send_tg_message(client, telegram_id, "⚠️ Rasmni o'qib bo'lmadi. Iltimos, yana yuboring.")
        return True

    transaction_id = f"rcp_{uuid.uuid4().hex[:12]}"
    receipt_url = await _store_telegram_receipt(client, file_id, transaction_id)
    # Botdan kelgan chek ham mini-app bilan bir xil chegirmali narxda qayd etiladi
    try:
        pricing = await course_pricing(store, course)
    except Exception:
        pricing = {"final_price": course.get("price")}
    purchase = await store.create_purchase(
        {
            "user_id": user["id"],
            "course_id": course["id"],
            "course_title": course["title"],
            "amount": pricing["final_price"],
            "status": "pending_approval",
            "payment_method": "telegram_receipt",
            "transaction_id": transaction_id,
            "telegram_id": telegram_id,
            "student_name": user.get("name") or "Talaba",
            "username": user.get("username"),
            # Telegram file_id boshqa chatga sendPhoto qilish uchun yetarli; chekning o'zi Telegramda qoladi.
            "receipt_image_url": receipt_url or f"tg-file:{file_id}",
            "comment": (message.get("caption") or "")[:500] or None,
        }
    )
    _checkout_sessions.pop(telegram_id, None)
    notified = await _notify_admins_about_receipt(client, purchase, file_id)
    await send_tg_message(
        client,
        telegram_id,
        "✅ <b>Chekingiz qabul qilindi!</b>\n\n"
        f"<b>{_escape(course['title'])}</b> uchun to'lovingiz tekshiruvga yuborildi. "
        "Admin tasdiqlashi bilan kurs va yopiq kanal havolasi avtomatik yuboriladi.",
    )
    if not notified:
        logger.warning("Chek adminlarga yuborilmadi: %s", purchase["transaction_id"])
    return True


async def _handle_admin_callback(client: httpx.AsyncClient, callback_query: Dict[str, Any]) -> bool:
    data = str(callback_query.get("data") or "")
    if not (data.startswith("approve_") or data.startswith("reject_")):
        return False

    query_id = callback_query.get("id", "")
    admin_tg_id = callback_query.get("from", {}).get("id")
    if admin_tg_id not in settings.ADMIN_IDS:
        await _answer_callback(client, query_id, "Sizda admin huquqlari yo'q")
        return True

    order_id = data.split("_", 1)[1]
    profile = settings.ADMIN_PROFILES.get(admin_tg_id, {})
    admin_name = profile.get("name") or callback_query.get("from", {}).get("first_name") or "Superadmin"
    approved = data.startswith("approve_")
    ok, result = (
        await approve_purchase(order_id, admin_name)
        if approved
        else await reject_purchase(order_id, admin_name)
    )
    await _answer_callback(client, query_id, ("✅ " if ok else "⚠️ ") + result)
    if not ok:
        return True

    message = callback_query.get("message") or {}
    chat = message.get("chat") or {}
    current_text = message.get("caption") or message.get("text") or ""
    updated = (
        f"{current_text}\n\n━━━━━━━━━━━━━━━━━━━━\n"
        f"{'✅ <b>TO\'LOV TASDIQLANDI</b>' if approved else '❌ <b>TO\'LOV RAD ETILDI</b>'}\n"
        f"👤 <b>Admin:</b> {_escape(admin_name)}"
    )[:1024]
    method = "editMessageCaption" if message.get("caption") is not None else "editMessageText"
    field = "caption" if method == "editMessageCaption" else "text"
    await _telegram_call(
        client,
        method,
        {"chat_id": chat.get("id"), "message_id": message.get("message_id"), field: updated, "parse_mode": "HTML"},
    )
    return True


async def handle_callback_query(client: httpx.AsyncClient, callback_query: Dict[str, Any]) -> None:
    if await _handle_admin_callback(client, callback_query):
        return

    query_id = callback_query.get("id", "")
    data = str(callback_query.get("data") or "")
    tg_user = callback_query.get("from") or {}
    chat_id = (callback_query.get("message") or {}).get("chat", {}).get("id") or tg_user.get("id")
    user = await _ensure_user(tg_user)
    if not user or not chat_id:
        await _answer_callback(client, query_id, "Foydalanuvchi aniqlanmadi")
        return

    if data == "noop":
        await _answer_callback(client, query_id)
        return
    if data.startswith("course:"):
        try:
            index = int(data.split(":", 1)[1])
        except ValueError:
            await _answer_callback(client, query_id, "Kurs topilmadi")
            return
        await _answer_callback(client, query_id)
        await show_course_card(client, int(chat_id), index)
        return
    if data.startswith("pay:"):
        await _answer_callback(client, query_id)
        await _start_checkout(client, int(chat_id), user, data.split(":", 1)[1])
        return
    if data == "checkout:cancel":
        _checkout_sessions.pop(int(user["telegram_id"]), None)
        await _answer_callback(client, query_id, "To'lov bekor qilindi")
        await send_tg_message(client, int(chat_id), "To'lov jarayoni bekor qilindi. Istalgan payt kursni qayta tanlashingiz mumkin.")
        return
    if data == "payments":
        await _answer_callback(client, query_id)
        await _send_payment_info(client, int(chat_id))
        return
    if data == "help":
        await _answer_callback(client, query_id)
        await _send_help(client, int(chat_id))
        return
    await _answer_callback(client, query_id, "Bu tugma endi faol emas")


async def handle_chat_join_request(client: httpx.AsyncClient, join_request: Dict[str, Any]) -> None:
    """Link va xaridor akkaunti mos kelgandagina join requestni tasdiqlaydi.

    Tasdiqlangach havola darhol bekor qilinadi (bir martalik link): uni boshqa
    odamga qayta yuborib yoki eski zayavkani qayta bosib kirib bo'lmaydi.
    """
    chat = join_request.get("chat") or {}
    requester = join_request.get("from") or {}
    chat_id = chat.get("id")
    telegram_id = requester.get("id")
    invite = join_request.get("invite_link") or {}
    invite_link = invite.get("invite_link") if isinstance(invite, dict) else None
    if not chat_id or not telegram_id:
        return

    authorized, purchase = await is_join_request_authorized(int(chat_id), int(telegram_id), invite_link)
    method = "approveChatJoinRequest" if authorized else "declineChatJoinRequest"
    result = await _telegram_call(
        client, method, {"chat_id": chat_id, "user_id": telegram_id}
    )
    if not result.get("ok"):
        return

    title = _escape((purchase or {}).get("course_title") or chat.get("title") or "kurs")
    if authorized:
        if invite_link:
            await revoke_join_request_link(client, int(chat_id), invite_link)
        await send_tg_message(
            client,
            int(telegram_id),
            f"🎉 <b>Xush kelibsiz!</b> Sizning <b>{title}</b> kanaliga zayavkangiz tasdiqlandi. Darslarni boshlashingiz mumkin.",
        )
    else:
        await send_tg_message(
            client,
            int(telegram_id),
            "⚠️ <b>Kanalga kirish rad etildi.</b> Bu havola boshqa akkauntga berilgan, allaqachon ishlatilgan yoki amal qilish muddati tugagan. "
            "Kursni o'z akkauntingizdan sotib oling.",
            {"inline_keyboard": [[{"text": "🚀 Mini Appni ochish", "web_app": {"url": settings.WEBAPP_URL}}]]},
        )


async def handle_my_chat_member(client: httpx.AsyncClient, update: Dict[str, Any]) -> None:
    """Bot kanalga admin bo'lganda superadminlarga kanal ID sini yuboradi.
    Guruhga qo'shilganda esa qisqa tanishtiruv yuboradi."""
    chat = update.get("chat") or {}
    old_status = (update.get("old_chat_member") or {}).get("status")
    new_status = (update.get("new_chat_member") or {}).get("status")

    if chat.get("type") in {"group", "supergroup"}:
        if new_status in {"member", "administrator"} and old_status in {"left", "kicked"}:
            await _send_group_intro(client, int(chat.get("id") or 0))
        return

    if new_status not in {"administrator", "creator"} or old_status == new_status:
        return
    if chat.get("type") not in {"channel", "supergroup"}:
        return

    text = (
        "📢 <b>Yangi dars kanali ulandi</b>\n\n"
        f"📌 Nomi: <b>{_escape(chat.get('title') or 'Kanal')}</b>\n"
        f"🆔 Kanal ID: <code>{chat.get('id')}</code>\n\n"
        "Admin paneldagi kurs tahrirlash oynasiga shu ID ni <code>telegram_channel_id</code> sifatida kiriting."
    )
    for admin_id in settings.ADMIN_IDS:
        await send_tg_message(client, admin_id, text)


async def _send_help(client: httpx.AsyncClient, chat_id: int) -> None:
    await send_tg_message(
        client,
        chat_id,
        "🤝 <b>Kreativ AI — Yordam markazi</b>\n\n"
        "To'lov, kurslar, yopiq kanallar yoki takliflar bo'yicha superadminlarga yozing:\n\n"
        "👤 <b>Yaxshi Bola</b> — @yomonboIa\n"
        "👤 <b>Zuhra Olimova</b> — @sokin_notalar",
        {"inline_keyboard": [
            [{"text": "🚀 Kreativ AI Mini App", "web_app": {"url": settings.WEBAPP_URL}}],
            [{"text": "📚 Kurslar Katalogi", "callback_data": "course:0"}]
        ]},
    )


async def _send_welcome(client: httpx.AsyncClient, chat_id: int, tg_user: Dict[str, Any]) -> None:
    first_name = _escape(tg_user.get("first_name") or "Do'stim")
    is_admin = tg_user.get("id") in settings.ADMIN_IDS
    text = (
        f"Assalomu alaykum, <b>{first_name}</b>! 🎓\n\n"
        "<b>Kreativ AI</b> — Sun'iy intellekt, dizayn va zamonaviy kasblar platformasiga xush kelibsiz!\n\n"
        "✨ <b>Imkoniyatlar:</b>\n"
        "• 📚 Yuqori sifatli amaliy kurslar\n"
        "• 🏆 Tekshiriluvchi QR-kodli sertifikatlar\n"
        "• 🔐 Himoyalangan yopiq dars kanallari\n\n"
        "Darslarni boshlash uchun quyidagi tugmani bosing 👇"
    )
    keyboard_rows = [
        [{"text": "🚀 Platformani Ochish (Mini App)", "web_app": {"url": settings.WEBAPP_URL}}],
        [{"text": "📚 Kurslar Katalogi", "callback_data": "course:0"}, {"text": "💳 To'lov Rekvizitlari", "callback_data": "payments"}],
        [{"text": "🆘 Admin Yordami", "callback_data": "help"}],
    ]
    if is_admin:
        keyboard_rows.append([{"text": "⚙️ Superadmin Boshqaruv Paneli", "web_app": {"url": f"{settings.WEBAPP_URL}#admin"}}])
    keyboard = {"inline_keyboard": keyboard_rows}

    banner_url = getattr(settings, "WELCOME_BANNER_URL", "")
    if not banner_url:
        try:
            courses = await get_store().list_courses(published_only=True)
            banner_url = str(courses[0].get("cover_url") or "") if courses else ""
        except Exception:
            banner_url = ""
    banner_url = _resolve_media_url(banner_url)
    if banner_url.startswith(("https://", "http://")):
        result = await send_tg_photo(client, chat_id, banner_url, text, keyboard)
        if result.get("ok"):
            return
    await send_tg_message(client, chat_id, text, keyboard)


async def _send_stats(client: httpx.AsyncClient, chat_id: int, user_id: int) -> None:
    if user_id not in settings.ADMIN_IDS:
        await send_tg_message(client, chat_id, "❌ Bu buyruq faqat superadminlar uchun.")
        return
    store = get_store()
    stats = await store.revenue_stats()
    pending = await store.list_purchases(status="pending_approval", limit=1000)
    active_courses = await store.list_courses(published_only=True)
    # Ayrim adminlarga (masalan Zuhra Olimova) talabalar soni ko'rsatilmaydi
    students_line = ""
    if user_id not in settings.STATS_STUDENTS_HIDDEN_IDS:
        students_line = f"👥 Talabalar: <b>{await store.count_users()} ta</b>\n"
    text = (
        "📊 <b>Kreativ AI — Platforma Statistikasi</b>\n\n"
        f"💰 Jami tushum: <b>{_uzs(stats.get('total_revenue'))}</b>\n"
        f"📈 Oylik tushum: <b>{_uzs(stats.get('monthly_revenue'))}</b>\n"
        f"{students_line}"
        f"📚 Faol kurslar: <b>{len(active_courses)} ta</b>\n"
        f"⏳ Kutilayotgan cheklar: <b>{len(pending)} ta</b>"
    )
    await send_tg_message(
        client, chat_id, text,
        {"inline_keyboard": [[{"text": "⚙️ Admin Panelni Ochish", "web_app": {"url": f"{settings.WEBAPP_URL}#admin"}}]]},
    )



async def _handle_unknown_text(client: httpx.AsyncClient, chat_id: int) -> None:
    """Matn ko'rinishidagi barcha xabarlarga yo'naltiruvchi javob (AI chat olib tashlangan)."""
    await send_tg_message(
        client,
        chat_id,
        "📚 <b>Kurslar platformasi</b>\n\n"
        "Kurslarni ko'rish uchun katalogni oching yoki to'lov uchun rekvizitlarni so'rang. "
        "Savollaringiz bo'lsa, adminlar /help bo'limida.",
        {"inline_keyboard": [
            [{"text": "📚 Kurslar Katalogi", "callback_data": "course:0"}, {"text": "💳 To'lov Rekvizitlari", "callback_data": "payments"}],
            [{"text": "🚀 Mini App", "web_app": {"url": settings.WEBAPP_URL}}],
        ]},
    )


async def _get_bot_id(client: httpx.AsyncClient) -> Optional[int]:
    """Botning o'z ID sini bir marta olib keshlaydi (guruhda reply-to-bot aniqlash uchun)."""
    global BOT_ID
    if BOT_ID is None:
        data = await _telegram_call(client, "getMe", {})
        BOT_ID = (data.get("result") or {}).get("id")
    return BOT_ID


def _group_ai_allowed(chat_id: int) -> bool:
    """Har bir guruhda AI javoblari: kamida 15 soniya oraliq va soatiga 8 tadan."""
    now = time.time()
    st = _GROUP_AI_STATE.setdefault(chat_id, {"times": [], "last": 0.0})
    st["times"] = [t for t in st["times"] if now - t < 3600]
    if now - st["last"] < 15:
        return False
    if len(st["times"]) >= 8:
        return False
    return True


def _group_ai_mark(chat_id: int) -> None:
    now = time.time()
    st = _GROUP_AI_STATE.setdefault(chat_id, {"times": [], "last": 0.0})
    st["last"] = now
    st["times"].append(now)


async def _send_group_intro(client: httpx.AsyncClient, chat_id: int) -> None:
    """Bot guruhga qo'shilganda qisqa tanishtiruv."""
    if not chat_id:
        return
    text = (
        "👋 <b>Assalomu alaykum!</b> Men — <b>Kreativ AI</b> o'quv platformasining yordamchisman.\n\n"
        "🤖 Guruhda savolingizni <b>@kreativaibot</b> deb yozib bering — AI yordamchim javob beradi "
        "va kasb o'rganish bo'yicha yo'l ko'rsatadi.\n"
        "📚 Kurslar, narxlar va chegirmalar haqida bemalol so'rang!"
    )
    keyboard = {
        "inline_keyboard": [
            [{"text": "🚀 Kurslarni ko'rish (Mini App)", "web_app": {"url": settings.WEBAPP_URL}}],
            [{"text": "📚 Kurslar Katalogi", "callback_data": "course:0"}],
        ]
    }
    await send_tg_message(client, chat_id, text, keyboard, protect_content=False)


async def _build_catalog_context(store) -> str:
    """AI ga beriladigan katalog konteksti — faqat real ma'lumotlar (raqam o'ylab topish taqiqlanadi)."""
    try:
        courses = await store.list_courses(published_only=True)
    except Exception:
        courses = []
    lines: list = []
    for c in courses[:8]:
        try:
            pricing = await course_pricing(store, c)
        except Exception:
            pricing = {"discount_active": False, "discount_spots_left": None, "final_price": c.get("price")}
        line = (
            f"• «{c.get('title')}» — kategoriya: {c.get('category')}, "
            f"{int(c.get('lesson_count') or 0)} ta dars, narxi {_uzs(pricing['final_price'])}, "
            f"ustoz: {c.get('instructor_name')}"
        )
        if pricing["discount_active"] and c.get("discount_percent"):
            line += (
                f", 🔥 −{int(c['discount_percent'])}% chegirma birinchi {int(c.get('discount_limit') or 0)} kishi uchun"
                + (f" ({int(pricing['discount_spots_left'])} ta joy qoldi)" if pricing.get("discount_spots_left") is not None else "")
            )
        lines.append(line)
    return "\n".join(lines) or "(katalog hozircha bo'sh)"


_GROUP_SYSTEM_PROMPT = (
    "Siz — «Kreativ AI» onlayn kurslar platformasining Telegram guruh yordamchisisiz. "
    "Vazifangiz: guruhdagi savollarga qisqa, do'stona va foydali javob berish hamda tabiiy tarzda "
    "platformadagi amaliy kurslarga qiziqish uyg'otish.\n\n"
    "Qoidalar:\n"
    "1. O'zbek tilida, sodda va samimiy ohangda yozing. Javob 1-4 gap + zarur bo'lsa 2-3 ta banddan oshmasin.\n"
    "2. Narx, chegirma, darslar soni — FAQAT katalogdan oling. Hech qachon raqam, aksiya yoki kurs "
    "nomini o'ylab chiqmang. Katalogda yo'q kursni tavsiya qilmang.\n"
    "3. Savol o'qish/kasb/ko'nikmaga aloqador bo'lsa — eng mos 1 ta kursni nomi va narxi bilan tavsiya qiling.\n"
    "4. Savol butunlay boshqa mavzuda bo'lsa — qisqa foydali javob bering va suhbatni kasb o'rganish "
    "mavzusiga tabiiy bog'lang.\n"
    "5. Spam, qattiq reklama ohangi bo'lmasin. Siyosiy, diniy va ta'qibli mavzularda betaraf qisqa javob bering.\n"
    "6. Javob oxirida 1 marta yumshoq CTA bo'lsin (masalan: 'Batafsil — Mini Appda 👇').\n"
    "7. Maksimal ~500 belgi. Emoji dan o'rnida foydalaning (1-3 dona)."
)


async def _group_ai_answer(
    client: httpx.AsyncClient,
    chat_id: int,
    reply_to_message_id: Optional[int],
    question: str,
    sender_name: str,
) -> None:
    """Guruhdagi savolga AI javob beradi: katalog konteksti + sotuvga yo'naltirilgan persona."""
    store = get_store()
    catalog = await _build_catalog_context(store)
    messages = [
        {"role": "system", "content": _GROUP_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Guruh a'zosi {sender_name} quyidagi savolni yozdi:\n"
                f"\"{question[:600]}\"\n\n"
                f"Platformaning joriy katalogi:\n{catalog}"
            ),
        },
    ]
    await send_tg_chat_action(client, chat_id, "typing")
    answer = await asyncio.to_thread(call_openrouter_api, messages)
    if not answer:
        top = "\n".join(catalog.splitlines()[:3]) if catalog and not catalog.startswith("(") else ""
        answer = (
            "🤖 Men hozircha savolga to'liq javob bera olmayaman, lekin Kreativ AI platformasidagi "
            "amaliy kurslar bilan tanishtiraman:\n"
            f"{top}\n\n"
            "Batafsil narx va chegirmalar Mini Appda 👇"
        )
    answer = answer.strip()
    if len(answer) > 1200:
        answer = answer[:1190].rstrip() + "…"

    payload: Dict[str, Any] = {
        "chat_id": chat_id,
        "text": _escape(answer),
        "disable_web_page_preview": True,
        "reply_markup": {"inline_keyboard": [
            [{"text": "🚀 Kurslarni ko'rish (Mini App)", "web_app": {"url": settings.WEBAPP_URL}}],
            [{"text": "📚 Kurslar Katalogi", "callback_data": "course:0"}],
        ]},
    }
    if reply_to_message_id:
        payload["reply_to_message_id"] = reply_to_message_id
        payload["allow_sending_without_reply"] = True
    await _telegram_call(client, "sendMessage", payload)


def _group_should_answer(message: Dict[str, Any], text: str) -> bool:
    """Guruhda bot faqat haqiqiy murojaatlarga javob beradi (spam qilmaydi):
    @mention, bot xabariga javob, yoki sotuvga aloqador so'zli savol."""
    lowered = text.lower()
    if f"@{settings.BOT_USERNAME.lower()}" in lowered:
        return True
    reply_from = ((message.get("reply_to_message") or {}).get("from")) or {}
    if BOT_ID and reply_from.get("id") == BOT_ID:
        return True
    if reply_from.get("username") and reply_from["username"].lower() == settings.BOT_USERNAME.lower():
        return True
    if "?" in text and any(k in lowered for k in _GROUP_SALES_KEYWORDS):
        return True
    return False


async def _handle_group_message(client: httpx.AsyncClient, message: Dict[str, Any]) -> None:
    """Guruh/supergrup xabarlari: komandalar + AI savol-javob. DB ga user yozilmaydi."""
    chat = message.get("chat") or {}
    chat_id = int(chat.get("id") or 0)
    tg_user = message.get("from") or {}
    if not chat_id or tg_user.get("is_bot"):
        return

    text = str(message.get("text") or "").strip()
    if text.startswith("/"):
        command = text.split(maxsplit=1)[0].split("@", 1)[0].lower()
        if command == "/start":
            await _send_group_intro(client, chat_id)
        elif command in {"/kurslar", "/courses"}:
            await show_course_card(client, chat_id, 0)
        elif command in {"/tolov", "/payment", "/payments"}:
            await _send_payment_info(client, chat_id)
        elif command in {"/help", "/contact"}:
            await _send_help(client, chat_id)
        elif command in {"/stats", "/admin"}:
            if tg_user.get("id") in settings.ADMIN_IDS:
                await _send_stats(client, chat_id, int(tg_user["id"]))
        return

    if not text or not _group_should_answer(message, text):
        return
    if not _group_ai_allowed(chat_id):
        return
    _group_ai_mark(chat_id)
    sender_name = _escape(tg_user.get("first_name") or "Do'stim")
    try:
        await _group_ai_answer(client, chat_id, message.get("message_id"), text, sender_name)
    except Exception:
        logger.exception("Guruh AI javobida xato (chat %s)", chat_id)


async def handle_tg_update(client: httpx.AsyncClient, update: Dict[str, Any]) -> None:
    if "chat_join_request" in update:
        await handle_chat_join_request(client, update["chat_join_request"])
        return
    if "my_chat_member" in update:
        await handle_my_chat_member(client, update["my_chat_member"])
        return

    # Bloklangan foydalanuvchilar bot bilan muloqot qila olmaydi (adminlar bundan mustasno)
    raw_tg_id = None
    if "callback_query" in update:
        raw_tg_id = ((update["callback_query"].get("from")) or {}).get("id")
    elif update.get("message"):
        raw_tg_id = ((update["message"].get("from")) or {}).get("id")
    if raw_tg_id:
        try:
            tg_id_int = int(raw_tg_id)
        except (TypeError, ValueError):
            tg_id_int = None
        if tg_id_int is not None and tg_id_int not in settings.ADMIN_IDS:
            try:
                if await get_store().is_user_blocked(tg_id_int):
                    if "callback_query" in update:
                        await _answer_callback(client, update["callback_query"].get("id"), "Hisobingiz bloklangan.")
                    return
            except Exception:
                pass

    if "callback_query" in update:
        await handle_callback_query(client, update["callback_query"])
        return

    message = update.get("message")
    if not message:
        return
    tg_user = message.get("from") or {}
    chat = message.get("chat") or {}
    chat_id = (chat.get("id"))
    if not tg_user or not chat_id:
        return

    # Guruh/supergrup xabarlari: bot faqat murojaatlarga javob beradi, DB ga
    # har bir guruh a'zosi yozilmaydi va chek/FSM oqimi faqat privat chatga xos.
    if chat.get("type") in {"group", "supergroup"}:
        await _handle_group_message(client, message)
        return

    user = await _ensure_user(tg_user)
    if not user:
        return
    if await _handle_receipt_photo(client, message, user):
        return

    text = str(message.get("text") or "").strip()
    if not text:
        if _checkout_sessions.get(int(user["telegram_id"])):
            await send_tg_message(client, int(chat_id), "📷 Chekni <b>rasm</b> sifatida yuboring. Hujjat yoki oddiy xabar qabul qilinmaydi.")
        return

    command = text.split(maxsplit=1)[0].split("@", 1)[0].lower()
    if command == "/start":
        # Referal havolasi: /start ref_XYZ
        payload = text.split(maxsplit=1)[1].strip() if len(text.split(maxsplit=1)) > 1 else ""
        if payload.lower().startswith("ref_"):
            from app.services.promos import link_referral
            ok, message, bonus = await link_referral(get_store(), user["id"], payload)
            if ok:
                await _send_welcome(client, int(chat_id), tg_user)
                await send_tg_message(
                    client,
                    int(chat_id),
                    "🎁 <b>Do'stingiz taklifi qabul qilindi!</b>\n\n"
                    f"Sizga bir martalik <b>−{int(bonus['percent'])}%</b> promokod berildi:\n"
                    f"<code>{bonus['code']}</code>\n\n"
                    "Kurs sotib olishda «Promokod» maydoniga shu kodni yozing.",
                    {"inline_keyboard": [[{"text": "🚀 Kurslarni ko'rish", "web_app": {"url": settings.WEBAPP_URL}}]]},
                )
                return
        await _send_welcome(client, int(chat_id), tg_user)
    elif command in {"/kurslar", "/courses"}:
        await show_course_card(client, int(chat_id), 0)
    elif command in {"/tolov", "/payment", "/payments"}:
        await _send_payment_info(client, int(chat_id))
    elif command in {"/stats", "/admin"}:
        await _send_stats(client, int(chat_id), int(user["telegram_id"]))
    elif command in {"/help", "/contact"}:
        await _send_help(client, int(chat_id))
    else:
        await _handle_unknown_text(client, int(chat_id))


async def start_telegram_bot_polling() -> None:
    """FastAPI lifespan ichida ishlaydigan, xatolarga chidamli long-polling xizmati."""
    if not settings.BOT_TOKEN:
        logger.warning("BOT_TOKEN sozlanmagan, Telegram polling ishga tushmadi.")
        return

    logger.info("Course Academy Telegram bot polling ishga tushmoqda.")
    offset = 0
    allowed_updates = ["message", "callback_query", "chat_join_request", "my_chat_member"]
    async with httpx.AsyncClient(timeout=35.0) as client:
        await _telegram_call(
            client,
            "setMyCommands",
            {"commands": [
                {"command": "start", "description": "Platformani ochish"},
                {"command": "kurslar", "description": "Kurslar katalogi"},
                {"command": "tolov", "description": "To'lov rekvizitlari"},
                {"command": "help", "description": "Yordam markazi"},
                {"command": "admin", "description": "Superadmin statistikasi"},
            ]},
        )
        await _telegram_call(
            client,
            "setChatMenuButton",
            {"menu_button": {"type": "web_app", "text": "🎓 Course Academy", "web_app": {"url": settings.WEBAPP_URL}}},
        )

        while True:
            try:
                response = await client.get(
                    f"{API_URL}/getUpdates",
                    params={"offset": offset, "timeout": 25, "allowed_updates": json.dumps(allowed_updates)},
                )
                data = response.json()
                if response.status_code != 200 or not data.get("ok"):
                    if response.status_code == 409:
                        logger.warning("Boshqa polling instansiyasi ishlayapti; qayta uriniladi.")
                        await asyncio.sleep(8)
                    else:
                        logger.warning("getUpdates xatosi: %s", response.text[:300])
                        await asyncio.sleep(3)
                    continue
                for item in data.get("result", []):
                    offset = int(item["update_id"]) + 1
                    try:
                        await handle_tg_update(client, item)
                    except Exception:
                        logger.exception("Telegram update ishlovida kutilmagan xato")
            except asyncio.CancelledError:
                logger.info("Telegram polling to'xtatildi.")
                break
            except (httpx.HTTPError, ValueError) as exc:
                logger.error("Telegram polling xatosi: %s", exc)
                await asyncio.sleep(3)
