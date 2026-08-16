---
name: motionsites-interactive-prompting
description: MotionSites uslubidagi premium, animatsiyali va interaktiv website promptlarini loyihalash. AI website builder yoki coding agent uchun recreation, original concept, scroll-driven motion, 3D/GLB, video background, responsive layout va incremental refinement promptlari kerak bo‘lganda foydalan.
---

# MotionSites uslubida interaktiv website promptlari

## Maqsad

Interaktiv website’ni oddiy “chiroyli sahifa yarat” topshirig‘iga aylantirma. Uni **visual identity + aniq layout + deterministik interaction + texnik implementatsiya + responsive/accessibility + acceptance criteria** sifatida yoz. MotionSites’dagi kuchli promptlar prompt matnini tayyor dizayn spetsifikatsiyasi sifatida ishlatadi: AI builder taxmin qilmaydi, berilgan qarorlarni amalga oshiradi.

## Tezkor workflow

1. **Natijani aniqlashtir.** Sayt turi, biznes maqsadi, auditoriya, asosiy CTA, sahifalar, til, builder/stack, reference va mavjud assetlarni belgila. Noaniq ma’lumotlarni `[NEEDS INPUT]` sifatida ajrat; ularni o‘zboshimchalik bilan to‘ldirma.
2. **Rejimni tanla.** Mavjud dizaynni qayta yaratish kerak bo‘lsa `pixel-faithful recreation`; yangi g‘oya kerak bo‘lsa `original concept`; mavjud saytni o‘zgartirish kerak bo‘lsa `preserve-and-customize` rejimidan foydalan.
3. **Asset-first reja tuz.** Still asset uchun Nano Banana 2/Pro, video asset uchun Gemini Omni Flash, coding/orchestration uchun Gemini 3.7 Flash + Antigravity role’larini ajrat. Video, poster, image, GLB, texture, font va icon URL/path’larini aniq yoz. Har bir asset uchun vazifasi, generation prompti, fallback’i, o‘lchami, crop/object-fit’i va alt matnini ko‘rsat.
4. **Promptni bo‘limlarga ajrat.** Doimo `Page identity → Assets → AI asset pipeline → Stack/setup → Design tokens → Global structure → Interaction/motion → Sections → Responsive → Accessibility/performance → Content constraints → Acceptance criteria` tartibini saqla.
5. **Motionni deterministik yoz.** “Smooth”, “cinematic” yoki “premium” so‘zlarini yolg‘iz qoldirma. Trigger, target property, start/end state, duration/easing, delay, viewport breakpoint, fallback va reduced-motion xatti-harakatini ber.
6. **Avval to‘liq v1 yarat.** Agentdan barcha bo‘lim va asosiy interaction’larni birinchi generatsiyada tugatishni so‘ra. Keyingi iteratsiyada bitta kichik o‘zgarishni ber: mobile spacing, overlay, headline size, timing yoki performance.
7. **Tekshir va refine qil.** Antigravity artifacts orqali desktop, tablet, mobile, keyboard, reduced-motion, asset loading, console error va route/CTA ishlashini tekshirtir. Har bir muammo uchun `Observed → Cause → One change → Verify` shaklida follow-up yoz.

## Rejim tanlash

| Rejim | Qachon ishlatish | Asosiy constraint |
|---|---|---|
| `pixel-faithful recreation` | Reference yoki tayyor preview’ni iloji boricha aynan ko‘chirishda | `Do not invent alternate copy, layout, fonts, colors, or effects.` |
| `original concept` | Reference faqat yo‘nalish bo‘lib, yangi brend yaratilganda | Reference’ni ko‘chirma; uning composition va interaction tamoyilini moslashtir |
| `preserve-and-customize` | Tayyor saytni boshqa biznesga moslashtirishda | Layout, typography, colors, motion va responsive behavior’ni saqla; faqat content/assets/business logic’ni almashtir |

## Prompt yozish qoidalari

- Har bir vizual qarorni o‘lchanadigan qiymatga aylantir: hex/rgb rang, font weight, breakpoint, padding, radius, opacity, blur, z-index, delay va duration.
- “Use exact URLs” deb tashqi assetlarni to‘liq URL yoki loyiha path bilan ko‘rsat. Ishonchsiz URL uchun local fallback va poster ber.
- “No” constraint’larini faqat muhim xatolar uchun ishlat: no generic gradients, no icon-card grid, no autoplay loop, no invented copy, no layout drift.
- Content’ni placeholder bilan aralashtirma. Real copy noma’lum bo‘lsa `[HEADLINE]`, `[CTA_LABEL]` kabi tokenlardan foydalan va agentdan layoutni saqlagan holda placeholder qo‘yishni so‘ra.
- Implementation framework’ni boshida e’lon qil: masalan, React + TypeScript + Vite + Tailwind CSS + Framer Motion + lucide-react. Keraksiz dependency qo‘shmaslikni ayt.
- Har bir section uchun hierarchy, grid/flex, max-width, alignment, copy, asset va reveal delay’ni yoz.
- Scroll-driven animation’da scroll mapping, frame strategy, canvas/video fallback, `prefers-reduced-motion` va mobile performance’ni majburiy ko‘rsat.
- “Let the builder generate the complete first version before making changes” kabi bosqich qoidasi bilan agentni erta mikro-tahrirlardan saqla.
- Agent workflow’da `/grill-me` bilan noaniqliklarni chiqar, `/goal` bilan to‘liq v1 va testlarni tugat, `/browser` bilan preview/QA’ni explicit talab qil. Parallel subagentlarga alohida input, output path va done criteria ber.
- `Gemini 3.7 Flash`ni director/coder, `Antigravity 2.0`ni agent workspace/orchestrator, `Nano Banana` family’ni still-image generator, `Gemini Omni Flash`ni video/motion asset generator sifatida ishlat; ularni bitta noaniq “hammasini qil” vazifasiga aralashtirma.

## Motion patternlari

Provider-specific asset pipeline, Gemini/Antigravity role split, Nano Banana va Omni promptlari, master orchestration shabloni hamda model cheklovlari uchun [references/ai-stack.md](references/ai-stack.md) ni o‘qi.


- **Scroll-scrubbed video:** fixed/sticky layer, poster → video → canvas fallback, normalized progress, lerp smoothing, object-cover math va DPR limitini belgila. Normal looping autoplay o‘rniga scroll-driven behavior’ni tanla.
- **Pinned scene transition:** sahifani pinned viewport’ga joylashtir; scroll progress’ni scene 1 dan scene 2 ga map qil; text scatter/fly-up kabi harakatlarda boshlang‘ich va yakuniy holatni aniq ber.
- **3D/GLB:** GLB path, texture resolution, Three.js, camera, lighting, tone mapping, model scale/origin, loading fallback va mobile simplification’ni yoz.
- **Reveal animation:** IntersectionObserver threshold, hidden/visible transform, opacity, duration, easing va per-element delay’larni ko‘rsat.
- **Glass/material:** panel, border, blur, saturation, shadow, pseudo-element, overlay va interaction state tokenlarini bir marta belgila, barcha sectionlarda qayta ishlat.
- **Responsive navigation:** desktop link row, mobile hamburger, overlay, focus trap, Escape close, AnimatePresence va stagger delay’ni alohida yoz.

## Output formati

Yakuniy promptni to‘liq copy/paste qilinadigan Markdown sifatida ber. Kod bloklaridan oldin qisqa izoh yoz, lekin promptning o‘zida ortiqcha tushuntirish bermagin. Quyidagi bo‘limlar nomini saqla; loyiha kichik bo‘lsa ham bo‘sh bo‘limni `Not applicable` deb belgila:

```text
# [Exact recreation/original concept] prompt — [Project]

## Page identity
## Assets
## Stack and setup
## Fonts and design tokens
## Global structure
## Interaction and motion
## Navigation
## Section 1 — [Name]
## Section 2 — [Name]
## Responsive behavior
## Accessibility and performance
## Content constraints
## Acceptance criteria
```

## Reference fayllar

- To‘liq prompt schema, field-by-field checklist va copy/paste shablonlari uchun [references/prompt-framework.md](references/prompt-framework.md) ni o‘qi.
- Gemini-era AI stack uchun yuqoridagi [references/ai-stack.md](references/ai-stack.md) ni o‘qi.
- Scroll video, pinned scenes, GLB/Three.js, Framer Motion, glass va responsive interaction uchun [references/motion-patterns.md](references/motion-patterns.md) ni o‘qi.
- Promptni baholash, test qilish va incremental refinement uchun [references/quality-checklist.md](references/quality-checklist.md) ni o‘qi.
- Realistik MotionSites-inspired misollar va anti-patternlar uchun [references/examples.md](references/examples.md) ni o‘qi.

## Muhim chegaralar

MotionSites’dan ilhomlangan strukturaviy metodlarni umumlashtir, lekin boshqa saytning maxsus promptini yoki brend assetlarini ruxsatsiz ko‘chirma. Reference visual’ni yo‘nalish sifatida ishlat; agar foydalanuvchi aynan recreation so‘rasa, berilgan reference va huquqiy chegaralarni aniq qayd et.
