import os
import sys
from datetime import date, datetime, timezone

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import Base, engine, SessionLocal
from app.models import (
    University,
    User,
    AcademicSession,
    Semester,
    Department,
    Course,
    CourseOffering,
    OfferingLecturer,
    Enrollment,
    NotificationSettings,
    GlobalRole,
    AccountStatus,
    SessionStatus,
    SemesterStatus,
    SemesterTerm,
    OfferingStatus,
    EnrollmentStatus,
)
from app.security import hash_password

def main():
    db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gather.db")
    if os.path.exists(db_file):
        print(f"Removing existing SQLite database: {db_file}")
        os.remove(db_file)
        
    print("Creating all tables...")
    Base.metadata.create_all(engine)
    
    db = SessionLocal()
    try:
        print("Seeding database...")
        # 1. University
        inst = University(
            name="Aduna U",
            join_code="ADUN-2026",
            timezone="Africa/Lagos",
            retention_months=12
        )
        db.add(inst)
        db.flush() # get id
        
        # 2. Users
        admin = User(
            institution_id=inst.id,
            email="admin@aduna.edu",
            password_hash=hash_password("password123"),
            full_name="Admin Roster",
            legal_name="Admin Roster",
            matric_or_staff_id="ADMIN-1",
            global_role=GlobalRole.admin,
            status=AccountStatus.active
        )
        lecturer = User(
            institution_id=inst.id,
            email="lecturer@aduna.edu",
            password_hash=hash_password("password123"),
            full_name="Jane Doe",
            legal_name="Jane Doe",
            matric_or_staff_id="STAFF-123",
            global_role=GlobalRole.lecturer,
            status=AccountStatus.active
        )
        student = User(
            institution_id=inst.id,
            email="student@aduna.edu",
            password_hash=hash_password("password123"),
            full_name="John Student",
            legal_name="John Student",
            matric_or_staff_id="MAT-456",
            global_role=GlobalRole.student,
            status=AccountStatus.active
        )
        db.add_all([admin, lecturer, student])
        db.flush()
        
        # 3. Notification Settings
        for u in [admin, lecturer, student]:
            ns = NotificationSettings(
                user_id=u.id,
                enabled=True,
                new_material=True,
                material_updated=True,
                scheduled_release=True,
                draft_activity=True,
                roster_changes=True,
                pending_approvals=True,
                batch_delivery=False,
                quiet_hours_start="22:00",
                quiet_hours_end="07:00",
            )
            db.add(ns)
            
        # 4. Academic Session
        session = AcademicSession(
            institution_id=inst.id,
            name="2025/2026",
            start_date=date(2025, 9, 1),
            end_date=date(2026, 6, 30),
            status=SessionStatus.active
        )
        db.add(session)
        db.flush()

        # 5. Semesters
        first_sem = Semester(
            session_id=session.id,
            term=SemesterTerm.first,
            start_date=date(2025, 9, 1),
            end_date=date(2026, 1, 31),
            registration_open=True,
            credit_unit_cap=24,
            status=SemesterStatus.active
        )
        second_sem = Semester(
            session_id=session.id,
            term=SemesterTerm.second,
            start_date=date(2026, 2, 1),
            end_date=date(2026, 6, 30),
            registration_open=False,
            credit_unit_cap=24,
            status=SemesterStatus.upcoming
        )
        db.add_all([first_sem, second_sem])
        db.flush()

        # 6. Dept
        dep = Department(
            university_id=inst.id,
            name="Computer Science"
        )
        db.add(dep)
        db.flush()
        
        # 7. Catalog Course
        course = Course(
            department_id=dep.id,
            code="CS101",
            title="Introduction to Computer Science",
            credit_units=3,
            description="Foundational programming principles."
        )
        db.add(course)
        db.flush()

        # 8. Course Offering (instance per semester)
        offering = CourseOffering(
            course_id=course.id,
            semester_id=first_sem.id,
            status=OfferingStatus.active,
            enrollment_mode="advisor_approval",
            sharing_ceiling="open",
            watermark_mandatory=False
        )
        db.add(offering)
        db.flush()
        
        # 9. Offering Lecturer (replaces CourseRoster)
        roster = OfferingLecturer(
            offering_id=offering.id,
            lecturer_id=lecturer.id,
            is_owner=True,
            can_publish=True,
            can_manage_roster=True
        )
        db.add(roster)
        
        # 10. Enrollment
        enrollment = Enrollment(
            offering_id=offering.id,
            student_id=student.id,
            status=EnrollmentStatus.active
        )
        db.add(enrollment)
        
        db.commit()
        print("Successfully bootstrapped the SQLite database with seed data!")
        print("Admin user: admin@aduna.edu / password123")
        print("Lecturer user: lecturer@aduna.edu / password123")
        print("Student user: student@aduna.edu / password123")
        
    except Exception as e:
        db.rollback()
        print(f"Error bootstrapping database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    main()
