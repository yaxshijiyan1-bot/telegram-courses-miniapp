# Gemini/Antigravity/Nano Banana motion-site tadqiqot qaydlari

## Gemini 3.7 Flash — rasmiy Google blogi

Google 2026-yil 13-avgustdagi blogida Gemini 3.7 Flash’ni coding va agentlar uchun eng kuchli workhorse modeli sifatida taqdim etgan. Blogdagi da’volarga ko‘ra, model software engineering, knowledge work va web development workflow’larida yaxshilangan; u debugging, issue resolution, first-pass code accuracy va production-ready code’da 3.6 Flash’dan yuqoriroq natijalar ko‘rsatgan. Web development’da kamroq prompt bilan funksional layout va feature-complete app yaratishi, screenshot/image/full design system reference’iga yuqori design adherence berishi aytilgan.

Blogdagi eng muhim motion-site dalili: Gemini 3.7 Flash yordamida single-shot interactive landing page yaratilgani, model sub-agent’larni orchestrate qilgani va Gemini Omni orqali smooth interactive parallax componentlar hosil qilingani ko‘rsatilgan. Demak workflow oddiy “bitta model kod yozdi” emas; kuchli model orchestration/planning layer bo‘lib, vizual/interaction specialist modelga subtask beradi.

Blog shuningdek modelning roadblock’larni yaxshiroq yengishi, intent’ni aniqlashtirishi, instruction fidelity, multi-step planning va tool calls’ni yaxshiroq bajarishini ta’kidlaydi. Rasmiy tavsiya sifatida Google Antigravity’da agent-first workflow’larni yoki Gemini API/AI Studio’da development’ni boshlashni ko‘rsatadi.

## Gemini 3.7 Flash — API docs

Rasmiy API model sahifasida `gemini-3.7-flash` native multimodal reasoning model ekani, input sifatida Text, Image, Video, Audio va PDF qabul qilishi ko‘rsatilgan. Output — Text. Input token limit 1,048,576, output token limit 65,536. Code execution, computer use (Preview), file search, function calling, search grounding, structured outputs va thinking (low/medium/high) qo‘llab-quvvatlanadi. Image generation bu modelning o‘zida qo‘llab-quvvatlanmaydi.

Muhim arxitektura xulosasi: Gemini 3.7 Flash — motion site’ning “director/coding/orchestration brain”i bo‘lishi mumkin, lekin Nano Banana yoki Gemini Image kabi image model emas. Rasm yaratish uchun alohida image-generation model/tool chaqiriladi; Gemini 3.7 Flash ularni prompt, asset brief, layout mapping va integration code bilan boshqaradi.

## Hozircha tasdiqlangan nomlar

- Gemini 3.7 Flash: rasmiy Google blogi va API docs bilan tasdiqlangan.
- Gemini Omni: Google blogida interactive parallax components yaratishda specialist layer sifatida tilga olingan; alohida capability docs bilan keyingi bosqichda tekshiriladi.
- Antigravity 2.0: rasmiy Antigravity product/blog sahifalari orqali tekshirilishi kerak.
- Nano Banana: Google AI docs’da Gemini’ning native image generation capabilities nomi sifatida tekshirilishi kerak.
- “Gemini Omni Flash” va “Nano Banana 2” nomlarida aniq versiya/product naming bo‘lishi mumkin; rasmiy docs’dagi model id va capability jadvali bilan ajratish zarur.

## Manbalar

1. https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/
2. https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash

## Antigravity 2.0 — rasmiy product sahifa

Antigravity 2.0 o‘zini agentlar bilan ishlash uchun dedicated platforma sifatida ta’riflaydi. Asosiy mexanizm — bir nechta autonomous agentni mustaqil projectlar bo‘yicha parallel orchestrate qilish. Muhim features: agentlarni launch/monitor/orchestrate qiluvchi central command center; murakkab vazifalarni parallel qismlarga bo‘luvchi dynamic subagents; cron asosidagi Scheduled Tasks; progressni ko‘rsatuvchi Artifacts; global/workspace-specific Skills, MCPs va JSON Hooks; Projects orqali bir nechta folder va permission’larni guruhlash; Live Voice Transcription orqali og‘zaki promptni aniq promptga aylantirish.

Motion site uchun bu quyidagicha talqin qilinadi: bitta agent brief va architecture’ni boshqaradi; subagentlar visual design, asset generation, frontend implementation, motion QA va responsive QA’ni alohida parallel bajaradi; Artifacts esa screenshot, preview, test report, asset manifest va implementation note kabi tekshiriladigan natijalarni qaytaradi. Antigravity 2.0 o‘zi image generator emas, u orchestrator/workspace layer.

## Nano Banana — rasmiy Gemini API docs

Google AI docs Nano Banana’ni Gemini’ning image generation capabilities sahifasi sifatida ko‘rsatadi. Sahifada prompt orqali fully-functional, UI-complete apps prototyping va Nano Banana 2’ning Gemini ecosystem hamda real-world tools bilan integratsiyasi tilga olinadi. Ko‘rsatilgan misollar magazine cover, isometric 3D London, photo editing/restoration, article visual, icon va other image outputs’ni o‘z ichiga oladi.

Bu motion-site pipeline’da Nano Banana’ning roli: hero background, poster frame, editorial image, texture, icon/illustration, 3D reference sheet va style-consistent assetlar yaratish/edit qilish. U frontend motionning o‘rnini bosmaydi; yaratgan rasmlar kodga exact asset sifatida ulanadi. Rasmni “hero”ga ishlatish uchun promptda aspect ratio, focal point, negative space, overlay readability, crop-safe composition, brand palette va output size’ni aniq berish kerak.

## Arxitektura xulosasi

Gemini 3.7 Flash = director/brain/coding/orchestration; Antigravity 2.0 = agent workspace/orchestrator; Gemini Omni = parallax/interactive specialist layer; Nano Banana = image/reference/texture asset generator; frontend stack = React/TypeScript/Tailwind/Framer Motion/Three.js; browser = render/test/QA.

## Gemini Omni Flash — rasmiy API docs

Gemini Omni Flash `gemini-omni-flash-preview` preview model bo‘lib, high-speed video generation, editing va cinematic control uchun mo‘ljallangan. U text, image, audio va video’ni birga qayta ishlaydi; Interactions API orqali conversational editing qiladi va avvalgi video kontekstini saqlab, keyingi turn’da faqat kerakli qismini o‘zgartirishga imkon beradi.

Video workflow’lar:

| Task | Input | Motion-site’dagi vazifa |
|---|---|---|
| `text_to_video` | text prompt | hero background, ambient loop, abstract scene |
| `image_to_video` | reference image + text | Nano Banana image’ni jonlantirish |
| `reference_to_video` | subject reference images + text | brend product/character continuity |
| `edit` | existing/generated video + instruction | lighting, background, timing yoki elementni iterativ tuzatish |

Docs aspect ratio sifatida 16:9 default va 9:16 portrait variantini ko‘rsatadi. Image-to-video’da yuqori resolution reference va aniq camera movement, subject motion va environmental effect tavsiya qilinadi; “make it move” kabi vague promptlar yomonroq natija beradi. Video generation promptida scene description, camera movement, lighting va mood yozish kerak.

Stateful editing’da `previous_interaction_id` orqali avvalgi video state’i saqlanadi; keyingi prompt faqat o‘zgaradigan qismni aytib, qolganini preserve qiladi. Katta video uchun URI delivery tavsiya qilinadi. Limitations: negative prompt alohida parameter sifatida yo‘q, negative instruction regular prompt ichida “Do not…” shaklida yoziladi; video extension/interpolation, multi-video reasoning va voice editing qo‘llanmaydi. Generated video SynthID watermark bilan keladi.

## Prompting xulosasi

Omni uchun yaxshi video prompt: `scene + subject + camera + subject motion + environment + lighting + style/mood + duration/aspect + preserve/do-not constraints`. Nano Banana still image’i composition/reference sifatida berilib, Omni uni real motion layer’ga aylantiradi. Motion-site prompti esa video generation promptidan keyin `asset role + web integration + scroll/hover trigger + fallback + accessibility`ni alohida yozadi.

## Antigravity 2.0 blogi va Codelab

Rasmiy blog Antigravity 2.0’ni IDE ichidagi Agent Manager emas, macOS/Linux/Windows uchun standalone desktop application sifatida ta’riflaydi. Agent bilan synchronous conversation qilish, u ishlab chiqargan Artifacts’ni ko‘rish va artifact ustida feedback berish mumkin. Dynamic subagents main agent tomonidan focused subtasks uchun yaratiladi; ular main context’ni ifloslantirmaydi va parallelism beradi. Asynchronous task management agentni bloklamasdan task/command’larni yuritadi. JSON hooks agent behavior’ini intercept/control qilishga yordam beradi.

Muhim slash command’lar: `/goal` task to‘liq tugaguncha ishlashni bildiradi; `/grill-me` implementationdan oldin aniqlashtiruvchi savollar berishni talab qiladi; `/schedule` kelajakdagi yoki recurring task’ni belgilaydi; `/browser` browser primitives’dan foydalanishni explicit yoqadi. Bu motion-site uchun ikki prompt rejimini beradi: avval `/grill-me` bilan brief/asset/interaction noaniqliklarini aniqlash, keyin `/goal` bilan complete first version + tests’ni tugatish.

Codelab Antigravity project’larini bir yoki bir nechta folder’ni birlashtiruvchi context/scope sifatida tushuntiradi. Har project o‘z agent settings, permission, tools va MCP konfiguratsiyasiga ega. Model tanlash, `+`, `@` va `/` actions orqali qo‘shimcha context/action berish mumkin. Bu motion-site’da frontend repo, asset folder, design reference va QA screenshots’ni bitta Project’ga birlashtirish uchun qulay.

Amaliy workflow: Project yaratish → reference screenshot/brief/assets’ni contextga qo‘shish → `/grill-me` bilan missing decisions’ni chiqarish → main agent architecture plan tuzishi → subagentlar visual system, Nano Banana assets, frontend build, motion implementation va browser QA’ni bajarishi → Artifacts orqali screenshots/report ko‘rish → feedback berish → `/goal` bilan acceptance criteria to‘liq bajarilguncha ishlatish.

## Gemini prompt engineering va Antigravity Agent docs

Google prompt design docs prompt engineering’ni iterative process deb ta’riflaydi: promptlar starting point, natijaga qarab experiment va refine qilinadi. Kutilgan natija chiqmasa wording’ni o‘zgartirish, ba’zan analog task orqali instructionni qayta ifodalash tavsiya qilinadi. Bu motion-site’da “make it premium” kabi noaniq so‘rovni kuzatiladigan field’lar va acceptance testlarga aylantirish kerakligini tasdiqlaydi.

Rasmiy Antigravity Agent docs’ga ko‘ra, Antigravity agent Gemini API’dagi general-purpose managed agent bo‘lib, bitta API interaction agentga reasoning, code execution, file management va web browsing loop beradi. Agent plan qiladi, action bajaradi, resultni observe qiladi va task tugaguncha takrorlaydi. U Gemini 3.7 Flash bilan ishlaydi; modelni `agent_config` orqali sozlash mumkin. Filesystem environment orqali, custom function va MCP server orqali kengaytiriladi. `AGENTS.md` va `.agents/skills/` orqali agent instruction/skill’lari filesystem-native tarzda beriladi.

Agent multi-turn va persistent environment bilan ishlaydi: `environment_id` orqali oldingi fayl/state saqlanadi; incomplete task keyingi interaction’da davom ettiriladi. Background execution, streaming, budget/token control va cron trigger mavjud. Motion-site’ni yaratishda bu “bir prompt = bitta javob” emas, balki persistent build/test/refine loop sifatida ishlatilishi kerak.

Muhim limitationlar: Antigravity agent preview’da; structured output, computer_use, file_search va Google Maps qo‘llanmasligi mumkin; text va image input qo‘llanadi, audio/video/document input agent layer’da cheklangan. Shuning uchun video generation’ni Omni API, image generation’ni Nano Banana API/tool, frontend build va QA’ni Antigravity coding agent orqali bo‘lish kerak.

## Arxitektura yangilanishi

1. Director agent: Gemini 3.7 Flash/Antigravity — briefni tahlil qiladi, plan va acceptance criteria tuzadi.
2. Visual asset agent: Nano Banana — hero still, poster, texture, illustration, reference sheet yaratadi.
3. Motion video agent: Gemini Omni Flash — still/reference’dan video, image-to-video yoki iterativ edit yaratadi.
4. Frontend agent: Antigravity environment — React/Tailwind/Framer Motion/Three.js kodini yozadi, assetlarni ulaydi.
5. QA agent: browser screenshot, responsive, reduced-motion, console/performance testlari.
6. Review loop: artifact screenshot/report asosida one-change-at-a-time refinement.

## Gemini Omni Flash prompt guide’dan aniq qoidalar

Rasmiy prompt guide bo‘yicha Omni default holatda bir nechta shot va narrative yaratishga urinadi. Agar motion-site hero asset’ida uzluksiz bitta scene kerak bo‘lsa, promptda `in a single unbroken scene`, `in a single continuous shot` yoki `no scene cuts` deb yozish kerak.

Keraksiz elementlar uchun sodda negative instructionlar ishlatiladi: `No dialogue`, `No embellishments`, `No extra sound effects`. Video edit’da overly descriptive prompt kutilmagan o‘zgarish keltirishi mumkin; oddiy edit command va `Keep everything else the same` consistency’ni saqlaydi.

Audio default yaratiladi; kerakli bo‘lsa calm background music, high energy techno beat yoki low tinny radio broadcast kabi aniq audio instruction beriladi. Timing event’lar natural language’da yoziladi: `After 3 seconds...`, `At 5s...`, `Every 2s cut...`; precise syntax majburiy emas.

Meta-prompting orqali modelga micro-detail, expression, timing, costume design, character/object specificity va realistic background detail’ga e’tibor berish buyuriladi. Video ichidagi readable text’ni exact quote bilan berish mumkin. Uploaded media rollarini `<FIRST_FRAME>` va `<IMAGE_REF_N>` kabi taglar bilan ajratish mumkin: birinchisi boshlang‘ich frame, ikkinchisi reference sifatida ishlaydi.

Bu qoidalar web motion asset pipeline’iga shunday ko‘chadi: Nano Banana still → Omni `<FIRST_FRAME>` yoki `<IMAGE_REF_1>` → specific camera/subject/environment motion → single continuous shot → audio/no-audio constraint → exact aspect ratio → video assetni frontend’da scroll/hover/section triggerga ulash.

## Model naming va real capabilities (2026-08-15)

Gemini 3.7 Flash `gemini-3.7-flash` — GA va production-ready. Rasmiy docs uni coding, spatial/multimodal reasoning, multi-step agentic workflow va design adherence uchun tavsiya qiladi. 1M context, 64k max output, low/medium/high thinking level mavjud; medium complex code/agent use-case uchun default tavsiya, high esa qiyin coding/tool-use uchun. Antigravity agent’ning yangi default modeli ham Gemini 3.7 Flash.

Nano Banana — bitta model emas, Gemini native image generation capabilities’ning family nomi. Rasmiy family quyidagicha:

| Marketing nomi | Model ID | Asosiy roli |
|---|---|---|
| Nano Banana 2 Lite | `gemini-3.1-flash-lite-image` | Eng tez/arzon; speed/scale; ko‘p reference va sequential edit uchun optimallashtirilmagan |
| Nano Banana 2 | `gemini-3.1-flash-image` | Generalist workhorse; 4K, world knowledge, reliable text rendering, bir nechta reference va consistency |
| Nano Banana Pro | `gemini-3-pro-image` | Professional/complex visual; advanced localization, brand consistency, precision creative control |
| Nano Banana (legacy) | `gemini-2.5-flash-image` | Legacy; yangi loyihalarda Nano Banana 2 Lite’ga o‘tish tavsiya qilinadi |

Gemini 3 image models 1K/2K/4K output, advanced text rendering, thinking mode va 14 tagacha reference image’ni qo‘llaydi. Nano Banana 2 ko‘p object reference, character consistency va 4K creative asset uchun eng muvozanatli tanlov; Pro eng nozik brand/character/style control uchun. Barcha generated images SynthID watermark bilan keladi.

Motion-site asset mapping:

- `Nano Banana 2 Lite`: tez thumbnail, repeated experiments, low-cost placeholder.
- `Nano Banana 2`: hero still, editorial image, product render, poster, texture sheet, multi-reference consistent asset.
- `Nano Banana Pro`: premium hero campaign, exact typography/logo/brand system, complex art direction.
- `Gemini Omni Flash`: still/reference’ni video va cinematic motion assetga aylantirish.
- `Gemini 3.7 Flash + Antigravity`: brief, code, orchestration, test va refinement.
