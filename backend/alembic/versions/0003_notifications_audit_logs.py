"""Add notifications, notification settings, audit logs, and fcm_token

Revision ID: 0003_notifications
Revises: 0002_identity
Create Date: 2026-06-23
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0003_notifications"
down_revision: Union[str, None] = "0002_identity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- sessions: add fcm_token ---
    op.add_column("sessions", sa.Column("fcm_token", sa.String(), nullable=True))

    # --- notification_settings ---
    op.create_table(
        "notification_settings",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("new_material", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("material_updated", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("scheduled_release", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("draft_activity", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("roster_changes", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("pending_approvals", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("batch_delivery", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("quiet_hours_start", sa.String(), nullable=True, server_default="22:00"),
        sa.Column("quiet_hours_end", sa.String(), nullable=True, server_default="07:00"),
    )
    op.create_index(
        "ix_notification_settings_user_id", "notification_settings", ["user_id"], unique=True
    )

    # --- notifications ---
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "course_id",
            UUID(as_uuid=False),
            sa.ForeignKey("courses.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "material_id",
            UUID(as_uuid=False),
            sa.ForeignKey("materials.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("body", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scheduled_send_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    # --- audit_logs ---
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "institution_id",
            UUID(as_uuid=False),
            sa.ForeignKey("universities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("target_id", sa.String(), nullable=True),
        sa.Column("details", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_audit_logs_institution_id", "audit_logs", ["institution_id"])
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("notifications")
    op.drop_index("ix_notification_settings_user_id", table_name="notification_settings")
    op.drop_table("notification_settings")
    op.drop_column("sessions", "fcm_token")
