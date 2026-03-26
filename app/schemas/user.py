# app/schemas/user.py
import uuid
from pydantic import BaseModel, EmailStr, Field
from enum import Enum

class UpdateUserAdminRequest(BaseModel):
    role: str | None = None
    status: str | None = None

class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    avatar_url: str | None
    role: str
    status: str

    class Config:
        from_attributes = True


class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)