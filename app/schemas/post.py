# app/schemas/post.py

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class CreatePostRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str
    tags: list[str] = []
    cover_image_url: str | None


class PostResponse(BaseModel):
    id: uuid.UUID
    author_id: uuid.UUID
    title: str
    content: str
    status: str
    published_at: datetime | None
    likes_count: int
    cover_image_url: str | None
    content_format: str

    class Config:
        from_attributes = True

class UpdatePostRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = None
    cover_image_url: str | None