import uuid
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from app.models.schemas import UpdateProgressRequest, CertificateResponse, NotificationResponse
from app.core.security import get_current_user
from app.core.supabase import supabase_client
from app.core.r2 import r2_client
from seed_data import COURSES, MODULES_COURSE_1, DEMO_PROGRESS, DEMO_NOTIFICATIONS

router = APIRouter(prefix="/student", tags=["Student Learning"])

@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Talaba bosh sahifasi (Davom ettirish, progress, mening kurslarim)"""
    user_id = current_user.get("sub")
    user_name = current_user.get("name", "Talaba")

    # Davom ettirish kartochkasi uchun faol kurs
    continue_course = COURSES[0] # AI Prompt Engineering
    continue_lesson = MODULES_COURSE_1[0]["lessons"][1] # 2-dars

    return {
        "user_name": user_name,
        "overall_progress_percent": 68,
        "completed_lessons_count": 24,
        "total_lessons_count": 35,
        "continue_learning": {
            "course_id": continue_course["id"],
            "course_title": continue_course["title"],
            "course_cover": continue_course["cover_url"],
            "lesson_id": continue_lesson["id"],
            "lesson_title": continue_lesson["title"],
            "lesson_duration": continue_lesson["duration"],
            "progress_percent": 68,
            "progress_text": "24 / 35 dars"
        },
        "enrolled_courses": [
            {
                "id": COURSES[0]["id"],
                "title": COURSES[0]["title"],
                "slug": COURSES[0]["slug"],
                "cover_url": COURSES[0]["cover_url"],
                "progress_percent": 68,
                "completed_lessons": 24,
                "total_lessons": 35,
                "last_lesson_title": "Antigravity & Gemini 3.7 bilan kod yozish",
                "status": "in_progress"
            }
        ]
    }

@router.get("/courses")
async def get_my_courses(current_user: dict = Depends(get_current_user)):
    """Xarid qilingan barcha kurslar"""
    return [
        {
            "id": COURSES[0]["id"],
            "title": COURSES[0]["title"],
            "slug": COURSES[0]["slug"],
            "cover_url": COURSES[0]["cover_url"],
            "instructor_name": COURSES[0]["instructor_name"],
            "progress_percent": 68,
            "completed_lessons": 24,
            "total_lessons": 35,
            "last_lesson_title": "Antigravity & Gemini 3.7 bilan kod yozish",
            "status": "in_progress"
        }
    ]

@router.get("/courses/{course_id}/lessons/{lesson_id}")
async def get_protected_lesson(
    course_id: str,
    lesson_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Himoyalangan dars ma'lumotlari va Cloudflare R2 video oqimi"""
    # Darsni topish
    target_lesson = None
    target_module = None
    all_lessons = []
    
    for m in MODULES_COURSE_1:
        for l in m["lessons"]:
            all_lessons.append(l)
            if l["id"] == lesson_id:
                target_lesson = l
                target_module = m

    if not target_lesson:
        target_lesson = {
            "id": lesson_id,
            "title": "Amaliy Dars",
            "duration": "15:00",
            "description": "Ushbu darsda amaliy topshiriqlar va video material taqdim etiladi.",
            "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "resources": [{"name": "Dars_Materiallari.pdf", "size": "3.5 MB", "url": "https://pub-a868f5ba65474136a054993d81485e0b.r2.dev/material.pdf"}]
        }

    # Cloudflare R2 dan xavfsiz URL olish (agar R2 object key berilgan bo'lsa)
    video_stream_url = target_lesson.get("video_url")
    if video_stream_url and not video_stream_url.startswith("http"):
        video_stream_url = r2_client.generate_presigned_url(video_stream_url, expires_in=7200)

    # Keyingi va oldingi darslarni hisoblash
    current_idx = next((i for i, l in enumerate(all_lessons) if l["id"] == lesson_id), -1)
    prev_lesson = all_lessons[current_idx - 1] if current_idx > 0 else None
    next_lesson = all_lessons[current_idx + 1] if current_idx != -1 and current_idx < len(all_lessons) - 1 else None

    return {
        "lesson": {
            **target_lesson,
            "video_url": video_stream_url
        },
        "module_title": target_module["title"] if target_module else "Asosiy modul",
        "prev_lesson_id": prev_lesson["id"] if prev_lesson else None,
        "next_lesson_id": next_lesson["id"] if next_lesson else None,
        "completed": True if lesson_id in ["l1111111-1111-1111-1111-111111111101", "l1111111-1111-1111-1111-111111111102"] else False
    }

@router.post("/progress")
async def update_lesson_progress(
    req: UpdateProgressRequest,
    current_user: dict = Depends(get_current_user)
):
    """Darsni tugallangan deb belgilash va progressni saqlash"""
    user_id = current_user.get("sub")
    
    # Supabase progress yozuvi
    await supabase_client.insert("lesson_progress", {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "course_id": req.course_id,
        "lesson_id": req.lesson_id,
        "completed": req.completed,
        "last_position": req.last_position
    })

    return {
        "success": True,
        "lesson_id": req.lesson_id,
        "completed": req.completed,
        "message": "Dars muvaffaqiyatli yakunlandi! 🎉"
    }

@router.get("/certificates", response_model=List[CertificateResponse])
async def get_certificates(current_user: dict = Depends(get_current_user)):
    """Talabaning olingan sertifikatlari"""
    user_name = current_user.get("name", "Abdurahmon Fayzullayev")
    return [
        {
            "id": "cert-1",
            "course_id": "c1111111-1111-1111-1111-111111111111",
            "course_title": "Sun'iy Intellekt va Prompt Engineering Pro",
            "student_name": user_name,
            "certificate_code": "CERT-AI-2026-8942",
            "issued_at": "15-Avgust, 2026",
            "certificate_url": "https://pub-a868f5ba65474136a054993d81485e0b.r2.dev/certificate-ai.pdf"
        }
    ]

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Bildirishnomalar ro'yxati"""
    return [
        {
            "id": "notif-1",
            "title": "Tabriklaymiz! 🎉",
            "message": "Siz 'AI Prompt Engineering' kursining 1-modulini muvaffaqiyatli yakunladingiz.",
            "type": "success",
            "is_read": False,
            "created_at": "Bugun, 14:30"
        },
        {
            "id": "notif-2",
            "title": "Yangi bonus material yuklandi",
            "message": "Figma design tokenlari va master shablonlar PDF fayli darsga biriktirildi.",
            "type": "info",
            "is_read": True,
            "created_at": "Kecha, 18:00"
        }
    ]
