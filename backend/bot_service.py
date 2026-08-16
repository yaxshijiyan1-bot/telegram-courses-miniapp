import asyncio
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

API_URL = f"https://api.telegram.org/bot{settings.BOT_TOKEN}"

async def send_tg_message(client: httpx.AsyncClient, chat_id: int, text: str, reply_markup: dict = None):
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    try:
        await client.post(f"{API_URL}/sendMessage", json=payload, timeout=10.0)
    except Exception as e:
        logger.error(f"Error sending message to {chat_id}: {e}")

async def handle_callback_query(client: httpx.AsyncClient, callback_query: dict):
    """Adminlar tomonidan to'lov chekini tasdiqlash yoki rad etish tugmasi bosilganda"""
    from app.api.checkout import PENDING_RECEIPTS

    query_id = callback_query.get("id")
    user_id = callback_query.get("from", {}).get("id")
    data = callback_query.get("data", "")
    message = callback_query.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    message_id = message.get("message_id")

    # Faqat ikkala Superadmin uchun ruxsat
    if user_id not in settings.ADMIN_IDS:
        await client.post(f"{API_URL}/answerCallbackQuery", json={
            "callback_query_id": query_id,
            "text": "❌ Sizda admin huquqlari yo'q!",
            "show_alert": True
        })
        return

    admin_name = "Yaxshi Bola" if user_id == 8544023815 else "Zuhra Olimova"

    if data.startswith("approve_"):
        order_id = data.replace("approve_", "")
        receipt = PENDING_RECEIPTS.get(order_id)
        
        student_tg_id = receipt.get("telegram_id") if receipt else None
        course_title = receipt.get("course_title", "Kurs") if receipt else "Kurs"

        # Callback javobi
        await client.post(f"{API_URL}/answerCallbackQuery", json={
            "callback_query_id": query_id,
            "text": f"✅ To'lov tasdiqlandi! ({admin_name})"
        })

        # Admindagi xabarni yangilash
        updated_text = (
            f"{message.get('text', message.get('caption', ''))}\n\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"✅ <b>TO'LOV TASDIQLANDI!</b>\n"
            f"👤 <b>Tasdiqlagan Admin:</b> {admin_name}\n"
            f"🎓 <b>Holati:</b> Talabaga kurs ochildi va botdan xushxabar yuborildi."
        )

        try:
            if "caption" in message:
                await client.post(f"{API_URL}/editMessageCaption", json={
                    "chat_id": chat_id,
                    "message_id": message_id,
                    "caption": updated_text,
                    "parse_mode": "HTML"
                })
            else:
                await client.post(f"{API_URL}/editMessageText", json={
                    "chat_id": chat_id,
                    "message_id": message_id,
                    "text": updated_text,
                    "parse_mode": "HTML"
                })
        except Exception:
            pass

        # Talabaga xushxabar yuborish
        if student_tg_id:
            congrats_text = (
                f"🎉 <b>Ajoyib Yangilik! To'lovingiz Tasdiqlandi!</b>\n\n"
                f"Hurmatli talaba, sizning <b>'{course_title}'</b> kursi uchun to'lovingiz adminlar tomonidan muvaffaqiyatli tasdiqlandi! 🎓\n\n"
                f"Kurs materiallari va barcha darslar profilingizda to'liq ochildi.\n"
                f"Hoziroq o'rganishni boshlashingiz mumkin 👇"
            )
            congrats_keyboard = {
                "inline_keyboard": [
                    [
                        {
                            "text": "🚀 Kursni Boshlash (Mini App)",
                            "web_app": {"url": settings.WEBAPP_URL}
                        }
                    ],
                    [
                        {
                            "text": "💬 Savol yoki Yordam",
                            "url": "https://t.me/yomonboia"
                        }
                    ]
                ]
            }
            await send_tg_message(client, student_tg_id, congrats_text, congrats_keyboard)

        if receipt:
            receipt["status"] = "approved"

    elif data.startswith("reject_"):
        order_id = data.replace("reject_", "")
        receipt = PENDING_RECEIPTS.get(order_id)
        student_tg_id = receipt.get("telegram_id") if receipt else None

        await client.post(f"{API_URL}/answerCallbackQuery", json={
            "callback_query_id": query_id,
            "text": f"❌ To'lov rad etildi! ({admin_name})"
        })

        updated_text = (
            f"{message.get('text', message.get('caption', ''))}\n\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"❌ <b>TO'LOV RAD ETILDI!</b>\n"
            f"👤 <b>Rad etgan Admin:</b> {admin_name}"
        )

        try:
            if "caption" in message:
                await client.post(f"{API_URL}/editMessageCaption", json={
                    "chat_id": chat_id,
                    "message_id": message_id,
                    "caption": updated_text,
                    "parse_mode": "HTML"
                })
            else:
                await client.post(f"{API_URL}/editMessageText", json={
                    "chat_id": chat_id,
                    "message_id": message_id,
                    "text": updated_text,
                    "parse_mode": "HTML"
                })
        except Exception:
            pass

        if student_tg_id:
            reject_text = (
                f"⚠️ <b>To'lov chekingiz tasdiqlanmadi</b>\n\n"
                f"Yuborgan to'lov chekingiz tekshiruvdan o'tmadi yoki xato yuborilgan.\n\n"
                f"Iltimos, qayta to'lov qiling yoki yordam uchun adminlarga yozing:\n"
                f"👤 @yomonboia (Yaxshi Bola)\n"
                f"👤 @sokin_notalar (Zuhra Olimova)"
            )
            await send_tg_message(client, student_tg_id, reject_text)

        if receipt:
            receipt["status"] = "rejected"

async def handle_tg_update(client: httpx.AsyncClient, update: dict):
    if "callback_query" in update:
        await handle_callback_query(client, update["callback_query"])
        return

    message = update.get("message")
    if not message:
        return

    chat_id = message.get("chat", {}).get("id")
    user_id = message.get("from", {}).get("id")
    text = message.get("text", "")
    first_name = message.get("from", {}).get("first_name", "Do'stim")

    is_admin = user_id in settings.ADMIN_IDS
    webapp_url = settings.WEBAPP_URL

    if text.startswith("/start"):
        admin_greeting = ""
        if user_id == 8544023815:
            admin_greeting = "\n\n👑 <b>Xush kelibsiz, Yaxshi Bola!</b> Sizda to'liq Superadmin huquqlari faol."
        elif user_id == 8112688757:
            admin_greeting = "\n\n👑 <b>Xush kelibsiz, Zuhra Olimova!</b> Sizda to'liq Superadmin huquqlari faol."

        welcome_text = (
            f"Assalomu alaykum, <b>{first_name}</b>! 🎓\n\n"
            f"<b>Premium Kurslar Platformasiga</b> xush kelibsiz!\n\n"
            f"Bu yerda siz Sun'iy Intellekt (AI), Dizayn, Telegram Fullstack dasturlash va Marketing "
            f"bo'yicha eng sara amaliy kurslarni o'rganishingiz mumkin.{admin_greeting}\n\n"
            f"O'rganishni boshlash uchun quyidagi tugmani bosing 👇"
        )

        keyboard = {
            "inline_keyboard": [
                [
                    {
                        "text": "🚀 Platformani ochish (Mini App)",
                        "web_app": {"url": webapp_url}
                    }
                ],
                [
                    {
                        "text": "📚 Kurslar Katalogi",
                        "web_app": {"url": f"{webapp_url}#courses"}
                    }
                ],
                [
                    {
                        "text": "🙋‍♂️ Yigitlar uchun (Yaxshi Bola)",
                        "url": "https://t.me/yomonboia"
                    },
                    {
                        "text": "🙋‍♀️ Qizlar uchun (Zuhra Olimova)",
                        "url": "https://t.me/sokin_notalar"
                    }
                ]
            ]
        }

        if is_admin:
            keyboard["inline_keyboard"].append([
                {
                    "text": "⚙️ Superadmin Dashboard",
                    "web_app": {"url": f"{webapp_url}#admin"}
                }
            ])

        await send_tg_message(client, chat_id, welcome_text, keyboard)

    elif text in ["/help", "/contact", "/admin_boglanish", "Admin bilan bog'lanish", "Yordam", "Bog'lanish"]:
        contact_text = (
            f"🤝 <b>Admin bilan bog'lanish markazi</b>\n\n"
            f"Savollar, to'lovlar yoki takliflar bo'yicha quyidagi bo'limlardan birini tanlang:\n\n"
            f"🙋‍♂️ <b>Yigitlar (O'g'il bolalar) uchun:</b>\n"
            f"👤 Ustoz: <b>Yaxshi Bola</b>\n"
            f"👉 Lichka: @yomonboia\n\n"
            f"🙋‍♀️ <b>Qizlar (Ayollar) uchun:</b>\n"
            f"👤 Ustoz: <b>Zuhra Olimova</b>\n"
            f"👉 Lichka: @sokin_notalar"
        )

        contact_keyboard = {
            "inline_keyboard": [
                [
                    {
                        "text": "🙋‍♂️ Yigitlar uchun (Yaxshi Bola)",
                        "url": "https://t.me/yomonboia"
                    }
                ],
                [
                    {
                        "text": "🙋‍♀️ Qizlar uchun (Zuhra Olimova)",
                        "url": "https://t.me/sokin_notalar"
                    }
                ],
                [
                    {
                        "text": "🚀 Mini Appni ochish",
                        "web_app": {"url": webapp_url}
                    }
                ]
            ]
        }
        await send_tg_message(client, chat_id, contact_text, contact_keyboard)

    elif text.startswith("/admin"):
        if not is_admin:
            await send_tg_message(client, chat_id, "❌ Kechirasiz, ushbu bo'lim faqat Administratorlar uchun.")
            return

        admin_name = "Yaxshi Bola" if user_id == 8544023815 else "Zuhra Olimova"
        admin_text = (
            f"👑 <b>Admin Boshqaruv Markazi</b>\n\n"
            f"Assalomu alaykum, <b>{admin_name}</b>!\n"
            f"Sizda platformaning barcha kurslari, talabalari, tushumlari va to'lov cheklarini tasdiqlash "
            f"bo'yicha to'liq Superadmin imkoniyatlari mavjud.\n\n"
            f"Boshqaruv panelini ochish uchun tugmani bosing 👇"
        )

        admin_keyboard = {
            "inline_keyboard": [
                [
                    {
                        "text": "📊 Admin Dashboardni Ochish",
                        "web_app": {"url": f"{webapp_url}#admin"}
                    }
                ]
            ]
        }
        await send_tg_message(client, chat_id, admin_text, admin_keyboard)

async def start_telegram_bot_polling():
    """FastAPI orqasida 24/7 avtomatik ishlovchi Telegram Bot polling xizmati"""
    if not settings.BOT_TOKEN:
        logger.warning("BOT_TOKEN is not set, skipping Telegram Bot polling.")
        return

    logger.info("Starting Telegram Bot Polling service for @kurslarimizbot...")
    offset = 0

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            await client.post(f"{API_URL}/setMyCommands", json={
                "commands": [
                    {"command": "start", "description": "Platformani ishga tushirish"},
                    {"command": "kurslar", "description": "Barcha kurslar katalogi"},
                    {"command": "admin", "description": "Admin boshqaruv paneli"}
                ]
            })
            await client.post(f"{API_URL}/setChatMenuButton", json={
                "menu_button": {
                    "type": "web_app",
                    "text": "🎓 Platformani ochish",
                    "web_app": {"url": settings.WEBAPP_URL}
                }
            })
        except Exception as e:
            logger.error(f"Error setting bot settings: {e}")

        # Polling loop
        while True:
            try:
                res = await client.get(f"{API_URL}/getUpdates", params={"offset": offset, "timeout": 20})
                if res.status_code == 200:
                    data = res.json()
                    for item in data.get("result", []):
                        offset = item["update_id"] + 1
                        await handle_tg_update(client, item)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Telegram polling error: {e}")
                await asyncio.sleep(3)
