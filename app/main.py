# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.db.session import engine
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.posts import router as posts_router
from app.api.v1.contrib import router as contrib_router
from app.api.v1.uploads import router as uploads_router

from app.startup import startup_tasks


app = FastAPI(title="InkWell API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(posts_router, prefix="/api/v1")
app.include_router(contrib_router, prefix="/api/v1")
app.include_router(uploads_router, prefix="/api/v1")


app.on_event("startup")
async def on_startup():
    await startup_tasks()

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