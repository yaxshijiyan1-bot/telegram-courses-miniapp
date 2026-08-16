import os
from typing import List, Dict, Any
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Telegram Mini App — Premium Kurslar Platformasi API"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"

    # Telegram Bot Config
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")
    BOT_USERNAME: str = os.getenv("BOT_USERNAME", "kurslarimizbot")

    # Teng huquqli Adminlar ro'yxati
    ADMIN_IDS_RAW: str = os.getenv("ADMIN_IDS", "8544023815,8112688757")

    # Adminlar to'g'ridan-to'g'ri kirish parollari (login/parol bilan admin panelga kirish uchun)
    # Bo'sh bo'lsa — to'g'ridan-to'g'ri kirish o'chiq bo'ladi (faqat Telegram HMAC auth ishlaydi)
    ADMIN_1_PASSWORD: str = os.getenv("ADMIN_1_PASSWORD", "")
    ADMIN_2_PASSWORD: str = os.getenv("ADMIN_2_PASSWORD", "")
    ADMIN_1_LOGINS: List[str] = ["yomonboia", "yaxshibola", "admin1"]
    ADMIN_2_LOGINS: List[str] = ["sokin_notalar", "zuhra", "admin2"]

    # Supabase Credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Cloudflare R2
    R2_ACCOUNT_ID: str = os.getenv("R2_ACCOUNT_ID", "")
    R2_ACCESS_KEY_ID: str = os.getenv("R2_ACCESS_KEY_ID", "")
    R2_SECRET_ACCESS_KEY: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
    R2_BUCKET_NAME: str = os.getenv("R2_BUCKET_NAME", "course")
    R2_PUBLIC_URL: str = os.getenv("R2_PUBLIC_URL", "")
    R2_ENDPOINT: str = os.getenv("R2_ENDPOINT", "")

    # Security & JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))

    # WebApp URL
    WEBAPP_URL: str = os.getenv("WEBAPP_URL", "https://kurslarimiz-platforma.vercel.app")

    # CORS — faqat ishonchli manbalar (Telegram Mini App o'zi frontend domenda ishlaydi)
    CORS_ORIGINS_RAW: str = os.getenv(
        "CORS_ORIGINS",
        "https://kurslarimiz-platforma.vercel.app,https://kurslarimiz.vercel.app,http://localhost:3000,http://localhost:5173"
    )

    @property
    def CORS_ORIGINS(self) -> List[str]:
        return [x.strip() for x in self.CORS_ORIGINS_RAW.split(",") if x.strip()]

    # SQLite fallback joylashuvi (Supabase jadvallari bo'lmasa avtomatik ishlaydi)
    DATA_DIR: str = os.getenv("DATA_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data"))

    @property
    def ADMIN_IDS(self) -> List[int]:
        try:
            return [int(x.strip()) for x in self.ADMIN_IDS_RAW.split(",") if x.strip()]
        except Exception:
            return [8544023815, 8112688757]

    @property
    def ADMIN_PROFILES(self) -> Dict[int, Dict[str, Any]]:
        """Teng huquqli adminlar profillari"""
        return {
            8544023815: {
                "name": "Yaxshi Bola",
                "username": "yomonboia",
                "role": "superadmin",
                "logins": self.ADMIN_1_LOGINS,
                "password": self.ADMIN_1_PASSWORD,
            },
            8112688757: {
                "name": "Zuhra Olimova",
                "username": "sokin_notalar",
                "role": "superadmin",
                "logins": self.ADMIN_2_LOGINS,
                "password": self.ADMIN_2_PASSWORD,
            }
        }

    # To'lov Karta Rekvizitlari
    CARD_NUMBER: str = os.getenv("CARD_NUMBER", "8600 5304 1234 5678")
    CARD_HOLDER: str = os.getenv("CARD_HOLDER", "Yaxshi Bola / Zuhra Olimova")
    CARD_BANK: str = os.getenv("CARD_BANK", "Uzcard / Humo (Payme, Click, Uzum)")

    class Config:
        case_sensitive = True

settings = Settings()
