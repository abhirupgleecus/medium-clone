import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models.email_verification_token import EmailVerificationToken
from app.repositories.user_repository import UserRepository


class VerificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    def generate_token(self) -> str:
        return secrets.token_urlsafe(32)

    async def create_token(self, user_id):
        raw_token = self.generate_token()
        token_hash = hash_password(raw_token)

        expires_at = datetime.now(timezone.utc) + timedelta(
            hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS
        )

        token = EmailVerificationToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )

        self.db.add(token)
        await self.db.flush()
        await self.db.commit()

        return raw_token

    async def verify_token(self, raw_token: str):
        result = await self.db.execute(
            select(EmailVerificationToken)
        )

        tokens = result.scalars().all()

        for token in tokens:
            if token.used_at is not None:
                continue

            if token.expires_at < datetime.now(timezone.utc):
                continue

            if verify_password(raw_token, token.token_hash):
                return token

        return None