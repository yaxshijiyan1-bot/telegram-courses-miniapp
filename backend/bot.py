import logging
import asyncio
import os
import requests
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "8876379472:AAGHgR0wyJlKGHfT8rvMyB_rulh7bby7zXA")
ADMIN_IDS = [8544023815, 8112688757]
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://kurslarimiz-platforma.vercel.app")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

def send_message(chat_id: int, text: str, reply_markup: dict = None):
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    try:
        res = requests.post(f"{API_URL}/sendMessage", json=payload, timeout=10)
        return res.json()
    except Exception as e:
        logger.error(f"Error sending message to {chat_id}: {e}")
        return None

def set_bot_commands():
    commands = [
        {"command": "start", "description": "Platformani ishga tushirish"},
        {"command": "kurslar", "description": "Barcha kurslar katalogi"},
        {"command": "admin", "description": "Admin boshqaruv paneli"}
    ]
    try:
        requests.post(f"{API_URL}/setMyCommands", json={"commands": commands})
    except Exception:
        pass

def handle_update(update: dict):
    message = update.get("message")
    if not message:
        return

    chat_id = message.get("chat", {}).get("id")
    user_id = message.get("from", {}).get("id")
    text = message.get("text", "")
    first_name = message.get("from", {}).get("first_name", "Do'stim")

    is_admin = user_id in ADMIN_IDS

    if text == "/start":
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
                        "web_app": {"url": WEBAPP_URL}
                    }
                ],
                [
                    {
                        "text": "📚 Kurslar Katalogi",
                        "web_app": {"url": f"{WEBAPP_URL}#courses"}
                    }
                ]
            ]
        }

        if is_admin:
            keyboard["inline_keyboard"].append([
                {
                    "text": "⚙️ Admin Dashboard",
                    "web_app": {"url": f"{WEBAPP_URL}#admin"}
                }
            ])

        send_message(chat_id, welcome_text, keyboard)

    elif text == "/admin":
        if not is_admin:
            send_message(chat_id, "❌ Kechirasiz, ushbu bo'lim faqat Administratorlar uchun.")
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
                        "web_app": {"url": f"{WEBAPP_URL}#admin"}
                    }
                ]
            ]
        }
        send_message(chat_id, admin_text, admin_keyboard)

def main():
    logger.info("Starting @kurslarimizbot polling service...")
    set_bot_commands()
    offset = 0

    while True:
        try:
            res = requests.get(f"{API_URL}/getUpdates", params={"offset": offset, "timeout": 20}, timeout=25)
            if res.status_code == 200:
                data = res.json()
                for item in data.get("result", []):
                    offset = item["update_id"] + 1
                    handle_update(item)
        except Exception as e:
            logger.error(f"Polling loop error: {e}")
            asyncio.run(asyncio.sleep(3))

if __name__ == "__main__":
    main()
