"""
Bir martalik migratsiya: bazadagi eski R2 public havolalarni /api/media/ proxy ko'rinishiga o'tkazadi.

Muammo: eski yozuvlarda to'g'ridan-to'g'ri https://pub-*.r2.dev/... havolalari saqlangan,
bucket endi PRIVATE bo'lgani uchun ular 403 qaytaradi (eski pub-a868f5ba... domen esa butunlay o'lgan).
Yechim: barcha R2 havolalari {API_PUBLIC_URL}/api/media/{key} ko'rinishida saqlanadi —
bu proxy har ochilishda yangi presigned havolaga yo'naltiradi va rasmlar doim ko'rinadi.

Qo'llash:  python migrate_r2_urls.py
"""
import asyncio
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from app.core.config import settings
from app.storage import init_store

_R2_HOST_RE = re.compile(r"\.r2\.dev$|\.r2\.cloudflarestorage\.com$", re.IGNORECASE)


def fix_key(key: str) -> str:
    """API endpoint URL dan olingan kalitda bucket nomi prefiks bo'lib qolgan bo'lsa,
    uni olib tashlaydi (masalan, .../course/courses/gallery/x.jpeg -> courses/gallery/x.jpeg)."""
    prefix = f"{settings.R2_BUCKET_NAME}/"
    while key.startswith(prefix):
        key = key[len(prefix):]
    return key


def to_media_url(url: Optional[str]) -> Optional[str]:
    """R2 public URL ni /api/media/{key} havolasiga aylantiradi. O'zgarmasa None qaytaradi."""
    if not url or not isinstance(url, str):
        return None
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https") or not _R2_HOST_RE.search(parsed.netloc.lower()):
        return None
    key = fix_key(parsed.path.lstrip("/"))
    if not key:
        return None
    return f"{settings.API_PUBLIC_URL}/api/media/{key}"


def repair_media_url(url: Optional[str]) -> Optional[str]:
    """Allaqachon /api/media/ ko'rinishidagi, lekin kalitida bucket prefiksi bor
    havolani tuzatadi. Tuzatish kerak bo'lmasa None qaytaradi."""
    if not url or not isinstance(url, str):
        return None
    prefix = f"{settings.API_PUBLIC_URL.rstrip('/')}/api/media/"
    if not url.startswith(prefix):
        return None
    key = url[len(prefix):]
    fixed = fix_key(key)
    if fixed == key or not fixed:
        return None
    return f"{prefix}{fixed}"


def fix_url(url: Optional[str]) -> Optional[str]:
    """R2 yoki noto'g'ri prefiksli media havolasini tuzatadi. O'zgarish bo'lmasa None."""
    return to_media_url(url) or repair_media_url(url)


def migrate_gallery(gallery: Any) -> Optional[List[str]]:
    """gallery_urls ro'yxatidagi R2 havolalarini yangilaydi. O'zgarish bo'lmasa None."""
    if not isinstance(gallery, list):
        return None
    changed = False
    result: List[str] = []
    for item in gallery:
        fixed = fix_url(item) if isinstance(item, str) else None
        if fixed:
            result.append(fixed)
            changed = True
        else:
            result.append(item)
    return result if changed else None


async def main() -> None:
    store = await init_store()
    print(f"Storage backend: {store.backend_name}")
    print(f"API_PUBLIC_URL:  {settings.API_PUBLIC_URL}")

    courses = await store.list_courses(published_only=False)
    courses_fixed = 0
    for course in courses:
        updates: Dict[str, Any] = {}

        new_cover = fix_url(course.get("cover_url"))
        if new_cover:
            updates["cover_url"] = new_cover

        new_gallery = migrate_gallery(course.get("gallery_urls"))
        if new_gallery is not None:
            updates["gallery_urls"] = new_gallery

        if updates:
            merged = {**course, **updates}
            await store.upsert_course(merged)
            courses_fixed += 1
            print(f"  [kurs] {course.get('id')}: {', '.join(updates)} yangilandi")

    purchases = await store.list_purchases(limit=10000)
    purchases_fixed = 0
    for purchase in purchases:
        new_receipt = fix_url(purchase.get("receipt_image_url"))
        if new_receipt:
            await store.update_purchase(purchase["id"], {"receipt_image_url": new_receipt})
            purchases_fixed += 1
            print(f"  [to'lov] {purchase['id']}: receipt_image_url yangilandi")

    print(f"\nJami: {courses_fixed} ta kurs, {purchases_fixed} ta to'lov yangilandi.")


if __name__ == "__main__":
    asyncio.run(main())
