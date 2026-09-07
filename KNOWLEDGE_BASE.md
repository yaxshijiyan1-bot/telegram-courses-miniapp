# 🧠 KNOWLEDGE_BASE — Kreativ AI Platforma Bilim Bazasi

> **Maqsad:** Bu fayl keyingi AI agentlar (yoki dasturchilar) uchun yagona bilim manbasi.
> Har bir sessiyada topilgan xato, sabab, tuzatish va o'rganilgan bilim SHU YERGA qo'shiladi va yangilanadi.
> Yangi AI bu faylni ishni boshlashdan oldin O'QIYDI. Hisobot yozayotganda «Topilgan xatolar» bo'limidan fakt olib, qayta o'ylab chiqmasin.
> **Yozish qoidasi:** har yozuv = XATO (aniq file:line) + SABAB + TUZATISH + QANDAY TEKSHIRILDI. Umumiy gaplarsiz.

---

## 📁 Loyiha pasporti (qisqa)

| Item | Qiymat |
|---|---|
| Mahsulot | Telegram Mini App — Premium kurslar platformasi («Kreativ AI») |
| Stack | FastAPI (Python) + React 18/TS/Vite/Tailwind + Telegram Bot (httpx, long-polling, aiogiiz yo'q) |
| Storage | Supabase (PostgREST) asosiy, SQLite (`data/app.db`) avtomatik fallback — `backend/app/storage/__init__.py` probe qiladi |
| Media | Cloudflare R2 (presigned GET; `/api/media/{key}` → 307 redirect, kesh 24 soat, presign 25 soat) |
| Frontend hosting | Cloudflare Pages (`_headers`: index no-cache, assets immutable) |
| Backend hosting | Render (`main.py` — lifespan ichida bot polling + storage init) |
| Bot | `backend/bot_service.py` — FastAPI lifespan'da 24/7 long-polling, aiogram YO'Q |
| Testlar | `backend/test_security_and_fixes.py`, `backend/test_api_endpoints.py`, `backend/test_full_suite.py`, `backend/test_bot_regression.py`, `backend/smoke_test.py` |

**Muhim config (`backend/app/core/config.py`):** `BOT_TOKEN`, `BOT_USERNAME` (default: `kreativaibot`), `ADMIN_IDS`, `JWT_SECRET` (BO'SH default — productionda ALBATTA .env'da bo'lishi kerak), `TELEGRAM_AUTH_MAX_AGE_HOURS=24`.

---

## 🔐 Arxitektura invariantlari (buzib bo'lmas qoidalar)

Ushbu qoidalar oqimlarning «kontrakt»lari. Refactor qilayotganda ularni saqlash shart:

1. **To'lov statuslari faqat shartli (compare-and-set) o'tadi**: `store.transition_purchase_status(purchase_id, expected_status, fields)` — ikki admin bir vaqtda bossa faqat bittasi o'tadi (SQLite `UPDATE ... WHERE status=?`, Supabase PATCH `id=eq&status=eq`). Boshqa joyda statusni to'g'ridan-to'g'ri o'zgartirish TAQIQ.
2. **Hamyondan pul faqat ledger orqali harakat qiladi**: har bir kirim/chiqim `wallets` JSON'dagi `history` ga `{delta, type, tx, created_at}` yoziladi. `type=spend` va aniq `tx` bo'yicha yozuv — YAGONA haqiqiy manba. `comment` maydoniga hech qachon pul hisobida tayanilmaydi (u foydalanuvchi tomonidan boshqariladi).
3. **Promokod TASDIQLASHDA sarflanadi** (`consume_code` approve oqimida), rad etilsa kod saqlanib qoladi.
4. **Chegirma faqat `discount_limit >= 1` da real narxni o'zgartiradi**; limit = 0/None bo'lsa `discount_percent` faqat «ko'rsatkich». `course_pricing()` — yagona narx manbai (mini-app, bot, checkout — hammasi shu funksiyadan oladi).
5. **Join-request linklari bir martalik**: xaridorga 72 soatlik `createChatInviteLink` beriladi, join tasdiqlangach `revokeChatInviteLink` bilan bekor qilinadi; join request faqat (chat_id, telegram_id, invite_link) uchlashmosi mos bo'lsa tasdiqlanadi (`is_join_request_authorized`).
6. **Telegram parse_mode=HTML yuborilganda HAR BIR foydalanuvchidan kelgan satr `html.escape()`dan o'tishi shart** (ism, username, izoh, kurs nomi). Aks holda `can't parse entities` xatosi yoki soxta formatting.
7. **`initData` faqat qat'iy HMAC-SHA256 bilan** (`validate_telegram_init_data`): bo'sh bot_token = rad, eski auth_date (>24 soat) = rad, `hmac.compare_digest` bilan.
8. **`SYSTEM[...]` teglari faqat SERVER yozadi**: checkout foydalanuvchi commentidan `SYSTEM[`, `wallet:`, `promo:` ni almashtirib tashlaydi; bot chek captionida ham xuddi shu tozalash bor.

---

## 🐞 Topilgan xatolar tarixi

### Sessiya: 2026-09-07 (2-qism) — Lightbox skrol xatosi + hamyon/referal audit

#### X-8. «Lavhalar» rasmni kattalashtirganda skrol bilan surilib kesilishi
- **Joy:** `frontend/src/pages/CourseDetailPage.tsx` (va aynan shu pattern `LessonPlayerPage.tsx`da ham bor edi)
- **Xato:** lightbox `position: fixed` bo'lsa-da, **sahifa ildiz elementida `animate-fade-up`** klassi bor (transform: translateY animatsiyasi, `both` fill — tugagach ham transform qoladi). CSS bo'yicha transform'li ota ichidagi `fixed` bola viewport'ga emas, otasiga nisbatan joylashadi → lightbox sahifa skroli bilan surilib ko'rinishdan kesilib chiqadi. Aynan foydalanuvchi report qilgan simptom.
- **Tuzatish:** yangi umumiy komponent `frontend/src/components/Lightbox.tsx` — `createPortal(document.body)` orqali render qilinadi (ota-transform ta'siri butunlay uziladi), body+html scroll lock, touch-swipe, klaviatura (Esc/←/→), oldinga-orqaga tugmalari, sanoq badge. Ikki sahifa ham o'z inline lightbox'ini shu komponentga almashtirdi.
- **Tekshiruv:** `tsc --noEmit` 0 xato, `npm run build` OK.
- **SABAQ (universal):** sahifa ildiziga transform animatsiyasi (`animate-fade-up`, framer-motion `motion.div` va h.k.) qo'ymoqchi bo'lsangiz, ichidagi barcha `fixed` elementlar (lightbox, modal, toast, bottom-sheet) viewport'ga bog'lanmay qoladi. Yechim: full-screen overlay'larni har doim `createPortal(document.body)` bilan render qilish.

#### X-9. Hamyon + referal tizimi auditi — XATO TOPILMADI, lekin to'liq isbotlandi
- **Joy:** `app/services/wallet.py`, `app/services/promos.py`, `app/services/purchases.py`, `app/api/checkout.py`
- **Yangi test:** `backend/test_wallet_referral_flow.py` (7 test, endi doimiy suite'a kiradi) — referal bog'lash qoidalari (o'zini taklif rad, takroriy bog'lanish rad, notanish kod rad), promo+hamyon aralash xarid narxi, approve'da promo sarflanishi + referrer cashback + enrollment, reject'da hamyon qaytishi + kurs ochilmasligi, milestone sovg'a (2 xaridli do'st → bepul kurs), ikki marta approve/cashback idempotensiyasi, 100M cap + balans tekshiruvi.
- **Muhim noziklik (test paytida o'rganildi):** `checkout.py`da hamyondan yechishda va `create_purchase`'da **aynan bir xil order_id** uzatilishi shart — reject paytida refund shu tx bo'yicha ledgerdan topiladi. Agar boshqa-tosh tx yozilsa, refund topilmaydi (0 qaytadi). Production kodi buni to'g'ri qiladi; testdagi birinchi xato shu moslikni buzgan edi.
- **Xulosa:** tizim mantiqi to'g'ri — cashback faqat qolgan (kartaga tushadigan) summadan emas, **umumiy xarid summasidan** hisoblanadi (60k qolgan holda 100k xarid uchun cashback bazadan kelgan `purchase.amount` bo'yicha emas — `reward_referrer`ga `purchase['amount']` uzatiladi, u checkout'dagi YAKUNIY (promo/hamyondan keyingi) summa; 6 000 = 60 000×10% — ya'ni cashback asosiy xarid summasidan emas, chek qilingan summadan ketadi. Bu dizayn qarori: «admin ko'rgan chek summasi»dan cashback).

---

### Sessiya: 2026-09-07 — Vercel → Cloudflare qarori (hosting tozalash)

**Qaror:** Vercel butunlay tark etildi — **Vercel Hobby tarifi faqat shaxsiy/notijorat foydalanish uchun**, platforma esa tijorat (pullik kurslar). Bu sizning o'z master promptingizdagi [V1] qoidasi bilan ham mos.

**Jonli tekshiruv natijalari (2026-09-07):**
- Production frontend ALLAQACHON Cloudflare Pages'da: `telegram-courses-miniapp2.pages.dev` (bot WebApp tugmasi shuni ochadi) — migratsiya kerak emas edi, faqat tozalash.
- Eski `kurslarimiz-platforma.vercel.app` HAMMA VAQT tirik va shu kungi build bilan production Render backendiga ulangan holda turgan (JS bundle ichida `https://kurslar-backend-api.onrender.com/api` topildi) → tijorat platforma Hobby tarifda ishlab turgan — asosiy xavf shu bo'lgan. Foydalanuvchi `kurslarimiz-miniapp` Vercel loyihasini dashboard'dan o'chirdi.
- `kurslarimiz.vercel.app` — 404 (o'lik nusxa).
- Production Render CORS'ida pages.dev ham, vercel.app ham ruxsat etilgan edi (preflight OPTIONS testi bilan isbotlandi); LOKAL `.env` esa production env'dan orqada edi (pages.dev umuman yo'q edi) — env sinxron emasligi qayd etildi.

**Repo'da tozalandi:** `config.py` (default CORS'dan 2 ta vercel domeni olib tashlandi), `.env.example` (vercel namunalari → pages.dev), `README.md` (Hosting qatori → Cloudflare Pages), `LANDING_BRIEF.md` (joylashuv qatori), lokal `backend/.env` (CORS: pages.dev + localhost, vercel o'chirildi).

**Qolgan qadam (FAQAT FOYDALANUVCHI O'ZI):** Render dashboard → Environment → `CORS_ORIGINS` dan vercel dominlarini olib tashlash (repo'dagi .env o'zi deploy bo'lmaydi).

**QATIY QOIDA (keyingi AI uchun):** frontend faqat **Cloudflare Pages** (repo'da `wrangler.toml`: `pages_build_output_dir = "frontend/dist"`, `frontend/public/_headers` kesh siyosati). Backend **Render'da qoladi** — FastAPI + 24/7 bot long-polling Workers'ga sig'maydi (Python long-running yo'q, 10ms CPU); butun backendni Hono'ga qayta yozish hozircha oqilona EMAS. Yangi vercel.app dominlari CORS'ga QO'SHILMAYDI.

---

### Sessiya: 2026-09-06 — «Senior code review» (GLM agent)

Review doirasi: `bot_service.py` (to'liq), `checkout.py`, `purchases.py`, `wallet.py`, `promos.py`, `pricing.py`, `security.py`, `auth.py`, `admin.py`, storage qatlami, frontend type-check. PoC (isbotlash skriptlari) bilan tekshirildi, so'ngra tuzatildi.

#### X-1. BOT_USERNAME bo'sh bo'lsa guruh AI har @li xabarga otiladi
- **Joy:** `bot_service._group_should_answer`
- **Xato:** `if f"@{settings.BOT_USERNAME.lower()}" in lowered` — username bo'sh/faqat bo'shliq bo'lsa `"@" in text` ga aylanadi → guruhda har qanday `@mention` botni AI javobiga undaydi (spam + OpenRouter krediti sarfi).
- **Tuzatish:** username strip+lower qilib, bo'sh bo'lsa @-va username-tekshiruvlari umuman o'chiriladi; BOT_ID bilan reply-aniqlash qoladi.
- **Tekshiruv:** `test_bot_regression.py` Test 1 (bo'sh username bilan `@` xabar trigger emas, real triggerlar ishlaydi).

#### X-2. Admin chek kartasiga status qatori qo'shilmasligi (HTML parse xatosi)
- **Joy:** `bot_service._handle_admin_callback`
- **Xato:** Telegram `editMessageCaption`'ga qaytargan eski caption **tekis matn** (entities qo'llanmagan), kod uni `parse_mode=HTML` bilan xom holda qayta yuborardi. Talaba ismi/izohidagi `&` yoki `<` → Telegram «can't parse entities» → TASDIQLANDI/RAD ETILDI qatori umuman chiqmay qolardi, admin ko'rsatmasi yo'qolardi.
- **Tuzatish:** eski caption `html.escape()`dan o'tkaziladi; edit o'tmasa qaror alohida fallback xabarda yuboriladi (order id bilan).
- **Tekshiruv:** Test 3 — `"Att&acker <b>X</b>"` li captionda escape + fallback tasdiqlangan.

#### X-3. Bot chek captioni — foydalanuvchi `SYSTEM[wallet:N]` yozib bazaga kiritishi
- **Joy:** `bot_service._handle_receipt_photo` → `create_purchase(comment=...)`
- **Xato:** caption tozalanmasdan 300+ belgida comment sifatida saqlanardi. Checkout (API) oqimi commentni tozalasa-da, bot oqimi tozalamas edi — `reject_purchase` commentdagi `SYSTEM[wallet:N]` ni o'qiydigan fallback (X-5) bilan birga xavfli zanjil hosil qilardi.
- **Tuzatish:** caption 300 belgiga qisqartirilib, `SYSTEM[`→`SYSTEM_[`, `wallet:`→`wallet_`, `promo:`→`promo_` almashtiriladi (checkout bilan bir xil qoida).
- **Tekshiruv:** Test 2 — soxta teglar bazaga o'tmaydi, izohning o'zi saqlanadi.

#### X-4. Admin caption/checkout/broadcast xom HTML (injection)
- **Joylar:** `checkout.py` `submit_receipt` (talaba ismi, username, kurs nomi, izoh, promokod xom ediqlanardi); `admin.py` `broadcast_message` (text va admin nomi).
- **Xavf:** talaba ismiga `<b>TO'LOV RAD ETILDI</b>...` yozsa admin chekida soxta qatorlar paydo bo'lardi; admin akkaunti oshsa broadcast orqali barcha talabalarga soxta formatting/havola ketardi.
- **Tuzatish:** barcha foydalanuvchi maydonlari `html.escape()`dan o'tkazildi (bot_service'dagi `_escape` bilan bir xil qoida). Broadcast endi tekis matn (HTML ni xohlasa admin o'zi o'z xatosini ko'radi).
- **Tekshiruv:** py_compile + butun test suitlar yashil; caption tarkibi Test 2/3 orqali indirekt tekshiriladi.

#### X-5. `reject_purchase` comment fallback — soxtalashtiriladigan pul manbai
- **Joy:** `purchases.py` `reject_purchase` (eski kod)
- **Xato:** agar ledgerda spend topilmasa, commentdan `SYSTEM[...wallet:N]` regex bilan o'qilardi. PoC'lar ko'rsatdiki ledger (`get_tx_debit_amount`) aslida aniq himoya qilar edi (faqat `type=spend` va to'liq teng tx hisobga oladi), lekin comment fallback: (a) o'lik kod, (b) kelajakda ledgerga ishonchni susaytiruvchi soxta manba, (c) foydalanuvchi nazoratidagi maydon. `has_tx`/`get_tx_debit_amount` esa to'liq tenglik bilan solishtiradi — prefix muammosi YO'Q (bu ham PoC bilan tekshirildi).
- **Tuzatish:** comment fallback butunlay olib tashlandi — refund faqat ledgerdan.
- **Tekshiruv:** Test 4 — soxta `SYSTEM[wallet:999999999]` comment bilan reject: aynan 20 000 (ledger) qaytdi, takror reject idempotent.
- **SABAQ:** pul hisobida hech qachon erkin matn maydoniga tayanma — faqat tizim yozgan ledger yozuvi.

#### X-6. `/stats` guruhda butun guruhga maxfiy statistika yuborilardi
- **Joy:** `bot_service._handle_group_message` → `_send_stats(client, chat_id, tg_id)`
- **Xato:** guruhdagi `/stats` xulosasini (jami tushum, oylik tushum, talabalar soni) **chatga** yuborardi — guruhda `/stats` bossa JAMI GURUH statistikani ko'rardi (maxfiy sotuv ma'lumoti ommaviy leak).
- **Tuzatish:** statistika faqat adminning shaxsiy chatiga yuboriladi (`_send_stats(client, tg_id, tg_id)`).
- **Tekshiruv:** `test_bot_regression.py` Test 5 — guruh chat_id statikasiga yuborilmaydi, admin tg_id ga yuboriladi, admin bo'lmagan a'zo uchun javob umuman yo'q.
- **SABAQ:** maxfiy hisobotlar har doim `from.id` (shaxsiy chat) manziliga yuborilishi kerak, `chat.id` emas — guruh chatida bu ikkisi farq qiladi.

#### X-7. Review sessiyasining o'zida kiritilgan regressiya (self-check saboq)
- **Xato:** X-6 ni tuzatayotganda `_handle_group_message` ichida `/stats` sharti `/help` elif zanjiridan **chetga** tushib qoldi — `/stats` umuman ishlamay qoldi (birinchi `if text.startswith("/")` bloki tugagach `elif command` noto'g'ri indentatsiyada qoldi).
- **Qanday topildi:** Test 5 «/stats uchun xabar yuborilmadi» deb yiqildi — PoC darhol xatoni ko'rsatdi.
- **Tuzatish:** elif zanjiri tiklandi.
- **SABAQ:** har bir kichik Edit'dan keyin test yashil bo'lmaguncha ish davom ettirilmaydi; regressiyani esa aynan shu test ushladi. Testlar UX uchun emas — o'zimizni o'zimizdan himoya qilish uchun.

#### Kichik: `dawomidagi` typo docstringda → `davomidagi` (tuzatildi).

---

## ⚠️ MA'LUM LEKIN TUZATILMAGAN holatlar (kelajakdagi ish ro'yxati)

Bu joylar reviewda aniqlandi, lekin xavf/vazn yoki ko'lam sababli dekabr sessiyasida o'zgartirilmadi. Keyingi AI shulardan boshlasin:

1. **`checkout.submit_receipt` — wallet `try_debit` bilan `create_purchase` orasida halol race** (`.env` shart emas, dizayn): parallel ikkita so'rovda ikkalasi ham bir balansni ko'rib, ikkinchisining yechishi `new_balance < 0` tufayli yolg'iz bittasida o'tadi (wallet.py `_mutate` 106-satr oldindan tekshirtiradi — balans aslida ikki karra yechilmaydi, lekin ikkinchi xaridorga «yetarli balans bor» degan noto'g'ri 400/izohsiz muvaffaqiyatsizlik qaytishi mumkin). To'liq yechim: walletda shartli UPDATE yoki lock.
2. **`/backup` faqat oxirgi 1000 user/purchase** (`limit=1000`) — katta o'sishdan keyin to'liq zaxira bo'lmaydi. Backup limitlarni `list_users(limit=...)`/pagination bilan to'liq qilish kerak.
3. **`checkout` IP-based rate-limitlar** (`_rate_limited`) bir necha IP ortidan oson chetlanadi va bitta server instansiyasi uchun lokal (Render ko'p instansiya bo'lsa bir-birini ko'rmaydi). Daraja: low.
4. **SQLite fallbackni productionda ishlatish** README'da ogohlantirilganidek qayta deployda YANGI fayl bilan qayta boshlanishi mumkin — real production Supabase bo'lishi shart. Bu faqat eslatma.
5. **`ai.py` admin kurs generatori modelni server allowlistdan emas, .env dan o'qiydi** — o'zi allowlist hisoblanadi, lekin `model_override` parametri faqat `call_openrouter_api` ichki chaqiruvlardan foydalanadi (public API yo'q), ochiq zaiflik YO'Q.
6. **PDF arxitektura qo'llanmasida taklif etilgan** (Cloudflare Worker cron + Queues + outbox) hozirgi Render-based arxitekturaga zid — bu takliflar faqat keyingi katta refaktorda ko'rib chiqiladi, joriy ishlayotgan tizimni buzish shart emas.

---

## 📚 O'rganilgan bilimlar / qoidalar (umumiy, loyihadan tashqarida ham amal qiladi)

1. **Telegram `parse_mode=HTML` va «tekis matn orqaga qaytishi»**: Telegram API'dan `message.caption`/`text` har doim entities QO'LLANMAGAN holda qaytadi. Uni qayta `parse_mode=HTML` bilan yuborishdan oldin `html.escape()` shart — aks holda foydalanuvchi belgilari `can't parse entities` xatosini beradi.
2. **Telegram `editMessageCaption` limiti 1024, `editMessageText` — 4096**: status qo'shib qayta yuborishda 1024 bilan kesish «caption» uchun xavfsiz, «text» uchun esa keraksiz qisqartirish — va kesishning o'zi parse xatosini keltirmaydi, lekin fallback xabar talab qiladi.
3. **`f"@{username}"` bo'sh username bilan `"@"` ga aylanadi** — har qanday substring tekshiruvida bu universal tuzoq: substring qurishdan OLDIN bo'shlik tekshirilishi kerak.
4. **Foydalanuvchidan kelgan matn hech qachon tizim teglari (SYSTEM[...]) uchun ishonchli manba bo'la olmaydi** — tizim teglari server tomonidan yozilib, kiritish nuqtasida tozalanishi kerak.
5. **Pul mablag'i invariantlari**: (a) faqat append-only ledger, (b) refund idempotensiya tx orqali (`refund_{order_tx}`), (c) compare-and-set status o'tishlari — bularsiz «ikki admin», «double-click», «retry» holatlarida ikki karra to'lov/kirim chiqadi.
6. **Telegram long-polling offsetni handler muvaffaqiyatidan OLDIN oshirish** (xato bo'lsa update yo'qoladi) yoki KEYIN (xato cheksiz retry bo'ladi) — joriy tanlov: OLDIN + `logger.exception` (yo'qolish riski qabul qilinadi, «komalogi cheksiz aylanish»dan yaxshiroq). Bu qarorni boshqa yo'nalishda o'zgartirsangiz, ikkala holni ham o'ylab qiling.
7. **Render free dyno 15 daqiqa uxlab qoladi** — 21:00 kunlik hisobot tsikli faqat dinam tirik bo'lsa ishlaydi; productionda kunlik hisobot aniq boshqa scheduler (cron-job.org, UptimeRobot to'g'ri emas — u faqat ping) orqali olib borilishi kerak. Joriy `_daily_reports_loop` buni qisman qoplaydi, lekin kafolat emas.
8. **Test yozishda trigger qoidalarini birinchi navbatda ko'rib chiq**: «savol belgisi + keyword» sintetik trigger — o'zbek tilida savol ko'pincha `?` belgisiz yoziladi, shuning uchun bu qoida amalda kam ishlaydi (dizayn qarori, xato emas).

---

## 🧪 Test protokoli (yangi AI uchun)

Ishni tugatishdan oldin **albatta** ishga tushiring (hammasi `backend/` ichidan):

```bash
python -m py_compile bot_service.py app/api/*.py app/services/*.py app/storage/*.py   # sintaksis
python test_security_and_fixes.py     # HMAC, admin auth, wallet chegaralari, refund spoof
python test_api_endpoints.py          # TestClient: /health, kurslar, submit-receipt (wallet auto-enroll)
python test_full_suite.py             # storage interfeyslari, kanal ID, approve oqimi
python test_bot_regression.py         # BOT_USERNAME, caption sanitizatsiya, admin edit escape, ledger refund
```

Frontend: `cd frontend && npx tsc --noEmit && npm run build`.

⚠️ Testlar `BOT_TOKEN=test_...` bilan real `api.telegram.org`ga so'rov yuboradi (404 qaytadi) — bu normal, xato emas. `data_test_regression/`, `data_poc*/` papkalari test qoldiqlari — `.gitignore`da `data*` qamallangani tekshirilsin.

⚠️ **Yangi topilgan xato uchun har doim:** (1) PoC yozib isbotla, (2) tuzat, (3) regression test qo'sh, (4) shu faylning «Topilgan xatolar tarixi»ga yoz. PoC fayllar/papkalarni oxirida o'chir.

---

## 📖 Asosiy hujjatlar joylashuvi

| Fayl | Nima |
|---|---|
| `README.md` | Ishga tushirish, Supabase schema, kanal ulash qo'llanmasi |
| `senior-engineer-master-prompt-uz (1).md` | Senior product-engineer yo'riqnomasi (auth, RLS, AI oqimi, free-tier limitlari) — **yangi AI buni ham o'qishi kerak** |
| `2026-yil Holatida Telegram + AI Agent Arxitekturasi...pdf` | 100→100k foydalanuvchi masshtablanish qo'llanmasi (joriy arxitektura uchun esa faqat ma'lumot) |
| `BOT_BRIEF.md` | Bot mahsulot talablari |
| `backend/schema.sql` | Supabase jadvallari (production setup) |

---

*Oxirgi yangilangan: 2026-09-06 — «Senior code review» sessiyasi.*
