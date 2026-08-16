# Original concept prompt — Premium Courses Telegram Mini App

Build a **production-quality Telegram Mini App for selling and delivering premium online courses**.

This is NOT a generic landing page and NOT a simple course catalog.

Create a complete mobile-first digital education product where users can:

- discover courses
- view detailed course information
- purchase a course
- receive/activate account credentials
- log in
- access only purchased courses
- watch lessons
- track progress
- continue learning
- manage their profile
- receive notifications
- view certificates
- access their purchased learning content inside a private student area

The product must feel like a **premium modern education platform inside Telegram**, not like a normal website squeezed into a Telegram WebView.

The design must be highly polished, visually memorable, elegant, trustworthy, fast and conversion-focused.

Primary brand direction:

**Premium green + emerald + cream + white + deep forest + subtle champagne/gold accent.**

Green must replace the previously planned pink palette.

Do NOT use childish green, neon green, gaming green or overly saturated gradients.

---

## Page identity

### Product

Premium Courses Telegram Mini App

### Purpose

Sell premium digital courses and provide a private learning environment for purchased courses.

### Audience

People who want to purchase professional online courses and learn from their phone.

### Primary conversion goal

**Browse course → open course details → purchase → activate account → enter learning dashboard**

### Secondary goals

- continue learning
- discover more courses
- track progress
- return to unfinished lessons
- access profile and certificates

### Overall visual feel

- premium
- modern
- elegant
- calm
- trustworthy
- sophisticated
- editorial
- high-end SaaS
- luxury education brand
- mobile-first
- clean
- highly polished

### Brand personality

The UI should communicate:

**“Bu oddiy kurs emas. Bu professional darajadagi ta’lim platformasi.”**

### Avoid

- neon green
- cyberpunk
- gaming UI
- childish illustrations
- generic SaaS templates
- excessive glassmorphism
- excessive gradients
- giant rounded cartoon cards
- excessive icons
- visual clutter
- random animation
- cheap ecommerce appearance
- fake testimonials
- invented statistics
- invented awards
- invented claims

---

## Assets

Use a structured asset system.

Create:

### Brand assets

- logo
- app icon
- favicon/web icon where needed
- green/gold brand mark

### Course assets

Each course can contain:

- cover image
- thumbnail
- preview image
- instructor image
- lesson thumbnail
- promotional banner
- video poster

### Learning assets

- PDF
- downloadable files
- lesson attachments
- certificate artwork

### Asset rules

Every asset must have:

- exact filename/path
- role
- dimensions
- aspect ratio
- crop behavior
- mobile behavior
- fallback
- alt text

Do not invent random stock imagery when a supplied asset exists.

If an asset is unavailable, use a deliberate local placeholder matching the design system rather than unrelated stock media.

---

## AI asset pipeline

Use AI-generated media only when useful.

### Still assets

Use Nano Banana generation for:

- premium course hero visuals
- promotional course covers
- instructor/editorial compositions
- decorative background visuals
- certificate backgrounds
- premium UI preview imagery

Every generated image must respect:

- green brand palette
- clean composition
- strong negative space for HTML text
- mobile-safe crop
- premium editorial art direction
- no accidental text
- no invented logo
- no unrelated objects

### Motion assets

Use motion assets only where they improve the experience.

Possible use:

- subtle hero animation
- premium course preview animation
- onboarding visual
- success animation

Do not turn the entire Mini App into a motion showcase.

Telegram Mini App usability has priority over visual effects.

---

## Stack and setup

Build using a maintainable production architecture.

Preferred stack:

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- lucide-react
- Supabase/PostgreSQL or equivalent backend
- Telegram WebApp SDK/API integration

Use only necessary dependencies.

Do not add large libraries without a clear requirement.

Set:

- document title
- viewport configuration
- mobile viewport behavior
- global reset
- font loading
- smooth but controlled transitions
- safe-area handling
- dark/light theme compatibility where appropriate

The application must run correctly both:

1. inside Telegram Mini App
2. in a normal mobile browser for testing

---

## Fonts and design tokens

### Primary palette

Use green as the dominant brand color.

Recommended palette:

```text
Primary Emerald: #159A6B
Deep Emerald: #0D6B4E
Forest: #103F32
Dark Forest: #082C24

Mint: #E6F5EF
Soft Green: #D7EEE5
Light Surface: #F4FAF7

Cream: #FBF8F1
Warm White: #FFFDFC
Pure White: #FFFFFF

Champagne Accent: #C9A96B
Soft Gold: #D9C18D

Main Text: #17352D
Secondary Text: #6B8179
Muted Text: #96A69F

Border: #E3ECE8
Error: #C94C4C
Success: #159A6B
```

Use green carefully.

Primary green should dominate:

- CTA
- active navigation
- progress
- badges
- links
- selected states
- key highlights

Gold should be a **luxury accent only**.

Do NOT cover large surfaces with gold.

### Typography

Use a sophisticated pairing:

Headline:

- elegant serif or premium editorial serif

Body:

- modern sans-serif

Recommended direction:

- Playfair Display / Cormorant Garamond for large editorial headings
- Inter / Manrope / Plus Jakarta Sans for UI

Typography must remain highly readable on small screens.

### Radius

Use:

- 10px inputs
- 12–16px buttons
- 16–22px cards
- 20–28px hero surfaces

Avoid excessive pill-shaped UI.

### Shadows

Use subtle soft shadows.

No heavy black shadows.

### Borders

Use very light warm-green/gray borders.

---

## Global structure

Design the Mini App specifically for a smartphone viewport.

Do NOT simply shrink a desktop site.

Recommended information architecture:

```text
Splash / Entry
↓
Home
↓
Courses
↓
Course Details
↓
Checkout
↓
Purchase Success
↓
Login / Activation
↓
Student Dashboard
↓
My Courses
↓
Course
↓
Lesson Player
↓
Progress
↓
Profile
↓
Certificates
```

Bottom navigation should be the primary navigation after the user enters the application.

Use:

- Home
- Courses
- My Learning
- Profile

For the public state, use:

- Home
- Courses
- About/Info
- Login

Adapt intelligently depending on authentication state.

---

## Telegram Mini App behavior

Integrate Telegram WebApp behavior cleanly.

Use Telegram context where appropriate:

- Telegram user identity
- theme information
- viewport dimensions
- safe area
- back navigation
- closing behavior
- haptic feedback where appropriate
- native Telegram-compatible interaction patterns

Do not overuse Telegram-specific UI.

The product should still feel like a premium standalone application.

When used inside Telegram:

- respect safe areas
- avoid content under the status/header area
- avoid fixed elements colliding with Telegram UI
- make bottom navigation safe-area aware
- support Telegram back behavior
- make touch targets comfortable

---

## Interaction and motion

Motion must be deterministic.

For each meaningful animation specify:

- trigger
- target property
- start state
- end state
- timing
- easing
- fallback
- reduced-motion state

Use motion primarily for:

- onboarding
- page transitions
- card interaction
- modal entrance
- accordion
- course progress
- purchase success
- navigation transitions
- subtle reveal

### Page transition

Trigger:

route change

Start:

opacity 0 + translateY(8px)

End:

opacity 1 + translateY(0)

Duration:

180–240ms

Easing:

ease-out

Keep transitions fast enough for mobile.

### Course card hover

Hover applies only on devices that support hover.

Start:

translateY(0), scale(1)

End:

translateY(-2px), scale(1.01)

Duration:

180ms

Touch devices must not depend on hover.

### Course details reveal

Trigger:

viewport intersection

Start:

opacity 0, translateY(16px)

End:

opacity 1, translateY(0)

Duration:

500ms

Stagger:

70–90ms

Do not animate everything simultaneously.

### Purchase success

After successful purchase:

- subtle scale-in
- checkmark reveal
- small gold particle accent
- gentle success transition

Keep it elegant, not celebratory/cartoonish.

### Reduced motion

With `prefers-reduced-motion: reduce`:

- remove transforms
- remove unnecessary animation
- show content immediately
- use static success state
- disable decorative motion

---

## Navigation

### Mobile bottom navigation

Persistent after entering main application.

Four items:

1. Bosh sahifa
2. Kurslar
3. O‘qishim
4. Profil

Each item contains:

- icon
- label
- active state

Active state:

- emerald icon
- emerald label
- subtle mint surface or indicator

Do not use huge icons.

### Top navigation

Use:

- Telegram-style back navigation when appropriate
- page title
- optional contextual action
- profile/avatar when needed

### Mobile menu

For pages requiring additional actions:

- slide/fade overlay
- focus management
- Escape close when browser supports it
- Telegram-compatible close behavior
- body scroll lock where necessary

---

# Section 1 — Splash / Entry

Create a premium first impression.

Background:

cream → subtle mint transition.

Center:

brand logo

small premium label:

`PREMIUM EDUCATION`

Large text:

**Bilimingizni yangi bosqichga olib chiqing.**

Subtext:

**Professional kurslar, amaliy darslar va o‘rganishingiz uchun qulay shaxsiy kabinet.**

Primary CTA:

**Boshlash**

Use very subtle animation.

Do not make splash unnecessarily long.

---

# Section 2 — Home

Home must immediately communicate value.

Top:

personalized greeting if authenticated:

**Assalomu alaykum, [ISMI] 👋**

Public visitor version:

**Bilimingizni rivojlantirishni bugundan boshlang.**

Search:

`Kurs qidirish...`

Hero:

large premium course promotional surface.

Content:

- course cover
- category
- title
- short value proposition
- price
- CTA

Primary CTA:

**Kursni ko‘rish**

---

## Category section

Title:

**Yo‘nalishni tanlang**

Categories should be visually elegant.

Examples:

- Dizayn
- Marketing
- AI
- SMM
- Biznes
- Kontent
- Freelance

Use compact chips or horizontally scrollable category tabs.

Do not create a generic grid full of oversized icons.

---

## Featured courses

Title:

**Mashhur kurslar**

Cards show:

- cover
- title
- rating
- lesson count
- duration
- current price
- old price
- discount if real
- CTA

Each course card should feel premium.

---

# Section 3 — Courses catalog

Top:

Back

Title:

**Kurslar**

Search input.

Category filters.

Sort/filter controls.

Course cards stacked vertically on mobile.

Each card:

cover image

category

course title

short description

rating

lesson count

duration

price

discount

CTA

Use strong hierarchy.

Do not allow price or CTA to become visually lost.

---

# Section 4 — Course Details

This is the most important conversion screen.

Hero:

course image/video preview.

Category.

Large course title.

Rating.

Student count only when real.

Short persuasive description.

Price block.

Old price if applicable.

Discount badge if real.

Primary CTA:

**Kursni sotib olish**

Secondary:

**Dastur bilan tanishish**

---

## Course benefits

Title:

**Bu kursda nimalarni o‘rganasiz?**

Use elegant numbered learning cards:

01
Asoslar

02
Amaliy ko‘nikmalar

03
Professional workflow

04
Real loyihalar

05
Bonus materiallar

---

## Curriculum

Title:

**Darslar dasturi**

Module accordion.

Example:

01. Boshlang‘ich qism
8 dars

02. Amaliy qism
12 dars

03. Professional daraja
10 dars

Each lesson row:

- lesson number
- lesson title
- duration
- lesson type
- preview/lock state

Locked lessons:

🔒

Text:

**Kursni sotib olgandan so‘ng ochiladi**

Preview lesson:

**Bepul ko‘rish**

---

## Instructor

Instructor image.

Name.

Specialization.

Short bio.

Optional social links.

Do not invent credentials.

---

## What you get

Cards:

- Video darslar
- PDF materiallar
- Bonuslar
- Amaliy topshiriqlar
- Shaxsiy kabinet
- Progress nazorati
- Yangilanadigan materiallar

---

## Testimonials

Only show real testimonials.

If unavailable:

use `[REAL TESTIMONIALS]` placeholder.

Never fabricate names, numbers or quotes.

---

## FAQ

Questions:

- Kursni qanday sotib olaman?
- Xariddan keyin qanday kiraman?
- Darslarga telefondan kirish mumkinmi?
- Kursga kirish muddati qancha?
- Darslarni qayta ko‘rish mumkinmi?
- Parolimni unutib qo‘ysam nima qilaman?

Accordion animation:

180–240ms.

---

# Section 5 — Checkout

Checkout should feel extremely trustworthy.

Top:

**Buyurtma**

Course summary.

Course thumbnail.

Course name.

Price.

Discount.

Final amount.

Payment method.

Terms/conditions.

Primary CTA:

**Kursni sotib olish**

Use a fixed bottom purchase CTA on mobile where appropriate.

Payment provider:

`[PAYMENT_PROVIDER]`

Do not hard-code unsupported payment logic.

Architecture must allow payment provider integration.

---

# Section 6 — Purchase Success

Success page.

Large elegant emerald checkmark.

Subtle champagne-gold decorative particles.

Title:

**Tabriklaymiz! 🎉**

Text:

**Kurs muvaffaqiyatli xarid qilindi.**

Then show account access instructions according to the actual authentication flow.

Possible fields:

Login:
`[LOGIN]`

Parol:
`[PASSWORD]`

Primary CTA:

**Kursni boshlash**

Secondary:

**Bosh sahifaga qaytish**

Never expose sensitive credentials unnecessarily.

---

# Section 7 — Login / Activation

Title:

**Xush kelibsiz!**

Subtitle:

**Kurslaringizga kirish uchun login va parolingizni kiriting.**

Inputs:

- Login
- Parol

Options:

- Meni eslab qolish
- Parolni unutdingizmi?

Primary:

**Kirish**

Below:

**Kurs hali sizniki emasmi?**

CTA:

**Kurslarni ko‘rish**

Error states must be clear.

Example:

**Login yoki parol noto‘g‘ri. Qayta urinib ko‘ring.**

---

# Section 8 — Student Dashboard

Authenticated user sees:

**Assalomu alaykum, [ISMI] 👋**

Subtitle:

**Bugun nimani o‘rganamiz?**

---

## Continue Learning

Large featured progress card.

Course cover.

Course name.

Current lesson.

Progress:

`68%`

Text:

`24 / 35 dars`

CTA:

**Davom ettirish**

---

## My Courses

Title:

**Mening kurslarim**

Course cards with:

- cover
- title
- progress
- current lesson
- last activity
- continue button

---

## Overall progress

Elegant circular progress.

Large:

**68%**

Text:

**24 / 35 dars tugatildi**

Use green progress ring with subtle gold detail.

---

# Section 9 — My Courses

List of all purchased courses.

Tabs:

- Barchasi
- Boshlangan
- Tugallangan

Each card:

cover

course title

progress

last lesson

completion status

CTA

---

# Section 10 — Course Learning Page

This is the private learning environment.

Header:

course title

progress

back button

---

## Module list

Expandable modules.

Lesson states:

Completed:

✓

Current:

emerald active state

Locked:

🔒

Upcoming:

neutral state

---

# Section 11 — Video Lesson Player

Large mobile video player.

Controls:

- play/pause
- timeline
- volume
- fullscreen
- speed
- captions where available

Do not overwhelm the player with controls.

Below:

Tabs:

**Dars haqida**
**Fayllar**

Lesson title.

Description.

Downloadable resources.

Primary action:

**Darsni tugallangan deb belgilash**

Navigation:

**← Oldingi dars**

**Keyingi dars →**

---

# Section 12 — Progress System

Progress must persist through backend.

Track:

- course progress
- module progress
- lesson completion
- last viewed lesson
- completion timestamp

Progress should remain after:

- logout
- reopening app
- changing device/session

---

# Section 13 — Access Control

IMPORTANT.

Users can access only courses they purchased.

Do not rely only on frontend hiding.

Backend must verify:

- authenticated user
- enrollment
- course ownership
- lesson access

If user opens a protected lesson URL directly without authorization:

show:

**Bu dars yopiq**

**Ushbu darsga kirish uchun kursni xarid qilishingiz kerak.**

CTA:

**Kurs haqida batafsil**

---

# Section 14 — Profile

Profile screen:

avatar

name

username

email/phone if available

Sections:

- Mening ma’lumotlarim
- Mening kurslarim
- Sertifikatlarim
- Bildirishnomalar
- Xavfsizlik
- Yordam
- Chiqish

Use clean list navigation.

---

# Section 15 — Certificates

Certificate cards.

Completed courses:

- course name
- completion date
- certificate preview

CTA:

**Sertifikatni ko‘rish**

Optional:

**Yuklab olish**

Certificate design must use:

- cream
- deep green
- champagne gold

Keep it premium and printable.

---

# Section 16 — Notifications

Notification list.

Examples:

- Yangi dars qo‘shildi
- Siz darsni tugatdingiz
- Kurs yangilandi
- Xarid muvaffaqiyatli yakunlandi
- Yangi bonus material qo‘shildi

Use category indicators.

Unread state:

subtle emerald indicator.

---

# Section 17 — Empty states

Example:

**Hali kurslaringiz yo‘q**

Text:

**O‘rganishni boshlash uchun kurslardan birini tanlang.**

CTA:

**Kurslarni ko‘rish**

Empty state illustration must match the brand.

No generic stock illustration.

---

# Section 18 — Error states

Create premium states for:

- 404
- unauthorized
- access denied
- payment failed
- video unavailable
- network error
- session expired

Example:

### 404

**Sahifa topilmadi**

**Siz qidirayotgan sahifa mavjud emas yoki o‘chirilgan.**

CTA:

**Bosh sahifaga qaytish**

---

# Section 19 — Offline / slow connection

Telegram users may have unstable connections.

Design graceful states:

**Internet aloqasi yo‘q**

Text:

**Internet ulanishingizni tekshiring va qayta urinib ko‘ring.**

CTA:

**Qayta urinish**

Do not freeze the entire interface.

Preserve already loaded UI when possible.

---

# Section 20 — Loading states

Create skeleton screens for:

- home
- courses
- course details
- dashboard
- lesson list
- profile

Buttons should support loading state.

Example:

**Yuklanmoqda...**

Prevent layout jumping.

---

## Responsive behavior

Primary target:

**mobile first**

### Small mobile

Optimize for approximately:

320–375px width.

Rules:

- compact spacing
- readable typography
- CTA remains visible
- horizontal scrolling sections where useful
- no accidental horizontal overflow

### Standard mobile

Approximately:

390–430px.

Use full intended visual hierarchy.

### Tablet

Expand:

- content width
- cards
- spacing
- curriculum layout

### Desktop browser fallback

If opened outside Telegram:

- centered app shell
- max width around 430–500px for mobile experience OR adaptive wider learning/dashboard layout where appropriate
- do not create an entirely different brand

Do not let desktop browser redesign the visual identity.

---

## Accessibility and performance

Implement:

- semantic headings
- accessible buttons
- keyboard support where browser-based interaction applies
- visible focus state
- accessible form labels
- proper color contrast
- `aria-expanded`
- `aria-controls`
- meaningful alt text

Performance:

- lazy-load noncritical images
- compress course covers
- lazy-load video
- use poster images
- avoid excessive animation
- reduce DOM complexity
- clean up event listeners
- no unnecessary re-renders
- no console errors
- optimize mobile network usage

Use `prefers-reduced-motion`.

When reduced motion is enabled:

- disable decorative motion
- minimize transitions
- show readable static states
- never hide content behind animation

---

## Content constraints

All UI copy must be in natural Uzbek Latin script.

Do not use awkward machine-translated Uzbek.

Use simple, polished, human wording.

Examples:

Good:

**Kursni boshlash**

**Davom ettirish**

**Darsni tugatish**

**Kursni sotib olish**

Avoid unnatural wording such as:

**Ta’lim jarayonini amalga oshirish**

When actual data is unavailable, use explicit tokens:

`[COURSE_TITLE]`

`[PRICE]`

`[OLD_PRICE]`

`[DISCOUNT]`

`[INSTRUCTOR_NAME]`

`[LESSON_COUNT]`

`[DURATION]`

`[REAL_TESTIMONIAL]`

Do NOT invent:

- student numbers
- ratings
- revenue
- awards
- expert credentials
- testimonials
- guarantees
- payment providers
- links

unless supplied.

---

## Backend/data model

Create production-ready data architecture.

### users

- id
- telegram_user_id
- name
- username
- email/phone where applicable
- role
- status
- created_at

### courses

- id
- title
- slug
- description
- cover
- price
- old_price
- duration
- level
- published
- created_at

### modules

- id
- course_id
- title
- order

### lessons

- id
- module_id
- title
- description
- video_url
- duration
- order
- is_preview
- published

### purchases

- id
- user_id
- course_id
- amount
- status
- transaction_id
- created_at

### enrollments

- id
- user_id
- course_id
- purchase_id
- status
- granted_at

### lesson_progress

- id
- user_id
- lesson_id
- completed
- completed_at
- last_position

### certificates

- id
- user_id
- course_id
- issued_at
- certificate_url

---

## Security

Never store plaintext passwords.

Use secure authentication.

Use server-side authorization.

Protect private lesson routes.

Protect student data.

Protect admin actions.

Never trust frontend-only checks.

A user must not gain course access by manually changing client-side state or URL parameters.

---

## Admin compatibility

The backend architecture must support a future or connected admin panel for:

- courses
- modules
- lessons
- students
- purchases
- enrollments
- certificates
- notifications
- analytics

The student Mini App must not contain admin functionality unless explicitly requested.

---

## Design details that make it feel expensive

Use:

- editorial typography
- green color hierarchy
- cream surfaces
- deep forest text
- subtle champagne-gold accents
- refined spacing
- elegant thin borders
- high-quality course covers
- sophisticated progress indicators
- clean iconography
- premium empty states
- subtle micro-interactions

Create visual rhythm.

Do not make every section a card.

Mix:

- full-width surfaces
- editorial blocks
- list sections
- compact cards
- large feature cards
- clean separators
- sticky actions

This is critical.

The product should look designed by a senior product designer, not generated from a UI template.

---

## Visual hierarchy rules

The most important element on each screen must be obvious within 1 second.

Public screens:

**course value → proof → price → CTA**

Learning screens:

**current lesson → video → description → next action**

Dashboard:

**continue learning → purchased courses → progress**

Profile:

**identity → account → useful actions**

---

## Premium interaction rules

Every important CTA should have:

default

pressed

loading

success

disabled

focus-visible

states.

Primary CTA:

Emerald background.

Hover/desktop:

slightly darker emerald.

Pressed:

small scale reduction approximately 0.98.

Duration:

100–150ms.

Loading:

spinner or subtle progress indicator.

Success:

brief checkmark state before navigation where appropriate.

---

## Acceptance criteria

The project is NOT complete until all of the following are true:

### Visual

- [ ] Premium green brand identity is consistent
- [ ] Cream/white surfaces feel premium
- [ ] Gold is used only as a subtle accent
- [ ] Typography hierarchy is strong
- [ ] No generic template feeling
- [ ] No visual clutter
- [ ] All important screens look polished

### Public experience

- [ ] Splash
- [ ] Home
- [ ] Course catalog
- [ ] Course search
- [ ] Course filtering
- [ ] Course details
- [ ] Curriculum
- [ ] FAQ
- [ ] Instructor
- [ ] Purchase CTA
- [ ] Checkout

### Authentication

- [ ] Login
- [ ] Logout
- [ ] Session persistence
- [ ] Protected routes
- [ ] Access denied state
- [ ] Password/session recovery architecture

### Student experience

- [ ] Dashboard
- [ ] Continue learning
- [ ] My courses
- [ ] Course progress
- [ ] Lesson list
- [ ] Video player
- [ ] Lesson completion
- [ ] Previous/next lesson
- [ ] Files
- [ ] Profile
- [ ] Certificates
- [ ] Notifications

### Telegram

- [ ] Telegram Mini App viewport works
- [ ] Safe areas respected
- [ ] Telegram back behavior supported
- [ ] Touch interaction polished
- [ ] Bottom navigation does not collide with Telegram UI
- [ ] Normal browser fallback works

### Responsive

- [ ] 320px mobile
- [ ] 375px mobile
- [ ] 390px mobile
- [ ] 430px mobile
- [ ] tablet
- [ ] desktop browser fallback

### Accessibility

- [ ] keyboard interaction where applicable
- [ ] visible focus
- [ ] semantic headings
- [ ] meaningful alt text
- [ ] accessible controls
- [ ] reduced motion

### Performance

- [ ] optimized images
- [ ] lazy-loaded media
- [ ] video poster
- [ ] no unnecessary animation
- [ ] no layout jumping
- [ ] no console errors
- [ ] no horizontal overflow

### Functional

- [ ] User can browse course
- [ ] User can open course details
- [ ] User can purchase
- [ ] Purchase state persists
- [ ] User can authenticate
- [ ] Purchased course becomes available
- [ ] Unpurchased course remains locked
- [ ] Lesson completion persists
- [ ] Progress persists
- [ ] User can continue from last lesson
- [ ] Protected lessons cannot be accessed by unauthorized users

---

## Build process

First inspect the existing project and available assets.

Then create a short implementation plan.

Do not start with isolated components.

Build the complete first version before micro-refining individual sections.

Implementation order:

1. project shell
2. design tokens
3. Telegram shell
4. navigation
5. public pages
6. course details
7. checkout flow
8. authentication
9. student dashboard
10. course player
11. progress system
12. profile/certificates/notifications
13. states
14. responsive optimization
15. accessibility
16. browser QA

Do not stop at a static UI mockup.

Implement the real product architecture.

---

## QA protocol

Before declaring completion, inspect:

- mobile
- tablet
- desktop browser fallback
- authenticated state
- unauthenticated state
- purchased course
- locked course
- loading states
- empty states
- error states
- slow network
- reduced motion

Run browser QA and verify:

- routes
- CTA actions
- authentication
- authorization
- progress persistence
- responsive layout
- console errors
- network errors
- asset loading

For every refinement use:

```text
Observed:
[exact visible problem]

Cause:
[likely cause]

Change:
[ONE change only]

Preserve:
[everything that must remain unchanged]

Verify:
[viewport and test required]
```

Do not redesign the entire application during a refinement pass.

---

## Final instruction

Build this as a **premium Telegram-native course ecosystem**.

The result should immediately feel:

**modern + premium + trustworthy + elegant + fast + addictive to use**

The green visual identity must be unmistakable.

Use:

**Emerald + Deep Forest + Cream + White + subtle Champagne Gold**

as the core visual language.

The design must be beautiful enough to increase purchase intent, but the user experience must remain simple enough that a first-time Telegram user understands:

**what the course is → why it is valuable → how much it costs → how to buy → how to start learning.**

Do not create a generic website.

Create a **real product**.