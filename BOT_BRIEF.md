# BOT BRIEFI — "Kreativ AI" Telegram boti (@kreativaibot)

> Bu hujjat bot kodini qayta yozish/yaxshilash uchun tayyorlangan. Bot "Kreativ AI"
> kurslar platformasining Telegram tomoni — mini-app bilan birga ishlaydi.

---

## 1. Bot nima va qanday ishlaydi

**@kreativaibot** — kurslar platformasining Telegram boti. Vazifalari: foydalanuvchini kutib olish, kurs katalogini ko'rsatish, to'lov rekvizitlarini berish, to'lov cheklarini qabul qilish, adminlarga xabar berish va xaridorni yopiq dars kanaliga xavfsiz kiritish.

**Arxitektura (hozirgi):**
- Python, **FastAPI backend ichida** long-polling (aiogram YO'Q — sof `httpx` + Telegram Bot API)
- Bot FastAPI'ning lifespan'ida bitta event loop'da ishlaydi; alohida `bot.py` skript ham bor
- Ma'lumotlar bazasi: **Supabase** (asosiy) + SQLite fallback (`app/storage`)
- Rasmlar/cheklar: **Cloudflare R2**
- Barcha matnlar **o'zbek tilida**, `parse_mode: HTML`, har doim `protect_content: True`
- Maxfiy kalitlar faqat `.env`'dan (`BOT_TOKEN` va boshqalar) — hech qayerda hardcode qilinmaydi

## 2. Bot buyruqlari (setMyCommands bilan o'rnatilgan)

| Buyruq | Vazifa |
|---|---|
| `/start` | Kutib olish xabari (banner rasm + inline klaviatura: Mini App, Katalog, To'lov, Yordam; adminlarga + Admin Panel) |
| `/kurslar` (`/courses`) | Kurslar katalogi — karusel: rasmli kartochka, "⬅️ Oldingi / Keyingi ➡️", "💳 To'lov qilish", "🚀 Mini Appda batafsil" |
| `/tolov` (`/payment`) | To'lov rekvizitlari: bank, karta raqami (`<code>` — nusxalash uchun), qabul qiluvchi |
| `/help` (`/contact`) | Yordam markazi — adminlar kontakti: Yaxshi Bola (@yomonboIa), Zuhra Olimova (@sokin_notalar) |
| `/admin` (`/stats`) | Faqat superadminlar uchun statistika: jami tushum, oylik tushum, talabalar soni*, faol kurslar, kutilayotgan cheklar |

\* Talabalar soni bitta admin'ga (Zuhra Olimova, ID 8112688757) ko'rsatilmaydi — `STATS_STUDENTS_HIDDEN_IDS` sozlamasi.

## 3. To'lov oqimi (eng muhim qism)

1. Foydalanuvchi katalog'da **"💳 To'lov qilish"** bosadi (`pay:{course_id}` callback)
2. Bot kurs nomi, summa va karta rekvizitlarini ko'rsatadi + "Chek skrinshotini rasm ko'rinishida yuboring" deydi (qisqa FSM: `_checkout_sessions[telegram_id] = course_id`)
3. Foydalanuvchi **rasm** yuboradi → bot:
   - chekni Telegram'dan yuklab olib **R2'ga** saqlaydi (`receipts/{transaction_id}`)
   - `purchases` jadvida `pending_approval` buyurtma yaratadi (`transaction_id = rcp_...`)
   - barcha superadminlarga chekni **✅ Tasdiqlash / ❌ Rad etish** tugmalari bilan yuboradi
   - talabaga "Chek qabul qilindi" deydi
4. Admin tugmani bosadi (`approve_{id}` / `reject_{id}` callback):
   - **Tasdiqlash** → kurs ochiladi, talabaga **bir martalik, 72 soatlik join-request link** yuboriladi, xabar matni "TO'LOV TASDIQLANDI" ga tahrirlanadi
   - **Rad etish** → talabaga rad xabari boradi
5. Admin huquqi faqat `ADMIN_IDS` ro'yxatidagilarda tekshiriladi

## 4. Yopiq kanal himoyasi (purchases servisi)

- `approve_purchase` → xaridor uchun faqat unga tegishli, 72 soat amal qiladigan **creates_chat_invite_request_only** link yaratadi
- `handle_chat_join_request` → join request faqat **link va xaridor akkaunti mos kelsagina** tasdiqlanadi; tasdiqlangach link **darhol bekor qilinadi** (bir martalik — o'g'irlab bo'lmaydi)
- Ruxsat bo'lmasa → rad xabari + "Mini Appni ochish" tugmasi
- `issue_channel_access` → mini-app'dagi "Kanalga o'tish" tugmasi uchun: a'zo bo'lsa kanalni ochadigan ichki havola, aks holda yangi bir martalik link
- `my_chat_member` → bot yangi kanalga admin bo'lganda, kanal ID'sini superadminlarga yuboradi (kurs sozlamalariga `telegram_channel_id` sifatida kiritish uchun)

## 5. Muhim qoidalar va cheklovlar

- **Adminlar — teng huquqli ikki superadmin:** ID 8544023815 (Yaxshi Bola, @yomonboIa) va 8112688757 (Zuhra Olimova, @sokin_notalar)
- **Bloklangan foydalanuvchilar** bot bilan muloqot qila olmaydi (adminlar bundan mustasno) — `is_user_blocked` tekshiruvi har bir update'da
- Har bir xabar `protect_content: True` (kontentni ko'chirib bo'lmasligi uchun)
- R2 media `/api/media/{key}` orqali 307 redirect qaytaradi, Telegram `sendPhoto` redirect'ni kuzatmaydi → **presigned URL** ochiladi (`r2_client.resolve_stream_url`)
- Mini-app deep-linklari: `{WEBAPP_URL}#course_{id}` (kurs sahifasi), `{WEBAPP_URL}#admin` (admin panel)
- Bot chat menyu tugmasi (`setChatMenuButton`) → Mini App ochadi
- AI chat **olib tashlangan** — ixtiyoriy matnga katalog/to'lov/Mini App tugmalari bilan yo'naltiruvchi javob qaytadi
- Karta rekvizitlari: `.env` (`CARD_NUMBER`, `CARD_HOLDER`, `CARD_BANK`) yoki admin panel'dan saqlangan `payment_settings` (bazadan o'qiladi, `.env` — fallback)

## 6. env sozlamalari (nomlari)

```
BOT_TOKEN, BOT_USERNAME
ADMIN_IDS=8544023815,8112688757
STATS_STUDENTS_HIDDEN_IDS=8112688757
WEBAPP_URL=https://telegram-courses-miniapp2.pages.dev
API_PUBLIC_URL=https://kurslar-backend-api.onrender.com
WELCOME_BANNER_URL (bo'sh bo'lsa birinchi kurs cover'i ishlatiladi)
CARD_NUMBER, CARD_HOLDER, CARD_BANK
SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL, R2_ENDPOINT
```

## 7. VAZIFA

Bot kodini shu funksionallikni **to'liq saqlagan holda** qayta yozish/yaxshilash. Saqlanishi SHART:

- Yuqoridagi barcha buyruqlar va to'lov oqimi (chek qabul qilish → admin tasdig'i → bir martalik kanal linki)
- Join-request himoyasi (link-xaridor mosligi, bir martalik link, 72 soat)
- Bloklangan foydalanuvchi tekshiruvi, `protect_content`, HTML parse mode, o'zbek tili
- Mini-app deep-linklari (`#course_{id}`, `#admin`) va `setChatMenuButton`
- Mavjud storage (`app/storage`) va purchases (`app/services/purchases.py`) qatlami bilan integratsiya
- Maxfiy kalitlar faqat `.env`'dan; hech qanday token/key kodda yozilmaydi

Yaxshilash erkin: kod strukturasi, xatolarga chidamlilik, qayta urinishlar, logging, admin uchun qo'shimcha buyruqlar — lekin yuqoridagi biznes-logika buzilmasligi kerak.
