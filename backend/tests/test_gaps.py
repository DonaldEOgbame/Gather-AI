import pytest
from app.models import GlobalRole, MaterialStatus

def _admin(client):
    inst = client.post("/courses/institutions", json={"name": "U", "join_code": "JC-1"}).json()["id"]
    client.post(
        "/auth/bootstrap",
        params={"institution_id": inst, "email": "admin@u.edu", "password": "password123"},
    )
    tok = client.post("/auth/login", data={"username": "admin@u.edu", "password": "password123"})
    return inst, {"authorization": f"Bearer {tok.json()['access_token']}"}

def _course(client, inst, H):
    sem = client.post("/courses/semesters", headers=H, json={"university_id": inst, "name": "F26"}).json()
    dep = client.post("/courses/departments", headers=H, json={"university_id": inst, "name": "CS"}).json()
    return client.post(
        "/courses",
        headers=H,
        json={"semester_id": sem["id"], "department_id": dep["id"], "code": "CS101", "title": "Intro"},
    ).json()

def _student(client, inst, H, email="s@u.edu", matric="M1"):
    client.post(
        "/auth/roster-import",
        headers=H,
        json={"institution_id": inst, "rows": [
            {"email": email, "matric_or_staff_id": matric, "global_role": "student"}]},
    )
    from app.notifier import get_notifier
    token = next(m.body.split("token: ")[-1].strip()
                 for m in reversed(get_notifier().outbox) if "token: " in m.body)
    client.post("/auth/activate", json={"token": token, "password": "student123"})
    stok = client.post("/auth/login", data={"username": email, "password": "student123"})
    return {"authorization": f"Bearer {stok.json()['access_token']}"}

def test_course_code_self_enrollment(client):
    inst, H = _admin(client)
    course = _course(client, inst, H)
    student_headers = _student(client, inst, H, email="s1@u.edu", matric="M1")

    # 1. Update enrollment mode to code
    r = client.patch(
        f"/courses/{course['id']}/enrollment-mode",
        headers=H,
        json={"enrollment_mode": "code"}
    )
    assert r.status_code == 200
    assert r.json()["enrollment_mode"] == "code"

    # 2. Generate join code
    r = client.post(
        f"/courses/{course['id']}/join-code",
        headers=H,
        json={"expires_in_hours": 1, "max_uses": 2}
    )
    assert r.status_code == 200
    code = r.json()["code"]

    # 3. Enroll using code
    r = client.post(
        f"/courses/{course['id']}/enroll",
        headers=student_headers,
        json={"code": code}
    )
    assert r.status_code == 200
    assert r.json()["status"] == "active"

    # 4. Try enrolling again (already enrolled)
    r = client.post(
        f"/courses/{course['id']}/enroll",
        headers=student_headers,
        json={"code": code}
    )
    assert r.status_code == 400

def test_timetable_session_management(client):
    inst, H = _admin(client)
    course = _course(client, inst, H)

    # Add slot
    r = client.post(
        f"/timetable/course/{course['id']}",
        headers=H,
        json={
            "weekday": 1,
            "start_time": "10:00",
            "end_time": "12:00",
            "room": "Room 101"
        }
    )
    assert r.status_code == 200
    assert r.json()["room"] == "Room 101"

    # Get course timetable
    r = client.get(
        f"/timetable/course/{course['id']}",
        headers=H
    )
    assert r.status_code == 200
    assert len(r.json()) == 1

def test_encrypted_backup_manifest(client):
    inst, H = _admin(client)
    student_headers = _student(client, inst, H)

    manifest = '{"files": [{"sha": "hash123", "path": "test.txt"}]}'
    
    # Store
    r = client.put(
        "/backup/manifest",
        headers=student_headers,
        json={"manifest_blob": manifest}
    )
    assert r.status_code == 200

    # Retrieve
    r = client.get(
        "/backup/manifest",
        headers=student_headers
    )
    assert r.status_code == 200
    assert r.json()["manifest_blob"] == manifest

def test_sharing_restrictions_and_reporting(client):
    inst, H = _admin(client)
    course = _course(client, inst, H)
    student_headers = _student(client, inst, H)

    # 1. Upload View-only material
    r = client.post(
        "/materials",
        headers=H,
        data={
            "course_id": course["id"],
            "week": 1,
            "title": "Secret Doc",
            "restriction": "view-only"
        },
        files={"file": ("secret.pdf", b"Confidential content", "application/pdf")},
    )
    assert r.status_code == 201
    mat_id = r.json()["id"]
    assert r.json()["restriction"] == "view-only"

    # Publish
    client.post(
        f"/materials/{mat_id}/publish",
        headers=H,
        json={"release_at": None}
    )

    # Enroll student first (roster based for now)
    client.patch(
        f"/courses/{course['id']}/enrollment-mode",
        headers=H,
        json={"enrollment_mode": "code"}
    )
    code_res = client.post(
        f"/courses/{course['id']}/join-code",
        headers=H,
        json={"expires_in_hours": 1, "max_uses": 2}
    ).json()
    client.post(
        f"/courses/{course['id']}/enroll",
        headers=student_headers,
        json={"code": code_res["code"]}
    )

    # 2. Student reports file
    r = client.post(
        f"/materials/{mat_id}/report",
        headers=student_headers,
        json={"reason": "blurry", "note": "Cannot read page 2"}
    )
    assert r.status_code == 200
    report_id = r.json()["id"]

    # 3. Lecturer gets reports
    r = client.get(
        f"/courses/{course['id']}/reports",
        headers=H
    )
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["id"] == report_id

    # 4. Lecturer resolves report
    r = client.patch(
        f"/reports/{report_id}/resolve",
        headers=H,
        json={"status": "resolved"}
    )
    assert r.status_code == 200
    assert r.json()["status"] == "resolved"


def test_timetable_session_conflict_checks(client):
    inst, H = _admin(client)
    course1 = _course(client, inst, H)
    
    # We need a second course to test same room conflict
    sem = client.post("/courses/semesters", headers=H, json={"university_id": inst, "name": "F26"}).json()
    dep = client.post("/courses/departments", headers=H, json={"university_id": inst, "name": "CS"}).json()
    course2 = client.post(
        "/courses",
        headers=H,
        json={"semester_id": sem["id"], "department_id": dep["id"], "code": "CS102", "title": "Intro 2"},
    ).json()

    # 1. Add slot to course1
    r = client.post(
        f"/timetable/course/{course1['id']}",
        headers=H,
        json={
            "day_of_week": 1,
            "start_time": "10:00",
            "end_time": "12:00",
            "room": "Lab A"
        }
    )
    assert r.status_code == 200

    # 2. Add conflicting slot (same room, overlapping time) to course2 -> expect 400
    r = client.post(
        f"/timetable/course/{course2['id']}",
        headers=H,
        json={
            "day_of_week": 1,
            "start_time": "11:00",
            "end_time": "13:00",
            "room": "Lab A"
        }
    )
    assert r.status_code == 400
    assert "Conflict" in r.json()["detail"]


def test_sharing_ceiling_restriction_cascade(client):
    inst, H = _admin(client)
    
    import app.db
    from app.models import Course
    
    db = app.db.SessionLocal()
    try:
        # Create course
        course = _course(client, inst, H)
        db_course = db.get(Course, course["id"])
        if db_course:
            db_course.sharing_ceiling = "app-only"
            db.commit()
            
            # Try to upload a material to this course with restriction = 'open' (looser than app-only ceiling)
            r = client.post(
                "/materials",
                headers=H,
                data={
                    "course_id": course["id"],
                    "week": 1,
                    "title": "Invalid Open Doc",
                    "restriction": "open"
                },
                files={"file": ("invalid.pdf", b"Some content", "application/pdf")},
            )
            # Expect 400 Bad Request
            assert r.status_code == 400
            assert "looser than the ceiling" in r.json()["detail"]
    finally:
        db.close()


def test_course_quota_wall_413(client):
    inst, H = _admin(client)
    course = _course(client, inst, H)
    
    import app.db
    from app.models import Material
    
    db = app.db.SessionLocal()
    try:
        # Upload a small material
        r = client.post(
            "/materials",
            headers=H,
            data={
                "course_id": course["id"],
                "week": 1,
                "title": "Small Doc",
                "restriction": "open"
            },
            files={"file": ("small.pdf", b"Some content", "application/pdf")},
        )
        assert r.status_code == 201
        mat_id = r.json()["id"]
        
        # Modify size in database to be slightly over 2 GB
        db_mat = db.get(Material, mat_id)
        if db_mat:
            db_mat.size_bytes = 2 * 1024 * 1024 * 1024 + 100
            db.commit()
            
        # Try uploading another file to the same course -> expect 413
        r = client.post(
            "/materials",
            headers=H,
            data={
                "course_id": course["id"],
                "week": 2,
                "title": "Another Doc",
                "restriction": "open"
            },
            files={"file": ("another.pdf", b"Some content", "application/pdf")},
        )
        assert r.status_code == 413
        assert "Course storage full" in r.json()["detail"]
    finally:
        db.close()


def test_resolve_course_join_code(client):
    inst, H = _admin(client)
    course = _course(client, inst, H)
    student_headers = _student(client, inst, H, email="s2@u.edu", matric="M2")

    # Update mode to code
    r = client.patch(
        f"/courses/{course['id']}/enrollment-mode",
        headers=H,
        json={"enrollment_mode": "code"}
    )
    assert r.status_code == 200

    # Generate join code
    r = client.post(
        f"/courses/{course['id']}/join-code",
        headers=H,
        json={"expires_in_hours": 1, "max_uses": 10}
    )
    assert r.status_code == 200
    code = r.json()["code"]

    # Resolve course join code as student
    r = client.get(
        f"/offerings/join-code/{code}",
        headers=student_headers
    )
    assert r.status_code == 200
    assert r.json()["code"] == "CS101"

