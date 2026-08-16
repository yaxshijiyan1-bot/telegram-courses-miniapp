import os
from typing import List, Dict, Any
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Telegram Mini App — Premium Kurslar Platformasi API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Telegram Bot Config
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")
    BOT_USERNAME: str = os.getenv("BOT_USERNAME", "kurslarimizbot")
    
    # Teng huquqli Adminlar ro'yxati
    ADMIN_IDS_RAW: str = os.getenv("ADMIN_IDS", "8544023815,8112688757")
    
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
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_jwt_key_telegram_course_platform_2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 kun

    # WebApp URL
    WEBAPP_URL: str = os.getenv("WEBAPP_URL", "https://kurslarimiz.vercel.app")

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
                "role": "superadmin"
            },
            8112688757: {
                "name": "Zuhra Olimova",
                "username": "sokin_notalar",
                "role": "superadmin"
            }
        }

    # To'lov Karta Rekvizitlari
    CARD_NUMBER: str = os.getenv("CARD_NUMBER", "8600 0000 0000 0000")
    CARD_HOLDER: str = os.getenv("CARD_HOLDER", "Yaxshi Bola / Zuhra Olimova")
    CARD_BANK: str = os.getenv("CARD_BANK", "Payme / Click / Uzum")

    class Config:
        case_sensitive = True

settings = Settings()
