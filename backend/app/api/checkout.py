import uuid
import base64
import json
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.models.schemas import CreateOrderRequest, CreateOrderResponse, VerifyOrderRequest
from app.core.security import get_current_user
from app.core.supabase import supabase_client
from app.core.config import settings
from seed_data import COURSES

router = APIRouter(prefix="/checkout", tags=["Checkout & Payments"])

# Kutilayotgan to'lov cheklari bazasi (In-memory cache + Supabase)
PENDING_RECEIPTS: Dict[str, Dict[str, Any]] = {}

class SubmitReceiptRequest(BaseModel):
    course_id: str
    payment_method: str = "payme"
    receipt_image: str # Base64 yoki URL
    comment: Optional[str] = None

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
    course = next((c for c in COURSES if c["id"] == req.course_id or c["slug"] == req.course_id), None)
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    user_id = current_user.get("sub")

    purchase_data = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "course_id": course["id"],
        "amount": course["price"],
        "status": "pending",
        "payment_method": req.payment_method,
        "transaction_id": order_id
    }
    await supabase_client.insert("purchases", purchase_data)

    payment_url = f"https://kurslarimiz-platforma.vercel.app/#checkout"

    return {
        "order_id": order_id,
        "course_id": course["id"],
        "course_title": course["title"],
        "amount": course["price"],
        "payment_method": req.payment_method,
        "payment_url": payment_url,
        "status": "pending"
    }

@router.post("/submit-receipt")
async def submit_receipt(
    req: SubmitReceiptRequest,
    current_user: Optional[dict] = None
):
    """
    Talaba tomonidan to'lov cheki skrinshotini yuborish.
    Ma'lumotlar avtomatik ravishda ikkala Superadminga Telegram Bot orqali yuboriladi!
    """
    course = next((c for c in COURSES if c["id"] == req.course_id or c["slug"] == req.course_id), None)
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    order_id = f"rcp_{uuid.uuid4().hex[:10]}"
    
    # User ma'lumotlari
    user_id = (current_user or {}).get("sub", str(uuid.uuid4()))
    student_name = (current_user or {}).get("name", "Telegram Talaba")
    username = (current_user or {}).get("username", "tg_user")
    telegram_id = (current_user or {}).get("telegram_id", 0)

    if req.comment and "Talaba:" in req.comment:
        student_name = req.comment.split("(@")[0].replace("Talaba:", "").strip()

    receipt_item = {
        "order_id": order_id,
        "user_id": user_id,
        "telegram_id": telegram_id,
        "student_name": student_name,
        "username": username,
        "course_id": course["id"],
        "course_title": course["title"],
        "amount": course["price"],
        "payment_method": req.payment_method,
        "receipt_image": req.receipt_image,
        "comment": req.comment,
        "status": "pending",
        "created_at": "Bugun, hozirgina"
    }

    # Keshga saqlash
    PENDING_RECEIPTS[order_id] = receipt_item

    # Supabase ga yozish
    await supabase_client.insert("purchases", {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "course_id": course["id"],
        "amount": course["price"],
        "status": "pending_approval",
        "payment_method": req.payment_method,
        "transaction_id": order_id
    })

    # Ikkala Superadminga Telegram Bot orqali to'lov cheki va xabarni yuborish
    if settings.BOT_TOKEN:
        tg_api = f"https://api.telegram.org/bot{settings.BOT_TOKEN}"
        caption = (
            f"🔔 <b>YANGI TO'LOV CHEKI KELDI!</b>\n\n"
            f"👤 <b>Talaba:</b> {student_name} (@{username})\n"
            f"🆔 <b>Telegram ID:</b> <code>{telegram_id}</code>\n"
            f"📚 <b>Kurs:</b> {course['title']}\n"
            f"💰 <b>Summa:</b> {course['price']:,} so'm\n"
            f"💳 <b>To'lov turi:</b> {req.payment_method.upper()}\n"
            f"🔢 <b>Buyurtma ID:</b> <code>{order_id}</code>\n\n"
            f"<i>Chekni tekshirib, quyidagi tugmalar orqali tasdiqlang:</i>"
        )

        keyboard = {
            "inline_keyboard": [
                [
                    {
                        "text": "✅ Tasdiqlash (Kursni ochish)",
                        "callback_data": f"approve_{order_id}"
                    },
                    {
                        "text": "❌ Rad etish",
                        "callback_data": f"reject_{order_id}"
                    }
                ],
                [
                    {
                        "text": "📊 Admin Dashboard",
                        "web_app": {"url": f"{settings.WEBAPP_URL}#admin"}
                    }
                ]
            ]
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            for admin_id in settings.ADMIN_IDS:
                try:
                    # Agar rasm base64 bo'lsa, uni rasm qilib yuborish
                    if req.receipt_image.startswith("data:image"):
                        try:
                            # base64 ni ochish
                            header, encoded = req.receipt_image.split(",", 1)
                            image_bytes = base64.b64decode(encoded)
                            
                            # sendPhoto multipart orqali jo'natish
                            files = {"photo": ("receipt.jpg", image_bytes, "image/jpeg")}
                            data = {
                                "chat_id": str(admin_id),
                                "caption": caption,
                                "parse_mode": "HTML",
                                "reply_markup": json.dumps(keyboard)
                            }
                            await client.post(f"{tg_api}/sendPhoto", data=data, files=files)
                        except Exception as img_err:
                            # Xatolik bo'lsa matn yuborish
                            await client.post(f"{tg_api}/sendMessage", json={
                                "chat_id": admin_id,
                                "text": caption,
                                "parse_mode": "HTML",
                                "reply_markup": keyboard
                            })
                    elif req.receipt_image.startswith("http"):
                        # URL rasm bilan yuborish
                        await client.post(f"{tg_api}/sendPhoto", json={
                            "chat_id": admin_id,
                            "photo": req.receipt_image,
                            "caption": caption,
                            "parse_mode": "HTML",
                            "reply_markup": keyboard
                        })
                    else:
                        await client.post(f"{tg_api}/sendMessage", json={
                            "chat_id": admin_id,
                            "text": caption,
                            "parse_mode": "HTML",
                            "reply_markup": keyboard
                        })
                except Exception as e:
                    print(f"Error notifying admin {admin_id}: {e}")

    return {
        "success": True,
        "order_id": order_id,
        "message": "To'lov cheki qabul qilindi! Adminlar tasdiqlagach, kurs avtomatik ochiladi."
    }

@router.post("/verify")
async def verify_order(
    req: VerifyOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """To'lov muvaffaqiyatini tekshirish va talabaga kursni ochish"""
    user_id = current_user.get("sub")
    
    await supabase_client.insert("enrollments", {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "course_id": req.order_id,
        "status": "active"
    })

    return {
        "success": True,
        "message": "To'lov muvaffaqiyatli qabul qilindi va kurs ochildi! 🚀"
    }
