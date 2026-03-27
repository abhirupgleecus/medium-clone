import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import Post, PostStatus
from app.models.user import Role


class ModerationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # 🟢 Contributor submits post
    async def submit_for_review(self, post_id: uuid.UUID, user):
        post = await self.db.get(Post, post_id)

        if not post:
            raise ValueError("Post not found")

        if post.author_id != user.id:
            raise ValueError("Not your post")

        if user.role != Role.CONTRIBUTOR:
            raise ValueError("Only contributors can submit")

        if post.status != PostStatus.DRAFT:
            raise ValueError("Only draft posts can be submitted")

        post.status = PostStatus.IN_REVIEW
        post.submitted_for_review_at = datetime.now(timezone.utc)

        await self.db.commit()

    # 🟡 Admin sees queue
    async def get_review_queue(self):
        result = await self.db.execute(
            select(Post).where(Post.status == PostStatus.IN_REVIEW)
        )
        return result.scalars().all()

    # 🔵 Admin approves
    async def approve_post(self, post_id: uuid.UUID, admin):
        post = await self.db.get(Post, post_id)

        if not post:
            raise ValueError("Post not found")

        if post.status != PostStatus.IN_REVIEW:
            raise ValueError("Post not in review")

        post.status = PostStatus.PUBLISHED
        post.reviewed_by = admin.id
        post.reviewed_at = datetime.now(timezone.utc)

        await self.db.commit()

    # 🔴 Admin rejects
    async def reject_post(self, post_id: uuid.UUID, admin, note: str | None):
        post = await self.db.get(Post, post_id)

        if not post:
            raise ValueError("Post not found")

        if post.status != PostStatus.IN_REVIEW:
            raise ValueError("Post not in review")

        post.status = PostStatus.REJECTED
        post.reviewed_by = admin.id
        post.reviewed_at = datetime.now(timezone.utc)
        post.review_note = note

        await self.db.commit()