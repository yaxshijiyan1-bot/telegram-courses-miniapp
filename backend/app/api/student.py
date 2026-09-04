import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.schemas import UpdateProgressRequest, CertificateResponse, NotificationResponse
from app.core.security import get_current_user
from app.core.r2 import r2_client
from app.services.purchases import issue_channel_access
from app.storage import get_store
from app.api.courses import resolve_course_modules

router = APIRouter(prefix="/student", tags=["Student Learning"])

def _fmt_date(value) -> str:
    """ISO vaqtni 'Bugun, 14:30' ko'rinishga o'tkazish"""
    if not value:
        return ""
    try:
        dt = value if isinstance(value, datetime) else datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        if (now - dt).days == 0:
            return f"Bugun, {dt.strftime('%H:%M')}"
        if (now - dt).days == 1:
            return f"Kecha, {dt.strftime('%H:%M')}"
        return dt.strftime("%d-%B, %Y")
    except Exception:
        return str(value)

def _all_lessons(course: dict) -> list:
    return [l for m in resolve_course_modules(course) for l in m.get("lessons", [])]

@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Talaba bosh sahifasi (Davom ettirish, progress, mening kurslarim) — real ma'lumotlar"""
    store = get_store()
    user_id = current_user.get("sub")

    enrollments = await store.list_enrollments(user_id)
    if not enrollments:
        return {
            "user_name": current_user.get("name", "Talaba"),
            "overall_progress_percent": 0,
            "completed_lessons_count": 0,
            "total_lessons_count": 0,
            "continue_learning": None,
            "enrolled_courses": []
        }

    total_completed = 0
    total_lessons = 0
    enrolled_courses = []
    continue_learning = None

    for enr in enrollments:
        course = await store.get_course(enr["course_id"])
        if not course:
            continue
        lessons = _all_lessons(course)
        completed = await store.count_completed(user_id, course["id"])
        total = len(lessons) or course.get("lesson_count") or 1
        percent = min(100, int(completed * 100 / max(total, 1)))
        total_completed += completed
        total_lessons += total

        # Oxirgi faol darsni aniqlash
        last_row = await store.latest_progress_row(user_id, course["id"])
        lesson_map = {l["id"]: l for l in lessons}
        next_lesson = None
        if last_row and last_row.get("lesson_id") in lesson_map:
            last_lesson = lesson_map[last_row["lesson_id"]]
            idx = lessons.index(last_lesson)
            next_lesson = lessons[idx + 1] if idx + 1 < len(lessons) else lessons[-1]
        else:
            next_lesson = lessons[0] if lessons else None

        enrolled_courses.append({
            "id": course["id"],
            "title": course["title"],
            "slug": course["slug"],
            "cover_url": course.get("cover_url"),
            "instructor_name": course.get("instructor_name"),
            "progress_percent": percent,
            "completed_lessons": completed,
            "total_lessons": total,
            "last_lesson_title": next_lesson["title"] if next_lesson else course["title"],
            "status": "in_progress" if percent < 100 else "completed",
            "granted_at": _fmt_date(enr.get("granted_at"))
        })

        if continue_learning is None and next_lesson:
            continue_learning = {
                "course_id": course["id"],
                "course_title": course["title"],
                "course_cover": course.get("cover_url"),
                "lesson_id": next_lesson["id"],
                "lesson_title": next_lesson["title"],
                "lesson_duration": next_lesson.get("duration", ""),
                "progress_percent": percent,
                "progress_text": f"{completed} / {total} dars"
            }

    overall = min(100, int(total_completed * 100 / max(total_lessons, 1)))
    return {
        "user_name": current_user.get("name", "Talaba"),
        "overall_progress_percent": overall,
        "completed_lessons_count": total_completed,
        "total_lessons_count": total_lessons,
        "continue_learning": continue_learning,
        "enrolled_courses": enrolled_courses
    }

@router.get("/courses")
async def get_my_courses(current_user: dict = Depends(get_current_user)):
    """Xarid qilingan barcha kurslar — real ma'lumotlar"""
    store = get_store()
    user_id = current_user.get("sub")
    enrollments = await store.list_enrollments(user_id)

    result = []
    for enr in enrollments:
        course = await store.get_course(enr["course_id"])
        if not course:
            continue
        lessons = _all_lessons(course)
        completed = await store.count_completed(user_id, course["id"])
        total = len(lessons) or course.get("lesson_count") or 1
        percent = min(100, int(completed * 100 / max(total, 1)))
        result.append({
            "id": course["id"],
            "title": course["title"],
            "slug": course["slug"],
            "cover_url": course.get("cover_url"),
            "instructor_name": course.get("instructor_name"),
            "progress_percent": percent,
            "completed_lessons": completed,
            "total_lessons": total,
            "last_lesson_title": lessons[0]["title"] if lessons else course["title"],
            "status": "in_progress" if percent < 100 else "completed",
            "granted_at": _fmt_date(enr.get("granted_at"))
        })
    return result

@router.get("/courses/{course_id}/channel-link")
async def get_channel_link(course_id: str, current_user: dict = Depends(get_current_user)):
    """Kurs kanali havolasi — a'zolar kanalni ochadi, qolganlarga yangi bir martalik link beriladi"""
    store = get_store()
    user_id = current_user.get("sub")

    enrollment = await store.get_enrollment(user_id, course_id)
    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail="Bu kurs hisobingizga biriktirilmagan. Avval kursni xarid qiling."
        )

    try:
        return await issue_channel_access(user_id, course_id, current_user.get("telegram_id"))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.get("/courses/{course_id}/lessons/{lesson_id}")
async def get_protected_lesson(
    course_id: str,
    lesson_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Himoyalangan dars ma'lumotlari — faqat kurs xaridori yoki preview dars uchun ochiq"""
    store = get_store()
    user_id = current_user.get("sub")

    course = await store.get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    modules = resolve_course_modules(course)
    target_lesson = None
    target_module = None
    all_lessons = []
    for m in modules:
        for l in m.get("lessons", []):
            all_lessons.append(l)
            if l.get("id") == lesson_id:
                target_lesson = l
                target_module = m

    if not target_lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")

    # HUQUQ TEKSHIRUVI: preview bo'lmagan darslar faqat xaridorga
    enrollment = await store.get_enrollment(user_id, course["id"])
    if not target_lesson.get("is_preview") and not enrollment:
        raise HTTPException(
            status_code=403,
            detail="Bu darsga kirish uchun kursni sotib oishingiz kerak. Kursni xarid qiling yoki admin tasdiqlashini kuting."
        )

    # Cloudflare R2 dan xavfsiz URL olish (obyekt kaliti, /api/media/ yoki eski r2.dev havolalar)
    video_stream_url = target_lesson.get("video_url")
    if video_stream_url:
        video_stream_url = r2_client.resolve_stream_url(video_stream_url, expires_in=7200)

    current_idx = next((i for i, l in enumerate(all_lessons) if l["id"] == lesson_id), -1)
    prev_lesson = all_lessons[current_idx - 1] if current_idx > 0 else None
    next_lesson = all_lessons[current_idx + 1] if current_idx != -1 and current_idx < len(all_lessons) - 1 else None

    progress_map = await store.get_progress_map(user_id, course["id"])
    prog = progress_map.get(lesson_id, {})

    return {
        "lesson": {
            **target_lesson,
            "video_url": video_stream_url,
            "completed": bool(prog.get("completed", False)),
            "last_position": prog.get("last_position", 0),
        },
        "module_title": target_module["title"] if target_module else "Asosiy modul",
        "prev_lesson_id": prev_lesson["id"] if prev_lesson else None,
        "next_lesson_id": next_lesson["id"] if next_lesson else None,
        "completed": bool(prog.get("completed", False))
    }

@router.post("/progress")
async def update_lesson_progress(
    req: UpdateProgressRequest,
    current_user: dict = Depends(get_current_user)
):
    """Darsni tugallangan deb belgilash va progressni saqlash (upsert)"""
    store = get_store()
    user_id = current_user.get("sub")

    enrollment = await store.get_enrollment(user_id, req.course_id)
    if not enrollment:
        raise HTTPException(status_code=403, detail="Faqat xarid qilingan kursda progress saqlanadi")

    await store.upsert_progress(user_id, req.course_id, req.lesson_id, req.completed, req.last_position)

    # Barcha darslar tugallanganda sertifikat avtomatik beriladi
    course = await store.get_course(req.course_id)
    new_certificate = None
    if course:
        lessons = _all_lessons(course)
        total = len(lessons)
        completed = await store.count_completed(user_id, req.course_id)
        if total and completed >= total:
            existing = await store.list_certificates(user_id)
            if not any(c.get("course_id") == req.course_id for c in existing):
                cert = await store.create_certificate({
                    "user_id": user_id,
                    "course_id": req.course_id,
                    "certificate_code": f"CERT-{course['slug'][:8].upper()}-{uuid.uuid4().hex[:6].upper()}",
                    "student_name": current_user.get("name", "Talaba"),
                    "course_title": course["title"],
                })
                await store.create_notification(
                    user_id,
                    "Sertifikat berildi! 🏆",
                    f"Tabriklaymiz! '{course['title']}' kursini to'liq yakunlab, rasmiy sertifikatga ega bo'ldingiz.",
                    "success"
                )
                new_certificate = cert.get("certificate_code")

    return {
        "success": True,
        "lesson_id": req.lesson_id,
        "completed": req.completed,
        "certificate_issued": new_certificate,
        "message": "Dars muvaffaqiyatli yakunlandi! 🎉"
    }

@router.get("/certificates", response_model=List[CertificateResponse])
async def get_certificates(current_user: dict = Depends(get_current_user)):
    """Talabaning olingan sertifikatlari — real ma'lumotlar"""
    store = get_store()
    user_id = current_user.get("sub")
    certs = await store.list_certificates(user_id)
    return [
        {
            "id": c["id"],
            "course_id": c.get("course_id"),
            "course_title": c.get("course_title", "Kurs"),
            "student_name": c.get("student_name", current_user.get("name", "Talaba")),
            "certificate_code": c.get("certificate_code", ""),
            "issued_at": _fmt_date(c.get("issued_at")),
            "certificate_url": c.get("certificate_url")
        }
        for c in certs
    ]

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Bildirishnomalar ro'yxati — real ma'lumotlar"""
    store = get_store()
    user_id = current_user.get("sub")
    notifs = await store.list_notifications(user_id)
    return [
        {
            "id": n["id"],
            "title": n.get("title", ""),
            "message": n.get("message", ""),
            "type": n.get("type", "info"),
            "is_read": bool(n.get("is_read", False)),
            "created_at": _fmt_date(n.get("created_at"))
        }
        for n in notifs
    ]

@router.post("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    """Barcha bildirishnomalarni o'qilgan deb belgilash"""
    store = get_store()
    await store.mark_notifications_read(current_user.get("sub"))
    return {"success": True, "message": "Barcha bildirishnomalar o'qilgan deb belgilandi"}

# ---------------- PROMO & REFERAL ----------------

from pydantic import BaseModel as _BaseModel
from typing import Optional as _Optional
from app.core.config import settings
from app.services.pricing import course_pricing as _course_pricing
from app.services.promos import (
    validate_code as _validate_code,
    apply_percent as _apply_percent,
    get_or_create_referral_code as _get_or_create_referral_code,
    link_referral as _link_referral,
    referral_stats as _referral_stats,
)


class _PromoValidateRequest(_BaseModel):
    code: str
    course_id: str


@router.post("/promo/validate")
async def validate_promo(req: _PromoValidateRequest, current_user: dict = Depends(get_current_user)):
    """Promokodni kursga qo'llashdan oldin tekshiradi va yakuniy narxni qaytaradi."""
    store = get_store()
    course = await store.get_course(req.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    entry, message = await _validate_code(store, req.code, current_user.get("sub"))
    if not entry:
        return {"valid": False, "message": message}

    pricing = await _course_pricing(store, course)
    final_price = _apply_percent(pricing["final_price"], entry["percent"])
    return {
        "valid": True,
        "message": message,
        "code": entry["code"],
        "percent": entry["percent"],
        "base_price": pricing["final_price"],
        "final_price": final_price,
    }


@router.get("/referral")
async def get_referral_info(current_user: dict = Depends(get_current_user)):
    """Profil uchun referal ma'lumotlari: shaxsiy kod, havola va statistika."""
    store = get_store()
    user_id = current_user.get("sub")
    stats = await _referral_stats(store, user_id)
    bot_username = settings.BOT_USERNAME
    stats["link"] = f"https://t.me/{bot_username}?start=ref_{stats['code']}"
    stats["bot_username"] = bot_username
    return stats


class _ApplyReferralRequest(_BaseModel):
    code: str


@router.post("/referral/apply")
async def apply_referral_code(req: _ApplyReferralRequest, current_user: dict = Depends(get_current_user)):
    """Mini App start_param orqali keldi: ref_XYZ kodi bilan bog'lanadi."""
    store = get_store()
    ok, message, bonus = await _link_referral(store, current_user.get("sub"), req.code)
    return {
        "success": ok,
        "message": message,
        "bonus_code": bonus["code"] if bonus else None,
        "bonus_percent": bonus["percent"] if bonus else None,
    }

# ---------------- HAMYON ----------------

from app.services import wallet as _wallet_service


@router.get("/wallet")
async def get_my_wallet(current_user: dict = Depends(get_current_user)):
    """Foydalanuvchi hamyoni: balans (so'mda) va oxirgi harakatlar.

    Balans faqat kurs xaridlarida to'lov sifatida sarflanadi; pul o'tkazib
    bo'lmaydi (ichki qiymat).
    """
    store = get_store()
    user_id = current_user.get("sub")
    w = await _wallet_service.get_wallet(store, user_id)
    history = []
    for e in reversed(w["history"][-15:]):  # eng yangi birinchi
        history.append({
            "id": e.get("id"),
            "amount": e.get("delta"),
            "type": e.get("type"),
            "note": e.get("note") or "",
            "created_at": _fmt_date(e.get("created_at")),
        })
    return {"balance": w["balance"], "history": history}
