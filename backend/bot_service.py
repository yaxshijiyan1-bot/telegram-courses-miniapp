import asyncio
import logging
import httpx
from app.core.config import settings
from app.services.purchases import approve_purchase, reject_purchase

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

    if data.startswith("approve_") or data.startswith("reject_"):
        order_id = data.replace("approve_", "").replace("reject_", "")
        is_approve = data.startswith("approve_")

        if is_approve:
            ok, result_msg = await approve_purchase(order_id, admin_name)
        else:
            ok, result_msg = await reject_purchase(order_id, admin_name)

        await client.post(f"{API_URL}/answerCallbackQuery", json={
            "callback_query_id": query_id,
            "text": f"{'✅' if is_approve else '❌'} {result_msg}" if ok else f"⚠️ {result_msg}"
        })

        if not ok:
            return

        # Admindagi xabarni yangilash
        updated_text = (
            f"{message.get('text', message.get('caption', ''))}\n\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"{'✅ <b>TO\'LOV TASDIQLANDI!</b>' if is_approve else '❌ <b>TO\'LOV RAD ETILDI!</b>'}\n"
            f"👤 <b>Admin:</b> {admin_name}\n"
            + ("🎓 <b>Holati:</b> Talabaga kurs ochildi va botdan xushxabar yuborildi." if is_approve else "📩 <b>Holati:</b> Talaba rad etilganlik haqida xabardor qilindi.")
        )

        try:
            if message.get("caption") is not None:
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

    elif text in ["/help", "/contact", "Admin bilan bog'lanish", "Yordam", "Bog'lanish"]:
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

    async with httpx.AsyncClient(timeout=35.0) as client:
        try:
            await client.post(f"{API_URL}/setMyCommands", json={
                "commands": [
                    {"command": "start", "description": "Platformani ishga tushirish"},
                    {"command": "help", "description": "Admin bilan bog'lanish"},
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

        # Polling loop (long polling, timeout=25)
        while True:
            try:
                res = await client.get(f"{API_URL}/getUpdates", params={"offset": offset, "timeout": 25})
                if res.status_code == 200:
                    data = res.json()
                    for item in data.get("result", []):
                        offset = item["update_id"] + 1
                        try:
                            await handle_tg_update(client, item)
                        except Exception as e:
                            logger.error(f"Update handling error: {e}")
                elif res.status_code == 409:
                    logger.warning("getUpdates 409: boshqa polling instansiyasi bor (eski deploy o'chishi kutilmoqda)...")
                    await asyncio.sleep(10)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Telegram polling error: {e}")
                await asyncio.sleep(3)
