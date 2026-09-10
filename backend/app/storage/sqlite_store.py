import os
import threading
import sqlite3
import uuid
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from .base import Store

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

class SqliteStore(Store):
    """
    O'rnatilgan SQLite storage — Supabase jadvallari mavjud bo'lmaganda
    avtomatik ishlaydigan nol-konfiguratsiyali fallback.
    """
    backend_name = "sqlite"

    def __init__(self, data_dir: str):
        os.makedirs(data_dir, exist_ok=True)
        self.db_path = os.path.join(data_dir, "app.db")
        self.lock = threading.RLock()
        self._init_schema()

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

    def _init_schema(self):
        with self.lock, self._conn() as c:
            c.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                telegram_id INTEGER UNIQUE,
                name TEXT NOT NULL,
                username TEXT,
                role TEXT DEFAULT 'student',
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS courses (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                category TEXT,
                description TEXT,
                short_description TEXT,
                cover_url TEXT,
                preview_video_url TEXT,
                price INTEGER DEFAULT 0,
                old_price INTEGER,
                discount_percent INTEGER,
                duration TEXT,
                lesson_count INTEGER DEFAULT 0,
                level TEXT,
                instructor_name TEXT,
                instructor_title TEXT,
                instructor_avatar TEXT,
                instructor_bio TEXT,
                access_duration TEXT,
                copyright_notice TEXT,
                rating REAL DEFAULT 5.0,
                student_count INTEGER DEFAULT 0,
                telegram_channel_id TEXT,
                gallery_urls TEXT,
                testimonials TEXT,
                custom_info TEXT,
                published INTEGER DEFAULT 1,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS purchases (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                course_id TEXT,
                amount INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                payment_method TEXT,
                transaction_id TEXT,
                telegram_id INTEGER,
                student_name TEXT,
                username TEXT,
                course_title TEXT,
                receipt_image_url TEXT,
                comment TEXT,
                reviewed_by TEXT,
                channel_invite_link TEXT,
                invite_expires_at TEXT,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS enrollments (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                purchase_id TEXT,
                status TEXT DEFAULT 'active',
                granted_at TEXT NOT NULL,
                UNIQUE(user_id, course_id)
            );
            CREATE TABLE IF NOT EXISTS lesson_progress (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                lesson_id TEXT NOT NULL,
                completed INTEGER DEFAULT 0,
                last_position INTEGER DEFAULT 0,
                updated_at TEXT NOT NULL,
                UNIQUE(user_id, lesson_id)
            );
            CREATE TABLE IF NOT EXISTS certificates (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                certificate_code TEXT UNIQUE NOT NULL,
                student_name TEXT NOT NULL,
                course_title TEXT NOT NULL,
                certificate_url TEXT,
                issued_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                is_read INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS lessons (
                id TEXT PRIMARY KEY,
                course_id TEXT,
                module_id TEXT,
                title TEXT NOT NULL,
                description TEXT,
                video_url TEXT,
                video_file_id TEXT,
                video_file_unique_id TEXT,
                duration TEXT,
                duration_seconds INTEGER,
                width INTEGER,
                height INTEGER,
                file_size INTEGER,
                order_index INTEGER DEFAULT 1,
                is_preview INTEGER DEFAULT 0,
                resources TEXT DEFAULT '[]',
                created_by INTEGER,
                published_message_id INTEGER,
                published INTEGER DEFAULT 1,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS access_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lesson_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                username TEXT,
                first_name TEXT,
                client_callback_id TEXT,
                mode TEXT,
                opened_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS user_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                lesson_id TEXT,
                is_blocked INTEGER DEFAULT 1,
                reason TEXT,
                created_at TEXT NOT NULL,
                UNIQUE(user_id, lesson_id)
            );
            CREATE INDEX IF NOT EXISTS idx_purchases_tx ON purchases(transaction_id);
            CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
            CREATE INDEX IF NOT EXISTS idx_enroll_user ON enrollments(user_id);
            CREATE INDEX IF NOT EXISTS idx_prog_user_course ON lesson_progress(user_id, course_id);
            CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
            CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
            CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_access_logs_lesson ON access_logs(lesson_id);
            """)

            # Safe column additions
            for col, ddl in (
                ("telegram_channel_id", "TEXT"),
                ("gallery_urls", "TEXT"),
                ("testimonials", "TEXT"),
                ("custom_info", "TEXT"),
                ("learning_outcomes", "TEXT"),
                ("show_instructor", "INTEGER DEFAULT 1"),
                ("show_outcomes", "INTEGER DEFAULT 1"),
                ("instructor_id", "TEXT"),
                ("modules", "TEXT"),
                ("discount_limit", "INTEGER"),
            ):
                try:
                    c.execute(f"ALTER TABLE courses ADD COLUMN {col} {ddl};")
                except Exception:
                    pass


            for col, ddl in (
                ("channel_invite_link", "TEXT"),
                ("invite_expires_at", "TEXT"),
                ("reviewed_by", "TEXT"),
            ):
                try:
                    c.execute(f"ALTER TABLE purchases ADD COLUMN {col} {ddl};")
                except Exception:
                    pass

    # ---------------- USERS ----------------
    async def get_user_by_tg(self, telegram_id: int) -> Optional[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            row = c.execute("SELECT * FROM users WHERE telegram_id=?", (telegram_id,)).fetchone()
            return dict(row) if row else None

    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            row = c.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
            return dict(row) if row else None

    async def create_user(self, user: Dict[str, Any]) -> Dict[str, Any]:
        row = {
            "id": user.get("id") or str(uuid.uuid4()),
            "telegram_id": user.get("telegram_id"),
            "name": user.get("name", "Talaba"),
            "username": user.get("username"),
            "role": user.get("role", "student"),
            "created_at": _now(),
        }
        with self.lock, self._conn() as c:
            c.execute(
                """INSERT INTO users (id, telegram_id, name, username, role, created_at)
                   VALUES (?,?,?,?,?,?)
                   ON CONFLICT(telegram_id) DO UPDATE SET name=excluded.name, username=excluded.username, role=excluded.role""",
                (row["id"], row["telegram_id"], row["name"], row["username"], row["role"], row["created_at"])
            )
        return row


    async def update_user(self, user_id: str, fields: Dict[str, Any]) -> bool:
        if not fields:
            return False
        cols = ", ".join(f"{k}=?" for k in fields)
        with self.lock, self._conn() as c:
            c.execute(f"UPDATE users SET {cols} WHERE id=?", (*fields.values(), user_id))
        return True

    async def list_users(self, limit: int = 200) -> List[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            rows = c.execute("SELECT * FROM users ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
            return [dict(r) for r in rows]

    async def count_users(self) -> int:
        with self.lock, self._conn() as c:
            return c.execute("SELECT COUNT(*) FROM users").fetchone()[0]

    async def delete_user(self, user_id: str) -> bool:
        with self.lock, self._conn() as c:
            for table in ("enrollments", "lesson_progress", "certificates", "notifications", "purchases"):
                c.execute(f"DELETE FROM {table} WHERE user_id=?", (user_id,))
            cur = c.execute("DELETE FROM users WHERE id=?", (user_id,))
            return cur.rowcount > 0

    # ---------------- COURSES ----------------
    def _course_row(self, r: sqlite3.Row) -> Dict[str, Any]:
        d = dict(r)
        d["published"] = bool(d.get("published"))
        d["show_instructor"] = bool(d.get("show_instructor", 1)) if d.get("show_instructor") is not None else True
        d["show_outcomes"] = bool(d.get("show_outcomes", 1)) if d.get("show_outcomes") is not None else True
        for json_field in ("gallery_urls", "testimonials", "custom_info", "learning_outcomes", "modules"):
            val = d.get(json_field)
            if isinstance(val, str):
                try:
                    d[json_field] = json.loads(val)
                except Exception:
                    d[json_field] = []
            elif val is None:
                d[json_field] = []
        return d

    async def list_courses(self, published_only: bool = True) -> List[Dict[str, Any]]:
        q = "SELECT * FROM courses" + (" WHERE published=1" if published_only else "") + " ORDER BY created_at ASC"
        with self.lock, self._conn() as c:
            rows = c.execute(q).fetchall()
            return [self._course_row(r) for r in rows]

    async def get_course(self, id_or_slug: str) -> Optional[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            row = c.execute("SELECT * FROM courses WHERE id=? OR slug=?", (id_or_slug, id_or_slug)).fetchone()
            return self._course_row(row) if row else None

    async def get_course_by_channel_id(self, channel_id: str) -> Optional[Dict[str, Any]]:
        ch_str = str(channel_id).strip()
        ch_clean = ch_str.replace("-100", "").replace("-", "")
        with self.lock, self._conn() as c:
            row = c.execute(
                "SELECT * FROM courses WHERE telegram_channel_id=? OR telegram_channel_id=? OR telegram_channel_id=?",
                (ch_str, f"-100{ch_clean}", ch_clean)
            ).fetchone()
            return self._course_row(row) if row else None

    async def upsert_course(self, course: Dict[str, Any]) -> Dict[str, Any]:
        cur = await self.get_course(course["id"]) or {}
        row = {**cur, **course}
        row["published"] = 1 if row.get("published", True) else 0
        row["show_instructor"] = 1 if row.get("show_instructor", True) else 0
        row["show_outcomes"] = 1 if row.get("show_outcomes", True) else 0
        if "created_at" not in row or not row["created_at"]:
            row["created_at"] = _now()

        # Serialize JSON fields
        gallery_json = json.dumps(row.get("gallery_urls") or [])
        testimonials_json = json.dumps(row.get("testimonials") or [])
        custom_info_json = json.dumps(row.get("custom_info") or [])
        outcomes_json = json.dumps(row.get("learning_outcomes") or [])
        modules_json = json.dumps(row.get("modules") or [])

        with self.lock, self._conn() as c:
            c.execute(
                """INSERT INTO courses (id,title,slug,category,description,short_description,cover_url,
                   preview_video_url,price,old_price,discount_percent,duration,lesson_count,level,
                   instructor_name,instructor_title,instructor_avatar,instructor_bio,access_duration,
                   copyright_notice,rating,student_count,telegram_channel_id,gallery_urls,testimonials,custom_info,
                   learning_outcomes,show_instructor,show_outcomes,instructor_id,modules,discount_limit,published,created_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                   ON CONFLICT(id) DO UPDATE SET title=excluded.title, slug=excluded.slug,
                   category=excluded.category, description=excluded.description,
                   short_description=excluded.short_description, cover_url=excluded.cover_url,
                   preview_video_url=excluded.preview_video_url, price=excluded.price,
                   old_price=excluded.old_price, discount_percent=excluded.discount_percent,
                   duration=excluded.duration, lesson_count=excluded.lesson_count, level=excluded.level,
                   instructor_name=excluded.instructor_name, instructor_title=excluded.instructor_title,
                   instructor_avatar=excluded.instructor_avatar, instructor_bio=excluded.instructor_bio,
                   access_duration=excluded.access_duration, copyright_notice=excluded.copyright_notice,
                   rating=excluded.rating, student_count=excluded.student_count,
                   telegram_channel_id=excluded.telegram_channel_id,
                   gallery_urls=excluded.gallery_urls,
                   testimonials=excluded.testimonials,
                   custom_info=excluded.custom_info,
                   learning_outcomes=excluded.learning_outcomes,
                   show_instructor=excluded.show_instructor,
                   show_outcomes=excluded.show_outcomes,
                   instructor_id=excluded.instructor_id,
                   modules=excluded.modules,
                   discount_limit=excluded.discount_limit,
                   published=excluded.published""",
                (row.get("id"), row.get("title"), row.get("slug"), row.get("category"),
                 row.get("description"), row.get("short_description"), row.get("cover_url"),
                 row.get("preview_video_url"), row.get("price", 0), row.get("old_price"),
                 row.get("discount_percent"), row.get("duration"), row.get("lesson_count", 0),
                 row.get("level"), row.get("instructor_name"), row.get("instructor_title"),
                 row.get("instructor_avatar"), row.get("instructor_bio"), row.get("access_duration"),
                 row.get("copyright_notice"), row.get("rating", 5.0), row.get("student_count", 0),
                 row.get("telegram_channel_id"), gallery_json, testimonials_json, custom_info_json,
                 outcomes_json, row.get("show_instructor", 1), row.get("show_outcomes", 1),
                 row.get("instructor_id"), modules_json, row.get("discount_limit"),
                 row.get("published", 1), row.get("created_at", _now()))
            )
        row["published"] = bool(row.get("published"))
        row["show_instructor"] = bool(row.get("show_instructor"))
        row["show_outcomes"] = bool(row.get("show_outcomes"))
        row["gallery_urls"] = json.loads(gallery_json)
        row["testimonials"] = json.loads(testimonials_json)
        row["custom_info"] = json.loads(custom_info_json)
        row["learning_outcomes"] = json.loads(outcomes_json)
        row["modules"] = json.loads(modules_json)
        return row


    async def delete_course(self, course_id: str) -> bool:
        with self.lock, self._conn() as c:
            cur = c.execute("DELETE FROM courses WHERE id=? OR slug=?", (course_id, course_id))
            return cur.rowcount > 0

    async def seed_course_structure(self, course_id: str, modules: list) -> bool:
        return True

    # ---------------- PURCHASES ----------------
    async def create_purchase(self, p: Dict[str, Any]) -> Dict[str, Any]:
        row = {
            "id": str(uuid.uuid4()),
            **p,
            "created_at": _now(),
        }
        with self.lock, self._conn() as c:
            c.execute(
                """INSERT INTO purchases (id,user_id,course_id,amount,status,payment_method,transaction_id,
                   telegram_id,student_name,username,course_title,receipt_image_url,comment,reviewed_by,
                   channel_invite_link,invite_expires_at,created_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (row.get("id"), row.get("user_id"), row.get("course_id"), row.get("amount", 0),
                 row.get("status", "pending"), row.get("payment_method"), row.get("transaction_id"),
                 row.get("telegram_id"), row.get("student_name"), row.get("username"),
                 row.get("course_title"), row.get("receipt_image_url"), row.get("comment"),
                 row.get("reviewed_by"), row.get("channel_invite_link"), row.get("invite_expires_at"),
                 row["created_at"])
            )
        return row

    async def get_purchase_by_tx(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            row = c.execute("SELECT * FROM purchases WHERE transaction_id=?", (transaction_id,)).fetchone()
            return dict(row) if row else None

    async def get_purchase_by_invite_link(self, invite_link: str) -> Optional[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            row = c.execute(
                "SELECT * FROM purchases WHERE channel_invite_link=? ORDER BY created_at DESC LIMIT 1",
                (invite_link,),
            ).fetchone()
            return dict(row) if row else None

    async def get_approved_purchase_for(self, user_id: str, course_id: str) -> Optional[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            row = c.execute(
                "SELECT * FROM purchases WHERE user_id=? AND course_id=? AND status='approved' "
                "ORDER BY created_at DESC LIMIT 1",
                (user_id, course_id),
            ).fetchone()
            return dict(row) if row else None

    async def update_purchase(self, purchase_id: str, fields: Dict[str, Any]) -> bool:
        if not fields:
            return False
        cols = ", ".join(f"{k}=?" for k in fields)
        with self.lock, self._conn() as c:
            c.execute(f"UPDATE purchases SET {cols} WHERE id=?", (*fields.values(), purchase_id))
        return True

    async def transition_purchase_status(
        self, purchase_id: str, expected_status: str, fields: Dict[str, Any]
    ) -> bool:
        if not fields:
            return False
        cols = ", ".join(f"{k}=?" for k in fields)
        with self.lock, self._conn() as c:
            cur = c.execute(
                f"UPDATE purchases SET {cols} WHERE id=? AND status=?",
                (*fields.values(), purchase_id, expected_status),
            )
            return cur.rowcount == 1

    async def list_purchases(self, status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            if status:
                rows = c.execute(
                    "SELECT * FROM purchases WHERE status=? ORDER BY created_at DESC LIMIT ?",
                    (status, limit)
                ).fetchall()
            else:
                rows = c.execute(
                    "SELECT * FROM purchases ORDER BY created_at DESC LIMIT ?", (limit,)
                ).fetchall()
            return [dict(r) for r in rows]

    async def list_purchases_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            rows = c.execute(
                "SELECT * FROM purchases WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
                (user_id, limit)
            ).fetchall()
            return [dict(r) for r in rows]

    async def count_active_purchases(self, course_id: str) -> int:
        """Kurs bo'yicha rad etilmagan xaridlar soni (chegirma limiti hisobi uchun)"""
        with self.lock, self._conn() as c:
            row = c.execute(
                "SELECT COUNT(*) AS n FROM purchases WHERE course_id=? "
                "AND status IN ('pending_approval','approved','completed')",
                (course_id,)
            ).fetchone()
            return int(row["n"]) if row else 0

    # ---------------- ENROLLMENTS ----------------
    async def get_enrollment(self, user_id: str, course_id: str) -> Optional[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            row = c.execute(
                "SELECT * FROM enrollments WHERE user_id=? AND course_id=? AND status='active'",
                (user_id, course_id)
            ).fetchone()
            return dict(row) if row else None

    async def create_enrollment(self, user_id: str, course_id: str, purchase_id: Optional[str] = None) -> Dict[str, Any]:
        row = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "course_id": course_id,
            "purchase_id": purchase_id,
            "status": "active",
            "granted_at": _now(),
        }
        with self.lock, self._conn() as c:
            c.execute(
                """INSERT INTO enrollments (id,user_id,course_id,purchase_id,status,granted_at)
                   VALUES (?,?,?,?,?,?)
                   ON CONFLICT(user_id, course_id) DO UPDATE SET status='active'""",
                (row["id"], user_id, course_id, purchase_id, "active", row["granted_at"])
            )
        return row

    async def list_enrollments(self, user_id: str) -> List[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            rows = c.execute(
                "SELECT * FROM enrollments WHERE user_id=? AND status='active' ORDER BY granted_at DESC",
                (user_id,)
            ).fetchall()
            return [dict(r) for r in rows]

    async def revoke_enrollment(self, user_id: str, course_id: str) -> bool:
        with self.lock, self._conn() as c:
            cur = c.execute(
                "DELETE FROM enrollments WHERE user_id=? AND course_id=?",
                (user_id, course_id)
            )
            c.execute(
                "DELETE FROM lesson_progress WHERE user_id=? AND course_id=?",
                (user_id, course_id)
            )
            return cur.rowcount > 0

    # ---------------- LESSON PROGRESS ----------------
    async def upsert_progress(self, user_id: str, course_id: str, lesson_id: str, completed: bool, last_position: int = 0) -> bool:
        with self.lock, self._conn() as c:
            c.execute(
                """INSERT INTO lesson_progress (id,user_id,course_id,lesson_id,completed,last_position,updated_at)
                   VALUES (?,?,?,?,?,?,?)
                   ON CONFLICT(user_id, lesson_id) DO UPDATE SET completed=?, last_position=?, updated_at=?""",
                (str(uuid.uuid4()), user_id, course_id, lesson_id, 1 if completed else 0, last_position, _now(),
                 1 if completed else 0, last_position, _now())
            )
        return True

    async def get_progress_map(self, user_id: str, course_id: str) -> Dict[str, Dict[str, Any]]:
        with self.lock, self._conn() as c:
            rows = c.execute(
                "SELECT lesson_id, completed, last_position FROM lesson_progress WHERE user_id=? AND course_id=?",
                (user_id, course_id)
            ).fetchall()
            return {r["lesson_id"]: {"completed": bool(r["completed"]), "last_position": r["last_position"]} for r in rows}

    async def count_completed(self, user_id: str, course_id: str) -> int:
        with self.lock, self._conn() as c:
            return c.execute(
                "SELECT COUNT(*) FROM lesson_progress WHERE user_id=? AND course_id=? AND completed=1",
                (user_id, course_id)
            ).fetchone()[0]

    async def latest_progress_row(self, user_id: str, course_id: str) -> Optional[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            row = c.execute(
                """SELECT lesson_id, last_position, updated_at FROM lesson_progress
                   WHERE user_id=? AND course_id=? ORDER BY updated_at DESC LIMIT 1""",
                (user_id, course_id)
            ).fetchone()
            return dict(row) if row else None

    # ---------------- CERTIFICATES ----------------
    async def list_certificates(self, user_id: str) -> List[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            rows = c.execute(
                "SELECT * FROM certificates WHERE user_id=? ORDER BY issued_at DESC", (user_id,)
            ).fetchall()
            return [dict(r) for r in rows]

    async def create_certificate(self, cert: Dict[str, Any]) -> Dict[str, Any]:
        row = {"id": str(uuid.uuid4()), **cert, "issued_at": cert.get("issued_at") or _now()}
        with self.lock, self._conn() as c:
            c.execute(
                """INSERT INTO certificates (id,user_id,course_id,certificate_code,student_name,course_title,certificate_url,issued_at)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (row["id"], row["user_id"], row["course_id"], row["certificate_code"],
                 row["student_name"], row["course_title"], row.get("certificate_url"), row["issued_at"])
            )
        return row

    # ---------------- NOTIFICATIONS ----------------
    async def list_notifications(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            rows = c.execute(
                "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
                (user_id, limit)
            ).fetchall()
            out = []
            for r in rows:
                d = dict(r)
                d["is_read"] = bool(d.get("is_read"))
                out.append(d)
            return out

    async def create_notification(self, user_id: str, title: str, message: str, type_: str = "info") -> Dict[str, Any]:
        row = {
            "id": str(uuid.uuid4()), "user_id": user_id, "title": title,
            "message": message, "type": type_, "is_read": False, "created_at": _now(),
        }
        with self.lock, self._conn() as c:
            c.execute(
                "INSERT INTO notifications (id,user_id,title,message,type,is_read,created_at) VALUES (?,?,?,?,?,?,?)",
                (row["id"], user_id, title, message, type_, 0, row["created_at"])
            )
        return row

    async def mark_notifications_read(self, user_id: str) -> bool:
        with self.lock, self._conn() as c:
            c.execute("UPDATE notifications SET is_read=1 WHERE user_id=? AND is_read=0", (user_id,))
        return True

    # ---------------- STATS ----------------
    async def revenue_stats(self) -> Dict[str, int]:
        with self.lock, self._conn() as c:
            total = c.execute(
                "SELECT COALESCE(SUM(amount),0) FROM purchases WHERE status IN ('approved','completed')"
            ).fetchone()[0]
            month_prefix = datetime.now(timezone.utc).strftime("%Y-%m")
            monthly = c.execute(
                "SELECT COALESCE(SUM(amount),0) FROM purchases WHERE status IN ('approved','completed') AND created_at LIKE ?",
                (f"{month_prefix}%",)
            ).fetchone()[0]
        return {"total_revenue": int(total), "monthly_revenue": int(monthly)}

    async def broadcast_recipients(self) -> List[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            rows = c.execute(
                "SELECT id, telegram_id, name FROM users WHERE telegram_id IS NOT NULL AND telegram_id != 0"
            ).fetchall()
            return [dict(r) for r in rows]

    # ---------------- APP SETTINGS ----------------
    async def get_setting(self, key: str) -> Optional[str]:
        with self.lock, self._conn() as c:
            row = c.execute("SELECT value FROM app_settings WHERE key=?", (key,)).fetchone()
            return row["value"] if row else None

    async def set_setting(self, key: str, value: str) -> bool:
        with self.lock, self._conn() as c:
            c.execute(
                """INSERT INTO app_settings (key, value, updated_at)
                   VALUES (?, ?, ?)
                   ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at""",
                (key, value, _now())
            )
        return True

    # ---------------- LESSONS ----------------
    def _lesson_row(self, r: Any) -> Dict[str, Any]:
        d = dict(r)
        d["is_preview"] = bool(d.get("is_preview"))
        d["published"] = bool(d.get("published", 1))
        d["order"] = d.get("order_index", 1)
        res_raw = d.get("resources")
        if isinstance(res_raw, str):
            try:
                d["resources"] = json.loads(res_raw)
            except Exception:
                d["resources"] = []
        elif res_raw is None:
            d["resources"] = []
        d["telegram_file_id"] = d.get("video_file_id")
        d["file_id"] = d.get("video_file_id")
        return d

    async def add_lesson(self, lesson: Dict[str, Any]) -> Dict[str, Any]:
        with self.lock, self._conn() as c:
            lesson_id = str(lesson.get("id") or "").strip()
            if not lesson_id:
                max_row = c.execute("SELECT MAX(CAST(id AS INTEGER)) FROM lessons").fetchone()
                max_id = (max_row[0] or 0) if max_row and max_row[0] is not None else 0
                lesson_id = str(max_id + 1)

            row = {
                "id": lesson_id,
                "course_id": lesson.get("course_id"),
                "module_id": lesson.get("module_id"),
                "title": lesson.get("title") or "Dars",
                "description": lesson.get("description"),
                "video_url": lesson.get("video_url"),
                "video_file_id": lesson.get("video_file_id") or lesson.get("telegram_file_id") or lesson.get("file_id"),
                "video_file_unique_id": lesson.get("video_file_unique_id"),
                "duration": str(lesson.get("duration") or ""),
                "duration_seconds": lesson.get("duration_seconds") or (lesson.get("duration") if isinstance(lesson.get("duration"), int) else None),
                "width": lesson.get("width"),
                "height": lesson.get("height"),
                "file_size": lesson.get("file_size"),
                "order_index": lesson.get("order") or lesson.get("order_index") or 1,
                "is_preview": 1 if lesson.get("is_preview") else 0,
                "resources": json.dumps(lesson.get("resources") or []),
                "created_by": lesson.get("created_by"),
                "published_message_id": lesson.get("published_message_id"),
                "published": 1 if lesson.get("published", True) else 0,
                "created_at": lesson.get("created_at") or _now(),
            }

            c.execute(
                """INSERT INTO lessons (id, course_id, module_id, title, description, video_url, video_file_id,
                   video_file_unique_id, duration, duration_seconds, width, height, file_size, order_index,
                   is_preview, resources, created_by, published_message_id, published, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(id) DO UPDATE SET
                   title=excluded.title, description=excluded.description, video_url=excluded.video_url,
                   video_file_id=excluded.video_file_id, video_file_unique_id=excluded.video_file_unique_id,
                   duration=excluded.duration, duration_seconds=excluded.duration_seconds,
                   width=excluded.width, height=excluded.height, file_size=excluded.file_size,
                   order_index=excluded.order_index, is_preview=excluded.is_preview,
                   resources=excluded.resources, published_message_id=excluded.published_message_id,
                   published=excluded.published""",
                (row["id"], row["course_id"], row["module_id"], row["title"], row["description"],
                 row["video_url"], row["video_file_id"], row["video_file_unique_id"], row["duration"],
                 row["duration_seconds"], row["width"], row["height"], row["file_size"], row["order_index"],
                 row["is_preview"], row["resources"], row["created_by"], row["published_message_id"],
                 row["published"], row["created_at"])
            )
            return self._lesson_row(row)

    async def get_lesson(self, lesson_id: Any) -> Optional[Dict[str, Any]]:
        lid = str(lesson_id)
        with self.lock, self._conn() as c:
            row = c.execute("SELECT * FROM lessons WHERE id=? OR id=?", (lid, lid.lstrip("0"))).fetchone()
            return self._lesson_row(row) if row else None

    async def list_lessons(self, course_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            if course_id:
                rows = c.execute("SELECT * FROM lessons WHERE course_id=? ORDER BY order_index ASC, created_at ASC", (course_id,)).fetchall()
            else:
                rows = c.execute("SELECT * FROM lessons ORDER BY order_index ASC, created_at ASC").fetchall()
            return [self._lesson_row(r) for r in rows]

    async def delete_lesson(self, lesson_id: Any) -> bool:
        lid = str(lesson_id)
        with self.lock, self._conn() as c:
            cur = c.execute("DELETE FROM lessons WHERE id=?", (lid,))
            return cur.rowcount > 0

    async def update_lesson(self, lesson_id: Any, fields: Dict[str, Any]) -> bool:
        lid = str(lesson_id)
        if not fields:
            return True
        cols = []
        vals = []
        for k, v in fields.items():
            if k == "order":
                cols.append("order_index = ?")
                vals.append(v)
            elif k == "resources" and not isinstance(v, str):
                cols.append("resources = ?")
                vals.append(json.dumps(v))
            elif k in ("video_file_id", "telegram_file_id", "file_id"):
                cols.append("video_file_id = ?")
                vals.append(v)
            else:
                cols.append(f'"{k}" = ?')
                vals.append(v)
        vals.append(lid)
        with self.lock, self._conn() as c:
            cur = c.execute(f"UPDATE lessons SET {', '.join(cols)} WHERE id=?", vals)
            return cur.rowcount > 0

    async def count_lessons(self, course_id: Optional[str] = None) -> int:
        with self.lock, self._conn() as c:
            if course_id:
                row = c.execute("SELECT COUNT(*) FROM lessons WHERE course_id=?", (course_id,)).fetchone()
            else:
                row = c.execute("SELECT COUNT(*) FROM lessons").fetchone()
            return row[0] if row else 0

    # ---------------- ACCESS LOGS ----------------
    async def log_access(self, access: Dict[str, Any]) -> Dict[str, Any]:
        with self.lock, self._conn() as c:
            c.execute(
                """INSERT INTO access_logs (lesson_id, user_id, username, first_name, client_callback_id, mode, opened_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (str(access.get("lesson_id") or ""), int(access.get("user_id") or 0),
                 access.get("username"), access.get("first_name"), access.get("client_callback_id"),
                 access.get("mode") or "ephemeral", access.get("opened_at") or _now())
            )
        return access

    async def get_recent_access_logs(self, limit: int = 10) -> List[Dict[str, Any]]:
        with self.lock, self._conn() as c:
            rows = c.execute("SELECT * FROM access_logs ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
            return [dict(r) for r in rows]

    async def count_access_logs(self) -> int:
        with self.lock, self._conn() as c:
            row = c.execute("SELECT COUNT(*) FROM access_logs").fetchone()
            return row[0] if row else 0

    # ---------------- USER PERMISSIONS ----------------
    async def block_user_lesson(self, user_id: int, lesson_id: Optional[Any] = None, reason: str = "") -> bool:
        lid = str(lesson_id) if lesson_id is not None else None
        with self.lock, self._conn() as c:
            c.execute(
                """INSERT INTO user_permissions (user_id, lesson_id, is_blocked, reason, created_at)
                   VALUES (?, ?, 1, ?, ?)
                   ON CONFLICT(user_id, lesson_id) DO UPDATE SET is_blocked=1, reason=excluded.reason""",
                (int(user_id), lid, reason, _now())
            )
        return True

    async def unblock_user_lesson(self, user_id: int, lesson_id: Optional[Any] = None) -> bool:
        lid = str(lesson_id) if lesson_id is not None else None
        with self.lock, self._conn() as c:
            if lid is None:
                c.execute("DELETE FROM user_permissions WHERE user_id=?", (int(user_id),))
            else:
                c.execute("DELETE FROM user_permissions WHERE user_id=? AND (lesson_id=? OR lesson_id IS NULL)", (int(user_id), lid))
        return True

    async def is_user_blocked_for_lesson(self, user_id: int, lesson_id: Optional[Any] = None) -> tuple[bool, str]:
        # 1. Global blocked list
        if await self.is_user_blocked(int(user_id)):
            return True, "Foydalanuvchi hisobi bloklangan"
        # 2. Per-lesson or per-user permissions table
        lid = str(lesson_id) if lesson_id is not None else None
        with self.lock, self._conn() as c:
            row = c.execute(
                "SELECT reason FROM user_permissions WHERE user_id=? AND is_blocked=1 AND (lesson_id IS NULL OR lesson_id=?)",
                (int(user_id), lid)
            ).fetchone()
            if row:
                return True, row["reason"] or "Administrator cheklovi"
        return False, ""
