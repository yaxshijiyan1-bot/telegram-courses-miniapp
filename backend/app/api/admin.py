import uuid
import logging
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.core.security import get_current_admin
from app.core.r2 import r2_client
from app.core.config import settings
from app.storage import get_store
from app.services.purchases import approve_purchase, reject_purchase
from seed_data import build_course_modules

logger = logging.getLogger(__name__)

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
    """Admin boshqaruv paneli umumiy statistikasi — real hisoblangan ma'lumotlar"""
    store = get_store()

    stats = await store.revenue_stats()
    total_students = await store.count_users()
    courses = await store.list_courses(published_only=True)
    pending = await store.list_purchases(status="pending_approval", limit=100)
    recent = await store.list_purchases(limit=10)

    recent_sales = []
    for p in recent:
        recent_sales.append({
            "id": p.get("transaction_id") or p.get("id", ""),
            "student_name": p.get("student_name") or "Talaba",
            "course_title": p.get("course_title") or "Kurs",
            "amount": p.get("amount", 0),
            "payment_method": p.get("payment_method", "payme"),
            "status": p.get("status", "pending"),
            "date": p.get("created_at", "")
        })

    return {
        "admin_name": admin.get("name"),
        "admin_username": admin.get("username"),
        "role": "Superadmin (Teng huquqli)",
        "storage_backend": store.backend_name,
        "total_revenue": stats["total_revenue"],
        "monthly_revenue": stats["monthly_revenue"],
        "total_students": total_students,
        "active_courses_count": len(courses),
        "pending_receipts_count": len(pending),
        "recent_sales": recent_sales
    }

@router.get("/pending-receipts")
async def get_pending_receipts(admin: dict = Depends(get_current_admin)):
    """Kutilayotgan to'lov cheklari ro'yxati — bazadan (server qayta ishga tushsa ham yo'qolmaydi)"""
    store = get_store()
    rows = await store.list_purchases(status="pending_approval", limit=100)
    return [
        {
            "order_id": r.get("transaction_id") or r.get("id", ""),
            "student_name": r.get("student_name") or "Talaba",
            "username": r.get("username") or "",
            "telegram_id": r.get("telegram_id") or 0,
            "course_id": r.get("course_id"),
            "course_title": r.get("course_title") or "Kurs",
            "amount": r.get("amount", 0),
            "payment_method": r.get("payment_method", "payme"),
            "receipt_image": r.get("receipt_image_url"),
            "comment": r.get("comment"),
            "created_at": r.get("created_at", ""),
            "status": "pending"
        }
        for r in rows
    ]

@router.post("/approve-receipt/{order_id}")
async def approve_receipt(order_id: str, admin: dict = Depends(get_current_admin)):
    """Admin paneldan to'lov chekini tasdiqlash va talabaga kursni haqiqatan ochish"""
    ok, message = await approve_purchase(order_id, admin.get("name", "Admin"))
    if not ok:
        raise HTTPException(status_code=404, detail=message)
    return {"success": True, "message": message}

@router.post("/reject-receipt/{order_id}")
async def reject_receipt(order_id: str, admin: dict = Depends(get_current_admin)):
    """Admin paneldan to'lov chekini rad etish"""
    ok, message = await reject_purchase(order_id, admin.get("name", "Admin"))
    if not ok:
        raise HTTPException(status_code=404, detail=message)
    return {"success": True, "message": message}

@router.get("/students")
async def get_students_list(admin: dict = Depends(get_current_admin)):
    """Barcha ro'yxatdan o'tgan talabalar CRM ro'yxati — real ma'lumotlar"""
    store = get_store()
    users = await store.list_users(limit=200)

    result = []
    for u in users:
        enrollments = await store.list_enrollments(u["id"])
        completed_total = 0
        lessons_total = 0
        course_titles = []
        for enr in enrollments:
            course = await store.get_course(enr["course_id"])
            if not course:
                continue
            course_titles.append(course["title"])
            lessons = len([l for m in build_course_modules(course) for l in m["lessons"]])
            completed_total += await store.count_completed(u["id"], course["id"])
            lessons_total += lessons or course.get("lesson_count", 0)
        overall = min(100, int(completed_total * 100 / max(lessons_total, 1))) if enrollments else 0
        result.append({
            "id": u["id"],
            "name": u.get("name", "Talaba"),
            "username": u.get("username") or "",
            "telegram_id": u.get("telegram_id") or 0,
            "role": u.get("role", "student"),
            "enrolled_courses_count": len(enrollments),
            "enrolled_courses": ", ".join(course_titles[:3]),
            "overall_progress": f"{overall}%",
            "joined_date": str(u.get("created_at", ""))[:10],
            "status": "Faol" if enrollments else "Yangi"
        })
    return result

@router.post("/manual-enroll")
async def manual_enroll_student(
    req: ManualEnrollRequest,
    admin: dict = Depends(get_current_admin)
):
    """Talabaga admin tomonidan to'g'ridan-to'g'ri (bepul yoki grant) kurs biriktirish"""
    store = get_store()
    course = await store.get_course(req.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    target = None
    try:
        target = await store.get_user_by_tg(int(req.user_id_or_tg_id))
    except ValueError:
        pass
    if not target:
        target = await store.get_user(req.user_id_or_tg_id)
    if not target:
        raise HTTPException(status_code=404, detail="Talaba topilmadi (Telegram ID yoki user ID kiriting)")

    await store.create_enrollment(target["id"], course["id"])
    await store.create_notification(
        target["id"],
        "Kurs biriktirildi 🎁",
        f"Admin '{course['title']}' kursini hisobingizga biriktirdi. O'rganishni boshlashingiz mumkin!",
        "success"
    )

    if target.get("telegram_id") and settings.BOT_TOKEN:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(f"https://api.telegram.org/bot{settings.BOT_TOKEN}/sendMessage", json={
                    "chat_id": target["telegram_id"],
                    "text": f"🎁 <b>Sizga kurs sovg'a qilindi!</b>\n\n'{course['title']}' kursi hisobingizga biriktirildi.\nAdmin: {admin.get('name')}",
                    "parse_mode": "HTML",
                    "reply_markup": {"inline_keyboard": [[{"text": "🚀 Kursni Boshlash", "web_app": {"url": settings.WEBAPP_URL}}]]}
                })
        except Exception:
            pass

    return {
        "success": True,
        "message": f"{target.get('name')} ga '{course['title']}' kursi muvaffaqiyatli biriktirildi! (Admin: {admin.get('name')})"
    }

@router.post("/broadcast")
async def broadcast_message(
    req: BroadcastRequest,
    admin: dict = Depends(get_current_admin)
):
    """Barcha talabalarga Telegram Bot orqali ommaviy xabar yuborish"""
    if not settings.BOT_TOKEN:
        raise HTTPException(status_code=400, detail="Bot token sozlanmagan")

    store = get_store()
    tg_api = f"https://api.telegram.org/bot{settings.BOT_TOKEN}"
    broadcast_text = f"📢 <b>Platforma Yangiligi</b>\n\n{req.text}\n\n<i>Yubordi: {admin.get('name')}</i>"

    keyboard = None
    if req.button_text and req.button_url:
        keyboard = {"inline_keyboard": [[{"text": req.button_text, "url": req.button_url}]]}

    recipients = await store.broadcast_recipients()
    sent_count = 0
    failed = 0

    async with httpx.AsyncClient(timeout=15.0) as client:
        for r in recipients:
            try:
                payload = {
                    "chat_id": r["telegram_id"],
                    "text": broadcast_text,
                    "parse_mode": "HTML"
                }
                if keyboard:
                    payload["reply_markup"] = keyboard

                if req.photo_url:
                    payload["photo"] = req.photo_url
                    payload["caption"] = broadcast_text
                    res = await client.post(f"{tg_api}/sendPhoto", json=payload)
                else:
                    res = await client.post(f"{tg_api}/sendMessage", json=payload)
                if res.status_code == 200:
                    sent_count += 1
                else:
                    failed += 1
                # Telegram rate-limit (30 msg/s) dan himoya
                import asyncio
                await asyncio.sleep(0.05)
            except Exception:
                failed += 1

    return {
        "success": True,
        "sent_count": sent_count,
        "failed_count": failed,
        "total_recipients": len(recipients),
        "message": f"Ommaviy xabar {sent_count} ta foydalanuvchiga yuborildi!"
    }

@router.put("/payment-settings")
async def update_payment_settings(
    req: PaymentSettingsRequest,
    admin: dict = Depends(get_current_admin)
):
    """Karta raqamlari va rekvizitlarni yangilash (joriy ish sessiyasi uchun)"""
    settings.CARD_NUMBER = req.card_number
    settings.CARD_HOLDER = req.card_holder
    settings.CARD_BANK = req.bank_name
    return {"success": True, "message": "To'lov rekvizitlari yangilandi"}

@router.get("/courses")
async def admin_list_courses(admin: dict = Depends(get_current_admin)):
    """Admin uchun barcha kurslar (nomi, narxi va boshqalarini tahrirlash uchun)"""
    store = get_store()
    return await store.list_courses(published_only=False)

@router.post("/courses")
async def create_course(
    course_data: Dict[str, Any],
    admin: dict = Depends(get_current_admin)
):
    """Yangi kurs yaratish"""
    store = get_store()
    if not course_data.get("title") or not course_data.get("slug"):
        raise HTTPException(status_code=400, detail="Kurs nomi (title) va slug majburiy")
    if not course_data.get("id"):
        course_data["id"] = str(uuid.uuid4())
    course_data.setdefault("published", True)
    row = await store.upsert_course(course_data)
    return {"success": True, "message": f"'{row.get('title')}' kursi yaratildi!", "course": row}

@router.put("/courses/{course_id}")
async def update_course(
    course_id: str,
    course_data: Dict[str, Any],
    admin: dict = Depends(get_current_admin)
):
    """Mavjud kursning nomi, narxi, tavsifi va parametrlarini tahrirlash (bazada saqlanadi)"""
    store = get_store()
    target = await store.get_course(course_id)
    if not target:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    allowed = ["title", "price", "old_price", "category", "level", "duration", "description",
               "short_description", "cover_url", "instructor_name", "instructor_title",
               "instructor_bio", "lesson_count", "published", "slug", "rating", "student_count",
               "preview_video_url", "access_duration"]
    updates = {k: v for k, v in course_data.items() if k in allowed and v is not None}
    if "price" in updates:
        updates["price"] = int(updates["price"])
    if "old_price" in updates and updates["old_price"]:
        updates["old_price"] = int(updates["old_price"])

    merged = {**target, **updates}
    row = await store.upsert_course(merged)
    return {"success": True, "message": f"'{row.get('title')}' kursi tahrirlandi va bazaga saqlandi!", "course": row}

@router.delete("/courses/{course_id}")
async def delete_course(
    course_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Kursni o'chirish"""
    store = get_store()
    ok = await store.delete_course(course_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")
    return {"success": True, "message": "Kurs o'chirildi"}

@router.post("/upload-to-r2")
async def upload_media_to_r2(
    filename: str,
    file_type: str = "video/mp4",
    admin: dict = Depends(get_current_admin)
):
    """
    Admin rasm yoki video yuklaganda Cloudflare R2 ga xavfsiz presigned PUT URL olish.
    Brauzer faylni to'g'ridan-to'g'ri R2 ga yuklaydi.
    """
    ext = filename.split(".")[-1] if "." in filename else "mp4"
    unique_key = f"courses/{uuid.uuid4().hex[:12]}.{ext}"

    upload_url = r2_client.generate_presigned_put_url(unique_key, expires_in=3600, content_type=file_type)
    public_url = r2_client.get_public_url(unique_key)

    if not upload_url:
        raise HTTPException(status_code=500, detail="R2 sozlanmagan — S3 kalitlarni tekshiring")

    return {
        "success": True,
        "object_key": unique_key,
        "upload_url": upload_url,
        "upload_method": "PUT",
        "content_type": file_type,
        "public_r2_url": public_url,
        "storage": "Cloudflare R2 (Zero-Egress Fees)"
    }
