import uuid
import json
import base64
import logging
from datetime import datetime, timezone
import httpx
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any, Optional, List
from app.core.security import get_current_admin
from app.core.r2 import r2_client
from app.core.config import settings
from app.storage import get_store
from app.services.purchases import approve_purchase, reject_purchase
from app.api.banners import load_banners, save_banners
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

class CourseUpsertRequest(BaseModel):
    """Admin kurs formasining tekshirilgan, storage-agnostic modeli."""
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    slug: Optional[str] = Field(default=None, min_length=2, max_length=255)
    category: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=10000)
    short_description: Optional[str] = Field(default=None, max_length=500)
    cover_url: Optional[str] = Field(default=None, max_length=2_000_000)
    price: Optional[int] = Field(default=None, ge=0, le=10_000_000_000)
    old_price: Optional[int] = Field(default=None, ge=0, le=10_000_000_000)
    discount_percent: Optional[int] = Field(default=None, ge=0, le=100)
    discount_limit: Optional[int] = Field(default=None, ge=0, le=1_000_000)
    duration: Optional[str] = Field(default=None, max_length=100)
    lesson_count: Optional[int] = Field(default=None, ge=0, le=10000)
    level: Optional[str] = Field(default=None, max_length=100)
    instructor_name: Optional[str] = Field(default=None, max_length=255)
    instructor_title: Optional[str] = Field(default=None, max_length=255)
    instructor_id: Optional[str] = Field(default=None, max_length=100)
    instructor_bio: Optional[str] = Field(default=None, max_length=5000)
    preview_video_url: Optional[str] = Field(default=None, max_length=2000)
    access_duration: Optional[str] = Field(default=None, max_length=100)
    rating: Optional[float] = Field(default=None, ge=0, le=5)
    student_count: Optional[int] = Field(default=None, ge=0)
    telegram_channel_id: Optional[str] = Field(default=None, max_length=32)
    published: Optional[bool] = None
    gallery_urls: Optional[List[str]] = Field(default=None)
    testimonials: Optional[List[Dict[str, Any]]] = Field(default=None)
    custom_info: Optional[List[Dict[str, str]]] = Field(default=None)
    show_instructor: Optional[bool] = Field(default=None)
    show_outcomes: Optional[bool] = Field(default=None)
    learning_outcomes: Optional[List[str]] = Field(default=None)
    # Dastur bo'limi — faqat matnli modullar: [{title, lessons: [{title}]}]
    modules: Optional[List[Dict[str, Any]]] = Field(default=None)

    @field_validator("modules")
    @classmethod
    def clean_modules(cls, value: Optional[List[Dict[str, Any]]]) -> Optional[List[Dict[str, Any]]]:
        """Ortiqcha maydonlarni tashlab, faqat matnli (sarlavha) struktura qoldiriladi."""
        if value is None:
            return None
        cleaned = []
        for m in value:
            if not isinstance(m, dict):
                continue
            title = str(m.get("title") or "").strip()[:300]
            if not title:
                continue
            lessons = []
            for l in (m.get("lessons") or []):
                if not isinstance(l, dict):
                    continue
                ltitle = str(l.get("title") or "").strip()[:300]
                if ltitle:
                    lessons.append({"title": ltitle})
            cleaned.append({"title": title, "lessons": lessons})
        return cleaned

    @field_validator("slug")
    @classmethod
    def clean_slug(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip().lower()
        if not value or any(char not in "abcdefghijklmnopqrstuvwxyz0123456789-" for char in value):
            raise ValueError("slug faqat kichik lotin harflari, raqamlar va '-' dan iborat bo'lishi kerak")
        return value

    @field_validator("telegram_channel_id")
    @classmethod
    def clean_channel_id(cls, value: Optional[str]) -> Optional[str]:
        if value in (None, ""):
            return None
        try:
            channel_id = int(str(value).strip())
        except ValueError as exc:
            raise ValueError("telegram_channel_id raqam bo'lishi kerak") from exc
        if channel_id >= 0:
            raise ValueError("Telegram kanal ID manfiy bo'lishi kerak (masalan, -100...)")
        return str(channel_id)

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
    blocked_ids = await store.get_blocked_ids()

    result = []
    for u in users:
        enrollments = await store.list_enrollments(u["id"])
        completed_total = 0
        lessons_total = 0
        course_titles = []
        courses = []
        for enr in enrollments:
            course = await store.get_course(enr["course_id"])
            if not course:
                continue
            course_titles.append(course["title"])
            courses.append({"id": course["id"], "title": course["title"]})
            stored_mods = course.get("modules") or []
            if stored_mods:
                lessons = sum(len(m.get("lessons") or []) for m in stored_mods)
            else:
                lessons = len([l for m in build_course_modules(course) for l in m["lessons"]])
            completed_total += await store.count_completed(u["id"], course["id"])
            lessons_total += lessons or course.get("lesson_count", 0)
        overall = min(100, int(completed_total * 100 / max(lessons_total, 1))) if enrollments else 0
        tg_id = int(u.get("telegram_id") or 0)
        result.append({
            "id": u["id"],
            "name": u.get("name", "Talaba"),
            "username": u.get("username") or "",
            "telegram_id": tg_id,
            "role": u.get("role", "student"),
            "enrolled_courses_count": len(enrollments),
            "enrolled_courses": ", ".join(course_titles[:3]),
            "courses": courses,
            "overall_progress": f"{overall}%",
            "joined_date": str(u.get("created_at", ""))[:10],
            "status": "Faol" if enrollments else "Yangi",
            "is_blocked": tg_id in blocked_ids,
        })
    return result

class BlockUserRequest(BaseModel):
    blocked: bool = True

@router.delete("/students/{user_id}")
async def delete_student(user_id: str, admin: dict = Depends(get_current_admin)):
    """Talabani tizimdan butunlay o'chirish (barcha kurslari, progressi, xaridlari bilan)"""
    store = get_store()
    target = await store.get_user(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Talaba topilmadi")

    tg_id = int(target.get("telegram_id") or 0)
    if tg_id in settings.ADMIN_IDS or target.get("role") == "superadmin":
        raise HTTPException(status_code=403, detail="Administrator hisobini o'chirib bo'lmaydi")

    ok = await store.delete_user(user_id)
    if not ok:
        raise HTTPException(status_code=400, detail="Foydalanuvchini o'chirishda xatolik yuz berdi")
    # Blok ro'yxatidan ham tozalash (avval bloklangan bo'lsa)
    if tg_id:
        await store.set_user_blocked(tg_id, False)
    return {"success": True, "message": f"{target.get('name')} tizimdan butunlay o'chirildi (Admin: {admin.get('name')})"}

@router.post("/students/{user_id}/block")
async def set_student_blocked(user_id: str, req: BlockUserRequest, admin: dict = Depends(get_current_admin)):
    """Talabani bloklash / blokdan chiqarish (login va miniapp kirishi yopiladi)"""
    store = get_store()
    target = await store.get_user(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Talaba topilmadi")

    tg_id = int(target.get("telegram_id") or 0)
    if not tg_id:
        raise HTTPException(status_code=400, detail="Bu foydalanuvchida Telegram ID yo'q")
    if tg_id in settings.ADMIN_IDS or target.get("role") == "superadmin":
        raise HTTPException(status_code=403, detail="Administrator hisobini bloklab bo'lmaydi")

    ok = await store.set_user_blocked(tg_id, req.blocked)
    if not ok:
        raise HTTPException(status_code=400, detail="Bloklash amalga oshmadi")
    action = "bloklandi" if req.blocked else "blokdan chiqarildi"
    return {"success": True, "blocked": req.blocked, "message": f"{target.get('name')} {action} (Admin: {admin.get('name')})"}

@router.delete("/students/{user_id}/courses/{course_id}")
async def revoke_student_course(user_id: str, course_id: str, admin: dict = Depends(get_current_admin)):
    """Talabaning ma'lum bir kursga kirishini cheklash"""
    store = get_store()
    target = await store.get_user(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Talaba topilmadi")
    course = await store.get_course(course_id)

    ok = await store.revoke_enrollment(user_id, course_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Bu kurs talabaga biriktirilmagan")

    title = course["title"] if course else course_id
    await store.create_notification(
        user_id,
        "Kursga kirish cheklandi",
        f"Admin '{title}' kursiga kirishingizni chekladi.",
        "warning"
    )
    return {"success": True, "message": f"{target.get('name')} ning '{title}' kursiga kirishi cheklandi (Admin: {admin.get('name')})"}

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
                    "protect_content": True,
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
    blocked_ids = await store.get_blocked_ids()
    sent_count = 0
    failed = 0

    async with httpx.AsyncClient(timeout=15.0) as client:
        for r in recipients:
            # Bloklangan foydalanuvchilarga xabar yuborilmaydi
            if int(r.get("telegram_id") or 0) in blocked_ids:
                continue
            try:
                payload = {
                    "chat_id": r["telegram_id"],
                    "text": broadcast_text,
                    "parse_mode": "HTML",
                    "protect_content": True,
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
    """Karta raqamlari va rekvizitlarni doimiy bazada saqlash"""
    store = get_store()
    settings.CARD_NUMBER = req.card_number
    settings.CARD_HOLDER = req.card_holder
    settings.CARD_BANK = req.bank_name
    
    pay_data = {
        "card_number": req.card_number,
        "card_holder": req.card_holder,
        "bank_name": req.bank_name
    }
    await store.set_setting("payment_settings", json.dumps(pay_data))
    return {"success": True, "message": "To'lov rekvizitlari bazada muvaffaqiyatli saqlandi!"}

@router.get("/courses")
async def admin_list_courses(admin: dict = Depends(get_current_admin)):
    """Admin uchun barcha kurslar (nomi, narxi va boshqalarini tahrirlash uchun)"""
    store = get_store()
    return await store.list_courses(published_only=False)

@router.post("/courses")
async def create_course(
    course_data: CourseUpsertRequest,
    admin: dict = Depends(get_current_admin)
):
    """Yangi kurs yaratish"""
    store = get_store()
    payload = course_data.model_dump(exclude_none=True)
    if not payload.get("title") or not payload.get("slug"):
        raise HTTPException(status_code=400, detail="Kurs nomi (title) va slug majburiy")
    payload["id"] = str(uuid.uuid4())
    payload.setdefault("published", True)
    if payload.get("modules"):
        payload["lesson_count"] = sum(len(m["lessons"]) for m in payload["modules"])
    row = await store.upsert_course(payload)
    return {"success": True, "message": f"'{row.get('title')}' kursi yaratildi!", "course": row}

@router.put("/courses/{course_id}")
async def update_course(
    course_id: str,
    course_data: CourseUpsertRequest,
    admin: dict = Depends(get_current_admin)
):
    """Mavjud kursning nomi, narxi, tavsifi va parametrlarini tahrirlash (bazada saqlanadi)"""
    store = get_store()
    target = await store.get_course(course_id)
    if not target:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    # exclude_unset explicit null qiymatlarni (masalan eski narx yoki kanal IDni
    # tozalash) saqlab qoladi.
    updates = course_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="Tahrirlash uchun kamida bitta maydon yuboring")

    # Modullar tahrirlanganda darslar soni avtomatik yangilanadi
    if updates.get("modules"):
        updates["lesson_count"] = sum(len(m["lessons"]) for m in updates["modules"])

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

class UploadBase64Payload(BaseModel):
    data: str
    filename: Optional[str] = "image.jpg"
    folder: Optional[str] = "courses"

@router.post("/upload-base64")
async def upload_base64_to_r2(
    payload: UploadBase64Payload,
    admin: dict = Depends(get_current_admin)
):
    """
    Base64 formatdagi rasm yoki faylni to'g'ridan-to'g'ri Cloudflare R2 ga yuklaydi va public URL qaytaradi.
    """
    raw = payload.data.strip()
    content_type = "image/jpeg"
    ext = "jpg"
    
    if raw.startswith("data:"):
        try:
            header, b64data = raw.split(",", 1)
            if ";" in header:
                content_type = header.split(";")[0].replace("data:", "")
                if "/" in content_type:
                    ext = content_type.split("/")[-1]
            image_bytes = base64.b64decode(b64data)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Base64 dekodlashda xatolik: {e}")
    else:
        try:
            image_bytes = base64.b64decode(raw)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Base64 dekodlashda xatolik: {e}")

    unique_key = f"{payload.folder}/{uuid.uuid4().hex[:12]}.{ext}"
    uploaded = r2_client.upload_bytes(unique_key, image_bytes, content_type=content_type)
    
    if not uploaded:
        raise HTTPException(status_code=500, detail="Cloudflare R2 ga yuklab bo'lmadi — R2 kalitlarini tekshiring")

    # Bucket private: brauzerda xatosiz ochilishi uchun /api/media proxy havolasi
    media_url = r2_client.get_media_url(unique_key)

    return {
        "success": True,
        "url": media_url,
        "object_key": unique_key,
        "storage": "Cloudflare R2"
    }

@router.post("/upload-file")
async def upload_file_to_r2(
    file: UploadFile = File(...),
    folder: str = "courses",
    admin: dict = Depends(get_current_admin)
):
    """
    Faylni multipart/form-data orqali to'g'ridan-to'g'ri Cloudflare R2 ga yuklash.
    """
    try:
        content = await file.read()
        filename = file.filename or "file.jpg"
        ext = filename.split(".")[-1] if "." in filename else "jpg"
        unique_key = f"{folder}/{uuid.uuid4().hex[:12]}.{ext}"
        content_type = file.content_type or "image/jpeg"
        
        uploaded = r2_client.upload_bytes(unique_key, content, content_type=content_type)
        if not uploaded:
            raise HTTPException(status_code=500, detail="Cloudflare R2 ga yuklab bo'lmadi")

        media_url = r2_client.get_media_url(unique_key)

        return {
            "success": True,
            "url": media_url,
            "object_key": unique_key,
            "storage": "Cloudflare R2"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Fayl yuklashda xatolik: {e}")

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
    public_url = r2_client.get_media_url(unique_key)

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

# =====================================================================
# BANNER TIZIMI — bosh sahifa uchun dinamik, admin boshqaruvidagi bannerlar
# =====================================================================

class BannerUpsertRequest(BaseModel):
    """Banner yaratish/tahrirlash so'rovi."""
    title: Optional[str] = Field(default=None, max_length=300)
    subtitle: Optional[str] = Field(default=None, max_length=300)
    tag: Optional[str] = Field(default=None, max_length=50)
    tag_color: Optional[str] = Field(default=None, max_length=30)
    image_url: str = Field(..., min_length=1, max_length=2_000_000)
    image_position: Optional[str] = Field(default=None, pattern="^(top|center|bottom)$")
    action_type: str = Field(..., pattern="^(link|course|none)$")
    action_value: Optional[str] = Field(default=None, max_length=2000)
    order_index: Optional[int] = Field(default=0, ge=0, le=1000)
    is_active: Optional[bool] = True

    @field_validator("action_value")
    @classmethod
    def check_action_value(cls, value: Optional[str], info) -> Optional[str]:
        action_type = info.data.get("action_type")
        if action_type in ("link", "course") and not (value and value.strip()):
            raise ValueError(f"action_type='{action_type}' bo'lganda action_value majburiy")
        return value.strip() if value else value

@router.get("/banners")
async def list_banners(admin: dict = Depends(get_current_admin)):
    """Admin uchun barcha bannerlar (faol bo'lmaganlari ham)."""
    banners = await load_banners()
    banners.sort(key=lambda b: b.get("order_index", 0))
    return {"success": True, "banners": banners}

@router.post("/banners")
async def create_banner(
    payload: BannerUpsertRequest,
    admin: dict = Depends(get_current_admin)
):
    """Yangi banner qo'shish (rasm R2 ga yuklanadi, keyin shu endpoint chaqiriladi)."""
    banners = await load_banners()

    # Kurs biriktirilgan bo'lsa, kurs mavjudligini tekshirish
    if payload.action_type == "course":
        store = get_store()
        courses = await store.list_courses(published_only=True)
        if not any(str(c.get("id")) == payload.action_value or c.get("slug") == payload.action_value for c in courses):
            raise HTTPException(status_code=400, detail="Biriktirilgan kurs topilmadi")

    banner = {
        "id": uuid.uuid4().hex[:16],
        "title": payload.title.strip() if payload.title else "",
        "subtitle": payload.subtitle.strip() if payload.subtitle else "",
        "tag": payload.tag.strip() if payload.tag else "",
        "tag_color": payload.tag_color.strip() if payload.tag_color else "cyan",
        "image_url": payload.image_url.strip(),
        "image_position": payload.image_position or "center",
        "action_type": payload.action_type,
        "action_value": payload.action_value or "",
        "order_index": payload.order_index if payload.order_index is not None else len(banners),
        "is_active": bool(payload.is_active),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    banners.append(banner)

    if not await save_banners(banners):
        raise HTTPException(status_code=500, detail="Bannerni saqlab bo'lmadi")
    return {"success": True, "message": "Banner qo'shildi", "banner": banner}

@router.put("/banners/{banner_id}")
async def update_banner(
    banner_id: str,
    payload: BannerUpsertRequest,
    admin: dict = Depends(get_current_admin)
):
    """Bannerni tahrirlash (rasm, link/kurs, tartib, faollik)."""
    banners = await load_banners()
    target = next((b for b in banners if b.get("id") == banner_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Banner topilmadi")

    if payload.action_type == "course":
        store = get_store()
        courses = await store.list_courses(published_only=True)
        if not any(str(c.get("id")) == payload.action_value or c.get("slug") == payload.action_value for c in courses):
            raise HTTPException(status_code=400, detail="Biriktirilgan kurs topilmadi")

    target.update({
        "title": payload.title.strip() if payload.title else "",
        "subtitle": payload.subtitle.strip() if payload.subtitle else "",
        "tag": payload.tag.strip() if payload.tag else "",
        "tag_color": payload.tag_color.strip() if payload.tag_color else target.get("tag_color") or "cyan",
        "image_url": payload.image_url.strip(),
        "image_position": payload.image_position or target.get("image_position") or "center",
        "action_type": payload.action_type,
        "action_value": payload.action_value or "",
        "order_index": payload.order_index if payload.order_index is not None else target.get("order_index", 0),
        "is_active": bool(payload.is_active),
    })

    if not await save_banners(banners):
        raise HTTPException(status_code=500, detail="Bannerni saqlab bo'lmadi")
    return {"success": True, "message": "Banner yangilandi", "banner": target}

@router.delete("/banners/{banner_id}")
async def delete_banner(
    banner_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Bannerni o'chirish."""
    banners = await load_banners()
    remaining = [b for b in banners if b.get("id") != banner_id]
    if len(remaining) == len(banners):
        raise HTTPException(status_code=404, detail="Banner topilmadi")

    if not await save_banners(remaining):
        raise HTTPException(status_code=500, detail="Bannerni o'chirib bo'lmadi")
    return {"success": True, "message": "Banner o'chirildi"}

# ---------------- PROMO KODLAR (Admin) ----------------

from pydantic import BaseModel as _PM
from app.services.promos import (
    list_codes as _promo_list,
    create_code as _promo_create,
    delete_code as _promo_delete,
    referral_stats as _ref_stats,
)


class _PromoCreateRequest(_PM):
    code: str
    percent: int
    max_uses: int = 0          # 0 = cheksiz
    days_valid: int = 0        # 0 = muddatsiz
    note: str = ""


@router.get("/promo-codes")
async def admin_list_promo_codes(admin: dict = Depends(get_current_admin)):
    store = get_store()
    return await _promo_list(store)


@router.post("/promo-codes")
async def admin_create_promo_code(req: _PromoCreateRequest, admin: dict = Depends(get_current_admin)):
    store = get_store()
    obj, message = await _promo_create(store, req.code, req.percent, req.max_uses, req.days_valid, req.note)
    if not obj:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message, "promo": obj}


@router.delete("/promo-codes/{code}")
async def admin_delete_promo_code(code: str, admin: dict = Depends(get_current_admin)):
    store = get_store()
    if not await _promo_delete(store, code):
        raise HTTPException(status_code=404, detail="Kod topilmadi")
    return {"success": True, "message": f"«{code.upper()}» kodi o'chirildi"}


@router.get("/referral/{user_id}")
async def admin_referral_info(user_id: str, admin: dict = Depends(get_current_admin)):
    """Admin panelda talaba profilida referal statistikasini ko'rish."""
    store = get_store()
    return await _ref_stats(store, user_id)

# ---------------- REFERAL SOZLAMALARI & SOVG'ALAR (Admin) ----------------

from pydantic import BaseModel as _RM
from typing import List as _List, Optional as _Opt
from app.services.promos import (
    get_referral_settings as _ref_settings_get,
    set_referral_settings as _ref_settings_set,
)


class _MilestonePayload(_RM):
    id: str
    invited_count: int
    title: str
    gift_type: str = "free_course"   # hozircha faqat bepul kurs qo'llanadi
    gift_course_id: _Opt[str] = None


class _ReferralSettingsRequest(_RM):
    reward_percent: int
    invitee_percent: int
    milestones: _List[_MilestonePayload] = []


@router.get("/referral-settings")
async def admin_get_referral_settings(admin: dict = Depends(get_current_admin)):
    """Referal foizlari va sovg'a milestone'lari (joriy holat)."""
    store = get_store()
    settings_data = await _ref_settings_get(store)
    # Sovg'a sifatida tanlanadigan kurslar (published ro'yxati, select uchun)
    courses = await store.list_courses(published_only=True)
    settings_data["gift_courses"] = [
        {"id": c["id"], "title": c.get("title") or "Kurs"} for c in courses
    ]
    return settings_data


@router.put("/referral-settings")
async def admin_save_referral_settings(req: _ReferralSettingsRequest, admin: dict = Depends(get_current_admin)):
    """Referal foizlari va sovg'a milestone'larini saqlaydi (global sozlama)."""
    store = get_store()
    # Kurs ID lari haqiqiyligini tekshiramiz (xato ID bilan sovg'a berilmasin)
    valid_ids = {c["id"] for c in await store.list_courses(published_only=True)}
    milestones = []
    seen_counts = set()
    for m in req.milestones:
        if m.invited_count <= 0 or m.invited_count in seen_counts:
            raise HTTPException(status_code=400, detail="Har milestone do'stlar soni musbat va takrorlanmas bo'lishi kerak")
        seen_counts.add(m.invited_count)
        if m.gift_type == "free_course":
            if not m.gift_course_id or m.gift_course_id not in valid_ids:
                raise HTTPException(status_code=400, detail=f"«{m.title}» uchun sovg'a kursi tanlanmagan yoki topilmadi")
            course = next(c for c in await store.list_courses(published_only=True) if c["id"] == m.gift_course_id)
            milestones.append({
                "id": m.id,
                "invited_count": m.invited_count,
                "title": m.title,
                "gift_type": "free_course",
                "gift_course_id": m.gift_course_id,
                "gift_course_title": course.get("title"),
            })
        else:
            raise HTTPException(status_code=400, detail="Noma'lum sovg'a turi")
    saved = await _ref_settings_set(store, req.reward_percent, req.invitee_percent, milestones)
    return {"success": True, "message": "Referal sozlamalari saqlandi", "settings": saved}
