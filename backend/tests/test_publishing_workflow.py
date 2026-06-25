import datetime
from datetime import timezone
import hashlib
from app.notifier import get_notifier
from app.models import Material, MaterialStatus, AuditLog, Enrollment, Session as SessionModel, Notification, NotificationSettings
from app.tasks import check_scheduled_releases, flush_delayed_notifications
import app.db

def _admin(client):
    inst = client.post("/courses/institutions", json={"name": "U", "join_code": "JC-1", "timezone": "UTC"}).json()["id"]
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

def _user(client, inst, admin_headers, email, role, matric):
    # Clear any old emails in outbox for this recipient to avoid crosstalk
    notifier = get_notifier()
    notifier.outbox = [m for m in notifier.outbox if m.to != email]

    r_import = client.post(
        "/auth/roster-import",
        headers=admin_headers,
        json={"institution_id": inst, "rows": [{"email": email, "matric_or_staff_id": matric, "global_role": role}]},
    )
    assert r_import.status_code == 200, f"Roster import failed: {r_import.text}"

    token = next(m.body.split("token: ")[-1].strip()
                 for m in reversed(notifier.outbox) if m.to == email and "token: " in m.body)
    
    r_act = client.post("/auth/activate", json={"token": token, "password": "password123"})
    assert r_act.status_code == 200, f"Activation failed: {r_act.text}"

    tok = client.post("/auth/login", data={"username": email, "password": "password123"})
    if "access_token" not in tok.json():
        raise Exception(f"Login failed for {email}: {tok.status_code} - {tok.text}")
    return {"authorization": f"Bearer {tok.json()['access_token']}"}, tok.json()["refresh_token"]

def test_roster_can_publish_gate(client):
    inst, H = _admin(client)
    course = _course(client, inst, H)

    LH_A, _ = _user(client, inst, H, "profA@u.edu", "lecturer", "L1")
    LH_B, _ = _user(client, inst, H, "profB@u.edu", "lecturer", "L2")

    userA = client.get("/auth/me", headers=LH_A).json()["id"]
    userB = client.get("/auth/me", headers=LH_B).json()["id"]

    client.post(f"/courses/{course['id']}/roster", headers=H, json={
        "user_id": userA, "can_publish": False, "can_manage_roster": False
    })
    client.post(f"/courses/{course['id']}/roster", headers=H, json={
        "user_id": userB, "can_publish": True, "can_manage_roster": False
    })

    payload = b"draft-pdf-content"
    mat = client.post(
        "/materials",
        headers=LH_A,
        data={"course_id": course["id"], "week": "1", "title": "L1"},
        files={"file": ("l1.pdf", payload, "application/pdf")},
    ).json()

    assert mat["status"] == "draft"

    r = client.post(f"/materials/{mat['id']}/publish", headers=LH_A, json={"release_at": None})
    assert r.status_code == 403

    r2 = client.post(f"/materials/{mat['id']}/publish", headers=LH_B, json={"release_at": None})
    assert r2.status_code == 200
    assert r2.json()["status"] == "live"


def test_batch_publishing_collapsing(client):
    inst, H = _admin(client)
    course = _course(client, inst, H)

    LH, _ = _user(client, inst, H, "prof@u.edu", "lecturer", "L1")
    SH1, _ = _user(client, inst, H, "student1@u.edu", "student", "S1")
    SH2, _ = _user(client, inst, H, "student2@u.edu", "student", "S2")

    prof_id = client.get("/auth/me", headers=LH).json()["id"]
    client.post(f"/courses/{course['id']}/roster", headers=H, json={
        "user_id": prof_id, "can_publish": True, "can_manage_roster": False
    })

    s1_id = client.get("/auth/me", headers=SH1).json()["id"]
    s2_id = client.get("/auth/me", headers=SH2).json()["id"]

    db = app.db.SessionLocal()
    db.add(Enrollment(course_id=course["id"], student_id=s1_id))
    db.add(Enrollment(course_id=course["id"], student_id=s2_id))
    for sid in [s1_id, s2_id]:
        settings = db.query(NotificationSettings).filter(NotificationSettings.user_id == sid).first()
        if not settings:
            settings = NotificationSettings(user_id=sid)
            db.add(settings)
        settings.quiet_hours_start = "00:00"
        settings.quiet_hours_end = "00:00"
    db.commit()
    db.close()

    get_notifier().outbox.clear()

    mats = []
    for i in range(3):
        m = client.post(
            "/materials",
            headers=LH,
            data={"course_id": course["id"], "week": str(i + 1), "title": f"Lecture {i + 1}"},
            files={"file": (f"l{i + 1}.pdf", b"pdf-bytes", "application/pdf")},
        ).json()
        mats.append(m["id"])

    r = client.post("/materials/publish-batch", headers=LH, json={
        "material_ids": mats,
        "release_at": None
    })
    assert r.status_code == 200
    outbox = get_notifier().outbox
    emails = [m for m in outbox if m.channel == "email"]
    new_mats_emails = [e for e in emails if "New material published" in e.subject]
    assert len(new_mats_emails) == 2
    assert "3 new materials" in new_mats_emails[0].body or "Lecture 1" in new_mats_emails[0].body


def test_scheduled_publishing_celery_task(client):
    inst, H = _admin(client)
    course = _course(client, inst, H)
    LH, _ = _user(client, inst, H, "prof@u.edu", "lecturer", "L1")
    prof_id = client.get("/auth/me", headers=LH).json()["id"]
    client.post(f"/courses/{course['id']}/roster", headers=H, json={
        "user_id": prof_id, "can_publish": True, "can_manage_roster": False
    })

    SH, _ = _user(client, inst, H, "student@u.edu", "student", "S1")
    s_id = client.get("/auth/me", headers=SH).json()["id"]
    db = app.db.SessionLocal()
    db.add(Enrollment(course_id=course["id"], student_id=s_id))
    db.commit()
    db.close()

    future_time = (datetime.datetime.now(timezone.utc) + datetime.timedelta(hours=1)).isoformat()
    m1 = client.post(
        "/materials",
        headers=LH,
        data={"course_id": course["id"], "week": "1", "title": "Future Lec"},
        files={"file": ("future.pdf", b"bytes", "application/pdf")},
    ).json()

    r = client.post(f"/materials/{m1['id']}/publish", headers=LH, json={"release_at": future_time})
    assert r.status_code == 200
    assert r.json()["status"] == "scheduled"

    future_time_2 = (datetime.datetime.now(timezone.utc) + datetime.timedelta(hours=2)).isoformat()
    m2 = client.post(
        "/materials",
        headers=LH,
        data={"course_id": course["id"], "week": "2", "title": "Past Lec"},
        files={"file": ("past.pdf", b"bytes", "application/pdf")},
    ).json()

    r2 = client.post(f"/materials/{m2['id']}/publish", headers=LH, json={"release_at": future_time_2})
    assert r2.status_code == 200
    assert r2.json()["status"] == "scheduled"

    # Now manually adjust its release_at to the past in the database
    db = app.db.SessionLocal()
    db_m2 = db.get(Material, m2["id"])
    db_m2.release_at = datetime.datetime.now(timezone.utc) - datetime.timedelta(hours=1)
    db.commit()
    db.close()

    check_scheduled_releases()

    db = app.db.SessionLocal()
    db_m1 = db.get(Material, m1["id"])
    db_m2 = db.get(Material, m2["id"])
    assert db_m1.status == MaterialStatus.scheduled
    assert db_m2.status == MaterialStatus.live
    db.close()


def test_fcm_token_registration(client):
    inst, H = _admin(client)
    r = client.put("/auth/fcm-token", headers=H, json={"fcm_token": "test-fcm-token-123"})
    assert r.status_code == 204

    db = app.db.SessionLocal()
    sess = db.query(SessionModel).filter(SessionModel.fcm_token == "test-fcm-token-123").first()
    assert sess is not None
    assert sess.fcm_token == "test-fcm-token-123"
    db.close()


def test_quiet_hours_notification_delay(client):
    inst, H = _admin(client)
    course = _course(client, inst, H)
    LH, _ = _user(client, inst, H, "prof@u.edu", "lecturer", "L1")
    prof_id = client.get("/auth/me", headers=LH).json()["id"]
    client.post(f"/courses/{course['id']}/roster", headers=H, json={
        "user_id": prof_id, "can_publish": True, "can_manage_roster": False
    })

    SH, _ = _user(client, inst, H, "student@u.edu", "student", "S1")
    s_id = client.get("/auth/me", headers=SH).json()["id"]

    db = app.db.SessionLocal()
    db.add(Enrollment(course_id=course["id"], student_id=s_id))
    db.commit()

    settings = db.query(NotificationSettings).filter(NotificationSettings.user_id == s_id).first()
    if not settings:
        settings = NotificationSettings(user_id=s_id)
        db.add(settings)
    settings.enabled = True
    settings.quiet_hours_start = "00:00"
    settings.quiet_hours_end = "23:59"
    db.commit()
    db.close()

    get_notifier().outbox.clear()

    mat = client.post(
        "/materials",
        headers=LH,
        data={"course_id": course["id"], "week": "1", "title": "Immediate Lec"},
        files={"file": ("lec.pdf", b"bytes", "application/pdf")},
    ).json()

    client.post(f"/materials/{mat['id']}/publish", headers=LH, json={"release_at": None})

    db = app.db.SessionLocal()
    notif = db.query(Notification).filter(Notification.user_id == s_id).first()
    assert notif is not None
    assert notif.scheduled_send_at is not None
    assert notif.sent_at is None
    db.close()

    outbox = get_notifier().outbox
    assert len([e for e in outbox if e.channel == "email" and "New material" in e.subject]) == 0


def test_audit_trail(client):
    inst, H = _admin(client)
    course = _course(client, inst, H)
    LH, _ = _user(client, inst, H, "prof@u.edu", "lecturer", "L1")
    prof_id = client.get("/auth/me", headers=LH).json()["id"]
    client.post(f"/courses/{course['id']}/roster", headers=H, json={
        "user_id": prof_id, "can_publish": True, "can_manage_roster": False
    })

    mat = client.post(
        "/materials",
        headers=LH,
        data={"course_id": course["id"], "week": "1", "title": "Immediate Lec"},
        files={"file": ("lec.pdf", b"bytes", "application/pdf")},
    ).json()

    client.post(f"/materials/{mat['id']}/publish", headers=LH, json={"release_at": None})

    db = app.db.SessionLocal()
    logs = db.query(AuditLog).filter(AuditLog.user_id == prof_id).all()
    assert len(logs) > 0
    actions = [l.action for l in logs]
    assert "publish_material" in actions

    # Check audit log API
    # 1. As lecturer
    log_res = client.get("/courses/audit-logs", headers=LH)
    assert log_res.status_code == 200
    assert len(log_res.json()) > 0

    # 2. As student
    SH, _ = _user(client, inst, H, "student@u.edu", "student", "S1")
    student_res = client.get("/courses/audit-logs", headers=SH)
    assert student_res.status_code == 403
    db.close()
