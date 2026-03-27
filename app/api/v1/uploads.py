from fastapi import APIRouter

from app.services.image_service import ImageService

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.get("/auth")
async def get_upload_auth():
    return ImageService.get_upload_auth()