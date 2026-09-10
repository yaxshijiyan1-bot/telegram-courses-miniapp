import asyncio
import os
import sys
import shutil
import time
import unittest
from unittest.mock import AsyncMock, patch, MagicMock

# Ensure project root and backend are in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.config import settings
from app.storage.sqlite_store import SqliteStore
import app.storage as storage_mod
from bot_service import (
    flag_is_true,
    delivery_error_text,
    BoundedCooldown,
    require_lesson_access,
    LessonAccessDenied,
    _handle_admin_callback,
    _save_pending_admin_video,
    _pending_admin_videos,
    handle_tg_update,
    _start_checkout,
)

TEST_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "data_test_audit_fixes"))


class TestAuditSecurityFixes(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        os.makedirs(TEST_DATA_DIR, exist_ok=True)

    @classmethod
    def tearDownClass(cls):
        try:
            shutil.rmtree(TEST_DATA_DIR, ignore_errors=True)
        except Exception:
            pass

    async def asyncSetUp(self):
        self.store = SqliteStore(TEST_DATA_DIR)
        storage_mod._store = self.store
        _pending_admin_videos.clear()

        with self.store.lock, self.store._conn() as c:
            for table in ["lessons", "access_logs", "user_permissions", "users", "courses", "enrollments", "purchases", "app_settings"]:
                try:
                    c.execute(f"DELETE FROM {table}")
                except Exception:
                    pass
            c.commit()

    def test_h2_flag_is_true_strictness(self):
        """H2: Strict boolean checks without truthy string bypass."""
        self.assertTrue(flag_is_true(True))
        self.assertTrue(flag_is_true(1))
        self.assertTrue(flag_is_true("1"))
        self.assertTrue(flag_is_true("true"))
        self.assertTrue(flag_is_true("True"))

        self.assertFalse(flag_is_true(False))
        self.assertFalse(flag_is_true(0))
        self.assertFalse(flag_is_true("0"))
        self.assertFalse(flag_is_true("false"))
        self.assertFalse(flag_is_true("False"))
        self.assertFalse(flag_is_true(None))
        self.assertFalse(flag_is_true(""))
        self.assertFalse(flag_is_true([]))
        self.assertFalse(flag_is_true({}))

    async def test_h1_revoked_enrollment_does_not_resurrect(self):
        """H1: Revoked enrollment must fail even if approved purchase exists in history."""
        course = await self.store.upsert_course({
            "id": "c1",
            "slug": "python-pro",
            "title": "Python Pro",
            "price": 100000,
            "published": True,
        })
        lesson = await self.store.add_lesson({
            "course_id": "c1",
            "title": "Lesson 1",
            "published": True,
            "is_preview": False,
        })
        lesson_id = lesson["id"]

        user = await self.store.create_user({
            "telegram_id": 999111,
            "name": "Student",
            "role": "student",
        })

        await self.store.create_purchase({
            "id": "p1",
            "user_id": user["id"],
            "course_id": "c1",
            "amount": 100000,
            "status": "approved",
            "receipt_url": "test.jpg",
        })

        enrollment = await self.store.create_enrollment(user["id"], "c1")
        # Explicitly revoke enrollment
        with self.store.lock, self.store._conn() as c:
            c.execute("UPDATE enrollments SET status = 'revoked' WHERE id = ?", (enrollment["id"],))
            c.commit()

        # require_lesson_access should raise LessonAccessDenied because enrollment is revoked!
        with self.assertRaises(LessonAccessDenied) as ctx:
            await require_lesson_access(int(user["telegram_id"]), lesson_id)
        self.assertIn("faol ruxsat mavjud emas", str(ctx.exception).lower())

    async def test_h5_unpublished_course_and_lesson_denied(self):
        """H5: Unpublished course or lesson must be denied access."""
        course = await self.store.upsert_course({
            "id": "c_unpub",
            "slug": "c-unpub",
            "title": "Unpublished Course",
            "published": False,
        })
        lesson = await self.store.add_lesson({
            "course_id": "c_unpub",
            "title": "Unpublished Lesson",
            "published": True,
        })
        lesson_id = lesson["id"]
        user = await self.store.create_user({"telegram_id": 888222, "name": "Student 2", "role": "student"})
        await self.store.create_enrollment(user["id"], "c_unpub")

        with self.assertRaises(LessonAccessDenied) as ctx:
            await require_lesson_access(int(user["telegram_id"]), lesson_id)
        self.assertIn("kurs hali ochilmagan", str(ctx.exception).lower())

    def test_delivery_error_text_diagnostics(self):
        """Audit D: Granular Telegram error text mapping."""
        # 429
        txt_429 = delivery_error_text({"error_code": 429, "parameters": {"retry_after": 7}})
        self.assertIn("7 soniya", txt_429)

        # 403
        txt_403 = delivery_error_text({"error_code": 403, "description": "bot was blocked by the user"})
        self.assertIn("amalni taqiqladi", txt_403)

        # Expired query
        txt_exp = delivery_error_text({"description": "query is too old and response timeout expired"})
        self.assertIn("eskirgan", txt_exp)

        # Delivery unknown
        txt_unk = delivery_error_text({"delivery_unknown": True})
        self.assertIn("Telegram javobi olinmadi", txt_unk)

    def test_bounded_cooldown_monotonic(self):
        """Rate Limiter: Monotonic time based rate limiting."""
        limiter = BoundedCooldown(seconds=0.1, max_keys=3)
        self.assertTrue(limiter.take("u1"))
        self.assertFalse(limiter.take("u1"))  # Still in cooldown

        time.sleep(0.12)
        self.assertTrue(limiter.take("u1"))  # Cooldown passed

    async def test_e_admin_callback_session_verification(self):
        """Audit E: Admin callback must reject session-less or mismatched session_id."""
        client = AsyncMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json = MagicMock(return_value={"ok": True})
        client.post = AsyncMock(return_value=mock_resp)

        admin_id = 999001
        settings.ADMIN_IDS_RAW = str(admin_id)

        _pending_admin_videos[admin_id] = {
            "session_id": "sess_valid_123",
            "video_file_id": "vid_123",
            "suggested_title": "Test Title",
        }

        # 1. Mismatched session
        cb_query_mismatch = {
            "id": "q1",
            "from": {"id": admin_id},
            "data": "admin:save_video:sess_wrong",
            "message": {"message_id": 10},
        }
        res1 = await _handle_admin_callback(client, cb_query_mismatch)
        self.assertTrue(res1)
        # Verify it did not pop or save the video
        self.assertIn(admin_id, _pending_admin_videos)

        # 2. Matching session
        cb_query_match = {
            "id": "q2",
            "from": {"id": admin_id},
            "data": "admin:save_video:sess_valid_123",
            "message": {"message_id": 10},
        }
        res2 = await _handle_admin_callback(client, cb_query_match)
        self.assertTrue(res2)
        self.assertNotIn(admin_id, _pending_admin_videos)

    async def test_f_group_checkout_redirects_to_private(self):
        """Audit F: Group checkout redirect to private chat with start payload."""
        client = AsyncMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json = MagicMock(return_value={"ok": True})
        client.post = AsyncMock(return_value=mock_resp)
        user = {"id": "u3", "telegram_id": 777333}

        # Negative chat_id represents group/supergroup
        group_chat_id = -1001234567890
        await _start_checkout(client, group_chat_id, user, "c1")

        # Must have sent a message warning that payments are only allowed in private chat
        self.assertTrue(client.post.called)


if __name__ == "__main__":
    unittest.main()
