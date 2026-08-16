# Telegram Mini App — Premium Kurslar Platformasi 🎓

Telegram ekotizimi uchun maxsus ishlab chiqilgan, hashamatli **Emerald + Cream + Champagne Gold** dizaynidagi to'liq ta'lim va kurslar sotuv platformasi.

---

## 🌟 Asosiy Imkoniyatlar

1. **Telegram-Native Dizayn & UX:**
   - Haptic feedback (tebranish effektlari), Telegram WebApp SDK, BackButton, Safe Area insets.
   - 320px–430px barcha smartfonlar, planshetlar va desktop brauzerlar uchun mos markaziy ramka (Desktop Shell).
2. **Hashamatli Dizayn Tizimi:**
   - Primary Emerald (`#159A6B`), Deep Emerald (`#0D6B4E`), Forest (`#103F32`), Cream (`#FBF8F1`), Champagne Gold (`#C9A96B`).
   - Editorial tipografiya: Playfair Display + Inter fontlari.
3. **To'liq Foydalanuvchi Oqimi:**
   - **Splash / Intro:** Brend kirish ekrani va animatsion CTA.
   - **Bosh sahifa:** Shaxsiylashtirilgan salomlashish, qidiruv, yo'nalishlar (AI, Dizayn, Dasturlash, Marketing), tavsiya etilgan Masterclass va mashhur kurslar.
   - **Katalog:** Jonli qidiruv, toifalar filtrlari, arzonroq/qimmatroq saralash.
   - **Kurs Tafsilotlari:** Video preview, narx bloki, "Bu kursda nimalarni o'rganasiz?" 01-05 kartochkalari, darslar dasturi (modullar va preview darslar), spiker info, FAQ va pastki yopishqoq xarid CTA.
   - **Checkout & To'lov:** Payme, Click, Uzum, Telegram Stars integratsiyasi.
   - **Xarid Muvaffaqiyati:** Emerald checkmark, oltin zarrachalar (confetti) va to'g'ridan-to'g'ri darsga yo'naltirish.
   - **Talaba Kabineti (Dashboard):** "Davom ettirish" faol dars kartochkasi, 68% li Circular Progress Ring, Mening kurslarim ro'yxati.
   - **O'quv Xonasi & Video Player:** Mobil video player (tezlik, timeline, fullscreen), Dars haqida va yuklab olinadigan PDF materiallar, "Darsni tugallangan deb belgilash" va oldingi/keyingi darsga o'tish.
   - **Profil, Sertifikatlar va Bildirishnomalar:** Raqamli QR sertifikatlar, bildirishnomalar va xavfsiz chiqish.

---

## 🛠 Texnologik Stack

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Canvas Confetti.
* **Backend:** FastAPI (Python), Uvicorn, Pydantic, PyJWT.
* **Ma'lumotlar Bazasi:** Supabase (PostgreSQL, RLS).
* **Media & Video Saqlash:** Cloudflare R2 (S3-compatible bucket, presigned streaming links).
* **Hosting:** Render.com (Backend) va Vercel / Cloudflare Pages (Frontend).

---

## 🚀 Ishga Tushirish

### 1. Frontendni ishga tushirish:
```bash
cd frontend
npm install
npm run dev
```
Brauzerda `http://localhost:3000` ochiladi.

### 2. Backendni ishga tushirish:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Swagger API hujjatlari: `http://localhost:8000/docs`
