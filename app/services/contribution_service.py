import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contribution_request import (
    ContributionRequest,
    ContributionRequestStatus,
)
from app.models.user import Role
from app.repositories.user_repository import UserRepository


class ContributionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    # 🟢 User creates request
    async def create_request(self, user_id: uuid.UUID, reason: str | None):
        user = await self.user_repo.get_by_id(user_id)

        if user.role == Role.CONTRIBUTOR:
            raise ValueError("You are already a contributor")

        # check existing pending request
        result = await self.db.execute(
            select(ContributionRequest).where(
                ContributionRequest.user_id == user_id,
                ContributionRequest.status == ContributionRequestStatus.PENDING,
            )
        )
        existing = result.scalars().first()

        if existing:
            raise ValueError("You already have a pending request")

        req = ContributionRequest(
            user_id=user_id,
            reason=reason,
        )

        self.db.add(req)
        await self.db.commit()

        return req

    # 🟡 Admin views pending requests
    async def get_pending_requests(self):
        result = await self.db.execute(
            select(ContributionRequest).where(
                ContributionRequest.status == ContributionRequestStatus.PENDING
            )
        )
        return result.scalars().all()

    # 🔵 Admin approves
    async def approve_request(self, request_id: uuid.UUID, admin_id: uuid.UUID):
        req = await self.db.get(ContributionRequest, request_id)

        if not req:
            raise ValueError("Request not found")

        if req.status != ContributionRequestStatus.PENDING:
            raise ValueError("Request already processed")

        user = await self.user_repo.get_by_id(req.user_id)

        # update role
        user.role = Role.CONTRIBUTOR

        # update request
        req.status = ContributionRequestStatus.APPROVED
        req.reviewed_by = admin_id
        req.reviewed_at = datetime.now(timezone.utc)

        await self.db.commit()

    # 🔴 Admin rejects
    async def reject_request(self, request_id: uuid.UUID, admin_id: uuid.UUID):
        req = await self.db.get(ContributionRequest, request_id)

        if not req:
            raise ValueError("Request not found")

        if req.status != ContributionRequestStatus.PENDING:
            raise ValueError("Request already processed")

        req.status = ContributionRequestStatus.REJECTED
        req.reviewed_by = admin_id
        req.reviewed_at = datetime.now(timezone.utc)

        await self.db.commit()