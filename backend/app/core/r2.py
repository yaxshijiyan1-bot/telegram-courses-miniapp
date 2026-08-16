import logging
import boto3
from botocore.config import Config
from app.core.config import settings

logger = logging.getLogger(__name__)

class R2StorageClient:
    def __init__(self):
        try:
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=settings.R2_ENDPOINT,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4"),
                region_name="auto"
            )
            self.bucket_name = settings.R2_BUCKET_NAME
            self.public_url = settings.R2_PUBLIC_URL.rstrip('/')
        except Exception as e:
            logger.error(f"Failed to initialize R2 S3 client: {e}")
            self.s3_client = None

    def generate_presigned_url(self, object_key: str, expires_in: int = 7200) -> str:
        """Video darsni xavfsiz tomosha qilish uchun 2 soatlik presigned URL beradi"""
        if not self.s3_client:
            return f"{self.public_url}/{object_key.lstrip('/')}"
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": object_key},
                ExpiresIn=expires_in
            )
            return url
        except Exception as e:
            logger.error(f"Error generating R2 presigned URL: {e}")
            return f"{self.public_url}/{object_key.lstrip('/')}"

    def get_public_url(self, object_key: str) -> str:
        return f"{self.public_url}/{object_key.lstrip('/')}"

r2_client = R2StorageClient()
