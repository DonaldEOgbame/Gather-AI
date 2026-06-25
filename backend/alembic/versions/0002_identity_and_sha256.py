"""Module 6 identity tables + SHA-256 dedup

Revision ID: 0002_identity
Revises: 0001_baseline
Create Date: 2026-06-23
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0002_identity"
down_revision: Union[str, None] = "0001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

account_status = sa.Enum("invited", "active", "suspended", "archived", name="account_status")


def upgrade() -> None:
    # --- SHA-256 dedup: rename materials.content_sha1 -> content_sha256 ---
    op.drop_index("ix_materials_content_sha1", table_name="materials")
    op.alter_column("materials", "content_sha1", new_column_name="content_sha256")
    op.create_index("ix_materials_content_sha256", "materials", ["content_sha256"])

    # --- universities (institution) gains join_code + timezone ---
    op.add_column("universities", sa.Column("join_code", sa.String(), nullable=True))
    op.add_column(
        "universities",
        sa.Column("timezone", sa.String(), nullable=False, server_default="UTC"),
    )
    op.create_index("ix_universities_join_code", "universities", ["join_code"], unique=True)

    # --- users gain identity fields ---
    account_status.create(op.get_bind(), checkfirst=True)
    op.add_column("users", sa.Column("institution_id", UUID(as_uuid=False), nullable=True))
    op.add_column("users", sa.Column("title", sa.String(), nullable=False, server_default=""))
    op.add_column("users", sa.Column("matric_or_staff_id", sa.String(), nullable=True))
    op.add_column(
        "users",
        sa.Column("status", account_status, nullable=False, server_default="invited"),
    )
    op.alter_column("users", "password_hash", existing_type=sa.String(), nullable=True)
    op.create_foreign_key(
        "fk_users_institution", "users", "universities", ["institution_id"], ["id"]
    )
    op.create_index("ix_users_institution_id", "users", ["institution_id"])
    op.create_index("ix_users_matric_or_staff_id", "users", ["matric_or_staff_id"])
    op.create_index("ix_users_status", "users", ["status"])

    # --- invitations ---
    op.create_table(
        "invitations",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("token", sa.String(), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_invitations_user_id", "invitations", ["user_id"])
    op.create_index("ix_invitations_token", "invitations", ["token"])

    # --- otp_codes ---
    op.create_table(
        "otp_codes",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("code_hash", sa.String(), nullable=False),
        sa.Column("purpose", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_otp_codes_user_id", "otp_codes", ["user_id"])

    # --- sessions ---
    op.create_table(
        "sessions",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("refresh_token_hash", sa.String(), nullable=False, unique=True),
        sa.Column("device_name", sa.String(), nullable=False, server_default="Unknown device"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"])
    op.create_index("ix_sessions_refresh_token_hash", "sessions", ["refresh_token_hash"])

    # --- pending_approvals ---
    op.create_table(
        "pending_approvals",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("institution_id", UUID(as_uuid=False), sa.ForeignKey("universities.id"), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False, server_default=""),
        sa.Column("matric_or_staff_id", sa.String(), nullable=False),
        sa.Column("requested_role", sa.Enum(name="global_role", create_type=False), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_pending_approvals_institution_id", "pending_approvals", ["institution_id"])


def downgrade() -> None:
    op.drop_table("pending_approvals")
    op.drop_table("sessions")
    op.drop_table("otp_codes")
    op.drop_index("ix_invitations_token", table_name="invitations")
    op.drop_table("invitations")

    op.drop_index("ix_users_status", table_name="users")
    op.drop_index("ix_users_matric_or_staff_id", table_name="users")
    op.drop_index("ix_users_institution_id", table_name="users")
    op.drop_constraint("fk_users_institution", "users", type_="foreignkey")
    op.alter_column("users", "password_hash", existing_type=sa.String(), nullable=False)
    op.drop_column("users", "status")
    op.drop_column("users", "matric_or_staff_id")
    op.drop_column("users", "title")
    op.drop_column("users", "institution_id")
    account_status.drop(op.get_bind(), checkfirst=True)

    op.drop_index("ix_universities_join_code", table_name="universities")
    op.drop_column("universities", "timezone")
    op.drop_column("universities", "join_code")

    op.drop_index("ix_materials_content_sha256", table_name="materials")
    op.alter_column("materials", "content_sha256", new_column_name="content_sha1")
    op.create_index("ix_materials_content_sha1", "materials", ["content_sha1"])
