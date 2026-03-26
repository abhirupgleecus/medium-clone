from pathlib import Path
from alembic import command
from alembic.config import Config

from app.core.config import settings
from app.db.seed import seed


def run_migrations():
    base_dir = Path(__file__).resolve().parent.parent

    alembic_cfg = Config(str(base_dir / "alembic.ini"))

    # ✅ CRITICAL FIX — inject DB URL
    alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

    alembic_cfg.set_main_option(
        "script_location",
        str(base_dir / "alembic"),
    )

    command.upgrade(alembic_cfg, "head")


async def startup_tasks():
    run_migrations()
    await seed()