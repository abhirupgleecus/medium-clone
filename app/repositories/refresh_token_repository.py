# app/repositories/refresh_token_repository.py

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    """
    Handles database operations for refresh tokens.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        *,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshToken:
        """
        Store a new refresh token.
        """
        token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(token)
        await self.db.flush()
        return token

    async def get_valid_token(
        self,
        *,
        user_id: uuid.UUID,
    ) -> list[RefreshToken]:
        """
        Get all active (non-revoked) tokens for a user.
        """
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def revoke(self, token: RefreshToken) -> None:
        """
        Revoke a refresh token.
        """
        token.revoked_at = datetime.utcnow()
        await self.db.flush()

    async def revoke_all(self, user_id: uuid.UUID) -> None:
        """
        Revoke all refresh tokens for a user.
        """
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
        )
        tokens = result.scalars().all()

        for token in tokens:
            token.revoked_at = datetime.utcnow()

        await self.db.flush()