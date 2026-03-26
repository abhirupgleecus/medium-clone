# app/repositories/post_tag_repository.py

import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post_tag import PostTag


class PostTagRepository:
    """
    Handles post-tag associations.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def add_tags_to_post(
        self,
        *,
        post_id: uuid.UUID,
        tag_ids: list[uuid.UUID],
    ) -> None:
        relations = [
            PostTag(post_id=post_id, tag_id=tag_id)
            for tag_id in tag_ids
        ]
        self.db.add_all(relations)
        await self.db.flush()