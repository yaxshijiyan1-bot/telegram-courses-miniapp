import json
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Set

class Store(ABC):
    """Barcha storage backendlari uchun yagona interfeys."""
    backend_name: str = "base"

    # ---------------- BLOCKED USERS ----------------
    # app_settings (key-value) jadvalida JSON ro'yxat sifatida saqlanadi —
    # Supabase'da users jadvaliga yangi ustun qo'shmasdan ishlaydi.
    BLOCKED_KEY = "blocked_users"
    _blocked_cache: Optional[Set[int]] = None
    _blocked_cache_ts: float = 0.0
    _BLOCKED_CACHE_TTL = 20.0

    async def get_blocked_ids(self) -> Set[int]:
        now = time.monotonic()
        if self._blocked_cache is not None and now - self._blocked_cache_ts < self._BLOCKED_CACHE_TTL:
            return self._blocked_cache
        raw = await self.get_setting(self.BLOCKED_KEY)
        ids: Set[int] = set()
        if raw:
            try:
                ids = {int(x) for x in json.loads(raw)}
            except Exception:
                ids = set()
        self._blocked_cache = ids
        self._blocked_cache_ts = now
        return ids

    async def set_user_blocked(self, telegram_id: int, blocked: bool) -> bool:
        ids = set(await self.get_blocked_ids())
        if blocked:
            ids.add(int(telegram_id))
        else:
            ids.discard(int(telegram_id))
        ok = await self.set_setting(self.BLOCKED_KEY, json.dumps(sorted(ids)))
        if ok:
            self._blocked_cache = ids
            self._blocked_cache_ts = time.monotonic()
        return ok

    async def is_user_blocked(self, telegram_id: int) -> bool:
        try:
            return int(telegram_id) in await self.get_blocked_ids()
        except Exception:
            return False

    # USERS
    @abstractmethod
    async def get_user_by_tg(self, telegram_id: int) -> Optional[Dict[str, Any]]: ...
    @abstractmethod
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]: ...
    @abstractmethod
    async def create_user(self, user: Dict[str, Any]) -> Dict[str, Any]: ...
    @abstractmethod
    async def update_user(self, user_id: str, fields: Dict[str, Any]) -> bool: ...
    @abstractmethod
    async def list_users(self, limit: int = 200) -> List[Dict[str, Any]]: ...
    @abstractmethod
    async def count_users(self) -> int: ...
    @abstractmethod
    async def delete_user(self, user_id: str) -> bool: ...

    # COURSES
    @abstractmethod
    async def list_courses(self, published_only: bool = True) -> List[Dict[str, Any]]: ...
    @abstractmethod
    async def get_course(self, id_or_slug: str) -> Optional[Dict[str, Any]]: ...
    @abstractmethod
    async def get_course_by_channel_id(self, channel_id: str) -> Optional[Dict[str, Any]]: ...
    @abstractmethod
    async def upsert_course(self, course: Dict[str, Any]) -> Dict[str, Any]: ...
    @abstractmethod
    async def delete_course(self, course_id: str) -> bool: ...
    @abstractmethod
    async def seed_course_structure(self, course_id: str, modules: List[Dict[str, Any]]) -> bool: ...

    # PURCHASES
    @abstractmethod
    async def create_purchase(self, p: Dict[str, Any]) -> Dict[str, Any]: ...
    @abstractmethod
    async def get_purchase_by_tx(self, transaction_id: str) -> Optional[Dict[str, Any]]: ...
    @abstractmethod
    async def get_purchase_by_invite_link(self, invite_link: str) -> Optional[Dict[str, Any]]: ...
    @abstractmethod
    async def get_approved_purchase_for(self, user_id: str, course_id: str) -> Optional[Dict[str, Any]]: ...
    @abstractmethod
    async def update_purchase(self, purchase_id: str, fields: Dict[str, Any]) -> bool: ...
    @abstractmethod
    async def transition_purchase_status(
        self, purchase_id: str, expected_status: str, fields: Dict[str, Any]
    ) -> bool: ...
    @abstractmethod
    async def list_purchases(self, status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]: ...
    @abstractmethod
    async def list_purchases_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]: ...
    @abstractmethod
    async def count_active_purchases(self, course_id: str) -> int: ...

    # ENROLLMENTS
    @abstractmethod
    async def get_enrollment(self, user_id: str, course_id: str) -> Optional[Dict[str, Any]]: ...
    @abstractmethod
    async def create_enrollment(self, user_id: str, course_id: str, purchase_id: Optional[str] = None) -> Dict[str, Any]: ...
    @abstractmethod
    async def list_enrollments(self, user_id: str) -> List[Dict[str, Any]]: ...
    @abstractmethod
    async def revoke_enrollment(self, user_id: str, course_id: str) -> bool: ...

    # LESSON PROGRESS
    @abstractmethod
    async def upsert_progress(self, user_id: str, course_id: str, lesson_id: str, completed: bool, last_position: int = 0) -> bool: ...
    @abstractmethod
    async def get_progress_map(self, user_id: str, course_id: str) -> Dict[str, Dict[str, Any]]: ...
    @abstractmethod
    async def count_completed(self, user_id: str, course_id: str) -> int: ...
    @abstractmethod
    async def latest_progress_row(self, user_id: str, course_id: str) -> Optional[Dict[str, Any]]: ...

    # CERTIFICATES
    @abstractmethod
    async def list_certificates(self, user_id: str) -> List[Dict[str, Any]]: ...
    @abstractmethod
    async def create_certificate(self, cert: Dict[str, Any]) -> Dict[str, Any]: ...

    # NOTIFICATIONS
    @abstractmethod
    async def list_notifications(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]: ...
    @abstractmethod
    async def create_notification(self, user_id: str, title: str, message: str, type_: str = "info") -> Dict[str, Any]: ...
    @abstractmethod
    async def mark_notifications_read(self, user_id: str) -> bool: ...

    # STATS
    @abstractmethod
    async def revenue_stats(self) -> Dict[str, int]: ...
    @abstractmethod
    async def broadcast_recipients(self) -> List[Dict[str, Any]]: ...

    # APP SETTINGS (key-value)
    @abstractmethod
    async def get_setting(self, key: str) -> Optional[str]: ...
    @abstractmethod
    async def set_setting(self, key: str, value: str) -> bool: ...
