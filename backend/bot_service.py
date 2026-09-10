"""Course Academy Telegram Bot.

Aiogram ishlatmasdan Telegram Bot API + httpx asosida yozilgan: FastAPI bilan bitta
event loopda ishlaydi, ammo /start, katalog, checkout FSM, chek tasdiqlash, join
request himoyasi va admin buyruqlari to'liq ajratilgan handlerlarga ega.
"""
from __future__ import annotations

import asyncio
import datetime as _dt
import html
import json
import logging
import secrets
import time
import uuid
from typing import Any, Dict, Optional, Tuple, List

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

# Adminlar video yuklash holati: admin_id -> video_meta_dict
_pending_admin_videos: Dict[int, Dict[str, Any]] = {}


class BoundedCooldown:
    """Xotirasi cheklangan va eskirgan kalitlarni avtomatik tozalovchi rate limiter (M7 yechimi)."""
    def __init__(self, seconds: float = 5.0, max_keys: int = 50000):
        self.seconds = seconds
        self.max_keys = max_keys
        self.items: Dict[Any, float] = {}

    def take(self, key: Any) -> bool:
        now = time.time()
        if len(self.items) >= self.max_keys:
            cutoff = now - self.seconds
            self.items = {k: ts for k, ts in self.items.items() if ts > cutoff}
            if len(self.items) >= self.max_keys:
                return False
        last = self.items.get(key, 0.0)
        if now - last < self.seconds:
            return False
        self.items[key] = now
        return True

    def clear(self) -> None:
        self.items.clear()


# Studentlar uchun dars ko'rish rate limiteri
_lesson_cooldown = BoundedCooldown(seconds=5.0, max_keys=50000)
# Backwards-compatibility alias for tests
_user_lesson_rate_limits = _lesson_cooldown.items


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
    """Telegram so'rovini bajaradi, rate limit (429) va xatolarni xavfsiz boshqaradi (M8 yechimi)."""
    try:
        response = await client.post(f"{API_URL}/{method}", json=payload, timeout=25.0)
        try:
            data = response.json()
        except ValueError:
            return {"ok": False, "error_code": response.status_code, "delivery_unknown": True}

        if not isinstance(data, dict):
            return {"ok": False, "error_code": response.status_code, "delivery_unknown": True}

        if response.status_code == 200 and data.get("ok"):
            return data

        code = data.get("error_code") or response.status_code
        params = data.get("parameters") or {}
        if code == 429:
            retry_after = params.get("retry_after", 1)
            logger.warning("Telegram 429 Too Many Requests on %s: retry_after=%s", method, retry_after)
        else:
            logger.warning("Telegram %s xatosi: code=%s desc=%s", method, code, str(data.get("description") or "")[:200])

        return {
            "ok": False,
            "error_code": code,
            "description": data.get("description", ""),
            "parameters": params,
            "delivery_unknown": response.status_code >= 500,
        }
    except httpx.RequestError as exc:
        logger.warning("Telegram %s tarmog'ida uzilish: %s", method, type(exc).__name__)
        return {"ok": False, "error_code": 0, "delivery_unknown": True}
    except Exception as exc:
        logger.error("Telegram %s so'rovida kutilmagan xato: %s", method, exc)
        return {"ok": False, "error_code": 0, "delivery_unknown": True}


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


def is_admin(user_id: int | str) -> bool:
    """str va int 64-bit xavfsiz admin tekshiruvi"""
    if not user_id:
        return False
    try:
        uid_int = int(str(user_id).strip())
        if uid_int in settings.ADMIN_IDS:
            return True
    except (ValueError, TypeError):
        pass
    uid_str = str(user_id).strip()
    return uid_str in [str(a) for a in settings.ADMIN_IDS]


async def send_tg_video(
    client: httpx.AsyncClient,
    chat_id: int | str,
    video: str,
    caption: Optional[str] = None,
    reply_markup: Optional[dict] = None,
    protect_content: bool = True,
    supports_streaming: bool = True,
    duration: Optional[int] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "chat_id": chat_id,
        "video": video,
        "protect_content": protect_content,
        "supports_streaming": supports_streaming,
    }
    if caption:
        payload["caption"] = caption[:1024]
        payload["parse_mode"] = "HTML"
    if reply_markup:
        payload["reply_markup"] = reply_markup
    if duration:
        payload["duration"] = int(duration)
    if width:
        payload["width"] = int(width)
    if height:
        payload["height"] = int(height)
    return await _telegram_call(client, "sendVideo", payload)


async def send_ephemeral_video(
    client: httpx.AsyncClient,
    chat_id: int | str,
    video_file_id: str,
    caption: str,
    callback_user_id: int,
    callback_query_id: str,
    replace_callback_query_message: bool = False,
    duration: Optional[int] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
    protect_content: bool = True,
) -> Dict[str, Any]:
    """
    Telegram Ephemeral Protected Video:
    Telegram Bot API sendVideo chaqiruvi ephemeral_message_parameters bilan
    faqat tugmani bosgan studentga va faqat o'sha clientga yuboriladi.
    protect_content=True qat'iy qo'llaniladi.
    """
    payload: Dict[str, Any] = {
        "chat_id": chat_id,
        "video": video_file_id,
        "caption": caption[:1024],
        "supports_streaming": True,
        "protect_content": protect_content,
        "ephemeral_message_parameters": {
            "receiver_user_id": int(callback_user_id),
            "callback_query_id": str(callback_query_id),
            "replace_callback_query_message": bool(replace_callback_query_message),
        }
    }
    if duration:
        payload["duration"] = int(duration)
    if width:
        payload["width"] = int(width)
    if height:
        payload["height"] = int(height)

    return await _telegram_call(client, "sendVideo", payload)


async def send_tg_chat_action(client: httpx.AsyncClient, chat_id: int, action: str = "typing") -> None:
    await _telegram_call(client, "sendChatAction", {"chat_id": chat_id, "action": action})


def _resolve_media_url(url: str) -> str:
    """R2 media havolalarini Telegram yubora oladigan to'g'ridan-to'g'ri URL ga aylantiradi.

    /api/media/{key} havolalari 307 redirect qaytaradi, Telegram sendPhoto esa
    redirectlarni kuzatmaydi — shuning uchun kalit bo'yicha presigned URL ochamiz.
    """
    resolved = r2_client.resolve_stream_url(url, expires_in=86400)
    return str(resolved or "").strip()


async def _answer_callback(
    client: httpx.AsyncClient,
    query_id: str,
    text: str = "",
    show_alert: bool = False,
    url: Optional[str] = None,
    cache_time: int = 0,
) -> None:
    payload: Dict[str, Any] = {"callback_query_id": query_id}
    if text:
        payload["text"] = text[:190]
    if show_alert:
        payload["show_alert"] = True
    if url:
        payload["url"] = url
    if cache_time:
        payload["cache_time"] = cache_time
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


def _course_keyboard(course: Dict[str, Any], index: int, total: int, is_group: bool = False) -> dict:
    bot_user = settings.BOT_USERNAME.lstrip("@")
    if is_group:
        app_btn = {"text": "🚀 Mini Appda ochish", "url": f"https://t.me/{bot_user}?start=catalog"}
    else:
        app_btn = {"text": "🚀 Mini Appda batafsil", "web_app": {"url": f"{settings.WEBAPP_URL}#course_{course['id']}"}}
    rows = [
        [
            {"text": "⬅️ Oldingi", "callback_data": f"course:{(index - 1) % total}"},
            {"text": f"{index + 1}/{total}", "callback_data": "noop"},
            {"text": "Keyingi ➡️", "callback_data": f"course:{(index + 1) % total}"},
        ],
        [{"text": "💳 To'lov qilish", "callback_data": f"pay:{course['id']}"}],
        [app_btn],
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
    is_group = int(chat_id) < 0
    keyboard = _course_keyboard(course, index, len(courses), is_group=is_group)
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
    # Hamyon balansi: bot oqimida hamyondan yechish yo'q (bu faqat Mini App checkoutda),
    # shuning uchun balans bor foydalanuvchiga aniq yo'l-yo'rig' ko'rsatamiz.
    wallet_line = ""
    try:
        from app.services import wallet as wallet_service
        wallet = await wallet_service.get_wallet(store, str(user.get("id") or ""))
        if wallet.get("balance", 0) > 0:
            wallet_line = (
                f"\n💰 <b>Hamyon balansingiz: {_uzs(wallet['balance'])}</b>\n"
                "Chekni shu chatga yuborsangiz butun summa kartadan hisoblanadi. Hamyondan "
                f"aniq summa ajratib, qolganini kartadan to'lash uchun xaridni <b>Mini Appda</b> davom ettiring."
            )
    except Exception:
        logger.exception("Hamyon balansini o'qishda xato (user=%s)", user.get("id"))
    _checkout_sessions[int(user["telegram_id"])] = course["id"]
    await send_tg_message(
        client,
        chat_id,
        "💳 <b>To'lovni amalga oshirish</b>\n\n"
        f"📚 Kurs: <b>{_escape(course['title'])}</b>\n"
        f"{price_block}{wallet_line}\n\n"
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


MAX_RECEIPT_BYTES = 8 * 1024 * 1024


async def _store_telegram_receipt(
    client: httpx.AsyncClient, file_id: str, transaction_id: str
) -> Optional[str]:
    """Telegramdan kelgan chekni oqimli (streaming) yuklab, R2 ga ko'chiradi (M9 yechimi)."""
    try:
        file_data = await _telegram_call(client, "getFile", {"file_id": file_id})
        file_path = (file_data.get("result") or {}).get("file_path")
        if not file_path:
            return None

        url = f"https://api.telegram.org/file/bot{settings.BOT_TOKEN}/{file_path}"
        async with client.stream("GET", url, timeout=30.0, follow_redirects=False) as response:
            if response.status_code != 200:
                return None
            raw_len = response.headers.get("content-length")
            if raw_len:
                try:
                    if int(raw_len) > MAX_RECEIPT_BYTES:
                        logger.warning("Chek hajmi limitdan katta: %s bayt", raw_len)
                        return None
                except ValueError:
                    pass

            body = bytearray()
            async for chunk in response.aiter_bytes(chunk_size=64 * 1024):
                if len(body) + len(chunk) > MAX_RECEIPT_BYTES:
                    logger.warning("Chek oqimi 8MB limitdan oshib ketdi, to'xtatildi")
                    return None
                body.extend(chunk)

            if not body:
                return None
            image_bytes = bytes(body)

        ext = str(file_path).rsplit(".", 1)[-1].lower() if "." in str(file_path) else "jpg"
        if ext not in {"jpg", "jpeg", "png", "webp"}:
            ext = "jpg"
        content_type = "image/jpeg" if ext in {"jpg", "jpeg"} else f"image/{ext}"
        return await asyncio.to_thread(
            r2_client.upload_bytes, f"receipts/{transaction_id}.{ext}", image_bytes, content_type
        ) or None
    except Exception as exc:
        logger.warning("Telegram cheki yuklanmadi/R2 ga ko'chirilmadi: %s", exc)
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

    # Foydalanuvchi captioni: uzunligini cheklab, tizim teglarini (SYSTEM[...],
    # 'wallet:', 'promo:') soxtalashtirib bo'lmas qilamiz — rad etilganda hamyon
    # qaytarish oqimi shu commentga qaram bo'lgani uchun uni tozalash muhim.
    raw_caption = str(message.get("caption") or "").strip()[:300]
    clean_caption = (
        raw_caption.replace("SYSTEM[", "SYSTEM_[").replace("wallet:", "wallet_").replace("promo:", "promo_")
        or None
    )

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
            "comment": clean_caption,
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


async def _get_effective_target_group(store, course_id: Optional[str] = None) -> Tuple[Optional[str], str]:
    """Hozirda faol bo'lgan Target Guruh ID va nomini olish."""
    if course_id:
        course = await store.get_course(course_id)
        if course and course.get("telegram_channel_id"):
            return str(course["telegram_channel_id"]), str(course.get("title") or "Kurs Guruhi")

    dyn_id = await store.get_setting("target_group_id")
    dyn_title = await store.get_setting("target_group_title") or "Kurs Guruhi"
    if dyn_id:
        return str(dyn_id), str(dyn_title)

    cfg_id = getattr(settings, "TARGET_GROUP_ID", "")
    if cfg_id:
        return str(cfg_id), "Target Guruh"

    return None, ""


async def publish_lesson_to_group(
    client: httpx.AsyncClient,
    lesson_id: str | int,
    admin_chat_id: int,
) -> bool:
    """Darsni Target Supergroupga faqat inline play tugmasi bilan chiqarish."""
    store = get_store()
    lesson = await store.get_lesson(lesson_id)
    if not lesson:
        courses = await store.list_courses(published_only=False)
        for c in courses:
            from app.api.courses import resolve_course_modules
            for m in resolve_course_modules(c):
                for l in m.get("lessons", []):
                    if str(l.get("id")) == str(lesson_id):
                        lesson = {**l, "course_id": c["id"]}
                        break
                if lesson:
                    break
            if lesson:
                break

    if not lesson:
        await send_tg_message(client, admin_chat_id, f"❌ #{lesson_id} dars topilmadi.")
        return False

    if lesson.get("published_message_id") and lesson.get("published"):
        await send_tg_message(
            client,
            admin_chat_id,
            f"ℹ️ <b>{_escape(lesson.get('title') or 'Dars')}</b> allaqachon guruhga chiqarilgan (Xabar ID: <code>{lesson.get('published_message_id')}</code>).",
        )
        return True

    target_id, target_title = await _get_effective_target_group(store, lesson.get("course_id"))
    if not target_id:
        await send_tg_message(
            client,
            admin_chat_id,
            "❌ <b>Xatolik:</b> Darslar chiqariladigan Target Guruh hali belgilanmagan!\n\n"
            "Botni kurs guruhingizga admin qilib qo'shing va o'sha guruhda <code>/set_group</code> buyrug'ini yuboring.",
        )
        return False

    lesson_title = lesson.get("title") or "Dars"
    post_text = (
        f"🎓 <b>{_escape(lesson_title)}</b>\n\n"
        "Videoni ko‘rish uchun pastdagi tugmani bosing."
    )
    inline_keyboard = {
        "inline_keyboard": [
            [
                {
                    "text": f"▶️ {_escape(lesson_title[:28])}ni ko'rish",
                    "callback_data": f"lesson:{lesson_id}",
                }
            ]
        ]
    }

    tg_target = int(target_id) if str(target_id).lstrip("-").isdigit() else target_id
    res = await send_tg_message(
        client,
        tg_target,
        post_text,
        reply_markup=inline_keyboard,
        protect_content=getattr(settings, "PROTECT_CONTENT", True),
    )
    if res.get("ok"):
        msg_id = (res.get("result") or {}).get("message_id")
        try:
            await store.update_lesson(lesson_id, {"published_message_id": msg_id, "published": True})
        except Exception:
            pass
        await send_tg_message(
            client,
            admin_chat_id,
            f"✅ <b>{_escape(lesson_title)}</b> darsi <b>{_escape(target_title)}</b> guruhiga chiqarildi!\n"
            f"Xabar ID: <code>{msg_id}</code>",
        )
        return True
    else:
        err = res.get("description") or "Noma'lum xatolik"
        await send_tg_message(
            client,
            admin_chat_id,
            f"❌ Guruhga chiqarishda xatolik yuz berdi: <i>{_escape(err)}</i>\n\n"
            "Bot guruhda administrator ekanligini va xabar yozish huquqi borligini tekshiring.",
        )
        return False


class LessonAccessDenied(Exception):
    def __init__(self, message: str, can_buy: bool = False, course_id: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.can_buy = can_buy
        self.course_id = course_id


async def require_lesson_access(
    user_id: int,
    lesson_id: str | int,
) -> Tuple[Any, Dict[str, Any], Optional[Dict[str, Any]]]:
    """
    Yagona va qat'iy (fail-closed) darsga kirish huquqi tekshiruvi (H1 & H2 yechimi):
    - user_id musbat son bo'lishi shart
    - Global va dars blocklist tekshiruvi (fail-closed)
    - Dars va Kurs mavjudligi hamda published holati tekshiruvi
    - Preview yoki Admin bo'lsa ruxsat
    - Boshqa holatda aktiv (active) enrollment mavjudligi tekshiriladi
    """
    if not isinstance(user_id, int) or user_id <= 0:
        raise LessonAccessDenied("Foydalanuvchi aniqlanmadi.")

    store = get_store()

    # 1. Darsni bazadan qidirish
    lesson = await store.get_lesson(lesson_id)
    target_course_id = (lesson or {}).get("course_id")
    if not lesson:
        courses = await store.list_courses(published_only=False)
        for c in courses:
            from app.api.courses import resolve_course_modules
            for m in resolve_course_modules(c):
                for l in m.get("lessons", []):
                    if str(l.get("id")) == str(lesson_id):
                        lesson = {**l, "course_id": c["id"]}
                        target_course_id = c["id"]
                        break
                if lesson:
                    break
            if lesson:
                break

    if not lesson:
        raise LessonAccessDenied("Dars topilmadi yoki o'chirilgan.")

    # 2. Admin huquqi
    if is_admin(user_id):
        return store, lesson, await store.get_user_by_tg(user_id)

    # 3. Global blocklist (Fail-closed)
    try:
        if await store.is_user_blocked(user_id):
            raise LessonAccessDenied("Hisobingiz bloklangan.")
    except LessonAccessDenied:
        raise
    except Exception as exc:
        logger.error("Blocklist tekshiruvida xato: %s", exc)
        raise LessonAccessDenied("Xavfsizlik tekshiruvida xatolik yuz berdi. Keyinroq urinib ko'ring.")

    # 4. Dars blocklisti (Fail-closed)
    try:
        is_blocked, reason = await store.is_user_blocked_for_lesson(user_id, lesson_id)
        if is_blocked:
            msg = "Ushbu darsdan foydalanish ma'muriyat tomonidan cheklangan."
            if reason:
                msg += f"\nSabab: {reason}"
            raise LessonAccessDenied(msg)
    except LessonAccessDenied:
        raise
    except Exception as exc:
        logger.error("Dars blocklist tekshiruvida xato: %s", exc)
        raise LessonAccessDenied("Xavfsizlik tekshiruvida xatolik yuz berdi. Keyinroq urinib ko'ring.")

    # 5. Kurs tekshiruvi: Dars biriktirilgan kurs bo'lishi shart (H2 yechimi)
    if not target_course_id:
        raise LessonAccessDenied("Ushbu darsga kirish hozircha mumkin emas (kurs belgilanmagan).")

    course = await store.get_course(target_course_id)
    if not course or not course.get("published", True):
        raise LessonAccessDenied("Kurs hali ochilmagan yoki nofaol.")

    # 6. Preview dars bo'lsa darhol ruxsat
    if lesson.get("is_preview"):
        return store, lesson, await store.get_user_by_tg(user_id)

    # 7. Foydalanuvchi va Enrollment tekshiruvi
    user = await store.get_user_by_tg(user_id)
    if not user:
        raise LessonAccessDenied("Avval botimizga kiring: /start", can_buy=True, course_id=target_course_id)

    enr = await store.get_enrollment(user["id"], target_course_id)
    if enr and enr.get("status") == "active":
        return store, lesson, user

    # Agar approved xarid bo'lsa, enrollmentni ochish
    purchase = await store.get_approved_purchase_for(user["id"], target_course_id)
    if purchase:
        await store.create_enrollment(user["id"], target_course_id, purchase.get("id"))
        return store, lesson, user

    raise LessonAccessDenied(
        f"🔒 «{lesson.get('title') or 'Dars'}» himoyalangan dars.\n\nUshbu darsni ko'rish uchun avval kursga a'zo bo'lishingiz kerak.",
        can_buy=True,
        course_id=target_course_id,
    )


async def deliver_private_lesson(
    client: httpx.AsyncClient,
    user_id: int,
    lesson_id: str | int,
    query_id: Optional[str] = None,
) -> bool:
    """
    Dars videosini 100% xavfsiz holda FAQAT talabaning shaxsiy chatiga yetkazish.
    Guruhga HECH QACHON pullik video yuborilmaydi (C1 xavfsizligi).
    """
    store = get_store()
    try:
        store, lesson, user = await require_lesson_access(user_id, lesson_id)
    except LessonAccessDenied as exc:
        if query_id:
            bot_user = settings.BOT_USERNAME.lstrip("@")
            if exc.can_buy and exc.course_id:
                await _answer_callback(
                    client,
                    query_id,
                    exc.message[:200],
                    show_alert=True,
                    url=f"https://t.me/{bot_user}?start=catalog",
                )
            else:
                await _answer_callback(client, query_id, exc.message[:200], show_alert=True)
        else:
            await send_tg_message(client, user_id, f"⚠️ {exc.message}")
        return False
    except Exception as exc:
        logger.error("Lesson auth unexpected error: %s", exc)
        if query_id:
            await _answer_callback(client, query_id, "⚠️ Ruxsatni tekshirishda xatolik.", show_alert=True)
        else:
            await send_tg_message(client, user_id, "⚠️ Ruxsatni tekshirishda xatolik yuz berdi.")
        return False

    video_file_id = lesson.get("video_file_id") or lesson.get("telegram_file_id") or lesson.get("file_id")
    if not video_file_id and str(lesson.get("video_url") or "").startswith("tg-file:"):
        video_file_id = str(lesson["video_url"]).split("tg-file:", 1)[1]

    if not video_file_id:
        if query_id:
            await _answer_callback(client, query_id, "❌ Video fayli topilmadi.", show_alert=True)
        else:
            await send_tg_message(client, user_id, "❌ Video fayli topilmadi.")
        return False

    raw_title = str(lesson.get("title") or "Dars")[:180]
    caption = f"🎓 <b>{_escape(raw_title)}</b>\n\n🔒 <i>Himoyalangan dars videosi</i>"
    duration = lesson.get("duration_seconds")
    if duration is None and isinstance(lesson.get("duration"), int):
        duration = lesson["duration"]

    # Shaxsiy chatga yuborish
    res = await send_tg_video(
        client=client,
        chat_id=user_id,  # Har doim shaxsiy chat!
        video=video_file_id,
        caption=caption,
        protect_content=getattr(settings, "PROTECT_CONTENT", True),
        supports_streaming=True,
        duration=duration,
        width=lesson.get("width"),
        height=lesson.get("height"),
    )

    if not res.get("ok"):
        err_code = res.get("error_code")
        desc = str(res.get("description") or "")
        logger.warning("Private video delivery failed to %s: code=%s desc=%s", user_id, err_code, desc)
        if query_id:
            bot_user = settings.BOT_USERNAME.lstrip("@")
            if err_code == 403 or "blocked" in desc.lower() or "chat not found" in desc.lower():
                await _answer_callback(
                    client,
                    query_id,
                    "⚠️ Videoni olish uchun avval botimizga kiring!",
                    show_alert=True,
                    url=f"https://t.me/{bot_user}?start=lesson_{lesson_id}",
                )
            else:
                await _answer_callback(client, query_id, "⚠️ Video yuborishda xatolik yuz berdi.", show_alert=True)
        else:
            await send_tg_message(client, user_id, "❌ Videoni yuborishda xatolik yuz berdi.")
        return False

    # Telemetriya va log
    try:
        await store.log_access({
            "lesson_id": str(lesson["id"]),
            "user_id": user_id,
            "mode": "private_protected",
        })
        target_course_id = lesson.get("course_id")
        if user and target_course_id:
            await store.upsert_progress(
                user["id"], target_course_id, str(lesson["id"]), completed=False
            )
    except Exception as exc:
        logger.error("Access log update error: %s", exc)

    if query_id:
        await _answer_callback(client, query_id, "✅ Dars videosi shaxsiy botingizga yuborildi!")
    return True


async def handle_student_ephemeral_lesson(
    client: httpx.AsyncClient,
    callback_query: Dict[str, Any],
    lesson_id: str | int,
) -> None:
    """Student guruhda dars tugmasini bosganda Ephemeral video (faqat o'sha talabaga ko'rinadigan) yetkazish."""
    query_id = callback_query.get("id", "")
    tg_user = callback_query.get("from") or {}
    user_id = int(tg_user.get("id") or 0)
    chat = (callback_query.get("message") or {}).get("chat") or {}
    chat_id = chat.get("id")
    chat_type = str(chat.get("type") or "")

    # 1. Rate limiting (BoundedCooldown orqali xotira himoyalangan)
    if not _lesson_cooldown.take(user_id):
        await _answer_callback(client, query_id, "Iltimos, biroz kuting (5 soniya).")
        return

    # 2. Xavfsiz avtorizatsiya tekshiruvi (Mini App xaridi / faol enrollment)
    store = get_store()
    try:
        store, lesson, user = await require_lesson_access(user_id, lesson_id)
    except LessonAccessDenied as exc:
        bot_user = settings.BOT_USERNAME.lstrip("@")
        if exc.can_buy and exc.course_id:
            await _answer_callback(
                client,
                query_id,
                exc.message[:200],
                show_alert=True,
                url=f"https://t.me/{bot_user}?start=catalog",
            )
        else:
            await _answer_callback(client, query_id, exc.message[:200], show_alert=True)
        return
    except Exception as exc:
        logger.error("Lesson auth unexpected error: %s", exc)
        await _answer_callback(client, query_id, "⚠️ Ruxsatni tekshirishda xatolik.", show_alert=True)
        return

    video_file_id = lesson.get("video_file_id") or lesson.get("telegram_file_id") or lesson.get("file_id")
    if not video_file_id and str(lesson.get("video_url") or "").startswith("tg-file:"):
        video_file_id = str(lesson["video_url"]).split("tg-file:", 1)[1]

    if not video_file_id:
        await _answer_callback(client, query_id, "❌ Video fayli topilmadi.", show_alert=True)
        return

    raw_title = str(lesson.get("title") or "Dars")[:180]
    caption = f"🎓 <b>{_escape(raw_title)}</b>\n\n🔒 <i>Himoyalangan dars videosi</i>"
    duration = lesson.get("duration_seconds")
    if duration is None and isinstance(lesson.get("duration"), int):
        duration = lesson["duration"]

    # 3. Guruhda bosilgan bo'lsa -> Ephemeral Video (Telegramda FAQAT o'sha talabaning ekranida ko'rinadi!)
    sent_ok = False
    if chat_id and chat_type in ("group", "supergroup"):
        res = await send_ephemeral_video(
            client=client,
            chat_id=chat_id,
            video_file_id=video_file_id,
            caption=caption,
            callback_user_id=user_id,
            callback_query_id=query_id,
            replace_callback_query_message=False,
            duration=duration,
            width=lesson.get("width"),
            height=lesson.get("height"),
            protect_content=getattr(settings, "PROTECT_CONTENT", True),
        )
        if res.get("ok"):
            sent_ok = True
            await _answer_callback(client, query_id, "✅ Dars videosi faqat siz uchun ochildi!")

    # 4. Guruh bo'lmasa yoki ephemeral yuborishda xatolik bo'lsa -> Shaxsiy chatga fallback
    if not sent_ok:
        sent_ok = await deliver_private_lesson(client, user_id=user_id, lesson_id=lesson_id, query_id=query_id)

    # 5. Telemetriya va progress
    if sent_ok:
        try:
            await store.log_access({
                "lesson_id": str(lesson["id"]),
                "user_id": user_id,
                "mode": "group_ephemeral" if chat_type in ("group", "supergroup") else "private_protected",
            })
            target_course_id = lesson.get("course_id")
            if user and target_course_id:
                await store.upsert_progress(
                    user["id"], target_course_id, str(lesson["id"]), completed=False
                )
        except Exception as exc:
            logger.error("Access log update error: %s", exc)



async def _handle_admin_video_message(
    client: httpx.AsyncClient,
    message: Dict[str, Any],
    admin_id: int,
) -> bool:
    """Admin to'g'ridan-to'g'ri video yuborganida 1-bosishda dars yaratish oqimi."""
    video = message.get("video")
    if not video and message.get("document") and str((message.get("document") or {}).get("mime_type") or "").startswith("video/"):
        video = message.get("document")

    if not video or not is_admin(admin_id):
        return False

    store = get_store()
    file_id = video.get("file_id")
    file_unique_id = video.get("file_unique_id")
    duration = int(video.get("duration") or 0)
    width = video.get("width")
    height = video.get("height")
    file_size = int(video.get("file_size") or 0)
    caption = str(message.get("caption") or "").strip()

    courses = await store.list_courses(published_only=True)
    active_course = courses[0] if courses else None
    course_id = active_course["id"] if active_course else None

    existing_count = await store.count_lessons(course_id=course_id)
    if existing_count == 0 and active_course:
        from app.api.courses import resolve_course_modules
        existing_count = len([l for m in resolve_course_modules(active_course) for l in m.get("lessons", [])])
    next_num = existing_count + 1

    if caption:
        if "dars" in caption.lower():
            suggested_title = caption
        else:
            suggested_title = f"{next_num}-dars. {caption}"
    else:
        suggested_title = f"{next_num}-dars"

    session_id = secrets.token_hex(6)
    _pending_admin_videos[admin_id] = {
        "file_id": file_id,
        "video_file_id": file_id,
        "video_file_unique_id": file_unique_id,
        "duration": duration,
        "duration_seconds": duration,
        "width": width,
        "height": height,
        "file_size": file_size,
        "suggested_title": suggested_title,
        "course_id": course_id,
        "created_by": admin_id,
        "session_id": session_id,
    }

    dur_str = f"{duration // 60:02d}:{duration % 60:02d}"
    size_mb = round(file_size / (1024 * 1024), 1)

    text = (
        "📹 <b>Yangi video dars qabul qilindi!</b>\n\n"
        f"⏱ <b>Davomiyligi:</b> <code>{dur_str}</code> | 💾 <b>Hajmi:</b> <code>{size_mb} MB</code>\n\n"
        f"💡 <b>Taklif etilgan nom:</b>\n"
        f"👉 <b>{_escape(suggested_title)}</b>\n\n"
        "<i>Quyidagi tugmani 1 marta bosib darsni darhol saqlashingiz mumkin, "
        "yoki boshqa nom xohlasangiz, uni shunchaki yozib yuboring:</i>"
    )

    keyboard = {
        "inline_keyboard": [
            [{"text": f"✅ «{suggested_title[:28]}» deb saqlash", "callback_data": f"admin:save_video:{session_id}"}],
            [{"text": "❌ Bekor qilish", "callback_data": f"admin:cancel_video:{session_id}"}],
        ]
    }

    await send_tg_message(client, admin_id, text, reply_markup=keyboard)
    return True


async def _save_pending_admin_video(
    client: httpx.AsyncClient,
    admin_id: int,
    custom_title: Optional[str] = None,
    message_id_to_edit: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    """Kutilayotgan videoni bazaga va Mini App katalogiga sinxron saqlash."""
    video_data = _pending_admin_videos.pop(admin_id, None)
    if not video_data:
        return None

    store = get_store()
    title = (custom_title or video_data.get("suggested_title") or "Yangi dars").strip()
    course_id = video_data.get("course_id")
    if not course_id:
        courses = await store.list_courses(published_only=True)
        if courses:
            course_id = courses[0]["id"]

    dur_sec = int(video_data.get("duration") or 0)
    dur_str = f"{dur_sec // 60:02d}:{dur_sec % 60:02d}"
    size_mb = round((video_data.get("file_size") or 0) / (1024 * 1024), 1)

    lesson = await store.add_lesson({
        "title": title,
        "course_id": course_id,
        "video_file_id": video_data.get("video_file_id"),
        "video_file_unique_id": video_data.get("video_file_unique_id"),
        "duration": dur_str,
        "duration_seconds": dur_sec,
        "width": video_data.get("width"),
        "height": video_data.get("height"),
        "file_size": video_data.get("file_size"),
        "created_by": admin_id,
    })

    lesson_id = lesson["id"]

    # Mini App katalogiga va modullariga sinxronlash
    if course_id:
        course = await store.get_course(course_id)
        if course:
            modules = list(course.get("modules") or [])
            if not modules:
                modules = [{"title": "01. Asosiy Video Darslar", "lessons": []}]
            modules[-1].setdefault("lessons", []).append({
                "id": str(lesson_id),
                "title": title,
                "duration": dur_str,
                "video_url": f"tg-file:{video_data.get('video_file_id')}",
                "telegram_file_id": video_data.get("video_file_id"),
                "file_id": video_data.get("video_file_id"),
                "is_preview": False,
            })
            course["modules"] = modules
            course["lesson_count"] = sum(len(m.get("lessons", [])) for m in modules)
            await store.upsert_course(course)

    target_id, target_title = await _get_effective_target_group(store, course_id)
    target_name = target_title if target_id else "Belgilanmagan (/set_group)"

    confirmation_text = (
        f"🎉 <b>{_escape(title)}</b> muvaffaqiyatli saqlandi!\n\n"
        f"📌 <b>Dars ID:</b> <code>{lesson_id}</code>\n"
        f"⏱ <b>Davomiyligi:</b> <code>{dur_str}</code> | 💾 <b>Hajmi:</b> <code>{size_mb} MB</code>\n"
        f"👥 <b>Target Guruh:</b> <b>{_escape(target_name)}</b>\n\n"
        "Endi darsni guruhga chiqarishingiz yoki yangi video yuklashingiz mumkin:"
    )

    keyboard = {
        "inline_keyboard": [
            [{"text": "📢 Guruhga chiqarish", "callback_data": f"admin:publish:{lesson_id}"}],
            [
                {"text": "📹 Yana dars qo'shish", "callback_data": "admin:add_video"},
                {"text": "📚 Darslar ro'yxati", "callback_data": "admin:lessons"}
            ],
            [{"text": "⚙️ Admin Panel (Mini App)", "web_app": {"url": f"{settings.WEBAPP_URL}#admin"}}],
        ]
    }

    if message_id_to_edit:
        edit_res = await _telegram_call(
            client,
            "editMessageText",
            {"chat_id": admin_id, "message_id": message_id_to_edit, "text": confirmation_text, "parse_mode": "HTML", "reply_markup": keyboard}
        )
        if not edit_res.get("ok"):
            await send_tg_message(client, admin_id, confirmation_text, reply_markup=keyboard)
    else:
        await send_tg_message(client, admin_id, confirmation_text, reply_markup=keyboard)

    return lesson


async def _send_admin_lessons_list(client: httpx.AsyncClient, admin_id: int) -> None:
    """Admin uchun barcha darslar va ularni guruhga chiqarish tugmalari."""
    store = get_store()
    lessons = await store.list_lessons()
    if not lessons:
        await send_tg_message(
            client,
            admin_id,
            "📚 Hozircha saqlangan video darslar yo'q.\n\nVideo yuboring va 1-bosishda dars yarating!",
            {"inline_keyboard": [[{"text": "📹 Video yuklash", "callback_data": "admin:add_video"}]]}
        )
        return

    text = f"📚 <b>Barcha Video Darslar ({len(lessons)} ta):</b>\n\n"
    rows = []
    for l in lessons[:15]:
        lid = l["id"]
        ltitle = l.get("title") or "Dars"
        dur = l.get("duration") or ""
        text += f"• <b>{_escape(ltitle)}</b> (<code>{dur}</code>) — ID: <code>{lid}</code>\n"
        rows.append([
            {"text": f"📢 #{lid} Guruhga chiqarish", "callback_data": f"admin:publish:{lid}"},
            {"text": f"▶️ Sinab ko'rish", "callback_data": f"lesson:{lid}"},
        ])

    rows.append([{"text": "📹 Yangi dars qo'shish", "callback_data": "admin:add_video"}])
    await send_tg_message(client, admin_id, text, reply_markup={"inline_keyboard": rows})


async def _send_direct_lesson_video(
    client: httpx.AsyncClient,
    chat_id: int,
    user_id: int,
    lesson_id: str | int,
) -> None:
    """Talabaga dars videosini to'g'ridan-to'g'ri shaxsiy chatda himoyalangan holda yuborish (H1 xavfsizligi)."""
    await deliver_private_lesson(client, user_id=user_id, lesson_id=lesson_id, query_id=None)


async def _handle_admin_callback(client: httpx.AsyncClient, callback_query: Dict[str, Any]) -> bool:
    data = str(callback_query.get("data") or "")
    query_id = callback_query.get("id", "")
    admin_tg_id = callback_query.get("from", {}).get("id")

    # Admin video & darslar boshqaruvi
    if data.startswith("admin:"):
        if not is_admin(admin_tg_id):
            await _answer_callback(client, query_id, "Sizda admin huquqlari yo'q")
            return True

        if data.startswith("admin:save_video"):
            parts = data.split(":")
            session_id = parts[2] if len(parts) > 2 else None
            pending = _pending_admin_videos.get(int(admin_tg_id))
            if session_id and pending and pending.get("session_id") != session_id:
                await _answer_callback(client, query_id, "⚠️ Bu video so'rovi allaqachon eskirgan.", show_alert=True)
                return True
            msg = callback_query.get("message") or {}
            msg_id = msg.get("message_id")
            await _answer_callback(client, query_id, "✅ Dars saqlanmoqda...")
            await _save_pending_admin_video(client, int(admin_tg_id), message_id_to_edit=msg_id)
            return True

        if data.startswith("admin:cancel_video"):
            parts = data.split(":")
            session_id = parts[2] if len(parts) > 2 else None
            pending = _pending_admin_videos.get(int(admin_tg_id))
            if session_id and pending and pending.get("session_id") != session_id:
                await _answer_callback(client, query_id, "⚠️ Bu video so'rovi allaqachon eskirgan.", show_alert=True)
                return True
            _pending_admin_videos.pop(int(admin_tg_id), None)
            await _answer_callback(client, query_id, "Video bekor qilindi.")
            msg = callback_query.get("message") or {}
            msg_id = msg.get("message_id")
            if msg_id:
                await _telegram_call(
                    client,
                    "editMessageText",
                    {"chat_id": admin_tg_id, "message_id": msg_id, "text": "❌ Video yuklash bekor qilindi.", "parse_mode": "HTML"}
                )
            return True

        if data.startswith("admin:publish:"):
            lid = data.split(":", 2)[2]
            await _answer_callback(client, query_id, "Guruhga chiqarilmoqda...")
            await publish_lesson_to_group(client, lid, int(admin_tg_id))
            return True

        if data == "admin:lessons":
            await _answer_callback(client, query_id)
            await _send_admin_lessons_list(client, int(admin_tg_id))
            return True

        if data == "admin:add_video":
            await _answer_callback(client, query_id)
            await send_tg_message(
                client,
                int(admin_tg_id),
                "📹 <b>Yangi dars videosini yuboring.</b>\n\n"
                "Video yuborganingizda tizim uning hajmi va davomiyligini tekshirib, 1-bosishda dars yaratish imkonini beradi."
            )
            return True

        return False

    if not (data.startswith("approve_") or data.startswith("reject_")):
        return False

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
    current_text = str(message.get("caption") or message.get("text") or "")
    status_line = "✅ <b>TO'LOV TASDIQLANDI</b>" if approved else "❌ <b>TO'LOV RAD ETILDI</b>"
    # Telegram eski captionni tekis matn (entities qo'llanmagan holda) qaytaradi.
    # Uni parse_mode=HTML bilan qayta yuborishdan oldin escape qilish shart —
    # talaba ismi/izohidagi & yoki < "can't parse entities" xatosini keltirib,
    # chek kartasiga status qatori umuman qo'shilmay qolardi.
    updated = (
        f"{_escape(current_text)}\n\n━━━━━━━━━━━━━━━━━━━━\n"
        f"{status_line}\n"
        f"👤 <b>Admin:</b> {_escape(admin_name)}"
    )[:1024]
    method = "editMessageCaption" if message.get("caption") is not None else "editMessageText"
    field = "caption" if method == "editMessageCaption" else "text"
    edit_result = await _telegram_call(
        client,
        method,
        {"chat_id": chat.get("id"), "message_id": message.get("message_id"), field: updated, "parse_mode": "HTML"},
    )
    if not edit_result.get("ok"):
        # Tahrir o'tmasa (masalan, caption 1024 belgi chekkasida kesilganda ham
        # xato qaytishi mumkin) — qarorni alohida xabar sifatida yozamiz.
        await send_tg_message(
            client,
            int(chat.get("id") or 0) or int(admin_tg_id or 0),
            f"{status_line}\n"
            f"👤 <b>Admin:</b> {_escape(admin_name)}\n"
            f"🔢 <b>Buyurtma:</b> <code>{_escape(order_id)}</code>",
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

    if data.startswith("lesson:"):
        lesson_id = data.split(":", 1)[1]
        await handle_student_ephemeral_lesson(client, callback_query, lesson_id)
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

        store = get_store()
        first_lesson = None
        target_course_id = (purchase or {}).get("course_id")
        if target_course_id:
            try:
                all_lessons = await store.list_lessons(target_course_id)
                if all_lessons:
                    first_lesson = all_lessons[0]
            except Exception:
                first_lesson = None

        keyboard_rows = [
            [{"text": "🚀 Kursni Mini Appda ochish", "web_app": {"url": settings.WEBAPP_URL}}],
        ]
        if first_lesson:
            l_title = str(first_lesson.get("title") or "1-Dars")[:24]
            keyboard_rows.insert(0, [{"text": f"▶️ {l_title}ni ko'rish", "callback_data": f"lesson:{first_lesson['id']}"}])

        await send_tg_message(
            client,
            int(telegram_id),
            f"🎉 <b>Xush kelibsiz!</b> Sizning <b>{title}</b> guruhiga a'zoligingiz tasdiqlandi.\n\n"
            "✅ <b>Darslarni tomosha qilish:</b>\n"
            "1. Guruhdagi istalgan dars e'lonidagi <b>[▶️ Darsni ko'rish]</b> tugmasini bosing — video to'g'ridan-to'g'ri faqat sizning ekraningizda ochiladi!\n"
            "2. Yoki to'g'ridan-to'g'ri Mini App orqali barcha darslarni tartib bilan o'rganishingiz mumkin.",
            {"inline_keyboard": keyboard_rows}
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
    bot_user = settings.BOT_USERNAME.lstrip("@")
    text = (
        "👋 <b>Assalomu alaykum!</b> Men — <b>Kreativ AI</b> o'quv platformasining yordamchisman.\n\n"
        "🤖 Guruhda savolingizni <b>@kreativaibot</b> deb yozib bering — AI yordamchim javob beradi "
        "va kasb o'rganish bo'yicha yo'l ko'rsatadi.\n"
        "📚 Kurslar, narxlar va chegirmalar haqida bemalol so'rang!"
    )
    keyboard = {
        "inline_keyboard": [
            [{"text": "🚀 Kurslarni ko'rish", "url": f"https://t.me/{bot_user}?start=catalog"}],
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

    bot_user = settings.BOT_USERNAME.lstrip("@")
    payload: Dict[str, Any] = {
        "chat_id": chat_id,
        "text": _escape(answer),
        "disable_web_page_preview": True,
        "reply_markup": {"inline_keyboard": [
            [{"text": "🚀 Kurslarni ko'rish", "url": f"https://t.me/{bot_user}?start=catalog"}],
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
    bot_username = settings.BOT_USERNAME.strip().lower()
    # BOT_USERNAME sozlanmagan (bo'sh) bo'lsa "@​" tekshiruvi o'chiriladi —
    # aks holda f"@{''}" -> "@" har qanday @li xabarga match qilib, bot spam qilardi.
    if bot_username and f"@{bot_username}" in lowered:
        return True
    reply_from = ((message.get("reply_to_message") or {}).get("from")) or {}
    if BOT_ID and reply_from.get("id") == BOT_ID:
        return True
    if bot_username and reply_from.get("username") and reply_from["username"].strip().lower() == bot_username:
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
            tg_id = int(tg_user.get("id") or 0)
            if is_admin(tg_id):
                # Statistika (tushum, talabalar soni) maxfiy — guruhga yozilmaydi,
                # faqat adminning o'ziga shaxsiy chatda yuboriladi.
                await _send_stats(client, tg_id, tg_id)
        elif command in {"/set_group", "/setgroup"}:
            tg_id = int(tg_user.get("id") or 0)
            if is_admin(tg_id):
                store = get_store()
                chat_title = chat.get("title") or f"Guruh {chat_id}"
                await store.set_setting("target_group_id", str(chat_id))
                await store.set_setting("target_group_title", chat_title)
                settings.TARGET_GROUP_ID = str(chat_id)
                await send_tg_message(
                    client,
                    chat_id,
                    f"✅ <b>Ushbu guruh asosiy darslar guruhi sifatida biriktirildi!</b>\n\n"
                    f"🆔 Guruh ID: <code>{chat_id}</code>\n"
                    f"📌 Nomi: <b>{_escape(chat_title)}</b>\n\n"
                    "Endi yangi darslar va e'lonlar ushbu guruhga chiqariladi.",
                )
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

    admin_tg_id = int(user.get("telegram_id") or 0)
    has_video = bool(
        message.get("video")
        or (message.get("document") and str((message.get("document") or {}).get("mime_type") or "").startswith("video/"))
    )
    if has_video and is_admin(admin_tg_id):
        await _handle_admin_video_message(client, message, admin_tg_id)
        return

    if await _handle_receipt_photo(client, message, user):
        return

    text = str(message.get("text") or "").strip()
    if not text:
        if _checkout_sessions.get(int(user["telegram_id"])):
            await send_tg_message(client, int(chat_id), "📷 Chekni <b>rasm</b> sifatida yuboring. Hujjat yoki oddiy xabar qabul qilinmaydi.")
        return

    # Kutilayotgan video bo'lsa va admin maxsus nom yozsa
    if admin_tg_id in _pending_admin_videos and not text.startswith("/"):
        await _save_pending_admin_video(client, admin_tg_id, custom_title=text)
        return

    command = text.split(maxsplit=1)[0].split("@", 1)[0].lower()
    if command == "/start":
        payload = text.split(maxsplit=1)[1].strip() if len(text.split(maxsplit=1)) > 1 else ""
        if payload.lower().startswith("lesson_"):
            lid = payload.split("_", 1)[1].strip()
            await _send_direct_lesson_video(client, int(chat_id), int(user["telegram_id"]), lid)
            return
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
    elif command in {"/darslar", "/lessons"}:
        if is_admin(user["telegram_id"]):
            await _send_admin_lessons_list(client, int(chat_id))
        else:
            await send_tg_message(client, int(chat_id), "❌ Bu buyruq faqat adminlar uchun.")
    elif command in {"/set_group", "/setgroup"}:
        if is_admin(user["telegram_id"]):
            parts = text.split(maxsplit=2)
            if len(parts) > 1:
                target_id = parts[1].strip()
                target_title = parts[2].strip() if len(parts) > 2 else f"Guruh {target_id}"
                store = get_store()
                await store.set_setting("target_group_id", target_id)
                await store.set_setting("target_group_title", target_title)
                settings.TARGET_GROUP_ID = target_id
                await send_tg_message(
                    client,
                    int(chat_id),
                    f"✅ <b>Target Guruh muvaffaqiyatli saqlandi!</b>\n\n"
                    f"🆔 ID: <code>{target_id}</code>\n"
                    f"📌 Nomi: <b>{_escape(target_title)}</b>"
                )
            else:
                await send_tg_message(
                    client,
                    int(chat_id),
                    "ℹ️ <b>Guruhni biriktirish uchun:</b>\n\n"
                    "1. Guruh ichida <code>/set_group</code> yozing, yoki\n"
                    "2. Shaxsiy chatda: <code>/set_group &lt;group_id&gt; [guruh nomi]</code> ko'rinishida yuboring."
                )
        else:
            await send_tg_message(client, int(chat_id), "❌ Bu buyruq faqat adminlar uchun.")
    elif command in {"/hisobot", "/report"}:
        if is_admin(user["telegram_id"]):
            await _send_daily_report(client, int(chat_id))
        else:
            await send_tg_message(client, int(chat_id), "❌ Bu buyruq faqat superadminlar uchun.")
    elif command == "/backup":
        if is_admin(user["telegram_id"]):
            await send_tg_message(client, int(chat_id), "📦 Zaxira tayyorlanmoqda...")
            await _send_backup(client, int(chat_id))
        else:
            await send_tg_message(client, int(chat_id), "❌ Bu buyruq faqat superadminlar uchun.")
    elif command in {"/help", "/contact"}:
        await _send_help(client, int(chat_id))
    else:
        await _handle_unknown_text(client, int(chat_id))


async def _send_daily_report(client: httpx.AsyncClient, chat_id: int) -> None:
    """Kunlik hisobot: bugungi tasdiqlangan xaridlar, tushum, kun davomidagi
    rad etilgan cheklar, yangi talabalar va referal cashback kirimlari."""
    store = get_store()
    try:
        purchases = await store.list_purchases(limit=200)
    except Exception:
        purchases = []
    today = _dt.date.today().isoformat()
    todays = [p for p in purchases if str(p.get("created_at") or "").startswith(today)]
    approved = [p for p in todays if p.get("status") == "approved"]
    rejected = [p for p in todays if p.get("status") == "rejected"]
    pending = [p for p in todays if p.get("status") == "pending_approval"]
    revenue = sum(int(p.get("amount") or 0) for p in approved)

    from app.services import wallet as wallet_service
    wallets_raw = await wallet_service._get_json(store, "wallets", {})
    todays_cashback = 0
    for w in wallets_raw.values():
        for e in (w.get("history") or []):
            if e.get("type") == "earn_referral" and str(e.get("created_at") or "").startswith(today):
                try:
                    todays_cashback += int(e.get("delta") or 0)
                except (TypeError, ValueError):
                    pass

    try:
        total_users = await store.count_users()
    except Exception:
        total_users = 0

    lines = [
        f"<b>📅 Kunlik hisobot — {today}</b>",
        "",
        f"💰 <b>Bugungi tushum:</b> {_uzs(revenue)}",
        f"✅ Tasdiqlangan xaridlar: <b>{len(approved)} ta</b>",
        f"⏳ Kutilayotgan cheklar: <b>{len(pending)} ta</b>",
        f"❌ Rad etilgan: <b>{len(rejected)} ta</b>",
        f"🤝 Bugungi referal cashback: <b>{_uzs(todays_cashback)}</b>",
        f"👥 Jami foydalanuvchilar: <b>{total_users}</b>",
    ]
    if approved:
        lines.append("")
        lines.append("<b>Xaridlar:</b>")
        for p in approved[:10]:
            lines.append(
                f"• {_escape(p.get('student_name') or 'Talaba')} — "
                f"{_escape(p.get('course_title') or 'Kurs')} ({_uzs(p.get('amount'))})"
            )
        if len(approved) > 10:
            lines.append(f"<i>...va yana {len(approved) - 10} ta</i>")
    await send_tg_message(
        client, chat_id, "\n".join(lines),
        {"inline_keyboard": [[{"text": "⚙️ Admin Panel", "web_app": {"url": f"{settings.WEBAPP_URL}#admin"}}]]},
    )


async def _send_backup(client: httpx.AsyncClient, chat_id: int) -> None:
    """To'liq zaxira: barcha jadvallar va sozlamalar bitta JSON fayl sifatida
    admin chatga yuboriladi (Document)."""
    store = get_store()
    backup: Dict[str, Any] = {
        "_meta": {
            "created_at": _dt.datetime.now(_dt.timezone.utc).isoformat(),
            "storage": getattr(store, "backend_name", "?"),
            "version": "2.0.0",
        }
    }
    try:
        backup["users"] = await store.list_users(limit=1000)
    except Exception:
        backup["users"] = []
    try:
        backup["courses"] = await store.list_courses(published_only=False)
    except Exception:
        backup["courses"] = []
    try:
        backup["purchases"] = await store.list_purchases(limit=1000)
    except Exception:
        backup["purchases"] = []
    try:
        from app.api.banners import load_banners
        backup["banners"] = await load_banners()
    except Exception:
        backup["banners"] = []
    from app.services import wallet as wallet_service
    for key in ("wallets", "promo_codes", "referral_codes", "referral_links",
                "referral_rewarded", "referral_milestones_granted", "referral_settings"):
        try:
            raw = await store.get_setting(key)
            backup[key] = json.loads(raw) if raw else {}
        except Exception:
            backup[key] = {}

    # /api/... URL larni R2 public URL ga almashtiramiz (tiklash uchun to'liqroq)
    payload = json.dumps(backup, ensure_ascii=False, default=str).encode("utf-8")
    files = {"document": (f"backup_{_dt.date.today().isoformat()}.json", payload, "application/json")}
    try:
        response = await client.post(
            f"{API_URL}/sendDocument",
            data={"chat_id": str(chat_id), "caption": "📦 To'liq platforma zaxirasi (JSON)"},
            files=files,
        )
        if response.status_code != 200:
            logger.warning("Backup yuborilmadi: %s", response.text[:200])
    except httpx.HTTPError as exc:
        logger.error("Backup yuborishda xato: %s", exc)


async def _daily_reports_loop(client: httpx.AsyncClient) -> None:
    """Har kuni soat 21:00 da barcha superadminlarga kunlik hisobot (uchishda)."""
    sent_for: str = ""
    while True:
        try:
            now = _dt.datetime.now()
            target = now.replace(hour=21, minute=0, second=0, microsecond=0)
            if now >= target:
                target += _dt.timedelta(days=1)
            await asyncio.sleep(min(max((target - now).total_seconds(), 30), 26 * 3600))
            # 'bugun' hisobini uyg'ongandan keyin olamiz — hisobot aniq bo'ladi
            today = _dt.date.today().isoformat()
            if sent_for != today:
                sent_for = today
                for admin_id in settings.ADMIN_IDS:
                    await _send_daily_report(client, int(admin_id))
        except asyncio.CancelledError:
            break
        except Exception:
            logger.exception("Kunlik hisobot tsiklida xato")
            await asyncio.sleep(600)


async def start_telegram_bot_polling() -> None:
    """FastAPI lifespan ichida ishlaydigan, xatolarga chidamli long-polling xizmati."""
    if not settings.BOT_TOKEN:
        logger.warning("BOT_TOKEN sozlanmagan, Telegram polling ishga tushmadi.")
        return

    logger.info("Course Academy Telegram bot polling ishga tushmoqda.")
    offset = 0
    allowed_updates = ["message", "callback_query", "chat_join_request", "my_chat_member"]
    async with httpx.AsyncClient(timeout=35.0) as client:
        # Kunlik 21:00 hisoboti — alohida fon vazifasi (pollingni bloklamaydi)
        reports_task = asyncio.create_task(_daily_reports_loop(client))
        await _telegram_call(
            client,
            "setMyCommands",
            {"commands": [
                {"command": "start", "description": "Platformani ochish"},
                {"command": "kurslar", "description": "Kurslar katalogi"},
                {"command": "tolov", "description": "To'lov rekvizitlari"},
                {"command": "help", "description": "Yordam markazi"},
                {"command": "admin", "description": "Superadmin statistikasi"},
                {"command": "hisobot", "description": "Kunlik hisobot (admin)"},
                {"command": "backup", "description": "To'liq zaxira olish (admin)"},
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
                reports_task.cancel()
                try:
                    await reports_task
                except (asyncio.CancelledError, Exception):
                    pass
                break
            except (httpx.HTTPError, ValueError) as exc:
                logger.error("Telegram polling xatosi: %s", exc)
                await asyncio.sleep(3)
