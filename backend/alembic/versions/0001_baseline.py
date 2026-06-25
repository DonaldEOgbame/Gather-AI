"""baseline schema

Revision ID: 0001_baseline
Revises:
Create Date: 2026-06-23
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

global_role = sa.Enum("admin", "lecturer", "student", name="global_role")
semester_status = sa.Enum("active", "archived", name="semester_status")
material_status = sa.Enum("draft", "scheduled", "live", name="material_status")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False, server_default=""),
        sa.Column("global_role", global_role, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "universities",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
    )

    op.create_table(
        "semesters",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("university_id", UUID(as_uuid=False), sa.ForeignKey("universities.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("status", semester_status, nullable=False, server_default="active"),
    )

    op.create_table(
        "departments",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("university_id", UUID(as_uuid=False), sa.ForeignKey("universities.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
    )

    op.create_table(
        "courses",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("semester_id", UUID(as_uuid=False), sa.ForeignKey("semesters.id"), nullable=False),
        sa.Column("department_id", UUID(as_uuid=False), sa.ForeignKey("departments.id"), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False, server_default=""),
        sa.UniqueConstraint("semester_id", "code", name="uq_course_semester_code"),
    )

    op.create_table(
        "course_roster",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("course_id", UUID(as_uuid=False), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("can_publish", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("can_manage_roster", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.UniqueConstraint("course_id", "user_id", name="uq_roster_course_user"),
    )

    op.create_table(
        "enrollments",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("course_id", UUID(as_uuid=False), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("student_id", UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.UniqueConstraint("course_id", "student_id", name="uq_enroll_course_student"),
    )

    op.create_table(
        "materials",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("course_id", UUID(as_uuid=False), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("week", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("storage_key", sa.String(), nullable=False),
        sa.Column("content_sha1", sa.String(), nullable=False),
        sa.Column("original_filename", sa.String(), nullable=False, server_default=""),
        sa.Column("size_bytes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", material_status, nullable=False, server_default="draft"),
        sa.Column("release_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("summary_json", sa.String(), nullable=True),
        sa.Column("download_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("uploaded_by", UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_materials_course_id", "materials", ["course_id"])
    op.create_index("ix_materials_content_sha1", "materials", ["content_sha1"])
    op.create_index("ix_materials_status", "materials", ["status"])

    op.create_table(
        "timetable_slots",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("course_id", UUID(as_uuid=False), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("weekday", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.String(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("timetable_slots")
    op.drop_table("materials")
    op.drop_table("enrollments")
    op.drop_table("course_roster")
    op.drop_table("courses")
    op.drop_table("departments")
    op.drop_table("semesters")
    op.drop_table("universities")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    material_status.drop(op.get_bind(), checkfirst=True)
    semester_status.drop(op.get_bind(), checkfirst=True)
    global_role.drop(op.get_bind(), checkfirst=True)
