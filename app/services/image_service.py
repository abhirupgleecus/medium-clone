import time
import hmac
import hashlib

from app.core.config import settings


class ImageService:

    @staticmethod
    def get_upload_auth():
        expire = int(time.time()) + 60  # valid for 60 sec

        token = hashlib.sha1(str(time.time()).encode()).hexdigest()

        signature = hmac.new(
            settings.IMAGEKIT_PRIVATE_KEY.encode(),
            f"{token}{expire}".encode(),
            hashlib.sha1,
        ).hexdigest()

        return {
            "token": token,
            "expire": expire,
            "signature": signature,
            "publicKey": settings.IMAGEKIT_PUBLIC_KEY,
        }