import hmac
import hashlib
import json
import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

def validate_telegram_init_data(init_data_raw: str, bot_token: str) -> Optional[Dict[str, Any]]:
    """
    Telegram WebApp initData string hashini qat'iy HMAC-SHA256 bilan tekshiradi.
    Foydalanuvchi ma'lumotlarini soxtalashtirishdan va eski initData ni qayta
    ishlatish (replay) hujumidan himoya qiladi.
    """
    if not init_data_raw:
        return None
    try:
        parsed_data = dict(urllib.parse.parse_qsl(init_data_raw, keep_blank_values=True))
        hash_to_check = parsed_data.pop("hash", None)
        if not hash_to_check:
            return None

        # Replay himoyasi: initData TELEGRAM_AUTH_MAX_AGE_HOURS dan eski bo'lmasligi kerak
        try:
            auth_date = float(parsed_data.get("auth_date") or 0)
        except ValueError:
            return None
        max_age_seconds = max(1, settings.TELEGRAM_AUTH_MAX_AGE_HOURS) * 3600
        if not auth_date or datetime.now(timezone.utc).timestamp() - auth_date > max_age_seconds:
            return None

        # Agar bot token mavjud bo'lsa, qat'iy HMAC-SHA256 tekshiruvi
        if bot_token:
            data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed_data.items()))
            secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
            calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

            # compare_digest timing-attack ga qarshi doimiy vaqtda solishtiradi
            if not hmac.compare_digest(calculated_hash, hash_to_check):
                return None

        if "user" in parsed_data:
            return json.loads(parsed_data["user"])
        return parsed_data
    except Exception:
        return None

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)) -> Optional[Dict[str, Any]]:
    if not credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    if not payload:
        return None
    # Bloklangan foydalanuvchi anonim sifatida ko'riladi — kurslarga kirish yo'q
    tg_id = payload.get("telegram_id")
    if tg_id is not None:
        try:
            tg_id_int = int(tg_id)
        except (TypeError, ValueError):
            return payload
        if tg_id_int not in settings.ADMIN_IDS:
            from app.storage import get_store
            try:
                if await get_store().is_user_blocked(tg_id_int):
                    return None
            except Exception:
                pass
    return payload

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autentifikatsiyadan o'tilmagan. Iltimos tizimga kiring."
        )
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yaroqsiz yoki muddati o'tgan token."
        )
    # Bloklangan foydalanuvchilar: token amal qilish muddati tugamagan bo'lsa ham rad etiladi.
    # Adminlar bloklanmaydi — ularni bloklash imkoni yo'q (ADMIN_IDS ichida).
    tg_id = payload.get("telegram_id")
    if tg_id is not None:
        try:
            tg_id_int = int(tg_id)
        except (TypeError, ValueError):
            tg_id_int = None
        if tg_id_int is not None and tg_id_int not in settings.ADMIN_IDS:
            from app.storage import get_store
            try:
                blocked = await get_store().is_user_blocked(tg_id_int)
            except Exception:
                blocked = False
            if blocked:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Hisobingiz bloklangan. Batafsil ma'lumot uchun admin bilan bog'laning."
                )
    return payload

async def get_current_admin(credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)) -> Dict[str, Any]:
    """Teng huquqli Adminlarni (Yaxshi Bola va Zuhra Olimova) tekshirish"""
    user = await get_current_user(credentials)
    tg_id = user.get("telegram_id")
    
    if tg_id not in settings.ADMIN_IDS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ushbu amalni bajarish uchun faqat Administrator ruxsatiga egasiz."
        )
    return user
