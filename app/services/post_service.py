# app/services/post_service.py

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import Post, PostStatus
from app.models.user import User
from app.repositories.post_repository import PostRepository
from app.repositories.tag_repository import TagRepository
from app.repositories.post_tag_repository import PostTagRepository
from app.repositories.post_like_repository import PostLikeRepository


class PostService:
    """
    Handles post-related business logic.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PostRepository(db)
        self.tag_repo = TagRepository(db)
        self.post_tag_repo = PostTagRepository(db)
        self.like_repo = PostLikeRepository(db)

    async def create_post(
        self,
        *,
        user: User,
        title: str,
        content: str,
        tags: list[str],
    ) -> Post:

        post = await self.repo.create(
            author_id=user.id,
            title=title,
            content=content,
        )

        # 🔹 Normalize tags
        tag_names = list({tag.strip().lower() for tag in tags if tag.strip()})

        if tag_names:
            existing_tags = await self.tag_repo.get_by_names(tag_names)
            existing_names = {t.name for t in existing_tags}

            new_names = [name for name in tag_names if name not in existing_names]

            new_tags = []
            if new_names:
                new_tags = await self.tag_repo.create_many(new_names)

            all_tags = list(existing_tags) + list(new_tags)

            await self.post_tag_repo.add_tags_to_post(
                post_id=post.id,
                tag_ids=[t.id for t in all_tags],
            )

        await self.db.commit()
        post.likes_count = 0

        return post

    async def list_my_posts(self, user: User):
        return await self.repo.list_by_author(user.id)

    async def get_post(
        self,
        *,
        user: User | None,
        post_id: uuid.UUID,
    ) -> Post:
        post = await self.repo.get_by_id(post_id)

        if not post:
            raise ValueError("Post not found")

        # If published → public
        if post.status == PostStatus.PUBLISHED:
            return post

        # If not published → only author can access
        if not user or post.author_id != user.id:
            raise ValueError("Post not found")

        return post
    
    async def list_public_posts(self):
        return await self.repo.list_published()

    async def publish_post(
        self,
        *,
        user: User,
        post_id: uuid.UUID,
    ) -> Post:
        post = await self.get_post(
            user=user,
            post_id=post_id,
        )

        # Ownership check
        if post.author_id != user.id:
            raise ValueError("Not allowed")

        post.status = PostStatus.PUBLISHED
        post.published_at = datetime.now(timezone.utc)

        await self.db.commit()
        return post
    
    async def update_post(
        self,
        *,
        user: User,
        post_id: uuid.UUID,
        title: str | None,
        content: str | None,
    ) -> Post:
        post = await self.get_post(
            user=user,
            post_id=post_id,
        )

        # Ownership check
        if post.author_id != user.id:
            raise ValueError("Not allowed")

        if title is not None:
            post.title = title

        if content is not None:
            post.content = content

        await self.db.commit()
        return post
    
    async def delete_post(
        self,
        *,
        user: User,
        post_id: uuid.UUID,
    ) -> None:
        post = await self.get_post(
            user=user,
            post_id=post_id,
        )

        if post.author_id != user.id:
            raise ValueError("Not allowed")

        post.deleted_at = datetime.now(timezone.utc)

        await self.db.commit()

    async def search_posts(
        self,
        *,
        tag: str | None,
        search: str | None,
    ):
        return await self.repo.search_posts(
            tag=tag,
            search=search,
        )
    
    async def like_post(
        self,
        *,
        user: User,
        post_id: uuid.UUID,
    ) -> None:
        post = await self.get_post(
            user=user,
            post_id=post_id,
        )

        # Only published posts can be liked
        if post.status != PostStatus.PUBLISHED:
            raise ValueError("Cannot like unpublished post")

        exists = await self.like_repo.exists(user.id, post_id)

        if not exists:
            await self.like_repo.create(user.id, post_id)
            await self.db.commit()

    async def unlike_post(
        self,
        *,
        user: User,
        post_id: uuid.UUID,
    ) -> None:
        await self.like_repo.delete(user.id, post_id)
        await self.db.commit()

    async def get_top_posts(self):
        return await self.repo.get_top_posts()