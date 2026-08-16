"""
Mustaqil bot skripti (kerak bo'lsa alohida ishga tushirish uchun).
Asosiy bot logikasi bot_service.py'da — maxfiy kalitlar faqat .env'dan o'qiladi.
Ishga tushirish: python bot.py
"""
import asyncio
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

if __name__ == "__main__":
    from bot_service import start_telegram_bot_polling
    from app.storage import init_store
    from app.core.config import settings

    if not settings.BOT_TOKEN:
        print("BOT_TOKEN .env'da sozlanmagan!")
    else:
        asyncio.run(init_store())
        asyncio.run(start_telegram_bot_polling())
