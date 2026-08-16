import logging
import httpx
from typing import Any, Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self):
        self.base_url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1"
        self.headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    async def get(self, table: str, query_params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.get(f"{self.base_url}/{table}", headers=self.headers, params=query_params or {})
                if res.status_code == 200:
                    return res.json()
                logger.warning(f"Supabase GET {table} failed: {res.status_code} - {res.text}")
                return []
            except Exception as e:
                logger.error(f"Supabase GET exception on {table}: {e}")
                return []

    async def insert(self, table: str, data: Dict[str, Any] | List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.post(f"{self.base_url}/{table}", headers=self.headers, json=data)
                if res.status_code in [200, 201]:
                    return res.json()
                logger.warning(f"Supabase POST {table} failed: {res.status_code} - {res.text}")
                return []
            except Exception as e:
                logger.error(f"Supabase POST exception on {table}: {e}")
                return []

    async def update(self, table: str, query_params: Dict[str, Any], data: Dict[str, Any]) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.patch(f"{self.base_url}/{table}", headers=self.headers, params=query_params, json=data)
                if res.status_code in [200, 204]:
                    return res.json() if res.text else []
                return []
            except Exception as e:
                logger.error(f"Supabase PATCH exception on {table}: {e}")
                return []

supabase_client = SupabaseClient()
