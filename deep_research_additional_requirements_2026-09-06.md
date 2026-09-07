# Deep Research uchun qo‘shimcha aniqliklar

Quyidagi assumptions asosida davom eting. Qo‘shimcha aniqlashtirish talab qilinmasin; agar ayrim joylarda real loyiha ma’lumoti yetishmasa, shu bazaviy modeldan foydalaning va kerak bo‘lsa alternativ ssenariylarni ham ko‘rsating.

## 1. Foydalanuvchi interaksiyasi modeli

Loyiha hybrid modelda ishlaydi:

- Telegram Bot mustaqil interfeys hisoblanadi va foydalanuvchidan oddiy matnli AI so‘rovlarini qabul qila oladi.
- Telegram Mini App asosiy va boy interfeys hisoblanadi.
- AI agent ham Bot orqali, ham Mini App orqali ishlaydi.
- Ikkala kanal bitta backend, bitta user identity modeli va imkon qadar bitta conversation/history tizimidan foydalanadi.
- Bot tezkor savollar, notification, command, onboarding, status va deep-link uchun ishlatiladi.
- Mini App esa murakkab AI interaction, file upload, image/video, dashboard, settings, history, billing/usage, structured forms va boshqa UI talab qiladigan funksiyalar uchun ishlatiladi.
- Bot Mini Appni ochish uchun entry point ham bo‘lishi mumkin.
- Mini Appdan boshlangan jarayon Bot orqali notification yoki natija yuborishi mumkin.
- Background AI task tugaganda foydalanuvchiga Bot orqali xabar yuborish imkoniyati ham architecturega kiritilsin.
- Telegram user ID asosiy Telegram identity sifatida ishlatiladi, lekin backendda ichki UUID/user record saqlansin.
- Mini App `initData` backendda tekshiriladi.
- Bot webhook requestlari Telegram secret token va boshqa kerakli security mexanizmlari orqali tekshiriladi.
- Bot va Mini App o‘rtasidagi conversation contextni birlashtirishning to‘g‘ri va xavfsiz usuli ham research qilinsin.

Asosiy interaction flow:

```text
Telegram User
→ Bot
→ /start yoki oddiy AI message
→ Backend
→ AI Agent
→ Database / R2 / Gemini
→ Bot response
```

yoki:

```text
Telegram User
→ Bot
→ Open Mini App
→ Cloudflare Pages frontend
→ Backend API
→ Telegram initData verification
→ Supabase / R2 / Gemini
→ Mini App result
→ zarur bo‘lsa Bot notification
```

Shu hybrid model primary reference architecture bo‘lsin.

---

## 2. Free Tier Resource Allocation uchun workload assumptions

100, 1K, 10K va 100K foydalanuvchi deganda jami registered user emas, avvalo platformadagi user base sifatida qaralsin.

Capacity planning uchun alohida:

- Registered Users
- MAU
- DAU
- Peak Concurrent Users

ajratib hisoblang.

Default workload sifatida quyidagi **Medium Usage Scenario**ni ishlating.

### User activity

Default:

- MAU = jami userlarning 50%
- DAU = jami userlarning 20%
- Peak concurrent users = DAUning taxminan 5–10%

Shuningdek Low / Medium / Heavy usage ssenariylarini ham yarating.

### Har bir DAU uchun kunlik faollik

O‘rtacha:

- 8 ta AI interaction/day
- 15 ta backend API request/day
- 5 ta Telegram Bot update/message event/day
- 10 ta DB read/day
- 4 ta DB write/day
- 0.10 ta media upload/day
- 2 ta stored/history retrieval/day

Bu sonlarni research davomida real platform limits bilan solishtiring.

### AI usage

Default AI interaction:

- input: o‘rtacha 1,500 token
- output: o‘rtacha 500 token
- jami: taxminan 2,000 token/request

8 AI request/day bo‘lsa:

**~16,000 AI token/DAU/day**

Lekin AI usage uchun 3 ssenariy yarating:

#### Low
- 4 AI request/day
- ~1,000 total token/request

#### Medium
- 8 AI request/day
- ~2,000 total token/request

#### Heavy
- 20 AI request/day
- ~5,000 total token/request

Bundan tashqari context/history noto‘g‘ri boshqarilganda token sarfi qanchalik oshishini ham ko‘rsating.

AI token budgetda:

- input
- output
- cached input
- embeddings
- tool/function calls
- multimodal request

imkon qadar alohida hisoblang.

### Database

Medium scenario:

Har bir DAU/day:

- 10 read
- 4 write
- 2 conversation/history query
- 1 analytics/event batch

Average user data:

- profile/settings: 5–20 KB
- conversation metadata: 10–50 KB
- text history: oyiga taxminan 1–10 MB/usergacha chiqishi mumkin

DB capacity planningda faqat request count emas:

- database size
- indexes
- connection count
- connection pooling
- concurrent queries
- bandwidth/egress
- Realtime usage

ham hisobga olinsin.

### Storage / R2

Medium scenario:

100 DAUdan taxminan 10 tasi kuniga bitta media upload qiladi.

Average media:

- image: 2 MB
- document: 5 MB
- audio: 3 MB
- video: 20–50 MB

Default mixed average upload hajmi:

**5 MB/upload**

Default:

**0.1 upload/DAU/day × 5 MB**

ya’ni o‘rtacha:

**0.5 MB new storage/DAU/day**

Lekin storage uchun alohida:

- images-heavy
- documents-heavy
- video-heavy

ssenariylarini ko‘rsating.

R2da faqat GB storage emas:

- Class A operations
- Class B operations
- download/read operations
- multipart uploads
- metadata requests
- CDN/cache hit ratio

ham hisoblanishi kerak.

### Telegram webhook

Medium:

- 5 inbound Telegram events/DAU/day
- Bot yuboradigan outbound response taxminan 5–10/DAU/day

Burst traffic uchun oddiy average emas, peak load ham hisoblang.

Masalan:

kampaniya yoki notificationdan keyin DAUning 5–15%i 1–5 daqiqada kirishi mumkin.

Shunga qarab webhook/backend concurrencyni baholang.

### Backend API

Medium:

**15 requests/DAU/day**

Lekin AI streaming, polling yoki frontendning noto‘g‘ri implementationi request sonini keskin oshirishi mumkin.

Shuning uchun:

- efficient architecture
- inefficient architecture

ni ham taqqoslang.

### User scale

Quyidagi 4 darajani hisoblang:

#### 100 users
- 50 MAU
- 20 DAU

#### 1,000 users
- 500 MAU
- 200 DAU

#### 10,000 users
- 5,000 MAU
- 2,000 DAU

#### 100,000 users
- 50,000 MAU
- 20,000 DAU

Har bir darajada Low / Medium / Heavy scenario hisoblang.

Natijada jadvalda:

- AI requests/day
- AI tokens/day
- AI tokens/month
- backend requests/day
- DB reads/writes
- new storage/day
- storage/month
- R2 operations
- Telegram webhook requests
- outbound Bot messages
- estimated bandwidth
- estimated concurrency

ko‘rsating.

Keyin har bir scale uchun:

**Which free tier fails first?**

degan xulosa bering.

Bu raqamlarni mutlaq haqiqat sifatida emas, capacity-planning assumptions sifatida belgilang.

Agar real 2026 pricing/limitlardan kelib chiqib yaxshiroq professional benchmark tavsiya qilish mumkin bo‘lsa, uni ham alohida ko‘rsating.

---

## 3. Senior Engineer Knowledge Map va architecture trade-offs

Ha. Qo‘llanma faqat configuration tutorial bo‘lmasligi kerak.

Staff/Principal darajasida **architecture trade-off va engineering decision-making chuqur yoritilishi majburiy.**

Faqat:

> “Supabase oson”

yoki:

> “Azure scalable”

kabi umumiy xulosalar yetarli emas.

Har bir muhim tanlov uchun texnik taqqoslash kerak.

Kamida quyidagilarni chuqur solishtiring:

### Database

- Supabase PostgreSQL vs Azure Database for PostgreSQL
- managed PostgreSQL vs self-managed PostgreSQL
- Supabase Storage metadata + PostgreSQL vs alohida object storage

Taqqoslash mezonlari:

- cost
- free tier
- connection limits
- pooling
- latency
- backup
- PITR
- HA
- replication
- scaling
- observability
- vendor lock-in
- migration complexity
- operational burden
- security
- developer experience

### Backend compute

- Render Web Service
- Azure Functions
- Azure Container Apps
- Azure App Service
- Cloudflare Workers, agar mos bo‘lsa

Quyidagilar bo‘yicha:

- long-running process
- Telegram webhook
- AI streaming
- WebSocket
- background jobs
- cron
- cold start
- execution timeout
- CPU/RAM
- concurrency
- scaling
- Docker support
- persistent connection
- cost

taqqoslang.

### Storage

- Supabase Storage
- Cloudflare R2
- Azure Blob Storage

Taqqoslang:

- GB/month
- egress
- operations
- CDN
- signed URLs
- S3 compatibility
- CORS
- image/video workload
- security
- developer experience

### Frontend

- Cloudflare Pages
- Render Static
- Azure Static Web Apps
- boshqa real alternativlar kerak bo‘lsa

### AI

2026-yil 6-sentyabrda mavjud amaldagi variantlardan:

- Gemini Pro-class model
- Gemini Flash-class model
- Azure AI orqali ishlatilishi mumkin bo‘lgan mos modellarga

workload-based routing nuqtai nazaridan qarang.

### Auth

- Telegram-native identity
- Supabase Auth
- custom JWT/session layer

qachon qaysi biri kerakligini tahlil qiling.

---

Har bir architecture comparison quyidagi formatda bo‘lsin:

**Option A**

**Option B**

**Technical differences**

**Performance**

**Reliability**

**Scaling**

**Security**

**Operational complexity**

**Cost at 100 / 1K / 10K / 100K users**

**Vendor lock-in**

**Migration difficulty**

**Failure modes**

**When A wins**

**When B wins**

**Final recommendation**

Architecture Decision Record, ya’ni ADR usulidan ham foydalaning.

Masalan:

### ADR-001: Backend hosting

**Context**

**Requirements**

**Options considered**

**Trade-offs**

**Decision**

**Why**

**Consequences**

**When to reconsider**

Shunday qilib Staff/Principal bo‘limida faqat texnologiyani ishlatishni emas, **nega aynan shu texnologiya tanlanishini, qaysi holatda boshqa variantga migratsiya qilish kerakligini va qarorning uzoq muddatli oqibatlarini** tushuntiring.

---

## Qo‘shimcha talab

Research agent mavjud assumptions yetarli bo‘lsa, boshqa clarification savollarini bermasdan researchni boshlasin.

Noma’lum joylarda:

1. reasonable engineering assumption qilsin;
2. uni `Assumption` deb belgilasin;
3. Low / Medium / Heavy ssenariylar orqali uncertainty’ni ko‘rsatsin;
4. factual limit va pricingni esa faqat 2026-09-06 holatidagi tekshirilgan rasmiy manbalardan olsin.

Maqsad bitta aniq loyihaga haddan tashqari bog‘lanib qolish emas. Asosiy reference project yuqoridagi Telegram Mini App + Bot + AI Agent bo‘lsin, lekin qo‘llanma boshqa production AI loyihalarga ham qo‘llash mumkin bo‘lgan senior-level engineering handbook sifatida yozilsin.
