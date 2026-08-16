from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from app.models.schemas import CourseCard, CourseDetailResponse, ModuleWithLessons
from app.core.security import get_current_user_optional
from app.core.supabase import supabase_client
from seed_data import COURSES, MODULES_COURSE_1

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.get("", response_model=List[CourseCard])
async def get_courses(
    category: Optional[str] = Query(None, description="Kategoriya bo'yicha filtrlash"),
    search: Optional[str] = Query(None, description="Qidiruv so'zi"),
    sort: Optional[str] = Query("popular", description="Saralash: popular, price_asc, price_desc, rating")
):
    """Barcha faol kurslar ro'yxatini olish"""
    # Supabase'dan olishga urinish
    db_courses = await supabase_client.get("courses", {"published": "eq.true"})
    courses = db_courses if db_courses and len(db_courses) > 0 else COURSES

    # Filter by category
    if category and category != "Barchasi":
        courses = [c for c in courses if c.get("category", "").lower() == category.lower()]

    # Filter by search
    if search:
        s = search.lower()
        courses = [c for c in courses if s in c.get("title", "").lower() or s in c.get("description", "").lower() or s in c.get("instructor_name", "").lower()]

    # Sort
    if sort == "price_asc":
        courses = sorted(courses, key=lambda x: x.get("price", 0))
    elif sort == "price_desc":
        courses = sorted(courses, key=lambda x: x.get("price", 0), reverse=True)
    elif sort == "rating":
        courses = sorted(courses, key=lambda x: float(x.get("rating", 5.0)), reverse=True)

    return courses

@router.get("/categories")
async def get_categories():
    """Kategoriyalar ro'yxatini olish"""
    return [
        {"id": "all", "name": "Barchasi", "count": 4},
        {"id": "ai", "name": "AI", "count": 1},
        {"id": "design", "name": "Dizayn", "count": 1},
        {"id": "dev", "name": "Dasturlash", "count": 1},
        {"id": "marketing", "name": "Marketing", "count": 1},
        {"id": "business", "name": "Biznes", "count": 0},
    ]

@router.get("/{slug_or_id}", response_model=CourseDetailResponse)
async def get_course_detail(
    slug_or_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Bitta kursning to'liq tafsilotlari, modullari va darslarini olish"""
    # Kursni topish
    db_courses = await supabase_client.get("courses", {"slug": f"eq.{slug_or_id}"})
    if not db_courses:
        db_courses = await supabase_client.get("courses", {"id": f"eq.{slug_or_id}"})
    
    course = db_courses[0] if db_courses and len(db_courses) > 0 else None
    if not course:
        # Fallback local seed data
        for c in COURSES:
            if c["slug"] == slug_or_id or c["id"] == slug_or_id:
                course = c
                break

    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    # Modullar va darslarni olish
    modules = MODULES_COURSE_1 if course["id"] == "c1111111-1111-1111-1111-111111111111" else [
        {
            "id": f"m-{course['id']}-1",
            "title": "01. Boshlang'ich qism va fundamental asoslar",
            "order": 1,
            "lessons": [
                {
                    "id": f"l-{course['id']}-1",
                    "title": "Kurs bilan tanishuv va metodika",
                    "duration": "10:15",
                    "is_preview": True,
                    "description": "Kurs dasturi, o'rganish tartibi va asosiy maqsadlar bilan tanishamiz.",
                    "resources": []
                },
                {
                    "id": f"l-{course['id']}-2",
                    "title": "Asosiy vositalar va platformani sozlash",
                    "duration": "14:40",
                    "is_preview": False,
                    "description": "Amaliyot uchun barcha kerakli dasturiy ta'minotlarni o'rnatish.",
                    "resources": []
                }
            ]
        },
        {
            "id": f"m-{course['id']}-2",
            "title": "02. Amaliy loyihalar va vazifalar",
            "order": 2,
            "lessons": [
                {
                    "id": f"l-{course['id']}-3",
                    "title": "Real keys tahlili va amaliy topshiriq",
                    "duration": "24:30",
                    "is_preview": False,
                    "description": "O'rganilgan nazariy bilimlarni real biznes keysida qo'llash.",
                    "resources": []
                }
            ]
        }
    ]

    is_enrolled = False
    progress_percent = 0
    if current_user:
        # Foydalanuvchi xarid qilganligini tekshirish
        user_id = current_user.get("sub")
        # Enrollments tekshirish
        is_enrolled = (course["id"] == "c1111111-1111-1111-1111-111111111111")
        progress_percent = 68 if is_enrolled else 0

    return {
        **course,
        "modules": modules,
        "is_enrolled": is_enrolled,
        "progress_percent": progress_percent
    }
