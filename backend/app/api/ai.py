import os
import json
import urllib.request
import urllib.error
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str

class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    course_title: Optional[str] = None
    lesson_title: Optional[str] = None
    context: Optional[str] = None

class AIChatResponse(BaseModel):
    reply: str
    provider: str
    model: str
    suggestions: List[str]

class GenerateCourseRequest(BaseModel):
    topic: str
    category: Optional[str] = "AI"
    target_audience: Optional[str] = "Boshlang'ich va Professional"

SYSTEM_PROMPT = """Siz — "Course Academy" (Kurslarimiz) platformasining 2026-yilgi professional Sun'iy Intellekt va Dasturlash bo'yicha shaxsiy AI Mentorisiz.
Ismingiz: "Kurslar AI Yordamchisi (ox-alpha)".
Siz talabalarga darslarni o'zlashtirishda, kod yozishda, xatolarni tuzatishda va amaliy loyihalarni rejalashtirishda yordam berasiz.

Qoidalar:
1. Doimo o'zbek tilida, do'stona, aniq, lo'nda va professional javob bering.
2. Kod yozganda zamonaviy standartlardan (React 19, TypeScript, Python 3.12, FastAPI, Supabase, Tailwind CSS, Antigravity) foydalaning va tushunarli izohlar qoldiring.
3. Agar foydalanuvchi ma'lum bir kurs yoki dars bo'yicha savol bersa, kontekstga moslab javob bering.
4. Foydalanuvchiga qo'shimcha o'rganish uchun 2-3 ta qisqa taklif (keyingi qadam) bering.
"""

def call_openrouter_api(messages: List[Dict[str, str]], model_override: Optional[str] = None) -> Optional[str]:
    """OpenRouter API inference (stealth/ox-alpha default)"""
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        return None
    model = model_override or settings.OPENROUTER_MODEL or "stealth/ox-alpha"
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kurslarimiz-platforma.vercel.app",
        "X-Title": "Course Academy Telegram MiniApp"
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.6,
        "max_tokens": 2000
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=16) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[AI] OpenRouter error: {e}")
        return None

def call_groq_api(messages: List[Dict[str, str]]) -> Optional[str]:
    """Groq Llama 3.3 70B inference via HTTP"""
    api_key = settings.GROQ_API_KEY
    if not api_key:
        return None
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.6,
        "max_tokens": 1500
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[AI] Groq call error: {e}")
        return None

def call_gemini_api(prompt_text: str) -> Optional[str]:
    """Gemini 2.5 Flash API via HTTP"""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {"parts": [{"text": f"{SYSTEM_PROMPT}\n\nFoydalanuvchi savoli: {prompt_text}"}]}
        ]
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"[AI] Gemini call error: {e}")
        return None

def smart_fallback_reply(query: str, course_title: Optional[str] = None, lesson_title: Optional[str] = None) -> str:
    """Intelligent fallback knowledge engine when external API keys are not set"""
    q_lower = query.lower()
    ctx_info = f" ({course_title} kursi bo'yicha)" if course_title else ""
    
    if "prompt" in q_lower or "ai" in q_lower or "gemini" in q_lower or "claude" in q_lower:
        return (
            f"💡 **AI va Prompt Engineering bo'yicha maslahat{ctx_info}:**\n\n"
            "Mukammal prompt yaratishning 4 oltin qoidasi:\n"
            "1. **Rol (Persona):** AI ga aniq rolni bering (masalan: *Sen Senior Frontend muhandisisan*).\n"
            "2. **Kontekst va Cheklov:** Nima qilish kerakligi va nima taqiqlanganini ayting (*Hech qanday tashqi kutubxonasiz toza CSS yoz*).\n"
            "3. **Format:** Natijani qanday shaklda kutayotganingizni belgilang (*Faqat JSON yoki TypeScript interfeys*).\n"
            "4. **Few-shot misollar:** 1-2 ta namuna kiriting.\n\n"
            "🚀 *Keyingi qadam:* Buni darsdagi amaliy mashg'ulotda darhol sinab ko'ring!"
        )
    elif "kod" in q_lower or "misol" in q_lower or "react" in q_lower or "typescript" in q_lower:
        return (
            f"💻 **2026 Zamonaviy Kod namunasi{ctx_info}:**\n\n"
            "```typescript\n"
            "// TanStack Query va Zustand bilan ma'lumot olish namunasi\n"
            "import { useQuery } from '@tanstack/react-query';\n"
            "import { api } from '../services/api';\n\n"
            "export const useCourseData = (courseId: string) => {\n"
            "  return useQuery({\n"
            "    queryKey: ['course', courseId],\n"
            "    queryFn: () => api.getCourseById(courseId),\n"
            "    staleTime: 1000 * 60 * 5, // 5 daqiqa keshda saqlash\n"
            "  });\n"
            "};\n"
            "```\n\n"
            "Ushbu yondashuv tarmoq trafigini 10x tejaydi va foydalanuvchiga ilovani bir zumda ochish imkonini beradi."
        )
    elif "test" in q_lower or "savol" in q_lower or "quiz" in q_lower:
        return (
            f"📝 **Dars bo'yicha mini-test savollari{ctx_info}:**\n\n"
            "1. **TanStack Query server state uchun ishlatilsa, Zustand nima uchun ishlatiladi?**\n"
            "   - *Javob:* Faqat brauzerning lokal UI holatlari (modal, theme, filtr) uchun.\n"
            "2. **Supabase xavfsizligida qaysi kalit hech qachon frontendga chiqmasligi shart?**\n"
            "   - *Javob:* `SUPABASE_SERVICE_ROLE_KEY`.\n"
            "3. **Telegram Mini Appda back button hodisasi qanday to'g'ri ushlanadi?**\n"
            "   - *Javob:* `window.Telegram.WebApp.BackButton.onClick(...)` orqali.\n\n"
            "Barcha savollarga to'g'ri javob berdingizmi? Yangi darsga o'tishga tayyorsiz! 🎉"
        )
    else:
        return (
            f"Salom! Men sizning **Course Academy AI Yordamchingizman**{ctx_info}.\n\n"
            f"Sizning savolingiz: *\"{query}\"*\n\n"
            "Men sizga darslardagi tushunarsiz mavzularni oddiy tilda tushuntirib berishim, amaliy topshiriqlar uchun tayyor kod yozib berishim yoki dars bo'yicha bilimingizni sinovdan o'tkazishim mumkin.\n\n"
            "Quyidagi mavzulardan birini tanlashingiz mumkin:\n"
            "• *\"Mavzuni oddiy tilda tushuntirib ber\"*\n"
            "• *\"Menga amaliy kod misoli ko'rsat\"*\n"
            "• *\"Bilimimni tekshirish uchun 3 ta savol ber\"*"
        )

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(req: AIChatRequest):
    """
    AI Course Mentor endpoint with primary OpenRouter stealth/ox-alpha routing
    """
    messages: List[Dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if req.course_title or req.lesson_title:
        ctx_msg = f"Foydalanuvchi ayni paytda o'rganayotgan kurs: '{req.course_title or 'Noma\'lum'}', dars: '{req.lesson_title or 'Noma\'lum'}'."
        messages.append({"role": "system", "content": ctx_msg})
        
    for h in req.history[-6:]:
        messages.append({"role": h.role, "content": h.content})
        
    messages.append({"role": "user", "content": req.message})

    # 1. Try OpenRouter (stealth/ox-alpha — Free, fast, high reasoning power)
    reply = call_openrouter_api(messages)
    provider = "openrouter"
    model = settings.OPENROUTER_MODEL or "stealth/ox-alpha"

    # 2. Fallback to Groq (Llama 3.3 70B)
    if not reply:
        reply = call_groq_api(messages)
        provider = "groq"
        model = "llama-3.3-70b-versatile"

    # 3. Fallback to Gemini 2.5 Flash
    if not reply:
        reply = call_gemini_api(req.message)
        provider = "gemini"
        model = "gemini-2.5-flash"

    # 4. Fallback to intelligent local engine
    if not reply:
        reply = smart_fallback_reply(req.message, req.course_title, req.lesson_title)
        provider = "smart-engine"
        model = "kurslar-mentor-v2"

    suggestions = [
        "Mavzuni soddaroq tushuntirib ber",
        "Amaliy kod misoli ko'rsat",
        "Mini-test savollarini ber",
        "Ushbu darsdan qanday loyiha qilsa bo'ladi?"
    ]

    return AIChatResponse(
        reply=reply,
        provider=provider,
        model=model,
        suggestions=suggestions
    )

@router.post("/generate-course")
async def generate_course_curriculum(req: GenerateCourseRequest):
    """
    AI Course Creator for Admin Panel using stealth/ox-alpha:
    Generates complete course details, modules, lessons and outcomes in JSON format.
    """
    prompt = f"""Siz — professional o'quv dasturlari arxitektorisiz.
Quyidagi mavzu bo'yicha 2026-yilgi zamonaviy, to'liq amaliy va bozorda yuqori talabga ega o'quv kursi dasturini JSON formatida tuzing:
Mavzu: "{req.topic}"
Kategoriya: "{req.category}"
Daraja: "{req.target_audience}"

Javobni FAQAT to'g'ri JSON formatida bering (hech qanday markdown ```json belgisisiz yoki matnsiz, faqat xom JSON):
{{
  "title": "Jozibali va aniq kurs nomi",
  "short_description": "1-2 gaplik qisqa, sotuvchi tavsif",
  "description": "Kursning to'liq tavsifi, kimlar uchunligi va o'quvchiga beradigan qiymati",
  "category": "{req.category}",
  "price": 490000,
  "old_price": 890000,
  "duration": "24 soat",
  "lesson_count": 18,
  "level": "{req.target_audience}",
  "outcomes": [
    "O'rganiladigan 1-asosiy ko'nikma",
    "O'rganiladigan 2-asosiy ko'nikma",
    "Portfolio uchun loyiha tayyorlash",
    "Rasmiy sertifikat va ishga joylashish imkoniyati"
  ],
  "modules": [
    {{
      "title": "01. Kirish va Asoslar",
      "lessons": [
        {{"title": "1-dars: Mavzuga kirish va asosiy tushunchalar", "duration": "14:20", "description": "Darsning qisqa mazmuni"}},
        {{"title": "2-dars: Ish muhitini sozlash va birinchi qadam", "duration": "18:40", "description": "Amaliy qadamlar"}}
      ]
    }},
    {{
      "title": "02. Amaliyot va Loyihalar",
      "lessons": [
        {{"title": "3-dars: Real loyihani noldan qurish", "duration": "24:10", "description": "Arxitektura va kodlash"}},
        {{"title": "4-dars: Xatolar bilan ishlash va optimizatsiya", "duration": "19:30", "description": "Debug va tezlik"}}
      ]
    }},
    {{
      "title": "03. Monetizatsiya va Yakuniy Imtihon",
      "lessons": [
        {{"title": "5-dars: Loyihani serverga deploy qilish", "duration": "22:00", "description": "Production tayyorgarligi"}},
        {{"title": "6-dars: Portfolio va daromad qilish sirlari", "duration": "25:15", "description": "Mijozlar topish"}}
      ]
    }}
  ]
}}
"""
    messages = [
        {"role": "system", "content": "Siz faqat valid JSON formatida ma'lumot qaytaruvchi AI arxitektorsiz."},
        {"role": "user", "content": prompt}
    ]

    raw_response = call_openrouter_api(messages)
    if not raw_response:
        raw_response = call_groq_api(messages)

    if raw_response:
        import re
        try:
            # Extract only the JSON part by finding first { and last }
            json_match = re.search(r'\{.*\}', raw_response.strip(), re.DOTALL)
            if json_match:
                clean_json = json_match.group(0)
                parsed = json.loads(clean_json)
                return {"success": True, "data": parsed, "model": "stealth/ox-alpha"}
            else:
                raise ValueError("JSON block topilmadi")
        except Exception as err:
            print(f"[AI] JSON parsing error: {err} | Raw: {raw_response[:200]}")

    # Fallback template if AI fails
    fallback_data = {
        "title": req.topic,
        "short_description": f"{req.topic} bo'yicha 2026-yilgi zamonaviy to'liq amaliy kurs.",
        "description": f"Ushbu kursda siz {req.topic} bo'yicha noldan boshlab professional darajagacha barcha zarur bilim va amaliy ko'nikmalarni o'rganasiz.",
        "category": req.category or "AI",
        "price": 490000,
        "old_price": 850000,
        "duration": "20 soat",
        "lesson_count": 16,
        "level": req.target_audience or "Boshlang'ich va Professional",
        "outcomes": [
            "Noldan boshlab mustaqil loyiha yarata olish",
            "Zamonaviy vositalar va sun'iy intellektdan unumli foydalanish",
            "Portfolio uchun 2 ta tayyor amaliy keys",
            "Rasmiy tasdiqlangan sertifikat olish"
        ],
        "modules": [
            {
                "title": "01. Kirish va Nazariy Asoslar",
                "lessons": [
                    {"title": "1-dars: Mavzuga kirish va maqsadlar", "duration": "12:00", "description": "Asosiy tushunchalar"},
                    {"title": "2-dars: Kerakli vositalarni o'rnatish", "duration": "15:00", "description": "Ish muhitini sozlash"}
                ]
            },
            {
                "title": "02. Amaliy Loyiha",
                "lessons": [
                    {"title": "3-dars: Real amaliy loyiha yaratish", "duration": "25:00", "description": "Noldan qurish"},
                    {"title": "4-dars: Xatolarni to'g'rilash va testlash", "duration": "18:00", "description": "Optimizatsiya"}
                ]
            },
            {
                "title": "03. Xulosa va Imtihon",
                "lessons": [
                    {"title": "5-dars: Yakuniy loyihani topshirish", "duration": "20:00", "description": "Natijalarni tekshirish"}
                ]
            }
        ]
    }
    return {"success": True, "data": fallback_data, "model": "template-engine"}
