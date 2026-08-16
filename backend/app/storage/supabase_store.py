import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings
from .base import Store

logger = logging.getLogger(__name__)

# Supabase courses jadvalidagi haqiqiy ustunlar (schema.sql) — faqat shular yuboriladi
COURSE_COLUMNS = {
    "id", "title", "slug", "category", "description", "short_description",
    "cover_url", "preview_video_url", "price", "old_price", "discount_percent",
    "duration", "lesson_count", "level", "instructor_name", "instructor_title",
    "instructor_avatar", "instructor_bio", "rating", "student_count",
    "published", "created_at"
}

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

class SupabaseStore(Store):
    """Supabase PostgreSQL (PostgREST) orqali ishlaydigan storage — asosiy production backend."""
    backend_name = "supabase"

    def __init__(self):
        self.base_url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1"
        self.headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    async def _req(self, method: str, table: str, params: Optional[Dict] = None, json_body: Any = None) -> Optional[Any]:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.request(
                    method, f"{self.base_url}/{table}",
                    headers=self.headers, params=params, json=json_body
                )
                if res.status_code in (200, 201, 204):
                    if res.status_code == 204 or not res.text:
                        return []
                    return res.json()
                logger.warning(f"Supabase {method} {table} -> {res.status_code}: {res.text[:200]}")
                return None
        except Exception as e:
            logger.error(f"Supabase {method} {table} exception: {e}")
            return None

    # ---------------- USERS ----------------
    async def get_user_by_tg(self, telegram_id: int) -> Optional[Dict[str, Any]]:
        rows = await self._req("GET", "users", {"telegram_id": f"eq.{telegram_id}", "limit": 1})
        return rows[0] if rows else None

    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        rows = await self._req("GET", "users", {"id": f"eq.{user_id}", "limit": 1})
        return rows[0] if rows else None

    async def create_user(self, user: Dict[str, Any]) -> Dict[str, Any]:
        row = {k: v for k, v in user.items() if v is not None}
        row.setdefault("id", str(uuid.uuid4()))
        rows = await self._req("POST", "users", json_body=row)
        return rows[0] if rows else row

    async def update_user(self, user_id: str, fields: Dict[str, Any]) -> bool:
        res = await self._req("PATCH", "users", {"id": f"eq.{user_id}"}, json_body=fields)
        return res is not None

    async def list_users(self, limit: int = 200) -> List[Dict[str, Any]]:
        rows = await self._req("GET", "users", {"order": "created_at.desc", "limit": limit})
        return rows or []

    async def count_users(self) -> int:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.get(
                    f"{self.base_url}/users", headers={**self.headers, "Prefer": "count=exact"},
                    params={"select": "id", "limit": 1}
                )
                total = res.headers.get("content-range", "*/0").split("/")[-1]
                return int(total)
        except Exception:
            return 0

    # ---------------- COURSES ----------------
    async def list_courses(self, published_only: bool = True) -> List[Dict[str, Any]]:
        params = {"order": "created_at.asc"}
        if published_only:
            params["published"] = "eq.true"
        rows = await self._req("GET", "courses", params)
        return rows or []

    async def get_course(self, id_or_slug: str) -> Optional[Dict[str, Any]]:
        rows = await self._req("GET", "courses", {"or": f"(id.eq.{id_or_slug},slug.eq.{id_or_slug})", "limit": 1})
        return rows[0] if rows else None

    async def upsert_course(self, course: Dict[str, Any]) -> Dict[str, Any]:
        # Faqat sxemadagi ustunlarni yuboramiz (ortiqcha kalitlar PostgREST 400 beradi)
        row = {k: v for k, v in course.items() if k in COURSE_COLUMNS and v is not None}
        rows = await self._req("POST", "courses", json_body=row)
        if rows:
            return rows[0]
        # INSERT muvaffaqiyatsiz (allaqachon mavjud) — UPDATE urinib ko'ramiz
        await self._req("PATCH", "courses", {"id": f"eq.{row.get('id')}"}, json_body=row)
        return row

    async def delete_course(self, course_id: str) -> bool:
        res = await self._req("DELETE", "courses", {"or": f"(id.eq.{course_id},slug.eq.{course_id})"})
        return res is not None

    async def seed_course_structure(self, course_id: str, modules: List[Dict[str, Any]]) -> bool:
        """
        Kursning modullari va darslarini birinchi ishga tushirishda yozadi.
        lesson_progress.lesson_id FK talab qilgani uchun darslar bazada bo'lishi shart.
        """
        existing = await self._req("GET", "modules", {"course_id": f"eq.{course_id}", "select": "id", "limit": 1})
        if existing:
            return True
        for m in modules:
            mod_row = {
                "id": m["id"], "course_id": course_id,
                "title": m["title"], "order": m.get("order", 1)
            }
            res = await self._req("POST", "modules", json_body=mod_row)
            if not res:
                logger.warning(f"Module seed muvaffaqiyatsiz: {m['id']}")
                continue
            for l in m.get("lessons", []):
                lesson_row = {
                    "id": l["id"],
                    "module_id": m["id"],
                    "course_id": course_id,
                    "title": l["title"],
                    "description": l.get("description"),
                    "video_url": l.get("video_url"),
                    "duration": l.get("duration", "00:00"),
                    "order": l.get("order", 1),
                    "is_preview": bool(l.get("is_preview", False)),
                    "resources": l.get("resources", []),
                    "published": True
                }
                lesson_row = {k: v for k, v in lesson_row.items() if v is not None}
                await self._req("POST", "lessons", json_body=lesson_row)
        return True

    # ---------------- PURCHASES ----------------
    async def create_purchase(self, p: Dict[str, Any]) -> Dict[str, Any]:
        row = {k: v for k, v in p.items() if v is not None}
        row.setdefault("id", str(uuid.uuid4()))
        rows = await self._req("POST", "purchases", json_body=row)
        return rows[0] if rows else row

    async def get_purchase_by_tx(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        rows = await self._req("GET", "purchases", {"transaction_id": f"eq.{transaction_id}", "limit": 1})
        return rows[0] if rows else None

    async def update_purchase(self, purchase_id: str, fields: Dict[str, Any]) -> bool:
        res = await self._req("PATCH", "purchases", {"id": f"eq.{purchase_id}"}, json_body=fields)
        return res is not None

    async def list_purchases(self, status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        params = {"order": "created_at.desc", "limit": limit}
        if status:
            params["status"] = f"eq.{status}"
        rows = await self._req("GET", "purchases", params)
        return rows or []

    # ---------------- ENROLLMENTS ----------------
    async def get_enrollment(self, user_id: str, course_id: str) -> Optional[Dict[str, Any]]:
        rows = await self._req("GET", "enrollments", {
            "user_id": f"eq.{user_id}", "course_id": f"eq.{course_id}",
            "status": "eq.active", "limit": 1
        })
        return rows[0] if rows else None

    async def create_enrollment(self, user_id: str, course_id: str, purchase_id: Optional[str] = None) -> Dict[str, Any]:
        row = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "course_id": course_id,
            "purchase_id": purchase_id,
            "status": "active",
        }
        rows = await self._req("POST", "enrollments", json_body=row)
        if rows:
            return rows[0]
        # Duplicate -> faollashtiramiz
        await self._req("PATCH", "enrollments",
                        {"user_id": f"eq.{user_id}", "course_id": f"eq.{course_id}"},
                        {"status": "active"})
        return row

    async def list_enrollments(self, user_id: str) -> List[Dict[str, Any]]:
        rows = await self._req("GET", "enrollments", {
            "user_id": f"eq.{user_id}", "status": "eq.active", "order": "granted_at.desc"
        })
        return rows or []

    # ---------------- LESSON PROGRESS ----------------
    async def upsert_progress(self, user_id: str, course_id: str, lesson_id: str, completed: bool, last_position: int = 0) -> bool:
        existing = await self._req("GET", "lesson_progress", {
            "user_id": f"eq.{user_id}", "lesson_id": f"eq.{lesson_id}", "limit": 1
        })
        if existing:
            res = await self._req("PATCH", "lesson_progress",
                                   {"id": f"eq.{existing[0]['id']}"},
                                   {"completed": completed, "last_position": last_position, "updated_at": _now(),
                                    **({"completed_at": _now()} if completed else {})})
            return res is not None
        row = {
            "id": str(uuid.uuid4()), "user_id": user_id, "course_id": course_id,
            "lesson_id": lesson_id, "completed": completed, "last_position": last_position,
            "updated_at": _now(), **({"completed_at": _now()} if completed else {}),
        }
        res = await self._req("POST", "lesson_progress", json_body=row)
        return res is not None

    async def get_progress_map(self, user_id: str, course_id: str) -> Dict[str, Dict[str, Any]]:
        rows = await self._req("GET", "lesson_progress", {
            "user_id": f"eq.{user_id}", "course_id": f"eq.{course_id}", "select": "lesson_id,completed,last_position"
        })
        return {r["lesson_id"]: {"completed": bool(r.get("completed")), "last_position": r.get("last_position", 0)} for r in (rows or [])}

    async def count_completed(self, user_id: str, course_id: str) -> int:
        rows = await self._req("GET", "lesson_progress", {
            "user_id": f"eq.{user_id}", "course_id": f"eq.{course_id}",
            "completed": "eq.true", "select": "id"
        })
        return len(rows or [])

    async def latest_progress_row(self, user_id: str, course_id: str) -> Optional[Dict[str, Any]]:
        rows = await self._req("GET", "lesson_progress", {
            "user_id": f"eq.{user_id}", "course_id": f"eq.{course_id}",
            "order": "updated_at.desc", "limit": 1
        })
        return rows[0] if rows else None

    # ---------------- CERTIFICATES ----------------
    async def list_certificates(self, user_id: str) -> List[Dict[str, Any]]:
        rows = await self._req("GET", "certificates", {
            "user_id": f"eq.{user_id}", "order": "issued_at.desc"
        })
        return rows or []

    async def create_certificate(self, cert: Dict[str, Any]) -> Dict[str, Any]:
        row = {"id": str(uuid.uuid4()), **cert}
        rows = await self._req("POST", "certificates", json_body=row)
        return rows[0] if rows else row

    # ---------------- NOTIFICATIONS ----------------
    async def list_notifications(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        rows = await self._req("GET", "notifications", {
            "user_id": f"eq.{user_id}", "order": "created_at.desc", "limit": limit
        })
        return rows or []

    async def create_notification(self, user_id: str, title: str, message: str, type_: str = "info") -> Dict[str, Any]:
        row = {"id": str(uuid.uuid4()), "user_id": user_id, "title": title, "message": message, "type": type_, "is_read": False}
        rows = await self._req("POST", "notifications", json_body=row)
        return rows[0] if rows else row

    async def mark_notifications_read(self, user_id: str) -> bool:
        res = await self._req("PATCH", "notifications",
                              {"user_id": f"eq.{user_id}", "is_read": "eq.false"},
                              {"is_read": True})
        return res is not None

    # ---------------- STATS ----------------
    async def revenue_stats(self) -> Dict[str, int]:
        rows = await self._req("GET", "purchases", {
            "status": "in.(approved,completed)", "select": "amount,created_at"
        })
        total = sum(int(r.get("amount") or 0) for r in (rows or []))
        month_prefix = datetime.now(timezone.utc).strftime("%Y-%m")
        monthly = sum(int(r.get("amount") or 0) for r in (rows or []) if str(r.get("created_at", "")).startswith(month_prefix))
        return {"total_revenue": total, "monthly_revenue": monthly}

    async def broadcast_recipients(self) -> List[Dict[str, Any]]:
        rows = await self._req("GET", "users", {
            "select": "id,telegram_id,name", "telegram_id": "not.is.null", "limit": "1000"
        })
        return [r for r in (rows or []) if r.get("telegram_id")]
