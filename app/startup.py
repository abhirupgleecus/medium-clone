import asyncio
from alembic import command
from alembic.config import Config

from app.db.seed import seed


def run_migrations():
    """
    Run Alembic migrations programmatically.
    """
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")


async def startup_tasks():
    """
    Run all startup tasks.
    """
    # Run migrations (sync)
    run_migrations()

    # Seed admin (async)
    await seed()