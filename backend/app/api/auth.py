import hmac
from fastapi import APIRouter, HTTPException, Depends, status, Request
from app.models.schemas import TelegramAuthRequest, DirectLoginRequest, AuthTokenResponse
from app.core.security import create_access_token, validate_telegram_init_data, get_current_user
from app.core.config import settings
from app.storage import get_store

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Oddiy rate-limit: bir IP dan 1 daqiqada 20 tagacha urinish
_login_attempts: dict = {}

def _rate_limited(request: Request, key: str, limit: int = 20, window: int = 60) -> bool:
    import time
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    bucket = _login_attempts.setdefault(f"{key}:{ip}", [])
    bucket[:] = [t for t in bucket if now - t < window]
    if len(bucket) >= limit:
        return True
    bucket.append(now)
    return False

def _admin_login_for(login_lower: str) -> int:
    for tg_id, profile in settings.ADMIN_PROFILES.items():
        if login_lower in profile["logins"]:
            return tg_id
    return 0

@router.post("/telegram", response_model=AuthTokenResponse)
async def telegram_auth(req: TelegramAuthRequest, request: Request):
    """Telegram WebApp initData orqali qat'iy va xavfsiz HMAC-SHA256 login / ro'yxatdan o'tish"""
    if _rate_limited(request, "tg"):
        raise HTTPException(status_code=429, detail="Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring.")

    tg_user = None

    if req.init_data:
        validated_user = validate_telegram_init_data(req.init_data, settings.BOT_TOKEN)
        if not validated_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Telegram autentifikatsiyasi xato: HMAC-SHA256 imzosi haqiqiy emas!"
            )
        tg_user = validated_user
    elif req.telegram_user:
        # Faqat local development uchun (BOT_TOKEN yo'q bo'lganda)
        tg_user = req.telegram_user
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram init_data taqdim etilmagan"
        )

    tg_id = int(tg_user.get("id", 0))

    # Agar kirayotgan user Admin bo'lsa (Yaxshi Bola yoki Zuhra Olimova)
    if tg_id in settings.ADMIN_PROFILES:
        admin_info = settings.ADMIN_PROFILES[tg_id]
        name = admin_info["name"]
        username = admin_info["username"]
        role = admin_info["role"]
    else:
        name = f"{tg_user.get('first_name', '')} {tg_user.get('last_name', '')}".strip() or "Talaba"
        username = tg_user.get("username", "")
        role = "student"

    store = get_store()
    user_record = await store.get_user_by_tg(tg_id)
    if user_record:
        # Ism/username/rol o'zgargan bo'lsa yangilab boramiz
        updates = {}
        if user_record.get("name") != name:
            updates["name"] = name
        if user_record.get("username") != username:
            updates["username"] = username
        if tg_id in settings.ADMIN_IDS and user_record.get("role") != "superadmin":
            updates["role"] = "superadmin"
        if updates:
            await store.update_user(user_record["id"], updates)
    else:
        user_record = await store.create_user({
            "telegram_id": tg_id,
            "name": name,
            "username": username,
            "role": role,
        })

    token = create_access_token({
        "sub": user_record["id"],
        "telegram_id": tg_id,
        "name": user_record.get("name", name),
        "username": user_record.get("username", username),
        "role": user_record.get("role", role)
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_record
    }

@router.post("/login", response_model=AuthTokenResponse)
async def direct_login(req: DirectLoginRequest, request: Request):
    """
    Login va parol orqali kirish — FAQAT ADMINLAR UCHUN.
    Parollar .env'dagi ADMIN_1_PASSWORD / ADMIN_2_PASSWORD dan tekshiriladi.
    Parol sozlanmagan bo'lsa ushbu yo'l butunlay o'chiq.
    """
    if _rate_limited(request, "direct", limit=10):
        raise HTTPException(status_code=429, detail="Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring.")

    login_lower = req.login.lower().strip()
    admin_tg_id = _admin_login_for(login_lower)

    if not admin_tg_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Talabalar uchun to'g'ridan-to'g'ri login o'chirilgan. Iltimos, Telegram orqali kiring."
        )

    profile = settings.ADMIN_PROFILES[admin_tg_id]
    stored_password = profile.get("password") or ""

    if not stored_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="To'g'ridan-to'g'ri kirish hozircha o'chirilgan. Telegram orqali kiring."
        )

    if not hmac.compare_digest(stored_password, req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login yoki parol noto'g'ri."
        )

    store = get_store()
    user_record = await store.get_user_by_tg(admin_tg_id)
    if not user_record:
        user_record = await store.create_user({
            "telegram_id": admin_tg_id,
            "name": profile["name"],
            "username": profile["username"],
            "role": "superadmin",
        })

    token = create_access_token({
        "sub": user_record["id"],
        "telegram_id": admin_tg_id,
        "name": user_record.get("name"),
        "username": user_record.get("username"),
        "role": "superadmin"
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_record
    }

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Joriy foydalanuvchi ma'lumotlarini olish"""
    return {"user": user}
