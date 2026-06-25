"""Module 6 — identity & onboarding flows."""

from app.notifier import get_notifier


def _last_token(substr: str) -> str:
    for m in reversed(get_notifier().outbox):
        if substr in m.body:
            return m.body.split(substr)[-1].strip()
    raise AssertionError(f"no outbox message containing {substr!r}")


def _institution(client, join_code="ADUN-2026"):
    r = client.post(
        "/courses/institutions",
        json={"name": "Aduna U", "join_code": join_code, "timezone": "Africa/Lagos"},
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _admin_headers(client, inst_id):
    client.post(
        "/auth/bootstrap",
        params={"institution_id": inst_id, "email": "admin@aduna.edu", "password": "password123"},
    )
    tok = client.post("/auth/login", data={"username": "admin@aduna.edu", "password": "password123"})
    return {"authorization": f"Bearer {tok.json()['access_token']}"}, tok.json()["refresh_token"]


def test_bootstrap_is_one_time(client):
    inst = _institution(client)
    assert client.post(
        "/auth/bootstrap",
        params={"institution_id": inst, "email": "a@b.c", "password": "password123"},
    ).status_code == 201
    # second bootstrap for same institution is refused
    assert client.post(
        "/auth/bootstrap",
        params={"institution_id": inst, "email": "x@y.z", "password": "password123"},
    ).status_code == 409


def test_roster_import_then_activate(client):
    inst = _institution(client)
    H, _ = _admin_headers(client, inst)
    r = client.post(
        "/auth/roster-import",
        headers=H,
        json={
            "institution_id": inst,
            "rows": [
                {
                    "email": "prof@aduna.edu",
                    "full_name": "Jane",
                    "title": "Prof.",
                    "matric_or_staff_id": "STAFF-1",
                    "global_role": "lecturer",
                }
            ],
        },
    )
    assert r.json() == {"invited": 1, "skipped_existing": 0, "failed": []}
    # invited user can't log in yet
    assert client.post(
        "/auth/login", data={"username": "prof@aduna.edu", "password": "whatever1"}
    ).status_code == 401
    token = _last_token("token: ")
    act = client.post("/auth/activate", json={"token": token, "password": "lecturer123"})
    assert act.status_code == 200 and act.json()["status"] == "active"
    assert client.post(
        "/auth/login", data={"username": "prof@aduna.edu", "password": "lecturer123"}
    ).status_code == 200


def test_self_register_otp_match(client):
    inst = _institution(client)
    H, _ = _admin_headers(client, inst)
    client.post(
        "/auth/roster-import",
        headers=H,
        json={
            "institution_id": inst,
            "rows": [
                {"email": "stu@aduna.edu", "matric_or_staff_id": "MAT-100", "global_role": "student"}
            ],
        },
    )
    sr = client.post(
        "/auth/self-register",
        json={
            "join_code": "ADUN-2026",
            "matric_or_staff_id": "MAT-100",
            "email": "stu@aduna.edu",
            "requested_role": "student",
        },
    )
    assert sr.json()["status"] == "otp_sent"
    code = _last_token("Code: ")
    v = client.post(
        "/auth/verify-otp", json={"email": "stu@aduna.edu", "code": code, "password": "student123"}
    )
    assert v.status_code == 200 and v.json()["status"] == "active"
    # wrong code rejected
    client.post(
        "/auth/self-register",
        json={
            "join_code": "ADUN-2026",
            "matric_or_staff_id": "MAT-100",
            "email": "stu@aduna.edu",
            "requested_role": "student",
        },
    )
    assert client.post(
        "/auth/verify-otp",
        json={"email": "stu@aduna.edu", "code": "000000", "password": "student123"},
    ).status_code == 400


def test_self_register_no_match_goes_to_approvals(client):
    inst = _institution(client)
    H, _ = _admin_headers(client, inst)
    nr = client.post(
        "/auth/self-register",
        json={
            "join_code": "ADUN-2026",
            "matric_or_staff_id": "UNKNOWN-9",
            "email": "ghost@aduna.edu",
            "requested_role": "student",
        },
    )
    assert nr.json()["status"] == "pending_approval"
    pend = client.get("/auth/pending-approvals", headers=H).json()
    assert len(pend) == 1 and pend[0]["email"] == "ghost@aduna.edu"
    appr = client.post(f"/auth/pending-approvals/{pend[0]['id']}", headers=H, json={"approve": True})
    assert appr.json()["status"] == "approved"
    assert client.get("/auth/pending-approvals", headers=H).json() == []


def test_sessions_refresh_and_remote_logout(client):
    inst = _institution(client)
    H, refresh = _admin_headers(client, inst)
    assert client.post("/auth/refresh", json={"refresh_token": refresh}).status_code == 200
    sessions = client.get("/auth/sessions", headers=H).json()
    assert len(sessions) >= 1
    sid = sessions[0]["id"]
    assert client.delete(f"/auth/sessions/{sid}", headers=H).status_code == 204
    # revoked refresh token no longer works
    assert client.post("/auth/refresh", json={"refresh_token": refresh}).status_code == 401
