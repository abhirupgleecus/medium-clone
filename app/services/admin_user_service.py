# app/services/admin_user_service.py

import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, Role, UserStatus
from app.repositories.user_repository import UserRepository


class AdminUserService:
    """
    Admin-level user management logic.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def list_users(self):
        return await self.user_repo.list_users()

    async def get_user(self, user_id: uuid.UUID) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        return user

    async def update_user(
        self,
        *,
        user_id: uuid.UUID,
        role: str | None,
        status: str | None,
    ) -> User:
        user = await self.get_user(user_id)

        if role:
            user.role = Role(role)

        if status:
            user.status = UserStatus(status)

        await self.db.commit()
        return user

    async def delete_user(self, user_id: uuid.UUID) -> None:
        user = await self.get_user(user_id)

        user.deleted_at = datetime.utcnow()

        await self.db.commit()