import uuid
from typing import Optional, Sequence

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.post import Post, PostStatus
from app.models.post_tag import PostTag
from app.models.tag import Tag
from app.models.post_like import PostLike


class PostRepository:
    """
    Handles database operations for posts.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    # -------------------------------
    # 🔹 INTERNAL HELPER
    # -------------------------------
    def _with_likes(self, query):
        """
        Adds likes count aggregation to a query.
        """
        return (
            query
            .outerjoin(PostLike, PostLike.post_id == Post.id)
            .group_by(Post.id)
            .add_columns(func.count(PostLike.post_id).label("likes_count"))
        )

    # -------------------------------
    # 🔹 CREATE
    # -------------------------------
    async def create(
        self,
        *,
        author_id: uuid.UUID,
        title: str,
        content: str,
    ) -> Post:
        post = Post(
            author_id=author_id,
            title=title,
            content=content,
        )
        self.db.add(post)
        await self.db.flush()
        return post

    # -------------------------------
    # 🔹 GET BY ID (WITH LIKES)
    # -------------------------------
    async def get_by_id(self, post_id: uuid.UUID) -> Optional[Post]:
        query = select(Post).where(
            Post.id == post_id,
            Post.deleted_at.is_(None),
        )

        query = self._with_likes(query)

        result = await self.db.execute(query)
        row = result.first()

        if not row:
            return None

        post, likes_count = row
        post.likes_count = likes_count
        return post

    # -------------------------------
    # 🔹 LIST BY AUTHOR (WITH LIKES)
    # -------------------------------
    async def list_by_author(self, author_id: uuid.UUID) -> Sequence[Post]:
        query = select(Post).where(
            Post.author_id == author_id,
            Post.deleted_at.is_(None),
        )

        query = self._with_likes(query)

        result = await self.db.execute(query)

        posts: list[Post] = []
        for post, likes_count in result.all():
            post.likes_count = likes_count
            posts.append(post)

        return posts

    # -------------------------------
    # 🔹 LIST PUBLISHED (WITH LIKES)
    # -------------------------------
    async def list_published(self) -> Sequence[Post]:
        query = select(Post).where(
            Post.status == PostStatus.PUBLISHED,
            Post.deleted_at.is_(None),
        )

        query = self._with_likes(query)

        result = await self.db.execute(query)

        posts: list[Post] = []
        for post, likes_count in result.all():
            post.likes_count = likes_count
            posts.append(post)

        return posts

    # -------------------------------
    # 🔹 UPDATE
    # -------------------------------
    async def update(self, post: Post) -> Post:
        """
        Persist updates to a post.
        """
        await self.db.flush()
        return post

    # -------------------------------
    # 🔹 SEARCH + FILTER (WITH LIKES)
    # -------------------------------
    async def search_posts(
        self,
        *,
        tag: str | None,
        search: str | None,
    ) -> Sequence[Post]:

        query = select(Post).where(
            Post.status == PostStatus.PUBLISHED,
            Post.deleted_at.is_(None),
        )

        # 🔹 Filter by tag
        if tag:
            tag_alias = aliased(Tag)

            query = (
                query
                .join(PostTag, PostTag.post_id == Post.id)
                .join(tag_alias, tag_alias.id == PostTag.tag_id)
                .where(tag_alias.name == tag.lower())
            )

        # 🔹 Search in title/content
        if search:
            search_term = f"%{search.lower()}%"
            query = query.where(
                Post.title.ilike(search_term) |
                Post.content.ilike(search_term)
            )

        query = self._with_likes(query).distinct()

        result = await self.db.execute(query)

        posts: list[Post] = []
        for post, likes_count in result.all():
            post.likes_count = likes_count
            posts.append(post)

        return posts

    # -------------------------------
    # 🔹 TOP POSTS (WITH LIKES)
    # -------------------------------
    async def get_top_posts(self, limit: int = 5) -> Sequence[Post]:
        query = select(Post).where(
            Post.status == PostStatus.PUBLISHED,
            Post.deleted_at.is_(None),
        )

        query = self._with_likes(query)

        query = (
            query
            .order_by(func.count(PostLike.post_id).desc())
            .limit(limit)
        )

        result = await self.db.execute(query)

        posts: list[Post] = []
        for post, likes_count in result.all():
            post.likes_count = likes_count
            posts.append(post)

        return posts