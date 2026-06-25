"""Phase 0 / Module 1-2 — structure, upload (SHA-256), and student RBAC."""

import hashlib


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


def test_upload_uses_sha256_and_lands_as_draft(client):
    inst, H = _admin(client)
    course = _course(client, inst, H)
    payload = b"payload-bytes"
    r = client.post(
        "/materials",
        headers=H,
        data={"course_id": course["id"], "week": "4", "title": "Lecture"},
        files={"file": ("CS101_Week4.pdf", payload, "application/pdf")},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["status"] == "draft" and body["week"] == 4
    assert body["content_sha256"] == hashlib.sha256(payload).hexdigest()


def test_week_bounds_validated(client):
    inst, H = _admin(client)
    course = _course(client, inst, H)
    bad = client.post(
        "/materials",
        headers=H,
        data={"course_id": course["id"], "week": "99", "title": "x"},
        files={"file": ("a.pdf", b"x", "application/pdf")},
    )
    assert bad.status_code == 422


def test_unenrolled_student_cannot_see_or_download(client):
    inst, H = _admin(client)
    course = _course(client, inst, H)
    mat = client.post(
        "/materials",
        headers=H,
        data={"course_id": course["id"], "week": "1", "title": "L"},
        files={"file": ("a.pdf", b"x", "application/pdf")},
    ).json()

    # make an active student (roster import + activate)
    client.post(
        "/auth/roster-import",
        headers=H,
        json={"institution_id": inst, "rows": [
            {"email": "s@u.edu", "matric_or_staff_id": "M1", "global_role": "student"}]},
    )
    from app.notifier import get_notifier
    token = next(m.body.split("token: ")[-1].strip()
                 for m in reversed(get_notifier().outbox) if "token: " in m.body)
    client.post("/auth/activate", json={"token": token, "password": "student123"})
    stok = client.post("/auth/login", data={"username": "s@u.edu", "password": "student123"})
    SH = {"authorization": f"Bearer {stok.json()['access_token']}"}

    # draft is invisible to an unenrolled student, and download 404s
    assert client.get("/materials", headers=SH, params={"course_id": course["id"]}).json() == []
    assert client.get(f"/materials/{mat['id']}/download", headers=SH).status_code == 404
