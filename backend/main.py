import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, courses, checkout, student, admin

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Telegram Mini App — Premium Kurslar Platformasi uchun Backend API"
)

# CORS sozlamalari (Telegram WebApp va barcha xavfsiz clientlar uchun)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routerlarni ro'yxatdan o'tkazish
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(courses.router, prefix=settings.API_PREFIX)
app.include_router(checkout.router, prefix=settings.API_PREFIX)
app.include_router(student.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "bot": f"@{settings.BOT_USERNAME}",
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
