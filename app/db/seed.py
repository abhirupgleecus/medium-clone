import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.user import User, Role, UserStatus
from app.core.security import hash_password


async def seed() -> None:
    """
    Seed initial data (super admin).
    """

    async with AsyncSessionLocal() as db:
        # 🔍 Check if admin already exists
        result = await db.execute(
            select(User).where(User.email == "admin@inkwell.com")
        )
        existing = result.scalar_one_or_none()

        if existing:
            print("✅ Super admin already exists")
            return

        # 👤 Create super admin
        admin = User(
            email="admin@inkwell.com",
            hashed_password=hash_password("admin123"),
            full_name="Super Admin",
            role=Role.SUPER_ADMIN,
            status=UserStatus.ACTIVE,
        )

        db.add(admin)
        await db.commit()

        print("🚀 Super admin created!")


if __name__ == "__main__":
    asyncio.run(seed())