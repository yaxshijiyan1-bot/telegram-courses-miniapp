"""
Boshlang'ich (seed) ma'lumotlar — kurslar, modullar va darslar.
MAXFIY KALITLAR BU YERDA SAQLANMAYDI: barchasi .env orqali keladi (app.core.config).
"""

# 1. SAMPLE PREMIUM COURSES
COURSES = [
    {
        "id": "c1111111-1111-1111-1111-111111111111",
        "title": "Sun'iy Intellekt va Prompt Engineering Pro",
        "slug": "ai-prompt-engineering-pro",
        "category": "AI",
        "short_description": "Gemini 3.7, Claude va ChatGPT orqali biznes, dasturlash va avtomatizatsiyani 10x tezlashtirish.",
        "description": "Ushbu keng qamrovli kursda siz zamonaviy LLM modellari, Antigravity agentlar tizimi, Nano Banana vizual generatsiyasi va AI orqali real loyihalarni noldan professional darajada boshqarishni o'rganasiz.",
        "cover_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        "preview_video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "price": 490000,
        "old_price": 890000,
        "discount_percent": 45,
        "duration": "24 soat",
        "lesson_count": 28,
        "level": "Boshlang'ichdan Yuqori darajagacha",
        "instructor_name": "Yaxshi Bola",
        "instructor_title": "AI Architect & Senior Software Engineer",
        "instructor_avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        "instructor_bio": "AI Agentlar, LLM arxitekturasi va murakkab dasturiy ta'minotlar bo'yicha yetakchi mutaxassis.",
        "access_duration": "1 yil (365 kun)",
        "copyright_notice": "Ko'chirib olish va tarqatish qat'iyan taqiqlanadi. Mualliflik huquqi bilan himoyalangan.",
        "rating": 5.0,
        "student_count": 1420,
        "published": True
    },
    {
        "id": "c2222222-2222-2222-2222-222222222222",
        "title": "Zamonaviy UI/UX va Mobile App Dizayn",
        "slug": "ui-ux-mobile-design",
        "category": "Dizayn",
        "short_description": "Figma, Design Systems va Apple Human Interface asosida mukammal mobil interfeyslar yaratish.",
        "description": "Figma Masterclass, zamonaviy dizayn tokenlari, mikro-animatsiyalar, tipografiya va Telegram Mini App interfeyslarini xalqaro standartda yaratish bo'yicha to'liq amaliy qo'llanma.",
        "cover_url": "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80",
        "preview_video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "price": 550000,
        "old_price": 950000,
        "discount_percent": 42,
        "duration": "30 soat",
        "lesson_count": 35,
        "level": "Amaliyotga yo'naltirilgan",
        "instructor_name": "Zuhra Olimova",
        "instructor_title": "Lead Product Designer & Art Director",
        "instructor_avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        "instructor_bio": "Fintech, EdTech va Telegram Mini App interfeyslari bo'yicha yetakchi Art Director.",
        "access_duration": "1 yil (365 kun)",
        "copyright_notice": "Ko'chirib olish va tarqatish qat'iyan taqiqlanadi. Mualliflik huquqi bilan himoyalangan.",
        "rating": 5.0,
        "student_count": 980,
        "published": True
    },
    {
        "id": "c3333333-3333-3333-3333-333333333333",
        "title": "Telegram Bot & Mini App Fullstack Dasturlash",
        "slug": "telegram-miniapp-fullstack",
        "category": "Dasturlash",
        "short_description": "FastAPI, React, TypeScript va Telegram WebApp SDK orqali real Mini Applar va to'lov tizimlarini qurish.",
        "description": "Telegram platformasida Click, Payme, Supabase va Cloudflare R2 bilan ishlovchi to'liq tijoriy Mini Applarni ishlab chiqish, serverga deploy qilish va yuritish bo'yicha eng sara kurs.",
        "cover_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
        "preview_video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "price": 690000,
        "old_price": 1200000,
        "discount_percent": 43,
        "duration": "42 soat",
        "lesson_count": 45,
        "level": "O'rta va Professional",
        "instructor_name": "Yaxshi Bola",
        "instructor_title": "Telegram Fullstack Architect",
        "instructor_avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
        "instructor_bio": "High-load tizimlar va Telegram ekotizimi bo'yicha yetakchi dasturchi va arxitektor.",
        "access_duration": "1 yil (365 kun)",
        "copyright_notice": "Ko'chirib olish va tarqatish qat'iyan taqiqlanadi. Mualliflik huquqi bilan himoyalangan.",
        "rating": 4.9,
        "student_count": 1850,
        "published": True
    },
    {
        "id": "c4444444-4444-4444-4444-444444444444",
        "title": "High-Ticket SMM va Kontent Monetizatsiya",
        "slug": "high-ticket-smm-monetization",
        "category": "Marketing",
        "short_description": "Telegram va Instagram kanallardan yuqori chekli mijozlarni jalb qilish va sotuv voronkalari.",
        "description": "Kontent reja, auditoriyani isitish (lead warming), video reels skriptlari, psixologik triggerlar va to'g'ri narxlash orqali oyiga barqaror daromad qilish sirlari.",
        "cover_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
        "preview_video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "price": 390000,
        "old_price": 700000,
        "discount_percent": 44,
        "duration": "16 soat",
        "lesson_count": 20,
        "level": "Boshlang'ich va Amaliyotchi",
        "instructor_name": "Zuhra Olimova",
        "instructor_title": "Marketing & Growth Strategist",
        "instructor_avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
        "instructor_bio": "100+ dan ortiq brendlar va shaxsiy bloglar uchun million dollarlik sotuv voronkalari muallifi.",
        "access_duration": "1 yil (365 kun)",
        "copyright_notice": "Ko'chirib olish va tarqatish qat'iyan taqiqlanadi. Mualliflik huquqi bilan himoyalangan.",
        "rating": 4.9,
        "student_count": 2100,
        "published": True
    }

]


# 2. MODULES & LESSONS FOR AI COURSE (Course 1)
MODULES_COURSE_1 = [
    {
        "id": "m1111111-1111-1111-1111-111111111111",
        "course_id": "c1111111-1111-1111-1111-111111111111",
        "title": "01. Kirish va LLM Asoslari",
        "order": 1,
        "lessons": [
            {
                "id": "l1111111-1111-1111-1111-111111111101",
                "title": "AI inqilobi va Prompt Engineering qanday ishlaydi?",
                "duration": "12:45",
                "order": 1,
                "is_preview": True,
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                "description": "Sun'iy intellektning hozirgi imkoniyatlari, kontekst oynasi, tokenlar va to'g'ri fikrlash modeli.",
                "resources": []
            },
            {
                "id": "l1111111-1111-1111-1111-111111111102",
                "title": "Master Prompt Arxitekturasi: Rol, Kontekst, Cheklovlar",
                "duration": "18:20",
                "order": 2,
                "is_preview": True,
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                "description": "Dasturlash, tahlil va matn generatsiyasida eng aniq natijaga erishish formulasini o'rganamiz.",
                "resources": []
            },
            {
                "id": "l1111111-1111-1111-1111-111111111103",
                "title": "Zero-shot, Few-shot va Chain-of-Thought texnikalari",
                "duration": "15:10",
                "order": 3,
                "is_preview": False,
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                "description": "Murakkab masalalarni AI ga bosqichma-bosqich yechtirish va xatolarni 90% ga kamaytirish usullari.",
                "resources": [{"name": "CoT_Amaliy_Topshiriqlar.pdf", "size": "3.1 MB", "url": "#"}]
            }
        ]
    },
    {
        "id": "m1111111-1111-1111-1111-111111111112",
        "course_id": "c1111111-1111-1111-1111-111111111111",
        "title": "02. Amaliy AI Dasturlash va Agentlar",
        "order": 2,
        "lessons": [
            {
                "id": "l1111111-1111-1111-1111-111111111104",
                "title": "Antigravity & Gemini 3.7 bilan kod yozish",
                "duration": "22:15",
                "order": 1,
                "is_preview": False,
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                "description": "Katta kod bazalarini tahlil qilish, avtonom agentlarni boshqarish va to'liq loyiha yaratish.",
                "resources": [{"name": "Agent_Workflows_Config.json", "size": "540 KB", "url": "#"}]
            },
            {
                "id": "l1111111-1111-1111-1111-111111111105",
                "title": "Avtomatik QA va Refinement strategiyasi",
                "duration": "19:40",
                "order": 2,
                "is_preview": False,
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
                "description": "Koddagi xatolarni avtomatik test qilish va xavfsiz deployga tayyorlash.",
                "resources": []
            }
        ]
    },
    {
        "id": "m1111111-1111-1111-1111-111111111113",
        "course_id": "c1111111-1111-1111-1111-111111111111",
        "title": "03. Real Biznes Loyiha va Yakuniy Imtihon",
        "order": 3,
        "lessons": [
            {
                "id": "l1111111-1111-1111-1111-111111111106",
                "title": "AI SaaS startupni 1 kunda ishga tushirish",
                "duration": "28:50",
                "order": 1,
                "is_preview": False,
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
                "description": "Landing page, API, to'lov va foydalanuvchilar qabulini noldan oxirigacha qurish.",
                "resources": [{"name": "Startup_Blueprint.pdf", "size": "5.6 MB", "url": "#"}]
            }
        ]
    }
]


# 3. DEMO USER & ENROLLMENT & CERTIFICATES
DEMO_USER = {
    "id": "u1111111-1111-1111-1111-111111111111",
    "telegram_id": 123456789,
    "name": "Abdurahmon Fayzullayev",
    "username": "abdurahmon_dev",
    "phone": "+998901234567",
    "role": "student"
}

DEMO_ENROLLMENT = {
    "id": "e1111111-1111-1111-1111-111111111111",
    "user_id": DEMO_USER["id"],
    "course_id": "c1111111-1111-1111-1111-111111111111",
    "status": "active"
}

DEMO_PROGRESS = [
    {
        "user_id": DEMO_USER["id"],
        "course_id": "c1111111-1111-1111-1111-111111111111",
        "lesson_id": "l1111111-1111-1111-1111-111111111101",
        "completed": True,
        "last_position": 765
    },
    {
        "user_id": DEMO_USER["id"],
        "course_id": "c1111111-1111-1111-1111-111111111111",
        "lesson_id": "l1111111-1111-1111-1111-111111111102",
        "completed": True,
        "last_position": 1100
    }
]

DEMO_NOTIFICATIONS = [
    {
        "user_id": DEMO_USER["id"],
        "title": "Xush kelibsiz!",
        "message": "Premium kurslar platformasiga muvaffaqiyatli a'zo bo'ldingiz.",
        "type": "success",
        "is_read": False
    },
    {
        "user_id": DEMO_USER["id"],
        "title": "Yangi dars qo'shildi",
        "message": "'AI Prompt Engineering' kursida yangi amaliy dars yuklandi.",
        "type": "course",
        "is_read": False
    }
]

def normalize_stored_modules(course_id: str, stored: list) -> list:
    """
    Admin kiritgan faqat matnli modullarni ([{title, lessons:[{title}]}])
    to'liq modul/dars strukturasiga keltiradi. ID lar deterministik —
    tartib raqamiga bog'langan.
    """
    modules = []
    order = 0
    for m in stored or []:
        title = str((m or {}).get("title") or "").strip()
        if not title:
            continue
        order += 1
        module_id = f"m-{course_id}-{order}"
        lessons = []
        l_order = 0
        for l in (m or {}).get("lessons") or []:
            ltitle = str((l or {}).get("title") or "").strip()
            if not ltitle:
                continue
            l_order += 1
            lessons.append({
                "id": f"l-{course_id}-{order}-{l_order}",
                "module_id": module_id,
                "course_id": course_id,
                "title": ltitle,
                "duration": str((l or {}).get("duration") or ""),
                "order": l_order,
                "is_preview": bool((l or {}).get("is_preview", False)),
                "description": (l or {}).get("description"),
                "resources": (l or {}).get("resources") or []
            })
        modules.append({
            "id": module_id,
            "course_id": course_id,
            "title": title,
            "order": order,
            "lessons": lessons
        })
    return modules


def build_course_modules(course: dict) -> list:
    """
    Berilgan kurs uchun modullar va darslar strukturasini quradi.
    Kurs 1 (AI) uchun to'liq tayyorLANGAN MODULES_COURSE_1 ishlatiladi,
    qolgan kurslar uchun universal 2-modulli amaliy dastur generatsiya qilinadi.
    """
    if course["id"] == "c1111111-1111-1111-1111-111111111111":
        return MODULES_COURSE_1
    return [
        {
            "id": f"m-{course['id']}-1",
            "course_id": course["id"],
            "title": "01. Boshlang'ich qism va fundamental asoslar",
            "order": 1,
            "lessons": [
                {
                    "id": f"l-{course['id']}-1",
                    "module_id": f"m-{course['id']}-1",
                    "course_id": course["id"],
                    "title": "Kurs bilan tanishuv va metodika",
                    "duration": "10:15",
                    "order": 1,
                    "is_preview": True,
                    "description": "Kurs dasturi, o'rganish tartibi va asosiy maqsadlar bilan tanishamiz.",
                    "resources": []
                },
                {
                    "id": f"l-{course['id']}-2",
                    "module_id": f"m-{course['id']}-1",
                    "course_id": course["id"],
                    "title": "Asosiy vositalar va platformani sozlash",
                    "duration": "14:40",
                    "order": 2,
                    "is_preview": False,
                    "description": "Amaliyot uchun barcha kerakli dasturiy ta'minotlarni o'rnatish.",
                    "resources": []
                }
            ]
        },
        {
            "id": f"m-{course['id']}-2",
            "course_id": course["id"],
            "title": "02. Amaliy loyihalar va vazifalar",
            "order": 2,
            "lessons": [
                {
                    "id": f"l-{course['id']}-3",
                    "module_id": f"m-{course['id']}-2",
                    "course_id": course["id"],
                    "title": "Real keys tahlili va amaliy topshiriq",
                    "duration": "24:30",
                    "order": 1,
                    "is_preview": False,
                    "description": "O'rganilgan nazariy bilimlarni real biznes keysida qo'llash.",
                    "resources": []
                }
            ]
        }
    ]

def seed():
    print("Seed ma'lumotlari storage moduli orqali ishga tushiriladi (main.py lifespan).")

if __name__ == "__main__":
    seed()

