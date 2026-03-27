# app/api/v1/posts.py

import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi import Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.dependencies import get_current_user, get_optional_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.post import CreatePostRequest, PostResponse, UpdatePostRequest
from app.services.post_service import PostService


router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post("", response_model=PostResponse)
async def create_post(
    body: CreatePostRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = PostService(db)

    return await service.create_post(
        user=user,
        title=body.title,
        content=body.content,
        tags=body.tags,
        cover_image_url=body.cover_image_url,
    )


@router.get("", response_model=list[PostResponse])
async def list_posts(
    tag: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = PostService(db)

    return await service.search_posts(
        tag=tag,
        search=search,
    )


@router.get("/me", response_model=list[PostResponse])
async def list_my_posts(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = PostService(db)
    return await service.list_my_posts(user)

@router.get("/top", response_model=list[PostResponse])
async def top_posts(
    db: AsyncSession = Depends(get_db),
):
    service = PostService(db)
    return await service.get_top_posts()


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    service = PostService(db)

    try:
        return await service.get_post(
            user=user,
            post_id=post_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{post_id}/publish", response_model=PostResponse)
async def publish_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = PostService(db)

    try:
        return await service.publish_post(
            user=user,
            post_id=post_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.patch("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: uuid.UUID,
    body: UpdatePostRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = PostService(db)

    try:
        return await service.update_post(
            user=user,
            post_id=post_id,
            title=body.title,
            content=body.content,
            cover_image_url=body.cover_image_url,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.delete("/{post_id}")
async def delete_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = PostService(db)

    try:
        await service.delete_post(
            user=user,
            post_id=post_id,
        )
        return {"message": "Post deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.post("/{post_id}/like")
async def like_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = PostService(db)

    try:
        await service.like_post(
            user=user,
            post_id=post_id,
        )
        return {"message": "Post liked"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{post_id}/like")
async def unlike_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = PostService(db)

    await service.unlike_post(
        user=user,
        post_id=post_id,
    )

    return {"message": "Post unliked"}

