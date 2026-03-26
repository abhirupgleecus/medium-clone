# app/repositories/user_repository.py

import uuid
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    """
    Handles database operations for User model.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Retrieve a user by email.
        """
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()


    async def create(
        self,
        *,
        email: str,
        hashed_password: str,
        full_name: str,
    ) -> User:
        """
        Create a new user.
        """
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
        )
        self.db.add(user)
        await self.db.flush()
        return user
    
    async def list_users(self) -> Sequence[User]:
        """
        Retrieve all non-deleted users.
        """
        result = await self.db.execute(
            select(User).where(User.deleted_at.is_(None))
        )
        return result.scalars().all()

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """
        Retrieve user by ID (excluding deleted).
        """
        result = await self.db.execute(
            select(User).where(
                User.id == user_id,
                User.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()