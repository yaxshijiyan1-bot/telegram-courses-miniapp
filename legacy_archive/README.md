# Legacy & Archive Repository

Bu jildda loyihaning eski/dastlabki prototiplari, tadqiqot materiallari va arxivlangan fayllar joylashtirilgan.

---

## ⚠️ DIQQAT: Amaldagi Ishlab Turgan Versiya (Production Codebase)

Loyihaning amaldagi va ishlab turgan haqiqiy kodi quyidagi asosiy jildlarda joylashgan:
1. **`frontend/`**:
   - **Texnologiyalar**: React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion / Motion + Lucide React + TanStack Query + Zustand.
   - **Kirish nuqtasi**: `frontend/src/App.tsx`, `frontend/src/main.tsx`.
   - **Xizmatlar**: `frontend/src/services/api.ts` (FastAPI backend bilan integratsiya).
   - **Dizayn**: Crisp iOS 27 uslubidagi toza Light Theme, animatsiyalar, adaptive xavfsizlik (Security Shield).

2. **`backend/`**:
   - **Texnologiyalar**: Python FastAPI + Supabase / SQLite hybrid storage + Cloudflare R2 + Telegram Bot API (httpx polling).
   - **Kirish nuqtasi**: `backend/main.py`, `backend/bot_service.py`.
   - **API Modullari**: `backend/app/api/` (auth, courses, checkout, student, admin, ai, banners).

---

## Arxiv Tarkibi (`legacy_archive/`)

| Fayl / Jild | Tavsif |
| :--- | :--- |
| `_project2/` | Eng birinchi, bitta faylli React JSX maketi (`all-pages.jsx`, mock data bilan). Hozirgi TypeScript arxitekturasi bilan almashtirilgan. |
| `project.zip`, `project (2).zip` | Oldingi versiyalarning to'liq zip nusxalari. |
| `extracted_materials/` | AI bepul texnologiyalar tadqiqoti va API hujjatlari. |
| `Bajar Ishlan Top Maksimal Darajada.zip` | Dastlabki tadqiqot materiallari arxivi. |
| `Organizing Skills for Modern Mini App Technology Stack.zip` | Agent va skill arxivi. |
| `SKILL(3).md` | Takroriy skill hujjati nusxasi. |
| `off.doc` | Eski qoralama matn hujjati. |

> Ushbu arxiv faqat tarixiy ma'lumot va ma'lumotnoma uchun saqlanadi. Loyiha rivojlanishi va ishlab turishi to'liq `frontend/` va `backend/` jildlarida olib boriladi.
