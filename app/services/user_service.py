# app/services/user_service.py

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password, hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository


class UserService:
    """
    Handles user-related business logic.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def get_me(self, user: User) -> User:
        """
        Return current user.
        """
        return user

    async def update_me(
        self,
        *,
        user: User,
        full_name: str | None,
        avatar_url: str | None,
    ) -> User:
        """
        Update current user's profile.
        """

        if full_name is not None:
            user.full_name = full_name

        if avatar_url is not None:
            user.avatar_url = avatar_url

        await self.db.commit()
        return user

    async def change_password(
        self,
        *,
        user: User,
        current_password: str,
        new_password: str,
    ) -> None:
        """
        Change user password.
        """

        if not user.hashed_password:
            raise ValueError("User has no password set")

        if not verify_password(current_password, user.hashed_password):
            raise ValueError("Current password is incorrect")

        user.hashed_password = hash_password(new_password)

        await self.db.commit()