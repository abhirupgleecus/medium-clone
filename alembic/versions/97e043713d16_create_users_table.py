"""create users table

Revision ID: 97e043713d16
Revises: be765237dfa8
Create Date: 2026-03-25 13:16:50.026083

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '97e043713d16'
down_revision: Union[str, None] = 'be765237dfa8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=True),
        sa.Column('full_name', sa.String(length=200), nullable=False),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),

        sa.Column(
            'role',
            sa.Enum(
                'super_admin', 'admin', 'author', 'contributor', 'viewer',
                name='role_enum'
            ),
            nullable=False
        ),

        sa.Column(
            'status',
            sa.Enum(
                'pending', 'active', 'suspended',
                name='user_status_enum'
            ),
            nullable=False
        ),

        sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),

        sa.PrimaryKeyConstraint('id')
    )

    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

    sa.Enum(name="role_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="user_status_enum").drop(op.get_bind(), checkfirst=True)
