import uuid
import base64
import json
import logging
import httpx
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from app.models.schemas import CreateOrderRequest, CreateOrderResponse
from app.core.security import get_current_user
from app.core.config import settings
from app.services.pricing import course_pricing
from app.storage import get_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/checkout", tags=["Checkout & Payments"])

class SubmitReceiptRequest(BaseModel):
    course_id: str
    payment_method: str = "karta"
    receipt_image: str  # Base64 (data:image...) yoki URL
    comment: Optional[str] = None
    promo_code: Optional[str] = None
    use_wallet: Optional[bool] = False      # hamyondan foydalanish (butun balans)
    wallet_amount: Optional[int] = None    # yoki aniq summa (qisman sarflash)

# Oddiy rate-limit: bir IP dan 1 daqiqada 6 tagacha chek
_submit_times: dict = {}

def _rate_limited(request: Request) -> bool:
    import time
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    bucket = _submit_times.setdefault(ip, [])
    bucket[:] = [t for t in bucket if now - t < 60]
    if len(bucket) >= 6:
        return True
    bucket.append(now)
    return False

@router.get("/payment-info")
async def get_payment_info():
    """To'lov rekvizitlari (Karta raqam, egasi va bank nomi)"""
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
    except Exception as e:
        logger.warning(f"Error reading payment_settings from store: {e}")

    return {
        "card_number": card_num,
        "card_holder": card_holder,
        "bank_name": bank_name,
        "admins": [
            {
                "name": "Yaxshi Bola",
                "username": "yomonboIa",
                "telegram_url": "https://t.me/yomonboIa",
                "role": "Asoschi & Superadmin"
            },
            {
                "name": "Zuhra Olimova",
                "username": "sokin_notalar",
                "telegram_url": "https://t.me/sokin_notalar",
                "role": "Hammuassis & Superadmin"
            }
        ],
        "bot_username": settings.BOT_USERNAME,
        "bot_url": f"https://t.me/{settings.BOT_USERNAME}"
    }


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(
    req: CreateOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """Kurs uchun yangi to'lov buyurtmasini shakllantirish"""
    store = get_store()
    course = await store.get_course(req.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    order_id = f"ord_{uuid.uuid4().hex[:12]}"

    pricing = await course_pricing(store, course)
    amount = pricing["final_price"]

    await store.create_purchase({
        "user_id": current_user.get("sub"),
        "course_id": course["id"],
        "course_title": course["title"],
        "amount": amount,
        "status": "pending",
        "payment_method": req.payment_method or "karta",
        "transaction_id": order_id,
        "telegram_id": current_user.get("telegram_id"),
        "student_name": current_user.get("name"),
        "username": current_user.get("username"),
    })

    return {
        "order_id": order_id,
        "course_id": course["id"],
        "course_title": course["title"],
        "amount": amount,
        "payment_method": req.payment_method or "karta",
        "payment_url": f"{settings.WEBAPP_URL}#checkout",
        "status": "pending"
    }

@router.post("/submit-receipt")
async def submit_receipt(
    req: SubmitReceiptRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Talaba tomonidan to'lov cheki skrinshotini yuborish.
    Chek rasmi bazaga og'ir yuk bo'lib saqlanmaydi — to'g'ridan-to'g'ri Telegram orqali adminga yuboriladi.
    Kurs FAQAT admin tasdiqlagach ochiladi.
    """
    if _rate_limited(request):
        raise HTTPException(status_code=429, detail="Juda ko'p so'rov. Bir daqiqadan keyin qayta urinib ko'ring.")

    store = get_store()
    course = await store.get_course(req.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    order_id = f"rcp_{uuid.uuid4().hex[:10]}"

    user_id = current_user.get("sub")
    student_name = current_user.get("name", "Talaba")
    username = current_user.get("username") or "tg_user"
    telegram_id = current_user.get("telegram_id", 0)

    # Bazaga faqat yengil matnli ma'lumot saqlanadi (og'ir rasm saqlanmaydi)
    pricing = await course_pricing(store, course)
    amount = pricing["final_price"]

    # Promokod: joriy (chegirmali) narxga qo'shimcha foiz. Kod TASDIQLANGANDA
    # sarflanadi — rad etilsa foydalanuvchi kodini yo'qotmaydi.
    promo_entry = None
    promo_note = None
    if (req.promo_code or "").strip():
        from app.services.promos import validate_code, apply_percent
        promo_entry, promo_message = await validate_code(store, req.promo_code, user_id)
        if not promo_entry:
            raise HTTPException(status_code=400, detail=promo_message)
        amount = apply_percent(amount, promo_entry["percent"])
        promo_note = f"promo:{promo_entry['code']}"

    # Hamyon: yoki butun balans (use_wallet), yoki foydalanuvchi belgilagan aniq
    # summa (wallet_amount — masalan 100k kursda 20k hamyondan, qolgani kartadan).
    # Yechirish HOZIR (submit paytida) bajariladi — chek rad etilsa reject
    # oqimida avtomatik qaytadi.
    wallet_spend = 0
    wants_wallet = req.use_wallet or (req.wallet_amount is not None and int(req.wallet_amount or 0) > 0)
    if wants_wallet and user_id:
        from app.services import wallet as wallet_service
        try:
            wallet = await wallet_service.get_wallet(store, user_id)
            spendable = min(wallet["balance"], amount)
            if req.wallet_amount is not None:
                spendable = min(spendable, max(0, int(req.wallet_amount)))
            if spendable > 0:
                ok, _new_balance = await wallet_service.try_debit(
                    store, user_id, spendable, "spend",
                    f"Kurs xaridi: {course['title']}", order_id
                )
                if ok:
                    wallet_spend = spendable
                    amount = amount - spendable
        except Exception:
            logger.exception("Hamyon yechishda xato (user=%s)", user_id)

    comment_parts = [p for p in [req.comment, promo_note] if p]
    if wallet_spend > 0:
        comment_parts.append(f"wallet:{wallet_spend}")
    comment_text = " | ".join(comment_parts) if comment_parts else None

    await store.create_purchase({
        "user_id": user_id,
        "course_id": course["id"],
        "course_title": course["title"],
        "amount": amount,
        "status": "pending_approval",
        "payment_method": req.payment_method or "karta",
        "transaction_id": order_id,
        "telegram_id": telegram_id,
        "student_name": student_name,
        "username": username,
        "receipt_image_url": req.receipt_image if req.receipt_image.startswith("http") else None,
        "comment": comment_text,
    })

    # Ikkala Superadminga to'g'ridan-to'g'ri Telegram Bot orqali to'lov cheki rasmi va tasdiqlash tugmalarini yuborish
    notified = 0
    if settings.BOT_TOKEN:
        tg_api = f"https://api.telegram.org/bot{settings.BOT_TOKEN}"
        caption = (
            f"🔔 <b>YANGI TO'LOV CHEKI KELDI!</b>\n\n"
            f"👤 <b>Talaba:</b> {student_name} (@{username})\n"
            f"🆔 <b>Telegram ID:</b> <code>{telegram_id}</code>\n"
            f"📚 <b>Kurs:</b> {course['title']}\n"
            f"💰 <b>Summa:</b> {amount:,} so'm\n"
        )
        if pricing["discount_active"] and course.get("discount_percent"):
            caption += (
                f"🎁 <b>Chegirma:</b> −{course['discount_percent']}% "
                f"(birinchi {course.get('discount_limit')} kishi)\n"
            )
        if promo_entry:
            caption += f"🎟 <b>Promokod:</b> {promo_entry['code']} (−{int(promo_entry['percent'])}%)\n"
        if wallet_spend > 0:
            caption += (
                f"💰 <b>Hamyondan:</b> −{wallet_spend:,} so'm\n"
                f"🏦 <b>Kartadan to'lanadi:</b> {amount:,} so'm\n"
            ).replace(",", " ")
        caption += (
            f"💳 <b>To'lov usuli:</b> Karta orqali o'tkazma\n"
            f"🔢 <b>Buyurtma ID:</b> <code>{order_id}</code>\n"
        )
        if req.comment:
            caption += f"💬 <b>Izoh:</b> {req.comment}\n"
        caption += f"\n<i>Chekni tekshirib, quyidagi tugmalar orqali tasdiqlang:</i>"

        keyboard = {
            "inline_keyboard": [
                [
                    {"text": "✅ Tasdiqlash (Kursni ochish)", "callback_data": f"approve_{order_id}"},
                    {"text": "❌ Rad etish", "callback_data": f"reject_{order_id}"}
                ],
                [
                    {"text": "📊 Admin Dashboard", "web_app": {"url": f"{settings.WEBAPP_URL}#admin"}}
                ]
            ]
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            for admin_id in settings.ADMIN_IDS:
                try:
                    sent = False
                    # 1. Agar rasm URL bo'lsa
                    if req.receipt_image.startswith("http"):
                        res = await client.post(f"{tg_api}/sendPhoto", json={
                            "chat_id": admin_id,
                            "photo": req.receipt_image,
                            "caption": caption,
                            "parse_mode": "HTML",
                            "protect_content": True,
                            "reply_markup": keyboard
                        })
                        sent = res.status_code == 200

                    # 2. Agar rasm Base64 bo'lsa — fayl sifatida to'g'ridan-to'g'ri adminga jo'natamiz (bazada saqlamasdan)
                    elif req.receipt_image.startswith("data:image"):
                        try:
                            _, encoded = req.receipt_image.split(",", 1)
                            image_bytes = base64.b64decode(encoded)
                            files = {"photo": ("receipt.jpg", image_bytes, "image/jpeg")}
                            res = await client.post(
                                f"{tg_api}/sendPhoto",
                                data={
                                    "chat_id": str(admin_id),
                                    "caption": caption,
                                    "parse_mode": "HTML",
                                    "protect_content": "true",
                                    "reply_markup": json.dumps(keyboard)
                                },
                                files=files
                            )
                            sent = res.status_code == 200
                        except Exception as ex:
                            logger.error(f"Base64 rasm yuborishda xato: {ex}")
                            sent = False

                    # 3. Agar rasm o'tmasa, oddiy matnli xabarni yuboramiz
                    if not sent:
                        res = await client.post(f"{tg_api}/sendMessage", json={
                            "chat_id": admin_id,
                            "text": caption,
                            "parse_mode": "HTML",
                            "protect_content": True,
                            "reply_markup": keyboard
                        })
                        sent = res.status_code == 200

                    if sent:
                        notified += 1
                except Exception as e:
                    logger.error(f"Error notifying admin {admin_id}: {e}")

    return {
        "success": True,
        "order_id": order_id,
        "notified_admins": notified,
        "message": "To'lov cheki adminga yuborildi! Adminlar tasdiqlagach, kurs avtomatik ochiladi."
    }
