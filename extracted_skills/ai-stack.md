# Gemini-era AI stack for motion websites

## Mundarija

1. Nomlar va vazifalar
2. Tavsiya etiladigan agent arxitekturasi
3. Bosqichma-bosqich ishlab chiqish workflow’i
4. Nano Banana asset prompti
5. Gemini Omni video prompti
6. Antigravity build prompti
7. Master orchestration prompti
8. Iteratsiya va QA protokoli
9. Cheklovlar va anti-patternlar
10. Rasmiy manbalar

## 1. Nomlar va vazifalar

Marketing nomini model ID bilan adashtirma. 2026-yil avgustdagi rasmiy Google docs bo‘yicha quyidagi role split ishlatiladi:

| Qatlam | Rasmiy model/mahsulot | Vazifa | Motion-site’dagi output |
|---|---|---|---|
| Director/coder | Gemini 3.7 Flash (`gemini-3.7-flash`) | Briefni tahlil qilish, architecture, code, tool-use, verification | plan, React/TS/CSS/Three.js code, QA report |
| Agent harness | Antigravity 2.0 / Antigravity Agent | Bir nechta agentni boshqarish, project context, files, code execution, browser/web, artifacts | parallel tasks, screenshots, preview, test artifacts |
| Still-image asset | Nano Banana 2 (`gemini-3.1-flash-image`) | Hero still, poster, product render, texture, illustration, text-bearing visual | PNG/WebP/JPG asset, reference image |
| Premium still asset | Nano Banana Pro (`gemini-3-pro-image`) | Brand consistency, complex art direction, high precision | premium campaign visual, exact logo/type treatment |
| Fast still asset | Nano Banana 2 Lite (`gemini-3.1-flash-lite-image`) | Tez/arzonga ko‘p variant va placeholder | thumbnail, concept iteration |
| Video/cinematic asset | Gemini Omni Flash (`gemini-omni-flash-preview`) | Text-to-video, image-to-video, reference-to-video, edit | MP4/URI hero loop, ambient scene, product motion |
| Frontend runtime | React/TypeScript + Tailwind + Framer Motion + Three.js | Assetlarni UI va interaction bilan birlashtirish | responsive, scroll-driven, hover/click/3D experience |

**Asosiy prinsip:** Gemini 3.7 Flash “director va coding brain”, Antigravity “agent workspace/orchestrator”, Nano Banana “still-image asset generator”, Omni “video/motion asset generator”. Ular bir-birining o‘rnini bosmaydi.

## 2. Tavsiya etiladigan agent arxitekturasi

Bitta ulkan prompt bilan barcha ishni topshirish o‘rniga quyidagi graph’dan foydalan:

```text
Brief + references
        |
        v
Director agent (Gemini 3.7 Flash / Antigravity)
        |
        +--> Visual asset agent (Nano Banana 2 / Pro)
        |
        +--> Motion asset agent (Gemini Omni Flash)
        |
        +--> Frontend implementation agent (Antigravity environment)
        |
        +--> Browser/responsive/accessibility QA agent
        |
        v
Artifacts: plan + asset manifest + preview screenshots + test report
        |
        v
One-change-at-a-time refinement loop
```

Parallel subagentlar har biri bitta aniq deliverablega ega bo‘lsin. Masalan, “design agent” asset ishlab chiqarmasin, “asset agent” React kodini o‘zgartirmasin. Har bir subtask uchun input, output path/format va done criteria ber.

## 3. Bosqichma-bosqich workflow

### Bosqich 0 — Project va context

Antigravity’da projectga frontend folder, `public/assets`, reference screenshot, brand guide va content brief’ni qo‘sh. `AGENTS.md` yoki `.agents/skills/` ichida global qoidalarni saqla. Asset, code va QA uchun alohida output folderlar belgila.

### Bosqich 1 — `/grill-me` bilan briefni aniqlashtirish

Agentdan implementationdan oldin quyidagilarni so‘rashni talab qil:

- Target audience, CTA va conversion goal nima?
- Recreationmi yoki original conceptmi?
- Exact copy, logo, font, image va video mavjudmi?
- Hero video qayerda ishlatiladi: autoplay, scroll-scrub, hover yoki click?
- Mobile’da qaysi effect soddalashtiriladi?
- Asset generation uchun qaysi model va resolution kerak?
- Reduced-motion va no-asset fallback qanday bo‘ladi?

Noaniq javoblarni `[NEEDS INPUT]` deb belgila; taxminiy brand claim yoki asset ixtiro qilma.

### Bosqich 2 — Design/interaction contract

Director quyidagi qisqa contract’ni yozsin:

```text
Project mode: [pixel-faithful recreation | original concept | preserve-and-customize]
Stack: [React + TypeScript + Tailwind + Framer Motion + Three.js]
Primary interaction: [scroll-scrubbed video | pinned scene | GLB orbit | parallax]
Assets needed: [list with role, dimensions, model, fallback]
Breakpoints: [mobile/tablet/desktop]
Acceptance criteria: [visual + functional + responsive + accessibility + performance]
```

### Bosqich 3 — Still asset generation

Nano Banana 2 yoki Pro’da assetni avval still sifatida ishlab chiq. Hero still, poster, texture va reference frame composition’i video generation’dan oldin tasdiqlansin. Har bir output uchun asset manifestga `filename`, `model`, `prompt`, `dimensions`, `aspect_ratio`, `role`, `alt`, `license/status` yoz.

### Bosqich 4 — Motion asset generation

Nano Banana still’ni `<FIRST_FRAME>` yoki `<IMAGE_REF_1>` sifatida Omni’ga ber. Promptda scene, subject motion, camera movement, environment effect, lighting, mood, aspect ratio, single-shot talabi va no constraints bo‘lsin. Video yetarli bo‘lmasa, oddiy edit prompt yubor: `Change the lighting... Keep everything else the same.`

### Bosqich 5 — Frontend implementation

Antigravity agentga asset manifestni ber. Agent video/poster/image’ni exact path bilan ulasin. Scroll-scrubbed video uchun poster → decoded video → canvas frame cache fallback; oddiy hero uchun poster/video; mobile uchun poster yoki reduced frame cache ishlat. 3D uchun GLB path, camera, lighting, tone mapping, model scale/origin va loading fallbackni aniq ber.

### Bosqich 6 — Artifact QA

Agent quyidagilarni artifacts sifatida qaytarsin:

1. desktop 1440px screenshot;
2. tablet screenshot;
3. mobile screenshot;
4. reduced-motion screenshot yoki video;
5. console/network error report;
6. asset manifest;
7. acceptance criteria checklist.

### Bosqich 7 — Refinement

Bir turn’da bitta o‘zgarish qil. Format:

```text
Observed: [aniq ko‘ringan muammo]
Cause: [taxminiy texnik sabab]
Change: [faqat bitta o‘zgarish]
Preserve: [o‘zgarmasligi kerak bo‘lgan qismlar]
Verify: [qaysi viewport/test bilan qayta tekshirish]
```

## 4. Nano Banana asset prompti

Still asset uchun quyidagi shablondan foydalan:

```text
Create an original [asset type] for a premium interactive website.

ROLE
- Asset role: [hero still / video poster / product render / texture / editorial image]
- Brand/audience: [brand and audience]
- Placement: [full-bleed hero / card / fixed background / 3D reference]

COMPOSITION
- Aspect ratio: [16:9 / 21:9 / 4:5 / 1:1]
- Focal point: [subject and exact position]
- Keep negative space on [left/right/top] for readable HTML headline and CTA.
- Crop-safe at desktop [ratio] and mobile [ratio].

ART DIRECTION
- Palette: [exact colors]
- Materials: [glass/chrome/fabric/paper/etc.]
- Lighting: [key/fill/rim, direction, softness]
- Camera: [lens/angle/distance]
- Style: [concrete visual properties, not vague adjectives]

REFERENCE AND TEXT
- Use the supplied reference images for [object/character/style] consistency.
- Preserve [brand shape/color/material].
- If text is required, render exactly: "[EXACT TEXT]".

CONSTRAINTS
- No invented logo, claim, UI text or extra subject.
- No visual clutter in the HTML copy area.
- No watermark-like typography except the specified text.
- Output a clean web-ready visual; do not include a browser frame or mockup.
```

**Tanlov:** ko‘p variant/tezlik uchun Lite; muvozanatli hero va ko‘p reference uchun Nano Banana 2; premium brand consistency va murakkab art direction uchun Pro.

## 5. Gemini Omni video prompti

### Image-to-video / reference-to-video

```text
Use <FIRST_FRAME> as the starting frame and <IMAGE_REF_1> as the visual reference.

Create a [duration]-second [16:9 or 9:16] video for a premium interactive website.
In a single continuous shot with no scene cuts:
- Subject: [exact subject]
- Subject motion: [specific movement, speed, direction, loop behavior]
- Camera movement: [push-in/orbit/pan/tilt/tracking], [start] to [end]
- Environment: [particles/fabric/reflection/fog/light response]
- Lighting: [specific change over time]
- Mood/material: [concrete visual attributes]
- Timing: [at 0s..., between 2–4s..., at final frame...]
- Preserve the composition and identity of the reference subject.
- Keep the left/right [x%] area clean for HTML overlay.
- No dialogue. No extra text. No extra sound effects.
- Keep the final frame visually close to the first frame for a seamless web loop.
```

### Video edit follow-up

```text
Change only [one aspect] of the previous video: [lighting/background/subject speed/text].
Keep everything else the same, including composition, camera path, subject identity and timing.
```

`make it move` demasdan camera, subject, environment va timingni yoz. Omni default bir nechta shot yaratishi mumkin, shu sabab `single continuous shot` va `no scene cuts`ni explicit ber.

## 6. Antigravity build prompti

```text
/goal
Build the complete first version of this motion website in the existing project.

ROLE
Act as a senior creative frontend engineer and motion designer. First inspect the project and references, then create a short implementation plan. Do not modify files until the plan and missing inputs are clear.

INPUTS
- Reference: [screenshot/URL/path]
- Asset manifest: [path]
- Exact copy/content: [path or inline]
- Project mode: [recreation/original/preserve]

IMPLEMENT
- Stack: React + TypeScript + Tailwind CSS + Framer Motion + Three.js only where required.
- Implement every section, route and primary interaction in the first complete version.
- Use exact asset paths from the manifest; do not invent replacement stock media.
- Implement [scroll-scrubbed video/pinned scene/GLB/parallax] with explicit start/end states.
- Add responsive behavior for [breakpoints], keyboard accessibility and reduced-motion fallback.
- Keep media layers non-interactive; keep CTA/nav layers interactive.

VERIFY
- Run the app, inspect desktop/tablet/mobile in the browser, and fix console errors.
- Produce screenshots and a concise QA artifact.
- Do not stop at a static mockup or partial section.
```

`/grill-me` ni implementationdan oldin ishlat; `/goal` ni complete first version va testlar uchun ishlat; `/browser` ni browser preview/test kerak bo‘lganda explicit ber.

## 7. Master orchestration prompti

```text
You are the director of a multi-agent motion website build.

GOAL
Create a production-quality, responsive, accessible interactive website for [brand/project].

PHASE 1 — CLARIFY
Use /grill-me. Ask only the questions that materially affect layout, content, assets, motion, stack or acceptance criteria. Mark missing values as [NEEDS INPUT].

PHASE 2 — PLAN
Return a short plan with: page structure, design tokens, asset list, motion graph, breakpoints, fallback strategy, subagent assignments and acceptance criteria.

PHASE 3 — DELEGATE
Run focused subtasks in parallel where safe:
A. Visual asset agent: generate Nano Banana stills and an asset manifest.
B. Motion asset agent: use Gemini Omni to create/edit video assets from approved references.
C. Frontend agent: implement the complete page using the manifest.
D. QA agent: test browser screenshots, responsive layout, keyboard, reduced motion, network and console.
Each subagent must return files, assumptions and done criteria. Do not let an asset agent redesign the layout or a QA agent silently change the design.

PHASE 4 — INTEGRATE
Use the approved asset manifest and exact paths. Preserve the design contract. Implement all main sections before micro-polish.

PHASE 5 — VERIFY
Use /browser. Produce desktop/tablet/mobile screenshots and a QA artifact. Fix failures, then rerun the checks.

PHASE 6 — REFINE
Only one visual/interaction change per turn. Preserve everything not named in the change request.
```

## 8. Iteratsiya va QA protokoli

### Visual

- Reference hierarchy, type scale, whitespace, colors, asset crop va overlay contrast mosmi?
- Hero asset HTML copy uchun negative space qoldirganmi?
- Video poster → video transition’da flash yoki layout shift yo‘qmi?

### Motion

- Trigger scroll/hover/click bilan deterministic ishlaydimi?
- Start/end state, duration, easing va timing event aniqmi?
- Omni video single-shot, seamless first/last frame va desired aspect ratio’dami?

### Responsive/accessibility

- 375px, 768px va 1440px atrofida overflow yo‘qmi?
- Mobile’da heavy canvas/video soddalashtirilganmi?
- Keyboard focus, Escape, `aria-expanded`, alt text va reduced-motion mavjudmi?

### Performance

- Noncritical media lazy-loadedmi?
- Canvas DPR 2 bilan cheklanganmi?
- Texture/image compression, `dispose`, network fallback va no-console-error tekshirilganmi?

### Scoring

Asset pipeline va provider role’larini ham hisobga olgan holda 14 qatlamni 0–2 ball bilan bahola: identity, content, assets, asset-generation prompt, stack, tokens, structure, motion, video prompt, sections, responsive, accessibility/performance, constraints, acceptance. 22 balldan past promptda builder taxmini ko‘p bo‘ladi.

## 9. Cheklovlar va anti-patternlar

- `Gemini 3.7 Flash` o‘zida image generation yo‘q; Nano Banana’ni alohida chaqir.
- `Gemini Omni Flash` preview; video generation/editing asset layer’idir, frontend interaction layer emas.
- `Antigravity 2.0` image/video generator emas; u agent orchestration va workspace layer.
- `Nano Banana` family nomi; promptlarda kerakli model ID’ni aniq yoz.
- “Make it premium”, “make it move”, “add a cool animation” kabi vague request’larni scene/state/timing/asset field’lariga ajrat.
- Bitta ulkan promptda barcha agentlarni aralashtirma; role, input, output va done criteria bilan ajrat.
- Video generation output’ni HTML text sifatida ishlatma; video poster va real asset path bilan integrate qil.
- First version tugamasdan navbatdagi mikro-o‘zgarishlarni yuborma.
- Reference’dan boshqa brendning logo, copy yoki proprietary asset’ini ruxsatsiz ko‘chirma.

## 10. Rasmiy manbalar

- [Gemini 3.7 Flash launch](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/)
- [Gemini 3.7 Flash model docs](https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash)
- [Latest Gemini 3.7 Flash guide](https://ai.google.dev/gemini-api/docs/latest-model)
- [Antigravity 2.0 product](https://antigravity.google/product/antigravity-2)
- [Antigravity 2.0 launch blog](https://antigravity.google/blog/introducing-google-antigravity-2)
- [Antigravity getting-started Codelab](https://codelabs.developers.google.com/getting-started-google-antigravity)
- [Antigravity Agent docs](https://ai.google.dev/gemini-api/docs/antigravity-agent)
- [Nano Banana image generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Gemini Omni Flash video docs](https://ai.google.dev/gemini-api/docs/omni)
- [Gemini prompt design strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)
