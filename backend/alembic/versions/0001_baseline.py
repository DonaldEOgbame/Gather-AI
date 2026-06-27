"""squashed baseline — full current schema

Single fresh baseline that supersedes the old 0001→0003 chain (which had drifted
~19 tables / dozens of columns behind the models and no longer applied cleanly).

It builds the schema directly from ``Base.metadata`` — the same source
``bootstrap_db.py`` and the test suite already use — so the migration can never
drift from the models, and it renders dialect-correct types (native UUID/enums on
Postgres, their mappings on SQLite). Future schema changes are authored as normal
incremental revisions on top of this.

Existing databases that were created via ``create_all`` (no ``alembic_version``
row) should be brought onto the chain with ``alembic stamp head`` rather than
``upgrade`` — they already have these tables.

Revision ID: 0001_baseline
Revises:
Create Date: 2026-06-27
"""
from typing import Sequence, Union

from alembic import op

from app.db import Base
from app import models  # noqa: F401  (registers every model on Base.metadata)

revision: str = "0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
