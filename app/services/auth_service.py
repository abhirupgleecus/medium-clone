# app/services/auth_service.py

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_refresh_token,
)
from app.models.user import User, UserStatus
from app.repositories.user_repository import UserRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.services.verification_service import VerificationService
from app.services.email_service import EmailService


class AuthService:
    """
    Handles authentication business logic.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_repo = RefreshTokenRepository(db)

    async def register(
        self,
        *,
        email: str,
        password: str,
        full_name: str,
    ) -> User:

        existing = await self.user_repo.get_by_email(email)
        if existing:
            raise ValueError("User with this email already exists")

        hashed = hash_password(password)

        user = await self.user_repo.create(
            email=email,
            hashed_password=hashed,
            full_name=full_name,
        )

        verification_service = VerificationService(self.db)
        email_service = EmailService()

        raw_token = await verification_service.create_token(user.id)

        email_service.send_verification_email(
            to_email=user.email,
            token=raw_token,
        )

        await self.db.commit()

        return user
    async def login(
        self,
        *,
        email: str,
        password: str,
    ) -> tuple[str, str]:
        """
        Authenticate user and return tokens.
        """

        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ValueError("Invalid credentials")

        if not user.hashed_password:
            raise ValueError("Invalid credentials")

        if not verify_password(password, user.hashed_password):
            raise ValueError("Invalid credentials")
        
        if user.status != UserStatus.ACTIVE:
            raise ValueError("User is not active")

        # Create tokens
        access_token = create_access_token(
            subject=str(user.id),
            role=user.role.value,
        )

        raw_refresh_token = generate_refresh_token()
        hashed_refresh_token = hash_password(raw_refresh_token)

        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        await self.token_repo.create(
            user_id=user.id,
            token_hash=hashed_refresh_token,
            expires_at=expires_at,
        )

        await self.db.commit()

        return access_token, raw_refresh_token

    async def refresh(
        self,
        *,
        user_id: uuid.UUID,
        refresh_token: str,
    ) -> tuple[str, str]:
        """
        Refresh access token using refresh token.
        """

        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("Invalid user")

        tokens = await self.token_repo.get_valid_token(user_id=user_id)

        matched_token = None

        for token in tokens:
            if verify_password(refresh_token, token.token_hash):
                matched_token = token
                break

        if not matched_token:
            raise ValueError("Invalid refresh token")

        if matched_token.expires_at < datetime.now(timezone.utc):
            raise ValueError("Refresh token expired")

        # Rotate token
        await self.token_repo.revoke(matched_token)

        new_refresh_token = generate_refresh_token()
        new_hashed = hash_password(new_refresh_token)

        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        await self.token_repo.create(
            user_id=user.id,
            token_hash=new_hashed,
            expires_at=expires_at,
        )

        access_token = create_access_token(
            subject=str(user.id),
            role=user.role.value,
        )

        await self.db.commit()

        return access_token, new_refresh_token

    async def logout(
        self,
        *,
        user_id: uuid.UUID,
        refresh_token: str,
    ) -> None:
        """
        Revoke a single refresh token.
        """

        tokens = await self.token_repo.get_valid_token(user_id=user_id)

        for token in tokens:
            if verify_password(refresh_token, token.token_hash):
                await self.token_repo.revoke(token)
                await self.db.commit()
                return

        raise ValueError("Invalid refresh token")

    async def logout_all(
        self,
        *,
        user_id: uuid.UUID,
    ) -> None:
        """
        Revoke all refresh tokens for a user.
        """

        await self.token_repo.revoke_all(user_id)
        await self.db.commit()