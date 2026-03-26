# app/api/v1/users.py
import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, Role
from app.schemas.user import (
    UserResponse,
    UpdateUserRequest,
    ChangePasswordRequest,
    UpdateUserAdminRequest,
)
from app.services.user_service import UserService
from app.services.admin_user_service import AdminUserService
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.SUPER_ADMIN)),
):
    service = AdminUserService(db)
    return await service.list_users()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.SUPER_ADMIN)),
):
    service = AdminUserService(db)

    try:
        return await service.get_user(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    body: UpdateUserAdminRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.SUPER_ADMIN)),
):
    service = AdminUserService(db)

    try:
        return await service.update_user(
            user_id=user_id,
            role=body.role,
            status=body.status,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.SUPER_ADMIN)),
):
    service = AdminUserService(db)

    try:
        await service.delete_user(user_id)
        return {"message": "User deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))



@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = UserService(db)

    user = await service.update_me(
        user=current_user,
        full_name=body.full_name,
        avatar_url=body.avatar_url,
    )

    return user


@router.patch("/me/password")
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = UserService(db)

    try:
        await service.change_password(
            user=current_user,
            current_password=body.current_password,
            new_password=body.new_password,
        )
        return {"message": "Password updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))