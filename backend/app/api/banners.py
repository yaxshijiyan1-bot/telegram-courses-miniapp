"""
Banner tizimi — bosh sahifa uchun admin boshqaruvidagi dinamik bannerlar.

Bannerlar app_settings jadvalida 'banners' kaliti ostida JSON massiv sifatida
saqlanadi (Supabase yoki SQLite — ikkalasida ham get_setting/set_setting mavjud,
shuning uchun alohida jadval/migratsiya kerak emas).

Banner ko'rinishi:
    {
        "id": "uuid-hex",
        "title": "ixtiyoriy sarlavha",
        "image_url": "https://.../api/media/banners/xxx.jpg",
        "action_type": "link" | "course",
        "action_value": "https://t.me/..." yoki course_id,
        "order_index": 0,
        "is_active": true,
        "created_at": "ISO-8601"
    }
"""

import json
import logging
from typing import Any, Dict, List

from fastapi import APIRouter

from app.storage import get_store

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Banners"])

BANNERS_SETTING_KEY = "banners"


async def load_banners() -> List[Dict[str, Any]]:
    """Barcha bannerlarni app_settings dan o'qish (xatolikda bo'sh ro'yxat)."""
    store = get_store()
    try:
        raw = await store.get_setting(BANNERS_SETTING_KEY)
        if not raw:
            return []
        data = json.loads(raw)
        if not isinstance(data, list):
            return []
        return [b for b in data if isinstance(b, dict) and b.get("id")]
    except Exception as e:
        logger.error(f"Banners JSON o'qishda xatolik: {e}")
        return []


async def save_banners(banners: List[Dict[str, Any]]) -> bool:
    """Bannerlar ro'yxatini app_settings ga yozish."""
    store = get_store()
    try:
        return await store.set_setting(
            BANNERS_SETTING_KEY, json.dumps(banners, ensure_ascii=False)
        )
    except Exception as e:
        logger.error(f"Banners JSON saqlashda xatolik: {e}")
        return False


@router.get("/banners")
async def get_public_banners():
    """
    Ommaviy endpoint — faqat faol bannerlar, order_index bo'yicha tartiblangan.
    Frontend bosh sahifada slider sifatida ko'rsatadi.
    """
    banners = await load_banners()
    active = [b for b in banners if b.get("is_active", True)]
    active.sort(key=lambda b: b.get("order_index", 0))
    return {"success": True, "banners": active}
