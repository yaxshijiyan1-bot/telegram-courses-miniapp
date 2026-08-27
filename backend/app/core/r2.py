import logging
from urllib.parse import urlparse
import boto3
from botocore.config import Config
from app.core.config import settings

logger = logging.getLogger(__name__)

class R2StorageClient:
    def __init__(self):
        self.bucket_name = settings.R2_BUCKET_NAME
        try:
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=settings.R2_ENDPOINT,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4"),
                region_name="auto"
            )
        except Exception as e:
            logger.error(f"Failed to initialize R2 S3 client: {e}")
            self.s3_client = None

    def get_media_url(self, object_key: str) -> str:
        """Bucketdagi obyektga barqaror havola: backend /api/media orqali presigned URL ga yo'naltiradi.

        Bucket private bo'lgani uchun to'g'ridan-to'g'ri public URL (403) o'rniga
        shu havola bazaga saqlanadi va brauzer/Telegram uchun doim ishlaydi.
        """
        return f"{settings.API_PUBLIC_URL}/api/media/{object_key.lstrip('/')}"

    def generate_presigned_url(self, object_key: str, expires_in: int = 7200, response_cache_control: str | None = None) -> str:
        """Video darsni xavfsiz tomosha qilish uchun presigned GET URL beradi.

        response_cache_control berilsa, R2 javobiga shu Cache-Control qo'shiladi —
        brauzer rasm baytlarini keshlab qoladi (banner/muqova kabi ommaviy rasmlar uchun).
        """
        if not self.s3_client:
            return ""
        try:
            params = {"Bucket": self.bucket_name, "Key": object_key}
            if response_cache_control:
                params["ResponseCacheControl"] = response_cache_control
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params=params,
                ExpiresIn=expires_in
            )
            return url
        except Exception as e:
            logger.error(f"Error generating R2 presigned URL: {e}")
            return ""

    def generate_presigned_put_url(self, object_key: str, expires_in: int = 3600, content_type: str = "application/octet-stream") -> str:
        """Admin tomonidan fayl yuklash uchun presigned PUT URL (browser'dan to'g'ridan-to'g'ri R2 ga)"""
        if not self.s3_client:
            return ""
        try:
            return self.s3_client.generate_presigned_url(
                "put_object",
                Params={"Bucket": self.bucket_name, "Key": object_key, "ContentType": content_type},
                ExpiresIn=expires_in
            )
        except Exception as e:
            logger.error(f"Error generating R2 presigned PUT URL: {e}")
            return ""

    def upload_bytes(self, object_key: str, data: bytes, content_type: str = "image/jpeg") -> str:
        """Server tomonidan baytlarni R2 ga yuklaydi va barqaror media URL qaytaradi"""
        if not self.s3_client:
            return ""
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=object_key,
                Body=data,
                ContentType=content_type
            )
            return self.get_media_url(object_key)
        except Exception as e:
            logger.error(f"Error uploading to R2: {e}")
            return ""

    def normalize_key(self, object_key: str) -> str:
        """API endpoint URL dan olingan kalitda bucket nomi prefiks bo'lib qolsa,
        uni olib tashlaydi (course/courses/x.jpeg -> courses/x.jpeg)."""
        prefix = f"{self.bucket_name}/"
        while object_key.startswith(prefix):
            object_key = object_key[len(prefix):]
        return object_key

    def resolve_stream_url(self, url_or_key: str, expires_in: int = 7200) -> str:
        """Istalgan R2 havolasini to'g'ridan-to'g'ri presigned URL ga aylantiradi.

        Qabul qiladi: obyekt kaliti, /api/media/{key} proxy havolasi, eski
        public bucket (r2.dev) yoki muddati o'tgan presigned havola. R2 ga
        tegishli bo'lmagan URL o'zgarishsiz qaytariladi.
        """
        value = str(url_or_key or "").strip()
        if not value:
            return value

        object_key = ""
        if not value.startswith(("http://", "https://")):
            object_key = value.lstrip("/")
        else:
            parsed = urlparse(value)
            host = parsed.netloc.lower()
            is_media_proxy = parsed.path.startswith("/api/media/")
            is_r2_host = host.endswith(".r2.dev") or host.endswith(".r2.cloudflarestorage.com")
            if is_media_proxy:
                object_key = parsed.path.split("/api/media/", 1)[1].lstrip("/")
            elif is_r2_host:
                object_key = parsed.path.lstrip("/")
        object_key = self.normalize_key(object_key)
        if not object_key:
            return value

        presigned = self.generate_presigned_url(object_key, expires_in=expires_in)
        return presigned or value

r2_client = R2StorageClient()
