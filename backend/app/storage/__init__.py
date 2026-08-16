import logging
from typing import Optional
import httpx
from app.core.config import settings
from .base import Store
from .sqlite_store import SqliteStore

logger = logging.getLogger(__name__)

_store: Optional[Store] = None

async def _supabase_available() -> bool:
    """Supabase'da jadvallar (schema.sql) ishga tushirilganmi — tekshirish"""
    if not settings.SUPABASE_URL or not (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY):
        return False
    try:
        base = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1"
        headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY}",
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(f"{base}/users", headers=headers, params={"select": "id", "limit": 1})
            if res.status_code == 200:
                return True
            if res.status_code == 404:
                logger.warning("Supabase'da 'users' jadvali topilmadi — schema.sql ishga tushirilmagan. SQLite fallback ishlatiladi.")
                return False
            logger.warning(f"Supabase probe failed: {res.status_code} — SQLite fallback ishlatiladi.")
            return False
    except Exception as e:
        logger.warning(f"Supabase ulanmadi ({e}) — SQLite fallback ishlatiladi.")
        return False

async def init_store() -> Store:
    """Storage'ni aniqlaydi (Supabase -> SQLite fallback) va birinchi ishga tushirishda seed qiladi"""
    global _store
    if _store is not None:
        return _store

    if await _supabase_available():
        from .supabase_store import SupabaseStore
        _store = SupabaseStore()
    else:
        _store = SqliteStore(settings.DATA_DIR)

    logger.info(f"Storage faol: {_store.backend_name}")
    await _seed_if_empty()
    return _store

def get_store() -> Store:
    if _store is None:
        raise RuntimeError("Storage ishga tushirilmagan — init_store() chaqirilmagan")
    return _store

async def _seed_if_empty():
    """Birinchi ishga tushirishda kurslar, modullar va adminlarni bazaga yozadi"""
    from seed_data import COURSES, build_course_modules
    try:
        courses = await _store.list_courses(published_only=False)
        if not courses:
            for c in COURSES:
                await _store.upsert_course(dict(c))
            logger.info(f"{len(COURSES)} ta seed kurs bazaga yozildi")

        # Har bir kurs uchun modullar va darslar (Supabase FK butunligi uchun)
        for c in COURSES:
            await _store.seed_course_structure(c["id"], build_course_modules(c))

        # Adminlar users jadvalida bo'lishini kafolatlaymiz (statistika va CRM uchun)
        from app.core.config import settings as s
        for tg_id, profile in s.ADMIN_PROFILES.items():
            existing = await _store.get_user_by_tg(tg_id)
            if not existing:
                await _store.create_user({
                    "telegram_id": tg_id,
                    "name": profile["name"],
                    "username": profile["username"],
                    "role": "superadmin",
                })
    except Exception as e:
        logger.error(f"Seed xatoligi: {e}")
