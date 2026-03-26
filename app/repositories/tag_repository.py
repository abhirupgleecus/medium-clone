# app/repositories/tag_repository.py

from typing import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tag import Tag


class TagRepository:
    """
    Handles tag DB operations.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_names(self, names: list[str]) -> Sequence[Tag]:
        result = await self.db.execute(
            select(Tag).where(Tag.name.in_(names))
        )
        return result.scalars().all()

    async def create_many(self, names: list[str]) -> list[Tag]:
        tags = [Tag(name=name) for name in names]
        self.db.add_all(tags)
        await self.db.flush()
        return tags