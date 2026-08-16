# Prompt framework

## Mundarija

1. Promptning maqsadi va rejimi
2. Bo‘limlar schema’si
3. Exact recreation shabloni
4. Original concept shabloni
5. Preserve-and-customize shabloni
6. Prompt kuchini baholash

## 1. Maqsad va rejim

Har bir prompt avval “nimani aynan saqlash kerak?” degan savolga javob beradi. `pixel-faithful recreation` reference’dagi layout, copy, font, rang, effect va behavior’ni o‘zgartirmaslikka qaratiladi. `original concept` reference’ni faqat visual direction sifatida ishlatadi. `preserve-and-customize` esa mavjud dizayn tizimini saqlab, business content va assetlarni almashtiradi.

## 2. Bo‘limlar schema’si

| Bo‘lim | Majburiy savol | Tavsiya etiladigan qiymatlar |
|---|---|---|
| Page identity | Bu sahifa kim uchun va qanday kayfiyatda? | title, brand, audience, purpose, anti-directions |
| Assets | Qaysi fayl qayerda va qanday ishlatiladi? | exact URL/path, role, dimensions, crop, fallback, alt |
| AI asset pipeline | Qaysi model qaysi assetni qanday yaratadi? | Nano Banana model, Omni reference, duration, aspect ratio, manifest |
| Stack and setup | Agent qaysi texnologiyada ishlaydi? | framework, dependencies, title, reset, entry files |
| Fonts/tokens | Visual grammar nimadan iborat? | font weights, colors, spacing, radius, blur, shadows |
| Global structure | Layering va viewport qanday? | root, fixed/sticky layers, z-index, sections, spacer |
| Interaction/motion | Foydalanuvchi nima qilsa nima o‘zgaradi? | trigger, state, property, timing, fallback |
| Sections | Har bir content block qanday tuzilgan? | hierarchy, copy, layout, asset, CTA, delay |
| Responsive | Breakpointlarda nima o‘zgaradi? | nav, grid, typography, spacing, asset simplification |
| Accessibility/performance | Qanday xavfsiz va tez ishlaydi? | alt, focus, keyboard, reduced-motion, lazy-load, DPR |
| Content constraints | Agent nimani o‘ylab topmasin? | exact copy, placeholder tokens, forbidden inventions |
| Acceptance criteria | Tayyorligini qanday bilamiz? | visual, functional, responsive, console checks |

## 3. Exact recreation shabloni

```markdown
# Exact recreation prompt — [PROJECT]

Recreate this page **pixel-faithfully**. Stack: [STACK]. Do not invent alternate copy, layout, fonts, colors, assets, or effects. Preserve the reference’s hierarchy and interaction model.

## Page identity
- Title: `[TITLE]`
- Brand mark and wording: `[EXACT BRAND]`
- Purpose and audience: `[PURPOSE]`
- Overall feel: `[3–5 concrete visual traits]`
- Avoid: `[ONLY IMPORTANT ANTI-DIRECTIONS]`

## Assets
- Hero media: `[EXACT URL/PATH]`; role: `[ROLE]`; dimensions: `[DIMENSIONS]`; fallback: `[FALLBACK]`.
- Secondary image/model: `[URL/PATH]`; display: `[SIZE/CROP]`; alt: `[ALT]`.
- Do not replace exact assets with invented stock media.

## AI asset pipeline
- Still assets: use `[Nano Banana 2 / Nano Banana Pro / Nano Banana 2 Lite]` for `[ROLES]`; preserve `[REFERENCE/BRAND/COMPOSITION]`.
- Motion assets: use `[Gemini Omni Flash]` with `[FIRST_FRAME/IMAGE_REF]`; specify duration, aspect ratio, single-shot requirement, camera movement, subject motion, timing and no constraints.
- Save an asset manifest containing filename, model, prompt, dimensions, role, alt text and fallback. Do not let generated media replace exact user-provided assets.

## Stack and setup
- Use `[FRAMEWORK]` and only `[DEPENDENCIES]`.
- Set document title to `[TITLE]`.
- Add `[RESET/FONT/BASE CSS]`.
- Keep all implementation in `[FILES/STRUCTURE]`.

## Fonts and design tokens
- Headline: `[FONT]`, weights `[WEIGHTS]`, sizes `[BREAKPOINTS]`.
- Body/labels: `[FONT]`, weights `[WEIGHTS]`.
- Colors: background `[COLOR]`, primary `[COLOR]`, secondary `[COLOR]`, accent `[COLOR]`.
- Spacing: horizontal rhythm `[VALUES]`; section top/bottom `[VALUES]`.
- Reusable materials: `[PANEL/BORDER/SHADOW/BLUR TOKENS]`.

## Global structure
[Describe root, fixed/sticky media, z-index layers, navigation, main sections and scroll length.]

## Interaction and motion
For every interaction, specify:
- Trigger: `[scroll/click/hover/viewport/load]`.
- Start state: `[properties]`.
- End state: `[properties]`.
- Mapping/timing: `[progress formula or duration/easing]`.
- Fallback: `[no-JS/no-asset/no-canvas/mobile fallback]`.
- Reduced motion: `[static or simplified behavior]`.

## Navigation
[Desktop, mobile, open/close, focus, Escape and CTA behavior.]

## Section 1 — [NAME]
- Layout: `[GRID/FLEX/POSITIONING]`.
- Copy: `[EXACT COPY OR TOKENS]`.
- Styling: `[CLASSES/TOKENS]`.
- Interaction/reveal: `[THRESHOLD/DELAY/DURATION]`.

## Responsive behavior
- Mobile `[BREAKPOINT]`: `[EXACT CHANGES]`.
- Tablet `[BREAKPOINT]`: `[EXACT CHANGES]`.
- Preserve visual hierarchy and do not let media obscure content.

## Accessibility and performance
- Add meaningful alt text, semantic headings, keyboard focus and visible focus states.
- Respect `prefers-reduced-motion`.
- Lazy-load noncritical media; cap canvas DPR at `[VALUE]`; provide poster/fallback.

## Content constraints
Use the exact copy above. If a value is missing, keep `[TOKEN]`; do not invent brand claims, metrics, testimonials or links.

## Acceptance criteria
- The page matches the supplied hierarchy, tokens and assets.
- All specified interactions work with mouse, touch and keyboard where applicable.
- Desktop, tablet and mobile render without overflow or console errors.
- Reduced-motion and unavailable-media fallbacks remain usable.
```

## 4. Original concept shabloni

Original concept’da reference’dagi nomlar va content’ni ko‘chirma. Quyidagicha yoz:

```markdown
Use [REFERENCE] only as visual direction for [COMPOSITION/MOTION/MATERIAL]. Create an original brand for [AUDIENCE] with the following exact content and constraints. Do not copy its text, logo, distinctive asset, or proprietary illustration.
```

Keyin “Page identity” va “Sections”ni o‘z brending bilan to‘ldir; reference’dan faqat interaction modelini ol. Masalan, “dark editorial layout with pinned hero and scroll-scrubbed abstract media” umumiy design principle bo‘lishi mumkin, lekin boshqa brendning title/copy/asset’i takrorlanmaydi.

## 5. Preserve-and-customize shabloni

```markdown
Preserve the current layout, typography, colors, animation timing, responsive behavior and component hierarchy. Rewrite only the business content for [BUSINESS]. Replace only the listed assets and routes. Do not redesign, simplify, add gradients, remove motion, or change the visual system unless explicitly requested.

Replace:
- Brand: [OLD] → [NEW]
- Headline: [OLD] → [NEW]
- Services: [OLD] → [NEW]
- Assets: [OLD] → [NEW]
- CTA/link: [OLD] → [NEW]

After the first complete version, make one refinement at a time and verify that the preserved design remains unchanged.
```

## 6. Prompt kuchini baholash

Promptni yuborishdan oldin har bir qatlamni 0–2 ball bilan bahola: `0 = yo‘q`, `1 = umumiy`, `2 = aniq va tekshiriladigan`. Identity, assets, AI asset pipeline, stack, tokens, structure, motion, sections, responsive, accessibility/performance, content constraints va acceptance criteria bo‘yicha jami 22 ball mavjud. 18 balldan past promptda AI taxmini ko‘p bo‘ladi; avval eng past ball olgan qatlamni to‘ldir.
