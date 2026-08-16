import uuid
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from app.core.security import get_current_admin
from app.core.supabase import supabase_client
from app.core.r2 import r2_client
from app.models.schemas import CourseCard
from seed_data import COURSES

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

@router.get("/dashboard-stats")
async def get_admin_dashboard_stats(admin: dict = Depends(get_current_admin)):
    """Admin boshqaruv paneli umumiy statistikasi (Yaxshi Bola & Zuhra Olimova uchun)"""
    return {
        "admin_name": admin.get("name"),
        "admin_username": admin.get("username"),
        "role": "Superadmin (Teng huquqli)",
        "total_revenue": 142500000, # 142,500,000 so'm
        "total_students": 6350,
        "active_courses_count": len(COURSES),
        "total_lessons_count": 128,
        "recent_sales": [
            {
                "id": "ord_1",
                "student_name": "Azizbek Rahimov",
                "course_title": "Sun'iy Intellekt va Prompt Engineering Pro",
                "amount": 490000,
                "payment_method": "payme",
                "date": "Bugun, 14:20"
            },
            {
                "id": "ord_2",
                "student_name": "Dilnoza Karimova",
                "course_title": "Telegram Bot & Mini App Fullstack Dasturlash",
                "amount": 690000,
                "payment_method": "click",
                "date": "Bugun, 13:05"
            }
        ]
    }

@router.post("/courses/create")
async def create_course(
    course_data: Dict[str, Any],
    admin: dict = Depends(get_current_admin)
):
    """Yangi kurs yaratish"""
    course_id = str(uuid.uuid4())
    slug = course_data.get("slug") or course_data.get("title", "").lower().replace(" ", "-")
    
    new_course = {
        "id": course_id,
        "title": course_data.get("title"),
        "slug": slug,
        "category": course_data.get("category", "AI"),
        "description": course_data.get("description", ""),
        "short_description": course_data.get("short_description", ""),
        "cover_url": course_data.get("cover_url", ""),
        "price": int(course_data.get("price", 0)),
        "old_price": int(course_data.get("old_price", 0)) if course_data.get("old_price") else None,
        "duration": course_data.get("duration", "10 soat"),
        "lesson_count": int(course_data.get("lesson_count", 0)),
        "level": course_data.get("level", "Boshlang'ich"),
        "instructor_name": course_data.get("instructor_name", admin.get("name")),
        "instructor_title": course_data.get("instructor_title", "Senior Expert"),
        "published": True
    }

    await supabase_client.insert("courses", new_course)
    return {"success": True, "course": new_course}

@router.post("/r2/generate-upload-url")
async def generate_r2_upload_url(
    filename: str,
    admin: dict = Depends(get_current_admin)
):
    """Cloudflare R2 ga video yoki dars fayli yuklash uchun xavfsiz presigned URL olish"""
    object_key = f"videos/{uuid.uuid4().hex[:8]}_{filename}"
    upload_url = r2_client.generate_presigned_url(object_key, expires_in=3600)
    public_url = r2_client.get_public_url(object_key)
    
    return {
        "object_key": object_key,
        "upload_url": upload_url,
        "public_url": public_url
    }
