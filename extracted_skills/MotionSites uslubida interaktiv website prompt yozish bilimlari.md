# MotionSites uslubida interaktiv website prompt yozish bilimlari

**Muallif:** Manus AI  
**Tadqiqot manbasi:** [motionsites.ai](https://motionsites.ai/)  
**Tadqiqot sanasi:** 2026-yil 15-avgust

## Qisqa xulosa

MotionSites promptni oddiy ijodiy so‘rov emas, balki AI coding agent uchun **recreation specification** sifatida quradi. Kuchli prompt visual kayfiyatni aytish bilan cheklanmaydi; u sahifaning aynan qanday ko‘rinishi, qaysi assetlardan foydalanishi, qaysi stack’da yozilishi, harakat qaysi trigger bilan boshlanishi, responsive breakpointlarda nima o‘zgarishi va tayyor natija qanday tekshirilishini belgilaydi. MotionSites’ning rasmiy ta’limiy sahifalarida promptning layout, styling, fonts, animations, responsive behavior, dependencies va exact content’ni qamrab olishi aytiladi.[1]

> “The prompt already includes detailed desktop, tablet, and mobile instructions, but you should still test every screen size.” — MotionSites Academy’dagi premium animated website darsi.[1]

## 1. MotionSites mahsulot modeli

MotionSites o‘zini Lovable, Bolt, Cursor va Claude kabi AI builder/coding tool’lar uchun tayyor website promptlari kutubxonasi sifatida taqdim etadi. Bosh sahifadagi asosiy va’da “copy, paste, and launch” oqimidir: foydalanuvchi preview’ni ko‘radi, promptni oladi va AI builder’da saytni generatsiya qiladi.[2] Shuning uchun promptning qiymati faqat matnda emas, balki preview, exact assets, category, source/remix imkoniyati va copy workflow bilan birgalikda yuzaga keladi.

| Qatlam | MotionSites’dagi vazifasi | Bizning promptda qanday aks etadi |
|---|---|---|
| Preview | Kutiladigan visual natijani oldindan ko‘rsatadi | Reference, screenshot, video yoki visual direction |
| Prompt | AI builder uchun implementatsiya yo‘riqnomasi | Section’lar, tokens, behavior va constraints |
| Asset | Dizaynning o‘ziga xosligini saqlaydi | Exact URL/path, fallback, dimensions, alt |
| Tool/stack | Kod generatoriga texnik kontekst beradi | React, TypeScript, Vite, Tailwind, Framer Motion, Three.js |
| Interaction | “Premium” hissini real behavior’ga aylantiradi | Scroll, hover, click, reveal, 3D, video, menu |
| Refinement | Birinchi v1’dan keyin nazoratli yaxshilash beradi | One change at a time va verify protokoli |

## 2. Promptning asosiy anatomiyasi

MotionSites namunalari odatda quyidagi tartibda yoziladi:

```text
Page identity
Assets
Fonts and design tokens
Stack and setup
Global structure
Interaction and motion
Navigation
Section-by-section content
Responsive behavior
Accessibility and performance
Content constraints
Acceptance criteria
```

Bu tartib tasodifiy emas. Avval “nima qurilyapti?” aniqlanadi, keyin “nimalar bilan?” va “qaysi texnologiyada?” belgilanadi; shundan so‘ng layout, interaction va tekshiruv mezonlari yoziladi. AI agent aynan shu kontekst ketma-ketligi orqali taxminlar sonini kamaytiradi.

### Page identity

Bu bo‘lim title, brand nomi, maqsadli auditoriya, sahifaning umumiy visual feel’i va taqiqlangan yo‘nalishlarni beradi. Masalan, “dark cinematic AI marketing site; white typography; frosted glass UI chips; sparse editorial layout” kabi phrase’lar kayfiyatni bildiradi, “no purple gradients, no cream paper look, no card grids of icons” esa design drift’ni cheklaydi.[3]

### Assets

MotionSites promptlarida assetlar “abstract hero image qo‘sh” darajasida qolmaydi. Exact URL, video kontenti, resolution, local mirror, poster, display size, border radius, object-fit va alt matn beriladi. Bu yondashuv generatsiyani deterministik qiladi va AI’ning mos kelmaydigan stock image yoki invented media tanlashini to‘xtatadi.[3]

### Stack va setup

Stack promptning boshida e’lon qilinadi: React + TypeScript + Vite + Tailwind CSS, kerak bo‘lsa Framer Motion, lucide-react yoki Three.js. Keyin font importi, document title, reset CSS, body background, text color, antialiasing va selection state yoziladi. Bu qism AI agentga “qaysi texnik muhitga kod yozish” kerakligini bildiradi.[4]

### Design tokens

Premium ko‘rinish ko‘pincha ko‘p sonli alohida CSS qarorlaridan emas, takrorlanuvchi tokenlardan keladi. MotionSites misolida glass panel, glass border, left-accent badge, primary/secondary CTA, text-over-video va mono label tokenlari bir marta berilib, barcha sectionlarda qayta ishlatiladi.[3]

### Global structure

Global structure fixed/sticky layer’lar, z-index, section tartibi, viewport balandligi va spacer’larni belgilaydi. Masalan, scroll video promptida `fixed inset-0 z-0`, `relative z-10` wrapper, fixed navbar, ikki `min-h-screen` section va video timeline uzunligini boshqaradigan `h-[80vh]` spacer ko‘rsatiladi.[3] Bu oddiy CSS detali emas: scroll uzunligi noto‘g‘ri bo‘lsa, video progress’i ham noto‘g‘ri bo‘ladi.

## 3. Motionni yozish formulasi

“Smooth”, “cinematic”, “fluid” va “premium” so‘zlari faqat niyatni bildiradi. Harakatni tekshiriladigan qilish uchun quyidagi formuladan foydalan:

> **Motion = Trigger + Target property + Start state + End state + Mapping/Timing + Fallback + Reduced-motion state.**

| Element | Savol | Misol |
|---|---|---|
| Trigger | Nima harakatni boshlaydi? | scroll, click, hover, viewport intersection, load |
| Target | Qaysi property o‘zgaradi? | opacity, translateY, scale, rotation, video frame |
| Start | Dastlabki holat qanday? | `opacity: 0`, `translateY(2rem)` |
| End | Yakuniy holat qanday? | `opacity: 1`, `translateY(0)` |
| Timing | Qancha davom etadi? | 700ms ease-out, 0.12 lerp |
| Mapping | Progress qayerdan keladi? | `scrollY/(scrollHeight-innerHeight)` |
| Fallback | Asset yoki browser imkoniyati bo‘lmasa? | poster, visible video seek, static final state |
| Reduced motion | Foydalanuvchi harakatni cheklasa? | animationni o‘chirish, contentni statik ko‘rsatish |

## 4. Scroll-driven video patterni

MotionSites’ning scroll-animated darsida video oddiy looping background emas, balki scroll timeline sifatida ishlatiladi. Tavsiya etiladigan arxitektura: pastki qatlamda poster image, keyin warm-up qiluvchi muted video, tayyor bo‘lgach frame cache chizuvchi canvas. Progress clamp qilinadi, `requestAnimationFrame` bilan lerp qilinadi, object-cover crop math qo‘llanadi va canvas DPR cheklanadi.[3]

```text
progress = clamp(scrollY / (scrollHeight - innerHeight), 0, 1)
smoothed += (progress - smoothed) * 0.12
frameIndex = round(smoothed * (frameCount - 1))
```

Bunday promptda quyidagilarni unutmaslik kerak: poster darhol ko‘rinsin; video `muted`, `playsInline`, `preload=auto` bo‘lsin; canvas tayyor bo‘lguncha fallback ishlasin; mobile’da frame count yoki resolution kamaytirilsin; `prefers-reduced-motion` uchun static holat berilsin; normal autoplay looping ishlatilmasin, agar u interaction maqsadiga zid bo‘lsa.

## 5. Sticky video va content overlay

Ikkinchi MotionSites darsi sticky background video’ni content ortida ishlatadi: `sticky top-0 h-screen` media layer, ustida `relative z-10` content, zarur bo‘lsa `-mt-[100vh]` bilan overlay. Pastki gradient matn o‘qilishini ta’minlaydi. Media pointer-events’ni yutib yubormasligi, navigation va CTA esa interactive qatlamda qolishi kerak.[4]

## 6. Pinned scene va 3D/GLB

3D lesson’da MotionSites bir reference image’ni ko‘p ko‘rinishli reference’ga aylantirish, AI image-to-3D generator’dan GLB olish, 1K–2K texture bilan eksport qilish va Claude + Three.js orqali animatsiya qilish workflow’ini beradi.[5] Promptda GLB path, model scale/origin, camera, lighting, tone mapping, texture resolution, loading state, error fallback va mobile simplification bo‘lishi kerak.

> “Apply tone mapping — without it, the model renders dark and muddy.” — MotionSites 3D darsidagi amaliy troubleshooting ko‘rsatmasi.[5]

Pinned scene’da sahifa viewport’ni “ushlab turadi”; scroll progress scene 1 va scene 2 orasidagi timeline’ga aylanadi. Text scatter, fly-up yoki fade kabi motionlar start/end state bilan yoziladi. Mobile’da travel distance qisqartirilishi, reduced-motion’da esa final static state ko‘rsatilishi kerak.

## 7. Responsive va accessibility

MotionSites Academy prompt ichida desktop, tablet va mobile ko‘rsatmalarini berishni tavsiya qiladi, lekin barcha screen size’larda alohida test qilish kerakligini ham ta’kidlaydi.[1] Shuning uchun “make it responsive” yetarli emas. Har breakpoint’da nav, grid, typography, spacing, media crop, CTA visibility va interaction qanday o‘zgarishini yoz.

Accessibility qismi promptda majburiy bo‘lishi kerak: semantic headings, meaningful alt text, keyboard focus, visible focus ring, `aria-expanded`, `aria-controls`, Escape bilan mobile menu’ni yopish, touch’da hover’ga bog‘liq bo‘lmagan behavior va reduced-motion fallback. Performance uchun lazy-load, poster, compressed media, DPR cap, texture limit, cleanup/dispose va console error’larni tekshirtir.

## 8. Preserve-and-customize workflow’i

MotionSites darslarida tayyor dizaynni yangi biznesga moslashtirganda existing layout, typography, colors, animations va responsive behavior’ni saqlash; faqat business copy, services, case studies, FAQ, CTA va visuals’ni almashtirish tavsiya qilinadi.[4] Eng yaxshi follow-up kichik va mustaqil bo‘ladi: “mobile spacing’ni yaxshila”, “dark overlay’ni kamaytir”, “headline size’ni mosla”. Butun sahifani qayta redesign qilishni so‘rash visual drift keltiradi.[1]

## 9. Universal copy/paste shablon

```markdown
# [Exact recreation/original concept] prompt — [Project]

Recreate/build this page [pixel-faithfully / as an original concept]. Use [STACK]. [Preservation or originality constraint].

## Page identity
[title, brand, audience, purpose, feel, anti-directions]

## Assets
[exact URLs/paths, role, dimensions, crop, fallback, alt]

## Stack and setup
[framework, dependencies, title, fonts, base CSS]

## Fonts and design tokens
[font weights, colors, spacing, radius, blur, shadows, CTA states]

## Global structure
[root, fixed/sticky media, z-index, navbar, main sections, spacer]

## Interaction and motion
[trigger, start/end state, timing/mapping, fallback, reduced motion]

## Navigation
[desktop links, mobile menu, focus, Escape, CTA]

## Section 1 — [Name]
[layout, exact copy, tokens, asset, reveal delays]

## Responsive behavior
[mobile/tablet/desktop changes]

## Accessibility and performance
[semantics, alt, keyboard, reduced motion, loading, DPR, cleanup]

## Content constraints
[exact copy, placeholders, forbidden inventions]

## Acceptance criteria
[visual, functional, responsive, performance and console checks]
```

## 10. Prompt sifatini score qilish

Promptning 10 qatlamini 0–2 ball bilan bahola: identity, assets, stack, tokens, structure, motion, content, responsive, accessibility/performance va acceptance criteria. `0` — yo‘q, `1` — umumiy, `2` — aniq va test qilinadi. 16/20 dan past promptni yubormaslik, avval eng past ball olgan qatlamni to‘ldirish tavsiya etiladi.

## 11. Gemini-era motion website pipeline’i

2026-yil avgust holatiga ko‘ra, yuqori sifatli motion website odatda bitta modelning bir martalik javobi bilan emas, **director → asset generation → frontend implementation → browser QA → controlled refinement** zanjiri bilan yaratiladi. Google’ning rasmiy materiallarida Gemini 3.7 Flash web development’da kamroq prompt bilan feature-complete app va design reference’ga yuqori adherence berishi, Antigravity esa agentlarni parallel boshqarishi, Nano Banana still-image generation, Gemini Omni esa video generation/editing uchun ishlatilishi ko‘rsatiladi.[6][7][8][9]

### Model va mahsulotlarning real taqsimoti

| Qatlam | Vosita | To‘g‘ri talqin | Saytdagi natija |
|---|---|---|---|
| Director/coder | Gemini 3.7 Flash (`gemini-3.7-flash`) | Coding, multimodal reasoning, planning va tool-use modeli | Architecture, React/TS kod, integration va QA plan |
| Agent platforma | Antigravity 2.0 | Bir nechta autonomous agentni parallel boshqaruvchi workspace/orchestrator | Project context, subagents, artifacts, browser/test workflow |
| Still image | Nano Banana 2 (`gemini-3.1-flash-image`) | Hero, poster, editorial image, texture va reference generator | PNG/WebP/JPG assetlar |
| Premium still | Nano Banana Pro (`gemini-3-pro-image`) | Brand consistency, localization va murakkab creative control | Premium campaign visual, exact typography/logo treatment |
| Video | Gemini Omni Flash (`gemini-omni-flash-preview`) | Text-to-video, image-to-video, reference-to-video va edit modeli | Hero video, ambient loop, product/character motion |
| Runtime | React/TypeScript, Tailwind, Framer Motion, Three.js | Assetlarni real interactive UI’ga ulash | Scroll, hover, click, pinned scene, 3D va responsive behavior |

**Muhim tuzatish:** Gemini 3.7 Flash API modelining o‘zida image generation yo‘q; Nano Banana alohida image model family’dir. Antigravity 2.0 image yoki video generator emas, agent orchestration/workspace layer. Gemini Omni Flash esa video/motion asset yaratadi, lekin o‘z-o‘zidan frontend scroll interaction’ini implement qilmaydi. Shuning uchun “Gemini hammasini o‘zi qiladi” degan tasvir aslida bir nechta specialist qatlamlarning orchestratsiyasidir.[6][7][8][9]

### Tavsiya etiladigan graph

```text
Brief + screenshot + brand assets
              |
              v
Director agent: Gemini 3.7 Flash / Antigravity
              |
     +--------+---------+----------------+
     |                  |                |
Nano Banana still   Omni video      Frontend build
     |                  |                |
     +------------------+----------------+
                        |
                 Browser QA agent
                        |
     screenshots + console report + acceptance checklist
                        |
             one-change-at-a-time refinement
```

### Antigravity workflow’i

Antigravity 2.0 project ichiga frontend folder, asset folder, screenshot/reference, content brief va design tokens’ni qo‘sh. Implementationdan oldin `/grill-me` bilan noaniqliklarni chiqar; keyin director’dan architecture plan, asset manifest, motion graph va acceptance criteria so‘ra. Focused subagentlarga alohida vazifa ber: visual asset, motion asset, frontend implementation va QA.

Antigravity blogi va Codelab’ida agentlar dynamic subagents, asynchronous task management, artifacts, projects, browser command va `/goal` kabi mexanizmlar bilan ishlashi ko‘rsatilgan. Motion site uchun asosiy usul quyidagicha:

1. **`/grill-me`** — brief, copy, asset, trigger, breakpoint va fallback noaniqliklarini aniqlashtir.
2. **Plan** — section tree, design tokens, asset manifest, motion timeline va done criteria yozdir.
3. **Parallel delegation** — still asset, video asset, frontend va QA’ni bir-biriga xalaqit bermaydigan subtasklarga ajrat.
4. **`/goal`** — partial mockup emas, barcha bo‘lim va asosiy interaction’lar bilan to‘liq v1 yaratishni talab qil.
5. **`/browser`** — desktop, tablet, mobile va reduced-motion preview/testni explicit ishga tushir.
6. **Artifacts** — screenshot, asset manifest, console report va acceptance checklist orqali natijani tekshir.
7. **Refinement** — bir turn’da bitta o‘zgarish: `Observed → Cause → One change → Verify`.

## 12. Nano Banana va Gemini Omni bilan asset pipeline’i

### Nano Banana’da still asset yaratish

Nano Banana marketing nomi bitta model emas, Gemini native image generation family’dir. Rasmiy docs’ga ko‘ra, Nano Banana 2 Lite tez/arzon, Nano Banana 2 generalist workhorse, Nano Banana Pro esa eng murakkab professional visual tasklar uchun. Gemini 3 image models 1K/2K/4K output, aniq text rendering, thinking mode va ko‘p reference image’ni qo‘llaydi.[8]

Still promptda quyidagi field’larni yoz:

```text
Asset role: hero still / video poster / texture / product render
Placement: full-bleed / fixed background / card / reference frame
Aspect ratio: 16:9 / 21:9 / 4:5 / 1:1
Focal point: subject va aniq joylashuvi
Negative space: HTML headline/CTA uchun chap yoki o‘ng bo‘sh joy
Crop safety: desktop va mobile ratio’larida subject kesilmasin
Palette/material/light/camera: konkret qiymatlar
Reference images: qaysi rasm object, character yoki style sifatida ishlatiladi
Exact text: agar rasm ichida text bo‘lsa, qo‘shtirnoq ichida aniq yoziladi
Constraints: no invented logo, no extra subject, no browser frame, no clutter
```

Hero image’ni “beautiful cinematic image” deb so‘rash yetarli emas. Masalan, “subject right-third’da; chap 42% HTML headline uchun negative space; low-contrast dark navy background; 21:9; mobile crop-safe” kabi composition constraints yozilsa, keyingi frontend layout ancha barqaror bo‘ladi.

### Gemini Omni’da video/motion asset yaratish

Omni Flash preview model bo‘lib, text-to-video, image-to-video, reference-to-video va edit tasklarini bajaradi. Image-to-video uchun yuqori resolution reference va aniq camera movement, subject motion hamda environmental effect kerak; “make it move” vague prompti yomonroq natija beradi.[9]

Video promptning ishlaydigan formulasi:

> **Video = scene + subject + subject motion + camera movement + environment + lighting + mood/material + timing + aspect ratio + preserve/no constraints.**

Rasmiy Omni guide bo‘yicha default model bir nechta shot yaratishi mumkin. Bitta uzluksiz hero asset uchun `in a single continuous shot` va `no scene cuts` yoz. Keraksiz elementlar uchun `No dialogue`, `No extra sound effects`, `No extra text` kabi sodda negative instructionlardan foydalan. Edit follow-up’da faqat o‘zgaradigan qismni ayt va `Keep everything else the same` qo‘sh. Timing’ni natural language bilan belgilash mumkin: `After 2 seconds...`, `At 5s...`, `Every 2s...`.[9]

```text
Use <FIRST_FRAME> as the starting frame.
Create a 7-second 16:9 video for a premium interactive website.
In a single continuous shot with no scene cuts:
- Subject: [exact object/character]
- Subject motion: [direction, speed, loop behavior]
- Camera: [slow push-in/orbit/pan], from [start] to [end]
- Environment: [specific particles/reflections/fog/light response]
- Lighting: [specific change over time]
- Keep the left 40% clean for HTML headline and CTA.
- Keep the final frame close to the first frame for seamless looping.
- No dialogue. No extra text. No extra sound effects.
```

### Still → video → web integration

1. Nano Banana 2/Pro’da composition’i tasdiqlaydigan hero still yarat.
2. Still’ni Omni’ga `<FIRST_FRAME>` yoki `<IMAGE_REF_1>` rolida ber.
3. Camera, subject, environment va timing’ni aniq yoz.
4. Birinchi video output’ni `poster`, `video` va kerak bo‘lsa `canvas frame cache` bilan frontend’ga ulash.
5. Scroll-driven bo‘lsa progress mapping’ni kodda implement qil; video generation prompti scroll behavior’ni o‘zi yaratmaydi.
6. Mobile’da poster yoki pastroq resolution fallback ber.
7. Reduced-motion’da static poster/final state ko‘rsat.

## 13. Master prompt arxitekturasi

Quyidagi prompt MotionSites structure’ini Gemini-era agent workflow’iga kengaytiradi:

```markdown
/goal
Create the complete first version of a production-quality responsive motion website.

## Role
Act as a senior creative frontend engineer, motion designer and build director.

## Project mode
[pixel-faithful recreation / original concept / preserve-and-customize]

## Phase 1 — Clarify
Use /grill-me. Ask only material questions. Mark unknown values as [NEEDS INPUT].

## Phase 2 — Design contract
Define page identity, exact copy, stack, design tokens, breakpoints, interaction graph,
asset list, fallbacks and acceptance criteria.

## Phase 3 — Asset pipeline
A. Use Nano Banana [2 / Pro] for [still assets].
B. Use Gemini Omni Flash for [video assets], using [FIRST_FRAME / IMAGE_REF] roles.
C. Save an asset manifest with filename, model, prompt, dimensions, role, alt and fallback.

## Phase 4 — Implementation
Use React + TypeScript + Tailwind + Framer Motion + Three.js only where required.
Implement every section and primary interaction in the first complete version.

## Phase 5 — Motion
For every interaction specify trigger, target property, start/end state, timing/mapping,
fallback, mobile simplification and reduced-motion state.

## Phase 6 — QA
Use /browser. Test 1440px, tablet and 375px; keyboard, reduced motion, asset loading,
network, console and CTA/route behavior. Produce screenshots and a QA artifact.

## Phase 7 — Refinement
After v1, make only one named change at a time. Preserve all unspecified behavior.
```

## 14. Sifatni baholashning yangilangan mezoni

Gemini-era promptni 14 qatlam bo‘yicha 0–2 ball bilan bahola: identity, content, assets, asset-generation prompt, stack, tokens, structure, motion, video prompt, sections, responsive, accessibility/performance, constraints va acceptance. Maksimum 28 ball. **22 balldan past** promptda builder yoki agent taxmini ko‘p bo‘ladi. Avval eng past ball olgan qatlamni to‘ldir.

## 15. Manbalar va kuzatuv chegaralari

MotionSites’ning barcha premium prompt matnlari ommaga to‘liq ko‘rinmasligi mumkin. Shuning uchun MotionSites’dan olingan qism kuzatilgan UI/Academy patternlarini umumlashtiradi; Gemini, Antigravity, Nano Banana va Omni qismi esa rasmiy Google docs/blog/codelab’dagi capability va workflow’lar bilan tekshirilgan. Model nomlari, pricing, preview holati va API schema’lari vaqt o‘tishi bilan o‘zgarishi mumkin; production’da har doim rasmiy docs’dagi model ID va capability jadvalini tekshir.

## References

[1]: https://motionsites.ai/lesson/build-animated-website-with-ai "How to Build a Premium Animated Website with MotionSites — MotionSites Academy"

[2]: https://motionsites.ai/ "MotionSites AI — Official Premium AI Website Prompts"

[3]: https://motionsites.ai/lesson/build-scroll-animated-website-with-ai "How to Build a Scroll-Animated Website With AI — MotionSites Academy"

[4]: https://motionsites.ai/lesson/build-animated-website-with-motionsites "How to Build an Animated Website with AI and MotionSites — MotionSites Academy"

[5]: https://motionsites.ai/lesson/build-3d-scroll-animated-website-with-ai "How to Build a 3D Scroll-Animated Website with AI — MotionSites Academy"
