"""Hamyon (wallet) — referal daromadlari saqlanadigan va xaridlarda
sarflanadigan balans. Saqlash: app_settings JSON (migratsiyasiz).

Balans faqat so'mda (int). Yozuvlar:
    {id, delta (+/−), type, note, tx, created_at}

type qiymatlari:
    earn_referral — do'st xaridi tasdiqlanganda kirim
    spend         — kurs xaridida sarflandi (hold: submit paytida yechiladi)
    refund        — chek rad etilganda sarf qaytarildi
    admin         — admin tomonidan qo'lda kiritish/o'chirish
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

KEY_WALLETS = "wallets"
MAX_BALANCE = 100_000_000  # himoya: g'alati katta qiymat yozilmasin
HISTORY_KEEP = 200


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


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def get_wallet(store, user_id: Optional[str]) -> Dict[str, Any]:
    """Foydalanuvchi hamyoni: joriy balans + oxirgi yozuvlar."""
    if not user_id:
        return {"balance": 0, "history": []}
    wallets = await _get_json(store, KEY_WALLETS, {})
    w = wallets.get(str(user_id))
    if not isinstance(w, dict):
        return {"balance": 0, "history": []}
    try:
        balance = int(w.get("balance") or 0)
    except (TypeError, ValueError):
        balance = 0
    return {
        "balance": balance,
        "history": list(w.get("history") or [])[-20:],
    }


async def has_tx(store, user_id: Optional[str], tx: str) -> bool:
    """Bu tranzaksiya bo'yicha yozuv mavjudmi (takroriy kirim himoyasi)."""
    if not user_id or not tx:
        return False
    wallets = await _get_json(store, KEY_WALLETS, {})
    w = wallets.get(str(user_id))
    if not isinstance(w, dict):
        return False
    return any(str(e.get("tx") or "") == str(tx) for e in (w.get("history") or []))


async def get_tx_debit_amount(store, user_id: Optional[str], tx: str) -> int:
    """Berilgan tx bo'yicha sarflangan (yechilgan) summani topadi."""
    if not user_id or not tx:
        return 0
    wallets = await _get_json(store, KEY_WALLETS, {})
    w = wallets.get(str(user_id))
    if not isinstance(w, dict):
        return 0
    for e in (w.get("history") or []):
        if str(e.get("tx") or "") == str(tx) and str(e.get("type") or "") == "spend":
            return abs(int(e.get("delta") or 0))
    return 0


async def _mutate(
    store, user_id: Optional[str], delta: int, type_: str, note: str, tx: Optional[str]
) -> Optional[int]:
    """Balansni o'zgartiradi; yangi balans yoki xatoda None qaytaradi."""
    if not user_id or delta == 0:
        return None
    wallets = await _get_json(store, KEY_WALLETS, {})
    key = str(user_id)
    w = wallets.get(key)
    if not isinstance(w, dict):
        w = {"balance": 0, "history": []}
    try:
        balance = int(w.get("balance") or 0)
    except (TypeError, ValueError):
        balance = 0

    new_balance = balance + int(delta)
    if new_balance < 0 or new_balance > MAX_BALANCE:
        return None

    entry = {
        "id": uuid.uuid4().hex[:10],
        "delta": int(delta),
        "type": type_,
        "note": (note or "")[:160],
        "tx": tx,
        "created_at": _now_iso(),
    }
    history = list(w.get("history") or [])
    history.append(entry)
    w["balance"] = new_balance
    w["history"] = history[-HISTORY_KEEP:]
    wallets[key] = w
    await _set_json(store, KEY_WALLETS, wallets)
    return new_balance


async def credit(
    store, user_id: Optional[str], amount: int, type_: str, note: str, tx: Optional[str] = None
) -> Optional[int]:
    """Hamyonga kirim (referal daromadi, qaytarish, admin kirituvi)."""
    try:
        amt = int(amount)
        if amt <= 0:
            return None
        return await _mutate(store, user_id, amt, type_, note, tx)
    except Exception:
        logger.exception("Hamyon kiritishda xato (user=%s)", user_id)
        return None


async def try_debit(
    store, user_id: Optional[str], amount: int, type_: str, note: str, tx: Optional[str] = None
) -> Tuple[bool, Optional[int]]:
    """Balans yetarli bo'lsa yechadi: (muvaffaqiyat, yangi balans)."""
    try:
        amt = int(amount)
        if amt <= 0:
            return False, None
        wallet = await get_wallet(store, user_id)
        if wallet["balance"] < amt:
            return False, wallet["balance"]
        new_balance = await _mutate(store, user_id, -amt, type_, note, tx)
        if new_balance is None:
            return False, wallet["balance"]
        return True, new_balance
    except Exception:
        logger.exception("Hamyon yechishda xato (user=%s)", user_id)
        return False, None
