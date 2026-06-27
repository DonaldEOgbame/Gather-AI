"""Design 18/26 — admin user management + device session controls."""

from app.notifier import get_notifier


def _institution(client, join_code="ADUN-2026"):
    r = client.post(
        "/courses/institutions",
        json={"name": "Aduna U", "join_code": join_code, "timezone": "Africa/Lagos"},
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _admin(client, inst_id):
    client.post(
        "/auth/bootstrap",
        params={"institution_id": inst_id, "email": "admin@aduna.edu", "password": "password123"},
    )
    tok = client.post("/auth/login", data={"username": "admin@aduna.edu", "password": "password123"})
    return {"authorization": f"Bearer {tok.json()['access_token']}"}


def _invite_lecturer(client, H, inst):
    client.post(
        "/auth/roster-import",
        headers=H,
        json={
            "institution_id": inst,
            "rows": [{
                "email": "lec@aduna.edu",
                "full_name": "Grace Hopper",
                "title": "Dr.",
                "matric_or_staff_id": "STAFF-1",
                "global_role": "lecturer",
            }],
        },
    )
    users = client.get("/auth/users?role=lecturer", headers=H).json()
    return users[0]["id"]


def test_admin_user_detail_and_role_change(client):
    inst = _institution(client)
    H = _admin(client, inst)
    uid = _invite_lecturer(client, H, inst)

    # get user detail
    r = client.get(f"/auth/users/{uid}", headers=H)
    assert r.status_code == 200 and r.json()["global_role"] == "lecturer"

    # change role lecturer -> admin
    r = client.patch(f"/auth/users/{uid}/role", headers=H, json={"global_role": "admin"})
    assert r.status_code == 200 and r.json()["global_role"] == "admin"


def test_admin_reset_password_emits_token(client):
    inst = _institution(client)
    H = _admin(client, inst)
    uid = _invite_lecturer(client, H, inst)
    before = len(get_notifier().outbox)
    r = client.post(f"/auth/users/{uid}/reset-password", headers=H)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "reset_sent" and body["reset_token"]
    assert len(get_notifier().outbox) == before + 1


def test_admin_suspend_blocks_login(client):
    inst = _institution(client)
    H = _admin(client, inst)
    uid = _invite_lecturer(client, H, inst)
    # activate the lecturer so they have a password / can log in
    from app.notifier import get_notifier as gn
    token = None
    for m in reversed(gn().outbox):
        if "token: " in m.body:
            token = m.body.split("token: ")[-1].strip()
            break
    client.post("/auth/activate", json={"token": token, "password": "lecturer123"})
    assert client.post("/auth/login", data={"username": "lec@aduna.edu", "password": "lecturer123"}).status_code == 200

    # suspend
    r = client.patch(f"/auth/users/{uid}/status", headers=H, json={"status": "suspended"})
    assert r.status_code == 200 and r.json()["status"] == "suspended"
    assert client.post("/auth/login", data={"username": "lec@aduna.edu", "password": "lecturer123"}).status_code == 403


def test_admin_cannot_change_own_role(client):
    inst = _institution(client)
    H = _admin(client, inst)
    me = client.get("/auth/me", headers=H).json()
    r = client.patch(f"/auth/users/{me['id']}/role", headers=H, json={"global_role": "student"})
    assert r.status_code == 400
