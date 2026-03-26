# app/api/v1/auth.py

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    MessageResponse,
)
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, Role

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role.value,
    }


@router.get("/admin-only")
async def admin_only(
    current_user = Depends(require_roles(Role.ADMIN))
):
    return {
        "message": "Welcome admin!",
        "user_id": str(current_user.id),
    }


@router.post("/register", response_model=MessageResponse, status_code=201)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)

    try:
        await service.register(
            email=body.email,
            password=body.password,
            full_name=body.full_name,
        )
        return {"message": "User registered successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)

    try:
        access_token, refresh_token = await service.login(
            email=form_data.username,
            password=form_data.password,
        )
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)

    try:
        access_token, new_refresh = await service.refresh(
            user_id=uuid.UUID(body.user_id),
            refresh_token=body.refresh_token,
        )
        return {
            "access_token": access_token,
            "refresh_token": new_refresh,
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout", response_model=MessageResponse)
async def logout(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)

    try:
        await service.logout(
            user_id=uuid.UUID(body.user_id),
            refresh_token=body.refresh_token,
        )
        return {"message": "Logged out successfully"}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))