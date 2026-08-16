# Motion patterns

## Mundarija

1. Scroll-scrubbed video
2. Sticky video va content overlay
3. Pinned scene transition
4. GLB/Three.js
5. Reveal va stagger
6. Glass material
7. Responsive navigation
8. Reduced motion va performance

## 1. Scroll-scrubbed video

Scroll-driven media uchun “video fon bo‘lsin” demasdan quyidagi ketma-ketlikni yoz:

```text
Create a fixed full-bleed media layer with z-0, overflow-hidden and pointer-events-none.
Layer order, bottom to top:
1. poster image, full cover, fade out after a decoded frame is ready;
2. muted playsInline video, preload=auto, visible during warm-up;
3. canvas frame cache, fade in when ready.
Map clamped progress = scrollY / (scrollHeight - innerHeight) to frames.
Smooth with requestAnimationFrame lerp: smoothed += (target - smoothed) * 0.12.
Use object-cover crop math. Cap canvas DPR at 2.
Do not autoplay as a normal looping background; motion is scroll-driven.
If frame extraction fails, seek the visible video only when the target time delta exceeds 0.04s.
```

Bu patternda frame count, max extraction width, poster va local fallback’ni loyiha hajmiga mosla. Mobile’da frame cache’ni kamaytirish yoki oddiy poster/video fallback’iga o‘tishni ko‘rsat.

## 2. Sticky video va content overlay

Media scroll bilan “sahna” sifatida ishlasa, video uchun `sticky top-0 h-screen`, content uchun `relative z-10`, kerak bo‘lsa `-mt-[100vh]` overlay modelini aniq yoz. Overlay gradient content o‘qilishini ta’minlasin, lekin media detail’ini yuvib yubormasin. `pointer-events-none` media qatlamda qolishi, CTA va navigation esa interactive layer’da bo‘lishi kerak.

## 3. Pinned scene transition

Pinned scene prompti quyidagi mappingni o‘z ichiga oladi:

```text
Keep the viewport pinned while scroll drives the scene timeline.
Scene 1 occupies progress 0.00–0.45; scene 2 occupies 0.55–1.00.
During the overlap, transform the first headline from [START] to [END], reduce opacity from 1 to 0, and transform the second headline from [START] to [END], increasing opacity from 0 to 1.
Use one requestAnimationFrame loop and clamp all progress values.
On touch devices keep the same information order but reduce travel distance.
With prefers-reduced-motion, show scene 2 as a static readable state.
```

Text scatter, fly-up, blur, scale va rotation uchun target property’larni alohida sanab chiq. “Cinematic” faqat kayfiyat; u timing va state o‘rnini bosa olmaydi.

## 4. GLB/Three.js

3D promptida kamida quyidagilarni ber:

| Field | Misol |
|---|---|
| File | `/assets/model.glb` yoki exact URL |
| Texture | 1K–2K, mobile uchun yengil variant |
| Renderer | Three.js/WebGL, antialias, alpha/background |
| Lighting | key/fill/rim light, intensity va rang |
| Tone | tone mapping va exposure qiymati |
| Camera | FOV, position, target/orbit chegarasi |
| Model | scale, origin, rotation, initial pose |
| Motion | scroll/cursor/drag triggeri va state’lar |
| Loading | poster, progress, error fallback |
| Performance | dispose, lazy load, DPR cap, reduced motion |

Dark/muddy render keng tarqalgan bo‘lsa, promptga “Apply tone mapping; do not leave the GLB unlit or muddy” kabi aniq guardrail qo‘sh. Model o‘lchami va origin’i noma’lum bo‘lsa, agentdan bounding box asosida normalize qilishni so‘ra.

## 5. Reveal va stagger

Har bir element uchun umumiy patternni bir marta belgila:

```text
Use IntersectionObserver with threshold 0.15.
Hidden state: translateY(2rem) and opacity 0.
Visible state: translateY(0) and opacity 1.
Transition: 700ms ease-out; add will-change-transform.
Use explicit per-element delays: logo 0ms, links 100 + i*100ms, CTA 500ms.
```

Bir section ichidagi barcha elementni bir xil delay bilan chiqarma. Hierarchy bo‘yicha logo → navigation → label → heading → supporting copy → CTA ketma-ketligini saqla.

## 6. Glass material

Glass effect’ni ko‘paytirish uchun har bir komponentga yangi gradient o‘ylab topma. Tokenlar ber:

```text
Glass panel: bg-white/15 + backdrop-blur-md.
Large panel: bg-white/10.
Border: border-white/15–25.
Primary CTA: solid light surface + dark text.
Secondary CTA: translucent surface + light border.
Text over media: white + drop-shadow-md/lg.
Mono label: uppercase + tracking-[0.15em] + 10–12px.
```

Agar custom CSS kerak bo‘lsa, pseudo-elementlar, mask, inset shadow, saturation/brightness va `pointer-events:none`ni exact yoz. Interaction state’lar: default, hover, active, focus-visible, disabled.

## 7. Responsive navigation

Desktop va mobile’ni alohida ko‘rsat. Mobile menu uchun state, trigger, overlay, close button, focus behavior va Escape tugmasini yoz. Stagger delay bo‘lsa `0.15 + i * 0.05` kabi formula ber. Menu ochilganda body scroll lock qilish, overlay esa `z-[55]`, toggle `z-[60]` kabi layering bilan belgilanadi. `aria-expanded`, `aria-controls` va visible focus ring’ni kirit.

## 8. Reduced motion va performance

Har qanday motion prompt quyidagilarni qamrab olsin: `prefers-reduced-motion: reduce` bo‘lganda transitionlarni o‘chirish yoki statik final state; video/3D bo‘lmasa poster yoki static image; noncritical media uchun lazy-loading; canvas DPR cap; texture/image compression; cleanup/dispose; mobile’da ortiqcha frame extractionni kamaytirish; no console errors; keyboard focus; meaningful alt text.

## 9. Nano Banana still → Omni video → frontend

AI-generated media uchun generation prompti va runtime behavior’ni alohida yoz. Still assetni Nano Banana 2/Pro’da composition, negative space, crop safety va brand consistency bilan tasdiqla. Uni Omni’ga `<FIRST_FRAME>` yoki `<IMAGE_REF_1>` sifatida ber va `single continuous shot`, `no scene cuts`, subject motion, camera path, timing, aspect ratio hamda final-frame continuity’ni ko‘rsat.

```text
Asset stage: Nano Banana [2/Pro]
- role: [hero still/poster]
- aspect ratio: [21:9]
- HTML copy safe area: [left 40%]
- references: [object/character/style]

Motion stage: Gemini Omni Flash
- input role: <FIRST_FRAME>
- duration: [7s]
- camera: [slow push-in]
- subject: [exact motion]
- environment: [specific effect]
- no scene cuts; final frame close to first frame

Runtime stage: React
- poster first; video muted/playsInline; optional canvas frame cache
- scroll progress clamp + lerp; mobile poster/low-cost fallback
- reduced-motion static poster/final frame
```

Omni video yaratishi frontend’dagi scroll interaction’ni avtomatik bermaydi. Video assetni `poster`, `video`, `canvas` va scroll progress mapping bilan runtime’da implement qil. Edit follow-up’da bitta o‘zgarish berib, `Keep everything else the same` bilan composition consistency’ni saqla.
