# app/repositories/post_like_repository.py

import uuid
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post_like import PostLike


class PostLikeRepository:
    """
    Handles post like operations.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def exists(self, user_id: uuid.UUID, post_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            select(PostLike).where(
                PostLike.user_id == user_id,
                PostLike.post_id == post_id,
            )
        )
        return result.scalar_one_or_none() is not None

    async def create(self, user_id: uuid.UUID, post_id: uuid.UUID) -> None:
        like = PostLike(user_id=user_id, post_id=post_id)
        self.db.add(like)
        await self.db.flush()

    async def delete(self, user_id: uuid.UUID, post_id: uuid.UUID) -> None:
        await self.db.execute(
            delete(PostLike).where(
                PostLike.user_id == user_id,
                PostLike.post_id == post_id,
            )
        )