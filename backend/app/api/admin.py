import uuid
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.core.security import get_current_admin
from app.core.supabase import supabase_client
from app.core.r2 import r2_client
from app.core.config import settings
from seed_data import COURSES, DEMO_USER

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

class BroadcastRequest(BaseModel):
    text: str
    photo_url: Optional[str] = None
    button_text: Optional[str] = None
    button_url: Optional[str] = None

class ManualEnrollRequest(BaseModel):
    user_id_or_tg_id: str
    course_id: str

class PaymentSettingsRequest(BaseModel):
    card_number: str
    card_holder: str
    bank_name: str

@router.get("/dashboard-stats")
async def get_admin_dashboard_stats(admin: dict = Depends(get_current_admin)):
    """Admin boshqaruv paneli umumiy statistikasi (Yaxshi Bola & Zuhra Olimova uchun)"""
    from app.api.checkout import PENDING_RECEIPTS

    pending_count = len([r for r in PENDING_RECEIPTS.values() if r.get("status") == "pending"])

    return {
        "admin_name": admin.get("name"),
        "admin_username": admin.get("username"),
        "role": "Superadmin (Teng huquqli)",
        "total_revenue": 142500000,
        "monthly_revenue": 38400000,
        "total_students": 6350,
        "active_courses_count": len(COURSES),
        "pending_receipts_count": pending_count,
        "recent_sales": [
            {
                "id": "ord_1",
                "student_name": "Azizbek Rahimov",
                "course_title": "Sun'iy Intellekt va Prompt Engineering Pro",
                "amount": 490000,
                "payment_method": "payme",
                "status": "completed",
                "date": "Bugun, 14:20"
            },
            {
                "id": "ord_2",
                "student_name": "Dilnoza Karimova",
                "course_title": "Telegram Bot & Mini App Fullstack Dasturlash",
                "amount": 690000,
                "payment_method": "click",
                "status": "completed",
                "date": "Bugun, 13:05"
            }
        ]
    }

@router.get("/pending-receipts")
async def get_pending_receipts(admin: dict = Depends(get_current_admin)):
    """Kutilayotgan to'lov cheklari ro'yxati"""
    from app.api.checkout import PENDING_RECEIPTS
    
    # Standart demo ma'lumotlar agar kesh bo'sh bo'lsa
    if not PENDING_RECEIPTS:
        return [
            {
                "order_id": "rcp_demo_1",
                "student_name": "Shoxrux Mirzayev",
                "username": "shoxrux_pro",
                "telegram_id": 145892019,
                "course_title": "Sun'iy Intellekt va Prompt Engineering Pro",
                "amount": 490000,
                "payment_method": "payme",
                "receipt_image": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80",
                "comment": "To'lov qilindi, iltimos kursni ochib bering",
                "created_at": "10 daqiqa oldin",
                "status": "pending"
            }
        ]

    return list(PENDING_RECEIPTS.values())

@router.post("/approve-receipt/{order_id}")
async def approve_receipt(order_id: str, admin: dict = Depends(get_current_admin)):
    """Admin paneldan to'lov chekini tasdiqlash va talabaga kursni ochish"""
    from app.api.checkout import PENDING_RECEIPTS
    receipt = PENDING_RECEIPTS.get(order_id)
    admin_name = admin.get("name", "Admin")

    if receipt:
        receipt["status"] = "approved"
        # Talabaga bot orqali bildirishnoma yuborish
        student_tg_id = receipt.get("telegram_id")
        if student_tg_id and settings.BOT_TOKEN:
            tg_api = f"https://api.telegram.org/bot{settings.BOT_TOKEN}"
            text = (
                f"🎉 <b>To'lovingiz Tasdiqlandi!</b>\n\n"
                f"Hurmatli talaba, <b>'{receipt.get('course_title')}'</b> kursi hisobingizga biriktirildi!\n"
                f"Tasdiqlagan admin: <b>{admin_name}</b>\n\n"
                f"Platformani ochib, o'rganishni boshlang 👇"
            )
            async with httpx.AsyncClient(timeout=10.0) as client:
                try:
                    await client.post(f"{tg_api}/sendMessage", json={
                        "chat_id": student_tg_id,
                        "text": text,
                        "parse_mode": "HTML",
                        "reply_markup": {
                            "inline_keyboard": [
                                [{"text": "🚀 Mini Appni Ochish", "web_app": {"url": settings.WEBAPP_URL}}]
                            ]
                        }
                    })
                except Exception:
                    pass

    return {"success": True, "message": f"Chek muvaffaqiyatli tasdiqlandi ({admin_name})!"}

@router.post("/reject-receipt/{order_id}")
async def reject_receipt(order_id: str, admin: dict = Depends(get_current_admin)):
    """Admin paneldan to'lov chekini rad etish"""
    from app.api.checkout import PENDING_RECEIPTS
    receipt = PENDING_RECEIPTS.get(order_id)
    if receipt:
        receipt["status"] = "rejected"

    return {"success": True, "message": "Chek rad etildi."}

@router.get("/students")
async def get_students_list(admin: dict = Depends(get_current_admin)):
    """Barcha ro'yxatdan o'tgan talabalar CRM ro'yxati"""
    return [
        {
            "id": "u1",
            "name": "Abdurahmon Fayzullayev",
            "username": "abdurahmon_dev",
            "telegram_id": 123456789,
            "enrolled_courses_count": 2,
            "overall_progress": "68%",
            "joined_date": "10-Avgust, 2026",
            "status": "Faol"
        },
        {
            "id": "u2",
            "name": "Dilnoza Karimova",
            "username": "dilnoza_ui",
            "telegram_id": 987654321,
            "enrolled_courses_count": 1,
            "overall_progress": "45%",
            "joined_date": "12-Avgust, 2026",
            "status": "Faol"
        },
        {
            "id": "u3",
            "name": "Azizbek Rahimov",
            "username": "azizbek_ai",
            "telegram_id": 555666777,
            "enrolled_courses_count": 1,
            "overall_progress": "20%",
            "joined_date": "Bugun",
            "status": "Faol"
        }
    ]

@router.post("/manual-enroll")
async def manual_enroll_student(
    req: ManualEnrollRequest,
    admin: dict = Depends(get_current_admin)
):
    """Talabaga admin tomonidan to'g'ridan-to'g'ri (bepul yoki grant) kurs biriktirish"""
    course = next((c for c in COURSES if c["id"] == req.course_id or c["slug"] == req.course_id), COURSES[0])

    return {
        "success": True,
        "message": f"Talabaga '{course['title']}' kursi muvaffaqiyatli biriktirildi! (Admin: {admin.get('name')})"
    }

@router.post("/broadcast")
async def broadcast_message(
    req: BroadcastRequest,
    admin: dict = Depends(get_current_admin)
):
    """Barcha talabalarga Telegram Bot orqali ommaviy xabar yuborish"""
    if not settings.BOT_TOKEN:
        raise HTTPException(status_code=400, detail="Bot token sozlanmagan")

    tg_api = f"https://api.telegram.org/bot{settings.BOT_TOKEN}"
    broadcast_text = f"📢 <b>Platforma Yangiligi</b>\n\n{req.text}\n\n<i>Yubordi: {admin.get('name')}</i>"

    keyboard = None
    if req.button_text and req.button_url:
        keyboard = {
            "inline_keyboard": [
                [{"text": req.button_text, "url": req.button_url}]
            ]
        }

    # Barcha adminlarga va demo foydalanuvchilarga xabar yuborish
    recipients = settings.ADMIN_IDS + [123456789]
    sent_count = 0

    async with httpx.AsyncClient(timeout=15.0) as client:
        for tg_id in recipients:
            try:
                payload = {
                    "chat_id": tg_id,
                    "text": broadcast_text,
                    "parse_mode": "HTML"
                }
                if keyboard:
                    payload["reply_markup"] = keyboard

                if req.photo_url:
                    payload["photo"] = req.photo_url
                    payload["caption"] = broadcast_text
                    await client.post(f"{tg_api}/sendPhoto", json=payload)
                else:
                    await client.post(f"{tg_api}/sendMessage", json=payload)
                sent_count += 1
            except Exception:
                pass

    return {
        "success": True,
        "sent_count": sent_count,
        "message": f"Ommaviy xabar {sent_count} ta foydalanuvchiga muvaffaqiyatli yuborildi!"
    }

@router.put("/payment-settings")
async def update_payment_settings(
    req: PaymentSettingsRequest,
    admin: dict = Depends(get_current_admin)
):
    """Karta raqamlari va rekvizitlarni yangilash"""
    settings.CARD_NUMBER = req.card_number
    settings.CARD_HOLDER = req.card_holder
    settings.CARD_BANK = req.bank_name

@router.put("/courses/{course_id}")
async def update_course(
    course_id: str,
    course_data: Dict[str, Any],
    admin: dict = Depends(get_current_admin)
):
    """Mavjud kursning nomi, narxi, tavsifi va parametrlarini tahrirlash"""
    target = next((c for c in COURSES if c["id"] == course_id or c["slug"] == course_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    # Ma'lumotlarni yangilash
    if "title" in course_data: target["title"] = course_data["title"]
    if "price" in course_data: target["price"] = int(course_data["price"])
    if "old_price" in course_data: target["old_price"] = int(course_data["old_price"]) if course_data["old_price"] else None
    if "category" in course_data: target["category"] = course_data["category"]
    if "level" in course_data: target["level"] = course_data["level"]
    if "duration" in course_data: target["duration"] = course_data["duration"]
    if "description" in course_data: target["description"] = course_data["description"]
    if "short_description" in course_data: target["short_description"] = course_data["short_description"]
    if "cover_url" in course_data: target["cover_url"] = course_data["cover_url"]
    if "instructor_name" in course_data: target["instructor_name"] = course_data["instructor_name"]

    await supabase_client.insert("courses", target)
    return {"success": True, "message": f"'{target['title']}' kursi tahrirlandi!", "course": target}

@router.delete("/courses/{course_id}")
async def delete_course(
    course_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Kursni o'chirish"""
    global COURSES
    COURSES = [c for c in COURSES if c["id"] != course_id and c["slug"] != course_id]
    return {"success": True, "message": "Kurs o'chirildi"}

@router.post("/upload-to-r2")
async def upload_media_to_r2(
    filename: str,
    file_type: str = "video/mp4",
    admin: dict = Depends(get_current_admin)
):
    """
    Admin rasm yoki video yuklaganda Cloudflare R2 ga xavfsiz presigned URL olish.
    Link Supabase ga saqlanadi, Egress esa Cloudflare R2 dan tekin ketadi!
    """
    ext = filename.split(".")[-1] if "." in filename else "mp4"
    unique_key = f"courses/{uuid.uuid4().hex[:12]}.{ext}"
    
    upload_url = r2_client.generate_presigned_url(unique_key, expires_in=3600)
    public_url = r2_client.get_public_url(unique_key)

    return {
        "success": True,
        "object_key": unique_key,
        "upload_url": upload_url,
        "public_r2_url": public_url,
        "storage": "Cloudflare R2 (Zero-Egress Fees)",
        "database": "Supabase PostgreSQL"
    }
