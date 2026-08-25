# Telegram Mini App — Premium Kurslar Platformasi 🎓

Telegram ekotizimi uchun maxsus ishlab chiqilgan, hashamatli **Emerald + Cream + Champagne Gold** dizaynidagi to'liq ta'lim va kurslar sotuv platformasi.

---

## 🌟 Asosiy Imkoniyatlar

1. **Telegram-Native Dizayn & UX:** Haptic feedback, Telegram WebApp SDK, BackButton, Safe Area insets, 320px–430px mobil + desktop ramka.
2. **To'liq Xavfsiz Auth:** Qat'iy HMAC-SHA256 initData tekshiruvi, JWT tokenlar, adminlar uchun qo'shimcha parol bilan to'g'ridan-to'g'ri kirish, rate-limit.
3. **Real To'lov Oqimi:** Talaba chek yuboradi → rasm Cloudflare R2 ga yuklanadi → bazaga yoziladi → adminlarga Telegram orqali bildirishnoma → admin tasdiqlaydi (bot tugmasi yoki admin panel) → kurs avtomatik ochiladi → talabaga xushxabar.
4. **Talaba Kabineti:** Real progress tracking, darslarni tugallash, avtomatik sertifikat berish, ichki bildirishnomalar.
5. **Professional Admin Panel:** Jonli statistika (tushum, talabalar), cheklarni tasdiqlash/rad etish, talabalar CRM, grant kurs berish, kurs CRUD (yaratish/tahrirlash/o'chirish), ommaviy broadcast.
6. **Avtomatik Storage:** Supabase jadvallari mavjud bo'lsa — PostgREST orqali ishlaydi; bo'lmasa — o'rnatilgan SQLite fallback (nol konfiguratsiya) + avtomatik kurslar seed.

---

## 🛠 Texnologik Stack

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, generative-loaders.
* **Backend:** FastAPI (Python), Uvicorn, PyJWT (python-jose), httpx, boto3.
* **Ma'lumotlar Bazasi:** Supabase (PostgreSQL, PostgREST) yoki o'rnatilgan SQLite fallback.
* **Media:** Cloudflare R2 (presigned GET/PUT, server-side upload, zero egress).
* **Bot:** FastAPI lifespan ichida 24/7 long-polling (callback tasdiqlash tugmalari bilan).
* **Hosting:** Render.com (Backend) + Vercel (Frontend).

---

## 🚀 Ishga Tushirish (Lokal)

### 1. Backend
```bash
cd backend
cp .env.example .env        # kalitlarni to'ldiring
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Swagger: `http://localhost:8000/docs`

> **MUHIM:** Production uchun Supabase SQL Editor'da `backend/schema.sql` to'liq ishga tushirilishi kerak. Jadvallar bo'lmasa backend avtomatik SQLite fallback'ga o'tadi (`/health` da `storage` maydonida ko'rinadi) — bu ishlaydi, lekin Render qayta deploy bo'lganda SQLite fayli yangilanadi.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

### 3. Testlar
```bash
python test_suite.py                        # productionga qarshi
python test_suite.py http://localhost:8000  # lokalga qarshi
cd backend && python smoke_test.py          # to'liq biznes oqimi (lokal server kerak)
```

### 4. Yopiq dars kanallarini ulash

1. Botni yopiq kanalga administrator qilib qo'shing va unga **Invite Users via Link** huquqini bering.
2. Bot superadminlarga kanalning manfiy ID raqamini yuboradi (masalan, `-1001234567890`).
3. Admin panel → **Kurslar** → kursni tahrirlash bo'limida bu qiymatni **Yopiq kanal ID** maydoniga saqlang.
4. Chek tasdiqlanganda bot xaridorga 72 soatlik join-request havolasini yuboradi. So'rov faqat aynan xaridorning Telegram ID si va shu invite-link mos bo'lsa avtomatik qabul qilinadi; havola ulashilgan begona akkaunt rad etiladi.

Ixtiyoriy ravishda `.env` ichida `WELCOME_BANNER_URL`, `PAYME_PAYMENT_URL`, `CLICK_PAYMENT_URL` va `UZUM_PAYMENT_URL` ni bering. To'lov havolalari bo'sh qolsa, foydalanuvchi karta rekvizitlari orqali to'laydi.

---

## 🔐 Xavfsizlik Qoidalari

* Barcha maxfiy kalitlar **faqat** `.env` da (`.gitignore` himoyasida).
* Telegram initData **har doim** HMAC-SHA256 bilan tekshiriladi (BOT_TOKEN bo'lmasa dev-rejim).
* `/auth/login` — faqat adminlar, parol `.env` dan (`ADMIN_1_PASSWORD`, `ADMIN_2_PASSWORD`); parol bo'lmasa butunlay o'chiq.
* Himoyalangan darslar faqat xaridorga (enrollment tekshiruvi server tomonda).
* Kurs admin tasdiqlamasidan hech kimga ochilmaydi.
* CORS faqat ishonchli domenlar ro'yxatiga ochiq.
* Auth va chek yuborishga IP-rate-limit qo'llanilgan.
