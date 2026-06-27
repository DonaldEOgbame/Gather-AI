"""Design 28 (course roster permission toggles) + 18 (revoke other sessions)."""

from app.notifier import get_notifier


def _admin(client):
    inst = client.post(
        "/courses/institutions",
        json={"name": "U", "join_code": "JC-RS", "timezone": "UTC"},
    ).json()["id"]
    client.post(
        "/auth/bootstrap",
        params={"institution_id": inst, "email": "admin@u.edu", "password": "password123"},
    )
    tok = client.post("/auth/login", data={"username": "admin@u.edu", "password": "password123"})
    return inst, {"authorization": f"Bearer {tok.json()['access_token']}"}


def _lecturer(client, inst, H, email):
    get_notifier().outbox = [m for m in get_notifier().outbox if m.to != email]
    client.post(
        "/auth/roster-import",
        headers=H,
        json={"institution_id": inst, "rows": [{"email": email, "matric_or_staff_id": email[:4].upper(), "global_role": "lecturer"}]},
    )
    token = next(m.body.split("token: ")[-1].strip()
                 for m in reversed(get_notifier().outbox) if m.to == email and "token: " in m.body)
    client.post("/auth/activate", json={"token": token, "password": "password123"})
    tok = client.post("/auth/login", data={"username": email, "password": "password123"})
    uid = client.get("/auth/me", headers={"authorization": f"Bearer {tok.json()['access_token']}"}).json()["id"]
    return uid, {"authorization": f"Bearer {tok.json()['access_token']}"}, tok.json()["refresh_token"]


def _offering(client, inst, H):
    sem = client.post("/courses/semesters", headers=H, json={"university_id": inst, "name": "S1"}).json()
    dep = client.post("/courses/departments", headers=H, json={"university_id": inst, "name": "CS"}).json()
    return client.post(
        "/courses",
        headers=H,
        json={"semester_id": sem["id"], "department_id": dep["id"], "code": "CS101", "title": "Intro"},
    ).json()


def test_offering_lecturer_permission_patch(client):
    inst, H = _admin(client)
    off = _offering(client, inst, H)
    uid, _, _ = _lecturer(client, inst, H, "ta@u.edu")

    # add as a TA with no permissions
    add = client.post(
        f"/offerings/{off['id']}/lecturers",
        headers=H,
        json={"lecturer_id": uid, "is_owner": False, "can_publish": False, "can_manage_roster": False},
    )
    assert add.status_code == 201, add.text

    # toggle can_publish on
    patch = client.patch(
        f"/offerings/{off['id']}/lecturers/{uid}",
        headers=H,
        json={"can_publish": True},
    )
    assert patch.status_code == 200, patch.text
    assert patch.json()["can_publish"] is True
    assert patch.json()["can_manage_roster"] is False


def test_revoke_other_sessions(client):
    inst, H = _admin(client)
    uid, H1, _ = _lecturer(client, inst, H, "multi@u.edu")
    # second login = second device/session
    client.post("/auth/login", data={"username": "multi@u.edu", "password": "password123"})

    sessions = client.get("/auth/sessions", headers=H1).json()
    assert len(sessions) >= 2

    r = client.post("/auth/sessions/revoke-others", headers=H1)
    assert r.status_code == 200 and r.json()["revoked"] >= 1

    # the current session still works
    assert client.get("/auth/me", headers=H1).status_code == 200
    remaining = [s for s in client.get("/auth/sessions", headers=H1).json()]
    assert len(remaining) == 1 and remaining[0]["current"] is True
