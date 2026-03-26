# app/main.py

from fastapi import FastAPI
from sqlalchemy import text

from app.db.session import engine
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.posts import router as posts_router

app = FastAPI(title="InkWell API")

app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(posts_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify API and DB connectivity.
    """
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "details": str(e)}