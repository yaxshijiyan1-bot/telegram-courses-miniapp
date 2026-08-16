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

async def handle_tg_update(client: httpx.AsyncClient, update: dict):
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

    elif text.startswith("/admin"):
        if not is_admin:
            await send_tg_message(client, chat_id, "❌ Kechirasiz, ushbu bo'lim faqat Administratorlar uchun.")
            return

        admin_name = "Yaxshi Bola" if user_id == 8544023815 else "Zuhra Olimova"
        admin_text = (
            f"👑 <b>Admin Boshqaruv Markazi</b>\n\n"
            f"Assalomu alaykum, <b>{admin_name}</b>!\n"
            f"Sizda platformaning barcha kurslari, foydalanuvchilari va tushumlarini boshqarish bo'yicha "
            f"to'liq Superadmin imkoniyatlari mavjud.\n\n"
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
        # Commands & Menu button sozlash
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
