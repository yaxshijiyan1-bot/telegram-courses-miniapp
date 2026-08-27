import os
import asyncio
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.config import settings
from app.api import auth, courses, checkout, student, admin, ai
from app.storage import init_store, get_store
from bot_service import start_telegram_bot_polling

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Storage'ni aniqlash (Supabase yoki SQLite fallback) va seed qilish
    store = await init_store()

    # Telegram bot pollingni fon jarayoni sifatida ishga tushirish
    bot_task = asyncio.create_task(start_telegram_bot_polling())
    yield
    # Shutdown: Botni to'xtatish
    bot_task.cancel()
    try:
        await bot_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Telegram Mini App — Premium Kurslar Platformasi uchun Backend API",
    lifespan=lifespan
)

# CORS — faqat ishonchli frontend manbalariga ruxsat
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# JSON javoblar uchun gzip siqish (mobil trafik tejamkorligi)
app.add_middleware(GZipMiddleware, minimum_size=1024)

# Routerlarni ro'yxatdan o'tkazish
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(courses.router, prefix=settings.API_PREFIX)
app.include_router(checkout.router, prefix=settings.API_PREFIX)
app.include_router(student.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)
app.include_router(ai.router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "bot": f"@{settings.BOT_USERNAME}",
        "frontend_url": settings.WEBAPP_URL,
        "docs_url": "/docs"
    }

from fastapi.responses import RedirectResponse
from app.core.r2 import r2_client

@app.get("/api/media/{object_key:path}")
async def serve_media(object_key: str):
    """Cloudflare R2 dagi rasmlar va medialarni xavfsiz va to'g'ridan-to'g'ri ochib berish"""
    object_key = r2_client.normalize_key(object_key)
    presigned = r2_client.generate_presigned_url(object_key, expires_in=3600)
    if not presigned:
        raise HTTPException(status_code=503, detail="Media xizmati vaqtincha ishlamayapti (R2 sozlanmagan)")
    return RedirectResponse(url=presigned, status_code=307)

@app.get("/health")
async def health_check():
    try:
        store = get_store()
        backend = store.backend_name
    except Exception:
        backend = "not_initialized"
    return {"status": "healthy", "storage": backend, "version": settings.VERSION}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
