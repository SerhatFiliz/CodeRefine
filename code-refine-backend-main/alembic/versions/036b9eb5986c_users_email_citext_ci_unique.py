"""users.email -> citext (CI unique)

Revision ID: 036b9eb5986c
Revises: 19c419e063f7
Create Date: 2025-10-22 17:54:11.871708

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '036b9eb5986c'
down_revision: Union[str, Sequence[str], None] = '19c419e063f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

from sqlalchemy.dialects import postgresql

def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")

    op.alter_column(
        "users", "email",
        type_=postgresql.CITEXT(),
        postgresql_using="email::citext",
        existing_nullable=False,  # tablo durumuna göre True/False
    )


def downgrade() -> None:
    """Downgrade schema."""
    pass
