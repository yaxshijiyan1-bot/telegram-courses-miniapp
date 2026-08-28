from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from app.models.schemas import CourseCard, CourseDetailResponse, ModuleWithLessons
from app.core.security import get_current_user_optional
from app.storage import get_store
from app.services.pricing import course_pricing
from seed_data import build_course_modules, normalize_stored_modules

router = APIRouter(prefix="/courses", tags=["Courses"])

# Faqat demo kurs uchun eski generatsiya saqlanadi; qolgan kurslar
# admin kiritgan modullarni ko'rsatadi (bo'lmasa Dastur bo'limi yashirinadi).
DEMO_COURSE_ID = "c1111111-1111-1111-1111-111111111111"


def resolve_course_modules(course: dict) -> list:
    """Admin saqlagan matnli modullarni afzal ko'radi, aks holda bo'sh qaytaradi."""
    stored = course.get("modules") or []
    if stored:
        return normalize_stored_modules(course["id"], stored)
    if course["id"] == DEMO_COURSE_ID:
        return build_course_modules(course)
    return []


@router.get("", response_model=List[CourseCard])
async def get_courses(
    category: Optional[str] = Query(None, description="Kategoriya bo'yicha filtrlash"),
    search: Optional[str] = Query(None, description="Qidiruv so'zi"),
    sort: Optional[str] = Query("popular", description="Saralash: popular, price_asc, price_desc, rating")
):
    """Barcha faol kurslar ro'yxatini olish"""
    store = get_store()
    courses = await store.list_courses(published_only=True)

    # Filter by category
    if category and category != "Barchasi":
        courses = [c for c in courses if (c.get("category") or "").lower() == category.lower()]

    # Filter by search
    if search:
        s = search.lower()
        courses = [c for c in courses if s in (c.get("title") or "").lower()
                   or s in (c.get("description") or "").lower()
                   or s in (c.get("instructor_name") or "").lower()]

    # Sort
    if sort == "price_asc":
        courses = sorted(courses, key=lambda x: x.get("price", 0))
    elif sort == "price_desc":
        courses = sorted(courses, key=lambda x: x.get("price", 0), reverse=True)
    elif sort == "rating":
        courses = sorted(courses, key=lambda x: float(x.get("rating") or 5.0), reverse=True)

    result = []
    for c in courses:
        pricing = await course_pricing(store, c)
        result.append({**c, **pricing})
    return result

@router.get("/categories")
async def get_categories():
    """Kategoriyalar ro'yxatini olish (jonli kurslardan hisoblanadi)"""
    store = get_store()
    courses = await store.list_courses(published_only=True)
    counts: dict = {}
    for c in courses:
        cat = c.get("category") or "Boshqa"
        counts[cat] = counts.get(cat, 0) + 1
    items = [{"id": "all", "name": "Barchasi", "count": len(courses)}]
    for cat, cnt in counts.items():
        slug = cat.lower().replace(" ", "-")
        items.append({"id": slug, "name": cat, "count": cnt})
    return items

@router.get("/{slug_or_id}", response_model=CourseDetailResponse)
async def get_course_detail(
    slug_or_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Bitta kursning to'liq tafsilotlari, modullari va darslarini olish"""
    store = get_store()
    course = await store.get_course(slug_or_id)

    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    modules = resolve_course_modules(course)

    is_enrolled = False
    progress_percent = 0
    if current_user:
        user_id = current_user.get("sub")
        enrollment = await store.get_enrollment(user_id, course["id"])
        if enrollment:
            is_enrolled = True
            all_lessons = [l for m in modules for l in m["lessons"]]
            total = len(all_lessons) or course.get("lesson_count") or 1
            completed = await store.count_completed(user_id, course["id"])
            progress_percent = min(100, int(completed * 100 / max(total, 1)))

    pricing = await course_pricing(store, course)

    return {
        **course,
        **pricing,
        "modules": modules,
        "is_enrolled": is_enrolled,
        "progress_percent": progress_percent
    }
