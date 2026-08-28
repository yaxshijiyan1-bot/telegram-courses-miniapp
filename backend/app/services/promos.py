"""Promokodlar va referal tizimining barcha mantiqi.

Saqlash: DB migratsiyasiz — kichik JSON hujjatlar app_settings kalitlarida
turadi (Supabase va SQLite ikkalasida ham mavjud jadval).

Promo kod obyekti:
    {code, percent, max_uses (0=cheksiz), used_by: [user_id], active: bool,
     expires_at: ISO|None, note: str, auto: bool}

Referal:
    referral_codes  : {user_id: kod}
    referral_links  : {taklif_qilingan_user_id: referrer_user_id}
    referral_rewarded: {referrer_user_id: [taklif_qilingan_user_id]} — ikki marta
                       mukofotlanishning oldini oladi.
"""
from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.storage import get_store

logger = logging.getLogger(__name__)

KEY_PROMOS = "promo_codes"
KEY_REF_CODES = "referral_codes"
KEY_REF_LINKS = "referral_links"
KEY_REF_REWARDED = "referral_rewarded"

# Mukofot foizlari env orqali sozlanadi
REFERRAL_REWARD_PERCENT = max(1, min(90, int(os.getenv("REFERRAL_REWARD_PERCENT", "15"))))
REFERRAL_INVITEE_PERCENT = max(1, min(90, int(os.getenv("REFERRAL_INVITEE_PERCENT", "10"))))


async def _get_json(store, key: str, default: Any) -> Any:
    raw = await store.get_setting(key)
    if not raw:
        return default
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        return default


async def _set_json(store, key: str, value: Any) -> None:
    await store.set_setting(key, json.dumps(value, ensure_ascii=False))


def _norm(code: Any) -> str:
    return str(code or "").strip().upper().replace(" ", "")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------- PROMO KODLAR

async def list_codes(store) -> List[Dict[str, Any]]:
    codes = await _get_json(store, KEY_PROMOS, [])
    # Eski yozuvlar tozalanadi (muddati tugagan va ishlatilganlar belgilanadi)
    return sorted(codes, key=lambda c: str(c.get("created_at") or ""), reverse=True)


async def create_code(
    store,
    code: str,
    percent: int,
    max_uses: int = 0,
    days_valid: int = 0,
    note: str = "",
    auto: bool = False,
) -> Tuple[Optional[Dict[str, Any]], str]:
    """Yangi promokod yaratadi. (kod, xabar) qaytaradi."""
    clean = _norm(code)
    if len(clean) < 3 or len(clean) > 24:
        return None, "Kod 3-24 belgidan iborat bo'lishi kerak"
    if not (1 <= int(percent) <= 90):
        return None, "Foiz 1-90 oralig'ida bo'lishi kerak"

    codes = await _get_json(store, KEY_PROMOS, [])
    if any(_norm(c.get("code")) == clean for c in codes):
        return None, "Bu kod allaqachon mavjud"

    expires_at = None
    if int(days_valid) > 0:
        expires_at = (datetime.now(timezone.utc) + timedelta(days=int(days_valid))).isoformat()

    obj = {
        "code": clean,
        "percent": int(percent),
        "max_uses": max(0, int(max_uses)),
        "used_by": [],
        "active": True,
        "expires_at": expires_at,
        "note": (note or "")[:120],
        "auto": bool(auto),
        "created_at": _now_iso(),
    }
    codes.append(obj)
    await _set_json(store, KEY_PROMOS, codes)
    return obj, f"«{clean}» kodi yaratildi (−{int(percent)}%)"


async def delete_code(store, code: str) -> bool:
    clean = _norm(code)
    codes = await _get_json(store, KEY_PROMOS, [])
    remaining = [c for c in codes if _norm(c.get("code")) != clean]
    if len(remaining) == len(codes):
        return False
    await _set_json(store, KEY_PROMOS, remaining)
    return True


async def validate_code(store, code: str, user_id: Optional[str]) -> Tuple[Optional[Dict[str, Any]], str]:
    """Kodni sarflamay, faqat tekshiradi. (info|None, xabar) qaytaradi."""
    clean = _norm(code)
    if not clean:
        return None, "Promokod kiritilmadi"
    codes = await _get_json(store, KEY_PROMOS, [])
    entry = next((c for c in codes if _norm(c.get("code")) == clean), None)
    if not entry:
        return None, "Bunday promokod topilmadi"
    if not entry.get("active", True):
        return None, "Bu promokod o'chirilgan"
    expires_at = entry.get("expires_at")
    if expires_at:
        try:
            if datetime.fromisoformat(str(expires_at)) < datetime.now(timezone.utc):
                return None, "Bu promokodning muddati tugagan"
        except (ValueError, TypeError):
            pass
    max_uses = int(entry.get("max_uses") or 0)
    used_by = entry.get("used_by") or []
    if max_uses > 0 and len(used_by) >= max_uses:
        return None, "Bu promokod limiti tugagan"
    if user_id and user_id in used_by:
        return None, "Siz bu promokodni allaqachon ishlatgansiz"
    return entry, f"Promokod qo'llanildi: −{int(entry['percent'])}%"


async def consume_code(store, code: str, user_id: Optional[str]) -> Tuple[Optional[Dict[str, Any]], str]:
    """Kodni ishlatilgan deb belgilaydi (chek tasdiqlanganda chaqiriladi)."""
    entry, message = await validate_code(store, code, user_id)
    if not entry:
        return None, message
    clean = _norm(code)
    codes = await _get_json(store, KEY_PROMOS, [])
    for c in codes:
        if _norm(c.get("code")) == clean:
            used_by = c.get("used_by") or []
            if user_id and user_id not in used_by:
                used_by.append(user_id)
            c["used_by"] = used_by
            break
    await _set_json(store, KEY_PROMOS, codes)
    return entry, message


def apply_percent(effective_price: int, percent: int) -> int:
    """Joriy (chegirmali) narxga promokod foizini qo'llaydi va yaxlitlaydi."""
    try:
        price = max(0, int(effective_price))
        pct = max(0, min(90, int(percent)))
        return round(price * (100 - pct) / 100)
    except (TypeError, ValueError):
        return int(effective_price or 0)


# ---------------------------------------------------------------- REFERAL

def _gen_code(prefix: str) -> str:
    return f"{prefix}{uuid.uuid4().hex[:6].upper()}"


async def get_or_create_referral_code(store, user_id: str) -> str:
    codes = await _get_json(store, KEY_REF_CODES, {})
    code = codes.get(str(user_id))
    if code:
        return code
    code = _gen_code("REF")
    # Tasodifiy to'qnashuv — qayta generatsiya
    existing = set(codes.values())
    while code in existing:
        code = _gen_code("REF")
    codes[str(user_id)] = code
    await _set_json(store, KEY_REF_CODES, codes)
    return code


async def resolve_referral_code(store, code: str) -> Optional[str]:
    """Kod bo'yicha referrer user_id ni topadi."""
    clean = _norm(code)
    codes = await _get_json(store, KEY_REF_CODES, {})
    for uid, c in codes.items():
        if _norm(c) == clean:
            return str(uid)
    return None


async def get_referrer_of(store, user_id: str) -> Optional[str]:
    links = await _get_json(store, KEY_REF_LINKS, {})
    referrer = links.get(str(user_id))
    return str(referrer) if referrer else None


async def link_referral(store, user_id: str, code: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """Foydalanuvchini referal kod bilan bog'laydi va taklif qilinganga bonus kod yaratadi.

    Havola formati: t.me/bot?start=ref_REFXXXXXX — shu sababli "ref_" va "REF_"
    prefikslari ham qabul qilinadi. (ok, xabar, taklif_qilingan_bonus_kodi|None)
    """
    clean = _norm(code)
    if clean.startswith("REF_"):
        clean = clean[4:]
    if not clean:
        return False, "Referal kod bo'sh", None

    referrer_id = await resolve_referral_code(store, clean)
    if not referrer_id:
        return False, "Bunday referal kod topilmadi", None
    if str(referrer_id) == str(user_id):
        return False, "O'zingizni taklif qila olmaysiz", None

    links = await _get_json(store, KEY_REF_LINKS, {})
    if str(user_id) in links:
        return False, "Siz allaqachon taklif qilingansiz", None

    links[str(user_id)] = str(referrer_id)
    await _set_json(store, KEY_REF_LINKS, links)

    # Taklif qilingan foydalanuvchiga bir martalik bonus promokod
    invitee_code, _ = await create_code(
        store,
        _gen_code("HI"),
        REFERRAL_INVITEE_PERCENT,
        max_uses=1,
        note="Referal taklif bonusi",
        auto=True,
    )
    try:
        await store.create_notification(
            str(user_id),
            "Do'stingiz taklifi qabul qilindi 🎁",
            f"Sizga bir martalik −{REFERRAL_INVITEE_PERCENT}% promokod berildi: {invitee_code['code']}",
            "success",
        )
    except Exception:
        logger.exception("Referal bildirishnomasi yozilmadi")
    return True, "Referal bog'landi", invitee_code


async def referral_stats(store, user_id: str) -> Dict[str, Any]:
    """Profil uchun: kod, link, takliflar soni va yaratilgan mukofot kodlari."""
    code = await get_or_create_referral_code(store, user_id)
    links = await _get_json(store, KEY_REF_LINKS, {})
    invited = [uid for uid, ref in links.items() if str(ref) == str(user_id)]
    rewarded = await _get_json(store, KEY_REF_REWARDED, {})
    codes = await _get_json(store, KEY_PROMOS, [])
    reward_codes = [
        {"code": c.get("code"), "percent": c.get("percent"), "used": len(c.get("used_by") or []) > 0}
        for c in codes
        if c.get("auto") and str(c.get("note") or "").startswith("Referal mukofoti") and str(c.get("owner")) == str(user_id)
    ]
    return {
        "code": code,
        "invited_count": len(invited),
        "reward_codes": reward_codes,
        "reward_percent": REFERRAL_REWARD_PERCENT,
        "invitee_percent": REFERRAL_INVITEE_PERCENT,
    }


async def reward_referrer(store, buyer_user_id: Optional[str]) -> Optional[Dict[str, Any]]:
    """Xarid tasdiqlanganda referrerga bir martalik foizli mukofot kodini yaratadi.

    Qaytaradi: {referrer_telegram_id, referrer_name, code, percent} yoki None.
    """
    if not buyer_user_id:
        return None
    try:
        referrer_id = await get_referrer_of(store, str(buyer_user_id))
        if not referrer_id:
            return None

        rewarded = await _get_json(store, KEY_REF_REWARDED, {})
        done = rewarded.get(str(referrer_id)) or []
        if str(buyer_user_id) in done:
            return None

        code_obj, _ = await create_code(
            store,
            _gen_code("GIFT"),
            REFERRAL_REWARD_PERCENT,
            max_uses=1,
            note=f"Referal mukofoti ({buyer_user_id[:8]})",
            auto=True,
        )
        # Mukofot kodi faqat egasiga ishlashi uchun owner belgilaymiz (statistika uchun)
        codes = await _get_json(store, KEY_PROMOS, [])
        for c in codes:
            if c.get("code") == code_obj["code"]:
                c["owner"] = str(referrer_id)
        await _set_json(store, KEY_PROMOS, codes)

        done.append(str(buyer_user_id))
        rewarded[str(referrer_id)] = done
        await _set_json(store, KEY_REF_REWARDED, rewarded)

        referrer = await store.get_user(str(referrer_id)) or {}
        try:
            await store.create_notification(
                str(referrer_id),
                "Referal mukofoti 🎁",
                f"Do'stingiz kurs sotib oldi! Sizga bir martalik −{REFERRAL_REWARD_PERCENT}% promokod: {code_obj['code']}",
                "success",
            )
        except Exception:
            logger.exception("Referrer bildirishnomasi yozilmadi")

        return {
            "referrer_telegram_id": referrer.get("telegram_id"),
            "referrer_name": referrer.get("name") or "Do'stingiz",
            "code": code_obj["code"],
            "percent": REFERRAL_REWARD_PERCENT,
        }
    except Exception:
        logger.exception("Referal mukofoti berishda xato")
        return None
