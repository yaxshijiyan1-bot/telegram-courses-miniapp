import re
import json
import time
import asyncio
import logging
import urllib.error
import urllib.request
from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.config import settings
from app.core.security import get_current_admin

# AI chat talabalar uchun olib tashlangan — bu modul faqat admin kurs generatorini saqlaydi.
router = APIRouter(prefix="/ai", tags=["AI Course Generator (Admin)"])
logger = logging.getLogger(__name__)

class GenerateCourseRequest(BaseModel):
    topic: str
    category: Optional[str] = "AI"
    target_audience: Optional[str] = "Boshlang'ich va Professional"

def call_openrouter_api(messages: List[Dict[str, str]], model_override: Optional[str] = None) -> Optional[str]:
    """OpenRouter orqali Qwen inference; xato bo'lsa fallbackga yo'l beradi."""
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        return None
    model = model_override or settings.OPENROUTER_MODEL or "qwen/qwen3.8-flash"
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
        "max_tokens": max(64, min(settings.OPENROUTER_MAX_TOKENS, 2000))
    }
    retryable_statuses = {429, 500, 502, 503, 504}
    attempts = max(1, min(settings.OPENROUTER_RETRY_ATTEMPTS + 1, 3))
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=16) as response:
                data = json.loads(response.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"]
        except urllib.error.HTTPError as exc:
            error_text = exc.read().decode("utf-8", "replace")[:500]
            if exc.code in retryable_statuses and attempt < attempts - 1:
                # 429 javobida token ishlatilmaydi; qisqa retry shared providerdagi
                # vaqtinchalik navbatni chetlab o'tishi mumkin.
                time.sleep(0.75 * (attempt + 1))
                continue
            logger.warning("OpenRouter %s xatosi: %s", exc.code, error_text)
            return None
        except Exception as exc:
            logger.warning("OpenRouter so'rovi bajarilmadi: %s", exc)
            return None
    return None

def call_groq_api(messages: List[Dict[str, str]]) -> Optional[str]:
    """Groq Llama 3.3 70B inference via HTTP (faqat admin yoqqan fallback)"""
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
        logger.warning("[AI] Groq call error: %s", e)
        return None

@router.post("/generate-course")
async def generate_course_curriculum(
    req: GenerateCourseRequest,
    admin: dict = Depends(get_current_admin)
):
    """
    AI Course Creator for Admin Panel using Qwen:
    Generates complete course details, modules, lessons and outcomes in JSON format.
    Faqat admin token bilan ochiladi — aks holda istalgan odam OpenRouter
    kreditlarini sarflashi mumkin edi.
    """
    if not (req.topic or "").strip():
        raise HTTPException(status_code=400, detail="Kurs mavzusi bo'sh bo'lmasligi kerak")

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

    raw_response = await asyncio.to_thread(call_openrouter_api, messages)
    if not raw_response and settings.ENABLE_AI_PROVIDER_FALLBACKS:
        raw_response = await asyncio.to_thread(call_groq_api, messages)

    if raw_response:
        try:
            # Extract only the JSON part by finding first { and last }
            json_match = re.search(r'\{.*\}', raw_response.strip(), re.DOTALL)
            if json_match:
                clean_json = json_match.group(0)
                parsed = json.loads(clean_json)
                return {"success": True, "data": parsed, "model": settings.OPENROUTER_MODEL}
            else:
                raise ValueError("JSON block topilmadi")
        except Exception as err:
            logger.warning("[AI] JSON parsing error: %s | Raw: %s", err, raw_response[:200])

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
