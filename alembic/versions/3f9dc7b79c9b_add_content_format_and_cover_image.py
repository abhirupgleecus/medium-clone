"""add content format and cover image

Revision ID: 3f9dc7b79c9b
Revises: 96a0c31511ec
Create Date: 2026-03-27 15:59:57.581485

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f9dc7b79c9b'
down_revision: Union[str, None] = '96a0c31511ec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from sqlalchemy.dialects import postgresql

def upgrade() -> None:
    content_format_enum = postgresql.ENUM(
        'html',
        'markdown',
        name='content_format_enum'
    )

    content_format_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'posts',
        sa.Column(
            'content_format',
            content_format_enum,
            nullable=False,
            server_default='html'
        )
    )

    op.add_column(
        'posts',
        sa.Column('cover_image_url', sa.String(length=500), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('posts', 'cover_image_url')
    op.drop_column('posts', 'content_format')

    content_format_enum = postgresql.ENUM(
        'html',
        'markdown',
        name='content_format_enum'
    )
    content_format_enum.drop(op.get_bind(), checkfirst=True)
