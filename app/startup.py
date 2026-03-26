from pathlib import Path
from alembic import command
from alembic.config import Config

from app.db.seed import seed


def run_migrations():
    base_dir = Path(__file__).resolve().parent.parent  # project root
    alembic_ini_path = base_dir / "alembic.ini"

    alembic_cfg = Config(str(alembic_ini_path))
    alembic_cfg.set_main_option("script_location", str(base_dir / "alembic"))

    command.upgrade(alembic_cfg, "head")


async def startup_tasks():
    run_migrations()
    await seed()