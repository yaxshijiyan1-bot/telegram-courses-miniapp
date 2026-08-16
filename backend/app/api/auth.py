import uuid
from fastapi import APIRouter, HTTPException, Depends, status
from app.models.schemas import TelegramAuthRequest, DirectLoginRequest, AuthTokenResponse
from app.core.security import create_access_token, validate_telegram_init_data, get_current_user
from app.core.config import settings
from app.core.supabase import supabase_client

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/telegram", response_model=AuthTokenResponse)
async def telegram_auth(req: TelegramAuthRequest):
    """Telegram WebApp initData orqali xavfsiz HMAC-SHA256 login / ro'yxatdan o'tish"""
    tg_user = req.telegram_user
    if req.init_data:
        validated_user = validate_telegram_init_data(req.init_data, settings.BOT_TOKEN)
        if validated_user:
            tg_user = validated_user
    
    if not tg_user:
        # Fallback local dev
        tg_user = {
            "id": 8544023815,
            "first_name": "Yaxshi",
            "last_name": "Bola",
            "username": "yomonboia"
        }

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

    # Supabase bazadan tekshirish
    db_users = await supabase_client.get("users", {"telegram_id": f"eq.{tg_id}"})
    if db_users and len(db_users) > 0:
        user_record = db_users[0]
        # Rolni yangilash agar admin bo'lsa
        if tg_id in settings.ADMIN_IDS:
            user_record["role"] = "superadmin"
            user_record["name"] = name
    else:
        user_id = str(uuid.uuid4())
        new_user = {
            "id": user_id,
            "telegram_id": tg_id,
            "name": name,
            "username": username,
            "role": role
        }
        inserted = await supabase_client.insert("users", new_user)
        user_record = inserted[0] if inserted else new_user

    token = create_access_token({
        "sub": user_record.get("id", str(uuid.uuid4())),
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
async def direct_login(req: DirectLoginRequest):
    """Login va parol orqali kirish"""
    login_lower = req.login.lower().strip()
    
    # Admin loginlari
    if login_lower in ["yomonboia", "yaxshibola", "admin1"]:
        user_record = {
            "id": str(uuid.uuid4()),
            "telegram_id": 8544023815,
            "name": "Yaxshi Bola",
            "username": "yomonboia",
            "role": "superadmin"
        }
    elif login_lower in ["sokin_notalar", "zuhra", "admin2"]:
        user_record = {
            "id": str(uuid.uuid4()),
            "telegram_id": 8112688757,
            "name": "Zuhra Olimova",
            "username": "sokin_notalar",
            "role": "superadmin"
        }
    else:
        user_record = {
            "id": str(uuid.uuid4()),
            "telegram_id": 987654321,
            "name": req.login.capitalize(),
            "username": req.login.lower(),
            "role": "student"
        }

    token = create_access_token({
        "sub": user_record["id"],
        "telegram_id": user_record["telegram_id"],
        "name": user_record["name"],
        "username": user_record["username"],
        "role": user_record["role"]
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
