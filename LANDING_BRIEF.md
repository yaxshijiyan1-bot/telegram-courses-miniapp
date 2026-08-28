# LANDING PAGE DIZAYN BRIEFI — "Kreativ AI" Telegram mini-app

> Bu hujjat landing page (kirish ekrani) dizaynini yaxshilash uchun tayyorlangan.
> Loyiha haqida to'liq kontekst, qanday ishlashi, texnik stek, amaldagi dizayn tizimi
> va hozirgi landing page kodi — hammasi shu yerda.

---

## 1. Loyiha nima?

**"Kreativ AI"** — Telegram ichida ishlaydigan o'zbek tilidagi onlayn kurslar platformasi (Telegram Mini App).

- **Shior:** "bilim qiymatga aylanadi"
- **Til:** butunlay o'zbek tilida
- **Ustozlar:** Zuhra Olimova (@Olimova_Zuhra) va Yaxshi Bola (@yomonboIa)
- **Auditoriya:** Telegram'dan f'alanadigan o'zbekistonlik talabalar — kurs sotib olib, darslarni o'qib boradigan odamlar
- **Muhim:** bu mobil ilova emas, Telegram ichida ochiladigan web-ilova. Ekran kichik (telefon), foydalanuvchi bosh barmog'i bilan ishlaydi.

## 2. Mini-app qanday ishlaydi (user flow)

1. Foydalanuvchi Telegram bot orqali mini-appni ochadi.
2. Ilova **SplashPage** (landing/kirish ekrani) bilan boshlanadi — brend, shior va "Boshlash" tugmasi. **Siz yaxshilashingiz kerak bo'lgan sahifa shu.**
3. "Boshlash" bosilgach asosiy ilovaga o'tiladi. Kirish avtomatik: Telegram WebApp SDK orqali initData yuboriladi, backend (FastAPI) JWT token qaytaradi — alohida login/parol yo'q.
4. Asosiy ilovada 4 ta pastki tab bor:
   - **Bosh sahifa** — admin tomonidan boshqariladigan banner slider (avto aylanadi, swipe qilinadi), ustozlar kartochkalari, tavsiya etilgan kurslar
   - **Kurslar** — katalog: qidiruv, kategoriya filtrlari, kurs kartochkalari
   - **Darslarim** — sotib olingan kurslar, davom etish progressi
   - **Profil** — statistika (o'tilgan darslar, streak), sertifikatlar, ustozlar ro'yxati, bildirishnomalar
5. Kurs bosilsa → kurs sahifasi (dastur, galereya, narx) → **CheckoutModal**: foydalanuvchi to'lov cheki rasmini yuklaydi → admin tasdiqlaydi → kurs ochiladi.
6. Darslar **video emas** — infografika rasmlar + fayllar ko'rinishida. Asl kurs kontenti yopiq Telegram kanalida beriladi. Ilovada video pleer va watermark UMUMAN YO'Q — bunday narsalar qo'shmaslik kerak.
7. Admin/superadmin uchun alohida admin panel (kurslar, bannerlar, foydalanuvchilar, sotuvlar boshqaruvi).

**Landing page vazifasi:** birinchi taassurot yaratish — brendni ko'rsatish, ishonch uyg'otish va bitta tugma bilan asosiy ilovaga o'tkazish. Hech qanday forma, ro'yxatdan o'tish yoki ortiqcha bosqich yo'q.

## 3. Texnik stek

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS (maxsus tema pastda)
- **Animatsiya:** motion/react (Framer Motion)
- **Ikonkalar:** lucide-react
- **Backend:** FastAPI (Render free tier), Supabase DB, Cloudflare R2 (rasmlar)
- **Joylashuv:** Cloudflare Pages + Vercel, GitHub main'dan avto-deploy
- **Shriftlar (Google Fonts'dan yuklanadi):**
  - `Plus Jakarta Sans` (400, 500, 600, 700, 800) — asosiy sans
  - `DM Serif Display` (italic 0;1) — accent serif (kursiv so'zlar uchun)
  - `JetBrains Mono` (500, 700) — mono

**Muhim cheklovlar:**
- Performans juda muhim — og'ir blur filtrlar, katta videolar, og'ir rasmlar ishlatmang. Rasmlar webp, ~30–80 KB atrofida bo'lsin.
- Landing page birinchi ochiladigan ekran — u eng yengil sahifa bo'lishi shart.
- Bitta `onStart()` callback bor — tugma bosilganda shu chaqiriladi, shu interfeysni saqlang.

## 4. Amaldagi dizayn tizimi (buni saqlang)

### Ranglar
| Token | Qiymat | Qo'llanishi |
|---|---|---|
| Fon (asosiy) | `#FFFFFF` | oq fon |
| Fon (ikkilamchi) | `#F8FAFC` | kartalar, bo'limlar |
| Fon (uchinchi) | `#F1F5F9` | hover, dividerlar |
| Glass | `rgba(255,255,255,0.85)` | shisha effektli chiplar |
| Matn (asosiy) | `#0F172A` (ink) | sarlavhalar |
| Matn (ikkilamchi) | `#475569` | tavsif matnlari |
| Matn (xira) | `#64748B` | yordamchi matnlar |
| **Asosiy aksent — cyan** | `#0284C7` | tugmalar, linklar, ikonkalar |
| Cyan yorug' | `#38BDF8` | gradientlar |
| Cyan chuqur | `#0369A1` | hover holatlar |
| Binafsha | `#7C3AED` | ikkilamchi aksent |
| Oltin | `#D97706` | badge/urg'u |
| Zumrad | `#059669` | muvaffaqiyat holatlari |

Dizayn **yorug' (light) tema**da. Brend rangi — **cyan/sky-blue**, ikkilamchi — binafsha.

### Tailwind'dagi maxsus nomlar
```
cyan → #0284C7 (cyan-light: #38BDF8, cyan-deep: #0369A1, cyan-glow: rgba(2,132,199,0.15))
violet → #7C3AED   gold → #D97706
ink / ink-secondary / ink-muted
```

### Shriftlar
- Asosiy matn: **Plus Jakarta Sans** (og'ir sarlavhalar: font-extrabold, tracking-tight)
- Kursiv aksent so'zlar: **DM Serif Display** (`.serif-accent` klassi — odatda cyan rang kursiv serif)
- Radiuslar: yumaloq — kartalar `rounded-2xl`/`rounded-3xl` (28–32px), tugmalar `rounded-2xl`

### Soyalar
```
soft:       0 8px 30px -10px rgba(15,23,42,0.08)
elevated:   0 12px 36px -12px rgba(15,23,42,0.12)
cyanGlow:   0 8px 24px -4px rgba(2,132,199,0.35)   ← asosiy tugma soyasi
cyanGlowSm: 0 4px 16px -3px rgba(2,132,199,0.25)
nav:        0 10px 40px -10px rgba(15,23,42,0.1), 0 0 20px -5px rgba(2,132,199,0.08)
```

### Mavjud CSS klasslar (index.css)
- `.blob` — radial gradient doira (blur filtersiz, GPU'ga yengil): `.blob-cyan` rgba(2,132,199,0.09), `.blob-violet` rgba(124,58,237,0.08), `.blob-gold`, `.blob-white`
- `.glass-chip` — shisha effektli kichik chip/pill (oq fon, xira border, yengil backdrop)
- `.serif-accent` — DM Serif Display kursiv aksent
- `.animate-pulse-glow`, `.animate-floaty` — mavjud keyframe animatsiyalar (nuqta pulsatsiyasi, rasm suzishi)

### Animatsiya uslubi
- Kirish animatsiyalari: `opacity 0→1` + `y 14–24px` pastdan ko'tarilish, stagger (0.15–0.6s delay)
- Easing: `ease: [0.22, 1, 0.36, 1]` (smooth chiqish) yoki spring (`stiffness 160–260, damping 20–26`)
- Tugma bosilganda: `whileTap={{ scale: 0.97 }}` + haptic feedback (`haptic.impact('medium')`)
- Harakat kam, nafis, tez — "hover" effektlar emas, bir martalik kirish choreografiyasi

## 5. Hozirgi landing page (SplashPage) — nima bor

Struktura (pastdan yuqoriga):
1. **Fon:** oq, ikkita `.blob` ambient nur (cyan yuqori-chapda, binafsha pastki-o'ngda)
2. **Yuqori:** markazda kichik glass-chip pill — pulsatsiyalanuvchi cyan nuqta + "KREATIV AI" yozuvi (10px, extrabold, tracking keng)
3. **Markaz:**
   - 3D uslubdagi hero rasm `splash_hero_v2.webp` (256×224px konteyner, foni kesilgan, suzib turadi — `animate-floaty`, ortida radial cyan nur)
   - Sarlavha: **"Bilimingizni oshiring."** — "oshiring" so'zi serif kursiv aksentda
   - Tavsif: "Professional amaliy kurslar, tizimli o'quv yo'li va Telegram uchun moslashtirilgan qulay muhit."
   - Ikki chip: 🛡 "Amaliy Ta'lim" va ⚡ "Telegramga mos"
4. **Past:** katta gradient tugma (cyan → cyan-light, cyanGlow soya): GraduationCap ikonka + "Boshlash" + ArrowRight. Ostida: "bilim qiymatga aylanadi · Kreativ AI 2026"

### Hozirgi kod (to'liq):

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Zap, GraduationCap } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';

interface SplashPageProps {
  onStart: () => void;
}

export const SplashPage: React.FC<SplashPageProps> = ({ onStart }) => {
  const { haptic } = useTelegram();

  const handleStart = () => {
    haptic?.impact?.('medium');
    onStart();
  };

  return (
    <div className="min-h-screen flex-1 flex flex-col justify-between p-6 bg-white text-slate-900 select-none relative overflow-hidden">
      {/* Ambient glows — radial gradient (blur filterisiz, GPU'ga yuklama bermaydi) */}
      <div className="blob blob-cyan absolute -top-32 -left-24 w-80 h-80 pointer-events-none" />
      <div className="blob blob-violet absolute -bottom-36 -right-24 w-96 h-96 pointer-events-none" />

      {/* Top brand pill */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pt-safe flex justify-center relative z-10"
      >
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-chip text-cyan">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse-glow" />
          <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase">
            Kreativ AI
          </span>
        </div>
      </motion.div>

      {/* Center hero */}
      <div className="my-auto flex flex-col items-center text-center space-y-7 relative z-10 max-w-xs mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 20, delay: 0.15 }}
          className="relative w-64 h-56 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(2,132,199,0.14),transparent_65%)]" />
          <motion.img
            src="/images/splash_hero_v2.webp"
            alt=""
            draggable={false}
            className="relative z-10 w-full h-full object-contain animate-floaty pointer-events-none drop-shadow-xl"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-2.5"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Bilimingizni<br />
            <em className="serif-accent">oshiring.</em>
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Professional amaliy kurslar, tizimli o‘quv yo‘li va Telegram uchun moslashtirilgan qulay muhit.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center space-x-2 text-[11px] font-bold"
        >
          <span className="flex items-center space-x-1.5 glass-chip text-slate-800 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan" strokeWidth={2.2} />
            <span>Amaliy Ta'lim</span>
          </span>
          <span className="flex items-center space-x-1.5 glass-chip text-slate-800 px-3 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5 text-cyan" strokeWidth={2.2} />
            <span>Telegramga mos</span>
          </span>
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pb-safe w-full space-y-3 relative z-10"
      >
        <motion.button
          type="button"
          onClick={handleStart}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan to-cyan-light text-white font-extrabold rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-cyanGlow"
        >
          <GraduationCap className="w-[18px] h-[18px]" strokeWidth={2.4} />
          <span>Boshlash</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </motion.button>
        <p className="text-[10px] text-center text-slate-400 font-medium">
          bilim qiymatga aylanadi · Kreativ AI 2026
        </p>
      </motion.div>
    </div>
  );
};
```

## 6. VAZIFA — landing page dizaynini yaxshilash

Yuqoridagi brend va dizayn tizimiga sodiq qolgan holda SplashPage'ni zamonaviyroq, ta'sirchanroq va "premium" his qilinadigan qilib qayta ishlang.

**Saqlanishi SHART:**
- Brend: "Kreativ AI" nomi, "bilim qiymatga aylanadi" shiori, o'zbek tili
- Rang palitrasi (oq fon + cyan/binafsha aksentlar) va shriftlar (Plus Jakarta Sans + DM Serif Display kursiv aksent)
- Yakunda bitta "Boshlash" tugmasi va `onStart()` chaqiruvi
- Yengillik: blur filtersiz ambient nurlar (`.blob` uslubidagi radial gradientlar), og'ir media yo'q
- Mobil-first: telefon ekranida, bitta qo'lda ishlatiladi; CTA pastda, bosh barmoq zonasida

**Nima yaxshilanishi mumkin (erkin):**
- Hero qism kompozitsiyasi, sarlavha matni va ierarxiya
- Kirish animatsiyalari choreografiyasi (stagger, spring, micro-interactions)
- Chip/badge'lar, ishonch elementlari (kurslar soni, talabalar, ustozlar)
- Ambient fon kompozitsiyasi (radial gradientlar, nafis naqshlar)
- Tipografik kontrast (kattaroq sarlavha, serif aksentning kreativroq qo'llanishi)
- Tugma dizayni (gradient, soya, micro-interaction)

**Qo'shmaslik kerak:** video pleer, watermark, ro'yxatdan o'tish formasi, ortiqcha sahifalar/bosqichlar, og'ir blur effektlar, tashqi kutubxonalar (faqat motion/react + lucide-react + Tailwind).

**Mavjud assetlar:** `/images/splash_hero_v2.webp` (3D uslubdagi hero rasm, foni kesilgan — almashtirish shart emas, qayta kompozitsiya qilish mumkin).

Natija: yangilangan `SplashPage.tsx` kodi (React + TypeScript + Tailwind + motion/react), yuqoridagi `SplashPageProps` interfeysini saqlagan holda.
