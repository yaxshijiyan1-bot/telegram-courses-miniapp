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
from app.core.r2 import r2_client
from app.storage import get_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/checkout", tags=["Checkout & Payments"])

class SubmitReceiptRequest(BaseModel):
    course_id: str
    payment_method: str = "payme"
    receipt_image: str  # Base64 (data:image...) yoki URL
    comment: Optional[str] = None

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
    """To'lov rekvizitlari va admin kontaktlari"""
    return {
        "card_number": settings.CARD_NUMBER,
        "card_holder": settings.CARD_HOLDER,
        "bank_name": settings.CARD_BANK,
        "admins": [
            {
                "name": "Yaxshi Bola",
                "username": "yomonboia",
                "telegram_url": "https://t.me/yomonboia",
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

    await store.create_purchase({
        "user_id": current_user.get("sub"),
        "course_id": course["id"],
        "course_title": course["title"],
        "amount": course.get("price", 0),
        "status": "pending",
        "payment_method": req.payment_method,
        "transaction_id": order_id,
        "telegram_id": current_user.get("telegram_id"),
        "student_name": current_user.get("name"),
        "username": current_user.get("username"),
    })

    return {
        "order_id": order_id,
        "course_id": course["id"],
        "course_title": course["title"],
        "amount": course.get("price", 0),
        "payment_method": req.payment_method,
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
    Rasm Cloudflare R2 ga yuklanadi, yozuv bazaga tushadi va
    ikkala Superadminga Telegram Bot orqali yuboriladi.
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

    # Chek rasmini R2 ga yuklash (base64 bo'lsa)
    receipt_url = req.receipt_image
    if req.receipt_image.startswith("data:image"):
        try:
            header, encoded = req.receipt_image.split(",", 1)
            image_bytes = base64.b64decode(encoded)
            if len(image_bytes) > 8 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="Rasm hajmi 8 MB dan oshmasligi kerak")
            mime = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
            ext = "png" if "png" in mime else ("webp" if "webp" in mime else "jpg")
            uploaded = r2_client.upload_bytes(f"receipts/{order_id}.{ext}", image_bytes, content_type=mime)
            if uploaded:
                receipt_url = uploaded
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"R2 yuklash muvaffaqiyatsiz, base64 saqlanmaydi: {e}")

    await store.create_purchase({
        "user_id": user_id,
        "course_id": course["id"],
        "course_title": course["title"],
        "amount": course.get("price", 0),
        "status": "pending_approval",
        "payment_method": req.payment_method,
        "transaction_id": order_id,
        "telegram_id": telegram_id,
        "student_name": student_name,
        "username": username,
        "receipt_image_url": receipt_url if receipt_url.startswith("http") else None,
        "comment": req.comment,
    })

    # Ikkala Superadminga Telegram Bot orqali to'lov cheki va xabarni yuborish
    notified = 0
    if settings.BOT_TOKEN:
        tg_api = f"https://api.telegram.org/bot{settings.BOT_TOKEN}"
        amount = course.get("price", 0)
        caption = (
            f"🔔 <b>YANGI TO'LOV CHEKI KELDI!</b>\n\n"
            f"👤 <b>Talaba:</b> {student_name} (@{username})\n"
            f"🆔 <b>Telegram ID:</b> <code>{telegram_id}</code>\n"
            f"📚 <b>Kurs:</b> {course['title']}\n"
            f"💰 <b>Summa:</b> {amount:,} so'm\n"
            f"💳 <b>To'lov turi:</b> {req.payment_method.upper()}\n"
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
                    if receipt_url and receipt_url.startswith("http"):
                        res = await client.post(f"{tg_api}/sendPhoto", json={
                            "chat_id": admin_id,
                            "photo": receipt_url,
                            "caption": caption,
                            "parse_mode": "HTML",
                            "reply_markup": keyboard
                        })
                        sent = res.status_code == 200
                    if not sent and receipt_url and receipt_url.startswith("data:image"):
                        try:
                            header, encoded = receipt_url.split(",", 1)
                            image_bytes = base64.b64decode(encoded)
                            files = {"photo": ("receipt.jpg", image_bytes, "image/jpeg")}
                            res = await client.post(f"{tg_api}/sendPhoto", data={
                                "chat_id": str(admin_id),
                                "caption": caption,
                                "parse_mode": "HTML",
                                "reply_markup": json.dumps(keyboard)
                            }, files=files)
                            sent = res.status_code == 200
                        except Exception:
                            sent = False
                    if not sent:
                        res = await client.post(f"{tg_api}/sendMessage", json={
                            "chat_id": admin_id,
                            "text": caption,
                            "parse_mode": "HTML",
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
        "message": "To'lov cheki qabul qilindi! Adminlar tasdiqlagach, kurs avtomatik ochiladi."
    }
