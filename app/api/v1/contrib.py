from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.db.session import get_db
from app.services.contribution_service import ContributionService
from app.services.moderation_service import ModerationService
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, Role

router = APIRouter(prefix="/contrib", tags=["Contribution"])

# -----------------------------

# 🟢 Contribution Requests

# -----------------------------

@router.post("/request", operation_id="create_contribution_request")
async def request_contribution(
    reason: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ):
    service = ContributionService(db)

    try:
        req = await service.create_request(
            user_id=current_user.id,
            reason=reason,
        )
        return {"message": "Request submitted", "id": str(req.id)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/requests", operation_id="get_contribution_requests")
async def get_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
    require_roles(Role.ADMIN, Role.SUPER_ADMIN)
    ),
    ):
    service = ContributionService(db)

    requests = await service.get_pending_requests()

    return [
        {
            "id": str(r.id),
            "user_id": str(r.user_id),
            "reason": r.reason,
            "created_at": r.created_at,
        }
        for r in requests
    ]


@router.post("/requests/{request_id}/approve", operation_id="approve_contribution_request")
async def approve_contribution_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
    require_roles(Role.ADMIN, Role.SUPER_ADMIN)
    ),
    ):
    service = ContributionService(db)

    try:
        await service.approve_request(
            request_id=request_id,
            admin_id=current_user.id,
        )
        return {"message": "Request approved"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.post("/requests/{request_id}/reject", operation_id="reject_contribution_request")
async def reject_contribution_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
    require_roles(Role.ADMIN, Role.SUPER_ADMIN)
    ),
    ):
    service = ContributionService(db)

    try:
        await service.reject_request(
            request_id=request_id,
            admin_id=current_user.id,
        )
        return {"message": "Request rejected"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------

# 🟣 Moderation / Review Queue

# -----------------------------

@router.post("/posts/{post_id}/submit", operation_id="submit_post_for_review")
async def submit_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ):
    service = ModerationService(db)

    try:
        await service.submit_for_review(post_id, current_user)
        return {"message": "Post submitted for review"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/queue", operation_id="get_moderation_queue")
async def get_queue(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
    require_roles(Role.ADMIN, Role.SUPER_ADMIN)
    ),
    ):
    service = ModerationService(db)

    posts = await service.get_review_queue()

    return [
        {
            "id": str(p.id),
            "title": p.title,
            "author_id": str(p.author_id),
            "submitted_at": p.submitted_for_review_at,
        }
        for p in posts
    ]


@router.post("/queue/{post_id}/approve", operation_id="approve_post")
async def approve_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
    require_roles(Role.ADMIN, Role.SUPER_ADMIN)
    ),
    ):
    service = ModerationService(db)

    try:
        await service.approve_post(post_id, current_user)
        return {"message": "Post approved"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/queue/{post_id}/reject", operation_id="reject_post")
async def reject_post(
    post_id: uuid.UUID,
    note: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
    require_roles(Role.ADMIN, Role.SUPER_ADMIN)
    ),
    ):
    service = ModerationService(db)

    try:
        await service.reject_post(post_id, current_user, note)
        return {"message": "Post rejected"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
