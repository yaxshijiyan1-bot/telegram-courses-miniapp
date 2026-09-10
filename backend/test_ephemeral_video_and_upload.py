"""
Test suite for Ephemeral Protected Video Delivery and 1-Click Admin Video Uploading.
Verifies all integration points:
- Telegram Bot API ephemeral_message_parameters payload
- Admin video upload and 1-click lesson creation (auto suggested title & custom text title)
- 1-click group publishing and /set_group binding
- Student authorization checks (enrolled, unenrolled, preview, blocked)
- Telemetry access logging and rate limiting
- Mini App API endpoints for course lessons and direct video dispatch
"""
import asyncio
import os
import sys
import shutil
import unittest
from unittest.mock import AsyncMock, patch, MagicMock

# Ensure project root and backend are in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.config import settings
from app.storage.sqlite_store import SqliteStore
import app.storage as storage_mod
import bot_service

TEST_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "data_test_ephem"))


class TestEphemeralVideoAndUpload(unittest.IsolatedAsyncioTestCase):
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

        settings.ADMIN_IDS_RAW = "999001,999002"
        settings.TARGET_GROUP_ID = "-1009988776655"
        settings.PROTECT_CONTENT = True

        # Clean tables before each test
        with self.store.lock, self.store._conn() as c:
            for table in ["lessons", "access_logs", "user_permissions", "users", "courses", "enrollments", "purchases", "app_settings"]:
                try:
                    c.execute(f"DELETE FROM {table}")
                except Exception:
                    pass
            c.commit()

        # Seed a test course
        self.course = await self.store.upsert_course({
            "id": "c_ai_pro",
            "title": "Sun'iy Intellekt Pro",
            "slug": "ai-pro",
            "price": 300000,
            "category": "AI",
            "published": True,
            "modules": [
                {
                    "id": "m1",
                    "title": "01. Asoslar",
                    "order": 1,
                    "lessons": [
                        {
                            "id": "l_preview",
                            "title": "01-Dars: Kirish",
                            "duration": "10:00",
                            "is_preview": True,
                            "video_url": "tg-file:PREVIEW_FILE_ID_123",
                            "telegram_file_id": "PREVIEW_FILE_ID_123",
                        }
                    ]
                }
            ]
        })

        # Seed an enrolled student and an unenrolled student
        self.enrolled_user = await self.store.create_user({
            "telegram_id": 111001,
            "name": "Enrolled Student",
            "username": "student_enrolled",
            "role": "student"
        })
        await self.store.create_enrollment(self.enrolled_user["id"], self.course["id"])

        self.unenrolled_user = await self.store.create_user({
            "telegram_id": 222002,
            "name": "Unenrolled Student",
            "username": "student_unenrolled",
            "role": "student"
        })

        # Clear rate limit and pending caches
        bot_service._user_lesson_rate_limits.clear()
        bot_service._pending_admin_videos.clear()

    async def test_01_send_ephemeral_video_payload_structure(self):
        """send_ephemeral_video Telegram Bot API ga to'g'ri ephemeral_message_parameters yuborishini tekshirish"""
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"ok": True, "result": {"message_id": 777}}
        mock_client.post.return_value = mock_response

        res = await bot_service.send_ephemeral_video(
            client=mock_client,
            chat_id="-1009988776655",
            video_file_id="TG_FILE_VIDEO_ABC",
            caption="Test Dars",
            callback_user_id=111001,
            callback_query_id="query_abc_123",
            duration=120,
            width=1920,
            height=1080,
            protect_content=True,
        )

        self.assertTrue(res.get("ok"))
        mock_client.post.assert_called_once()
        call_args = mock_client.post.call_args
        endpoint = call_args[0][0]
        self.assertIn("sendVideo", endpoint)
        payload = call_args[1]["json"]

        self.assertEqual(payload["chat_id"], "-1009988776655")
        self.assertEqual(payload["video"], "TG_FILE_VIDEO_ABC")
        self.assertTrue(payload["protect_content"])
        self.assertTrue(payload["supports_streaming"])
        self.assertEqual(payload["duration"], 120)

        ephem = payload.get("ephemeral_message_parameters")
        self.assertIsNotNone(ephem)
        self.assertEqual(ephem["receiver_user_id"], 111001)
        self.assertEqual(ephem["callback_query_id"], "query_abc_123")
        self.assertFalse(ephem["replace_callback_query_message"])

    async def test_02_admin_video_upload_and_1click_save(self):
        """Admin privat chatda video yuborganida avtomatik nom taklif qilish va 1-bosishda saqlash"""
        admin_id = 999001
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"ok": True, "result": {"message_id": 101}}
        mock_client.post.return_value = mock_response

        # 1. Admin video yuboradi
        video_msg = {
            "message_id": 100,
            "from": {"id": admin_id, "first_name": "Admin"},
            "chat": {"id": admin_id, "type": "private"},
            "video": {
                "file_id": "ADMIN_VID_FILE_999",
                "file_unique_id": "uniq_999",
                "duration": 180,
                "file_size": 25 * 1024 * 1024,
                "width": 1920,
                "height": 1080,
            },
            "caption": "Python Asoslari Birinchi Qism"
        }

        handled = await bot_service._handle_admin_video_message(mock_client, video_msg, admin_id)
        self.assertTrue(handled)
        self.assertIn(admin_id, bot_service._pending_admin_videos)

        pending = bot_service._pending_admin_videos[admin_id]
        self.assertEqual(pending["file_id"], "ADMIN_VID_FILE_999")
        self.assertIn("Python Asoslari Birinchi Qism", pending["suggested_title"])

        # 2. Admin [✅ deb saqlash] tugmasini bosadi (admin:save_video)
        saved_lesson = await bot_service._save_pending_admin_video(mock_client, admin_id)
        self.assertIsNotNone(saved_lesson)
        self.assertNotIn(admin_id, bot_service._pending_admin_videos)
        self.assertEqual(saved_lesson["telegram_file_id"], "ADMIN_VID_FILE_999")
        self.assertEqual(saved_lesson["duration"], "03:00")

        # Bazada mavjudligini tekshirish
        db_lesson = await self.store.get_lesson(saved_lesson["id"])
        self.assertIsNotNone(db_lesson)
        self.assertEqual(db_lesson["telegram_file_id"], "ADMIN_VID_FILE_999")

        # Mini App kurs modullari sinxron yangilanganini tekshirish
        course = await self.store.get_course(self.course["id"])
        all_l_ids = [l["id"] for m in course.get("modules", []) for l in m.get("lessons", [])]
        self.assertIn(saved_lesson["id"], all_l_ids)

    async def test_03_admin_custom_title_text_save(self):
        """Admin video yuborgach, matn yozsa o'sha nom bilan dars saqlanishi"""
        admin_id = 999002
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"ok": True, "result": {"message_id": 102}}
        mock_client.post.return_value = mock_response

        # Video yuklash
        video_msg = {
            "message_id": 101,
            "from": {"id": admin_id, "first_name": "Admin 2"},
            "chat": {"id": admin_id, "type": "private"},
            "video": {
                "file_id": "CUSTOM_TITLE_VID_123",
                "duration": 300,
                "file_size": 15 * 1024 * 1024,
            }
        }
        await bot_service._handle_admin_video_message(mock_client, video_msg, admin_id)

        # Admin matn ko'rinishida nom yuboradi
        update = {
            "message": {
                "message_id": 102,
                "from": {"id": admin_id, "first_name": "Admin 2"},
                "chat": {"id": admin_id, "type": "private"},
                "text": "05-Dars. Neyrotarmoqlar bilan amaliyot"
            }
        }
        await bot_service.handle_tg_update(mock_client, update)

        # Saqlangan darsni tekshirish
        lessons = await self.store.list_lessons()
        custom_saved = next((l for l in lessons if l.get("telegram_file_id") == "CUSTOM_TITLE_VID_123"), None)
        self.assertIsNotNone(custom_saved)
        self.assertEqual(custom_saved["title"], "05-Dars. Neyrotarmoqlar bilan amaliyot")

    async def test_04_publish_lesson_to_group(self):
        """Darsni Target guruhga e'lon sifatida inline tugma bilan chiqarish"""
        lesson = await self.store.add_lesson({
            "title": "Mukammal Dars 1",
            "course_id": self.course["id"],
            "telegram_file_id": "PUB_VID_123",
            "duration": "15:00",
            "duration_seconds": 900
        })

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"ok": True, "result": {"message_id": 888}}
        mock_client.post.return_value = mock_response

        ok = await bot_service.publish_lesson_to_group(mock_client, lesson["id"], admin_chat_id=999001)
        self.assertTrue(ok)

        # Guruhga yuborilgan xabarni tekshirish
        calls = [c for c in mock_client.post.call_args_list if "-1009988776655" in str(c)]
        self.assertTrue(len(calls) > 0)
        group_call = calls[0]
        payload = group_call[1]["json"]
        self.assertIn("Mukammal Dars 1", payload.get("text") or payload.get("caption", ""))

        # Inline tugmani tekshirish: callback_data 'lesson:{id}'
        btn = payload["reply_markup"]["inline_keyboard"][0][0]
        self.assertEqual(btn["callback_data"], f"lesson:{lesson['id']}")
        self.assertIn("ko'rish", btn["text"])

    async def test_05_student_ephemeral_access_control(self):
        """Talabaning guruhda inline tugmani bosgandagi huquq va ruxsatlari:
        1. Xarid qilmagan talaba rad etiladi
        2. Xarid qilgan talabaga ephemeral video jo'natiladi
        3. Bloklangan talaba rad etiladi
        4. 5 soniya ichida qayta bosish rate limited qilinadi
        """
        lesson = await self.store.add_lesson({
            "title": "Xavfsiz Dars",
            "course_id": self.course["id"],
            "telegram_file_id": "SECURE_VID_777",
            "duration": "10:00",
            "is_preview": False
        })

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"ok": True, "result": {"message_id": 901}}
        mock_client.post.return_value = mock_response

        # 1. Unenrolled student bosadi -> Rad etiladi
        unenrolled_query = {
            "id": "q_unenrolled",
            "data": f"lesson:{lesson['id']}",
            "from": {"id": 222002, "first_name": "Unenrolled"},
            "message": {"chat": {"id": -1009988776655, "type": "supergroup"}}
        }
        await bot_service.handle_callback_query(mock_client, unenrolled_query)
        # answerCallbackQuery alert yuborilgan
        calls = [c for c in mock_client.post.call_args_list if "answerCallbackQuery" in str(c)]
        last_answer = calls[-1][1]["json"]
        self.assertEqual(last_answer["callback_query_id"], "q_unenrolled")
        self.assertTrue(any(w in last_answer.get("text", "") for w in ["kursga a'zo", "himoyalangan dars", "xarid"]))

        # 2. Enrolled student bosadi -> Talabaning shaxsiy chatiga himoyalangan video yuboriladi
        mock_client.reset_mock()
        mock_client.post.return_value = mock_response

        enrolled_query = {
            "id": "q_enrolled_1",
            "data": f"lesson:{lesson['id']}",
            "from": {"id": 111001, "first_name": "Enrolled", "username": "enrolled_user"},
            "message": {"chat": {"id": -1009988776655, "type": "supergroup"}}
        }
        await bot_service.handle_callback_query(mock_client, enrolled_query)

        # sendVideo chaqirilganini tekshirish (faqat talabaning shaxsiy chatiga - 111001!)
        video_calls = [c for c in mock_client.post.call_args_list if "sendVideo" in str(c)]
        self.assertEqual(len(video_calls), 1)
        v_payload = video_calls[0][1]["json"]
        self.assertEqual(v_payload["chat_id"], 111001)
        self.assertEqual(v_payload["video"], "SECURE_VID_777")
        self.assertTrue(v_payload["protect_content"])

        # Telemetriya log yozilganini tekshirish
        logs = await self.store.get_recent_access_logs(limit=10)
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0]["user_id"], 111001)
        self.assertEqual(logs[0]["lesson_id"], str(lesson["id"]))

        # 3. Rate limiting tekshirish (darhol yana bosish)
        mock_client.reset_mock()
        mock_client.post.return_value = mock_response
        await bot_service.handle_callback_query(mock_client, enrolled_query)
        rl_calls = [c for c in mock_client.post.call_args_list if "answerCallbackQuery" in str(c)]
        self.assertIn("biroz kuting", rl_calls[-1][1]["json"]["text"])

        # 4. Bloklangan talaba tekshirish
        bot_service._user_lesson_rate_limits.clear()
        await self.store.block_user_lesson(111001, lesson["id"], reason="Qoidabuzarlik")
        mock_client.reset_mock()
        mock_client.post.return_value = mock_response

        await bot_service.handle_callback_query(mock_client, enrolled_query)
        blocked_calls = [c for c in mock_client.post.call_args_list if "answerCallbackQuery" in str(c)]
        self.assertIn("cheklangan", blocked_calls[-1][1]["json"]["text"])

    async def test_06_set_group_command_handling(self):
        """Guruh ichida yoki privat chatda /set_group buyrug'i ishlashi"""
        admin_id = 999001
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"ok": True, "result": {"message_id": 555}}
        mock_client.post.return_value = mock_response

        # Guruh ichida /set_group
        group_update = {
            "message": {
                "message_id": 201,
                "from": {"id": admin_id, "first_name": "Admin"},
                "chat": {"id": -1001122334455, "title": "Maxsus Kurs Superguruhi", "type": "supergroup"},
                "text": "/set_group"
            }
        }
        await bot_service.handle_tg_update(mock_client, group_update)

        # Bazadagi target_group_id o'zgarganini tekshirish
        saved_gid = await self.store.get_setting("target_group_id")
        saved_title = await self.store.get_setting("target_group_title")
        self.assertEqual(saved_gid, "-1001122334455")
        self.assertEqual(saved_title, "Maxsus Kurs Superguruhi")

    async def test_07_student_api_endpoints(self):
        """Mini App talaba API darslar va video jo'natish endpointlari"""
        from app.api.student import get_course_lessons, get_protected_lesson, send_lesson_video_to_telegram

        # Dars qo'shamiz
        lesson = await self.store.add_lesson({
            "title": "API Dars",
            "course_id": self.course["id"],
            "telegram_file_id": "API_TG_VID_999",
            "duration": "12:00",
            "is_preview": False
        })

        # 1. Kurs darslari ro'yxati (GET /api/student/courses/{cid}/lessons)
        user_ctx = {"sub": self.enrolled_user["id"], "telegram_id": 111001, "role": "student"}
        res = await get_course_lessons(self.course["id"], current_user=user_ctx)
        self.assertEqual(res["course_id"], self.course["id"])
        self.assertTrue(res["is_enrolled"])
        self.assertTrue(any(l["id"] == lesson["id"] for l in res["lessons"]))

        # 2. Dars tafsilotlari (GET /api/student/courses/{cid}/lessons/{lid})
        detail = await get_protected_lesson(self.course["id"], lesson["id"], current_user=user_ctx)
        self.assertEqual(detail["lesson"]["telegram_file_id"], "API_TG_VID_999")
        self.assertTrue(detail["lesson"]["is_telegram_video"])

        # 3. Talaba shaxsiy chatiga video yuborish (POST .../send-video)
        with patch("bot_service.send_tg_video", new_callable=AsyncMock) as mock_send_vid:
            mock_send_vid.return_value = {"ok": True, "result": {"message_id": 333}}
            send_res = await send_lesson_video_to_telegram(self.course["id"], lesson["id"], current_user=user_ctx)
            self.assertTrue(send_res["success"])
            mock_send_vid.assert_called_once()
            call_kwargs = mock_send_vid.call_args[1]
            self.assertEqual(call_kwargs["chat_id"], 111001)
            self.assertEqual(call_kwargs["video"], "API_TG_VID_999")


if __name__ == "__main__":
    unittest.main()
