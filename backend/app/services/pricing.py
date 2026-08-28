"""Kurs narxi va "birinchi N kishi" chegirmasini hisoblash mantiqi.

Qoida: agar kursda discount_percent > 0 va discount_limit >= 1 bo'lsa,
chegirma faqat birinchi N ta xaridor uchun amal qiladi. Xaridorlar soni
rad etilmagan xaridlardan sanaladi (pending_approval, approved, completed).
Limit to'lgach narx asl holatiga qaytadi.

discount_limit berilmagan kurslarda discount_percent faqat ko'rsatkich
(eski xatti-harakat): narx o'zgarishi hisoblanmaydi.
"""
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def discount_state(course: Dict[str, Any], buyers: int) -> Dict[str, Any]:
    """Xaridorlar soni ma'lum bo'lganda yakuniy narx va chegirma holatini hisoblaydi."""
    price = _to_int(course.get("price"))
    percent = _to_int(course.get("discount_percent"))
    limit = course.get("discount_limit")
    limit = _to_int(limit) if limit is not None else 0

    if percent > 0 and limit > 0:
        active = buyers < limit
        final_price = round(price * (100 - percent) / 100) if active else price
        return {
            "discount_active": active,
            "discount_spots_left": max(0, limit - buyers),
            "final_price": final_price,
        }
    return {"discount_active": False, "discount_spots_left": None, "final_price": price}


async def course_pricing(store, course: Dict[str, Any]) -> Dict[str, Any]:
    """Kurs uchun effektiv narxni hisoblaydi (kerak bo'lsa xaridlar sonini sanaydi)."""
    percent = _to_int(course.get("discount_percent"))
    limit = course.get("discount_limit")
    buyers = 0
    if percent > 0 and limit:
        try:
            buyers = await store.count_active_purchases(course.get("id"))
        except Exception as e:
            logger.warning(f"Xaridlar sonini hisoblashda xato ({course.get('id')}): {e}")
            buyers = 0
    return discount_state(course, buyers)
