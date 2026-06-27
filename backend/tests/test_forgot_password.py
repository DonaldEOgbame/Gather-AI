"""Design 04 'Forgot?' — public self-service password reset."""

from app.notifier import get_notifier


def _institution(client, join_code="FP-1"):
    return client.post(
        "/courses/institutions",
        json={"name": "U", "join_code": join_code, "timezone": "UTC"},
    ).json()["id"]


def _admin(client, inst):
    client.post(
        "/auth/bootstrap",
        params={"institution_id": inst, "email": "admin@u.edu", "password": "password123"},
    )
    tok = client.post("/auth/login", data={"username": "admin@u.edu", "password": "password123"})
    return {"authorization": f"Bearer {tok.json()['access_token']}"}


def _active_user(client, inst, H, email="ada@u.edu"):
    get_notifier().outbox = [m for m in get_notifier().outbox if m.to != email]
    client.post(
        "/auth/roster-import",
        headers=H,
        json={"institution_id": inst, "rows": [{"email": email, "matric_or_staff_id": "S1", "global_role": "student"}]},
    )
    token = next(m.body.split("token: ")[-1].strip()
                 for m in reversed(get_notifier().outbox) if m.to == email and "token: " in m.body)
    client.post("/auth/activate", json={"token": token, "password": "password123"})
    return email


def test_forgot_then_reset_flow(client):
    inst = _institution(client)
    H = _admin(client, inst)
    email = _active_user(client, inst, H)

    # request a reset (token surfaced for test parity)
    r = client.post("/auth/forgot-password", json={"email": email})
    assert r.status_code == 200 and r.json()["status"] == "reset_sent"
    reset_token = r.json()["reset_token"]
    assert reset_token

    # complete the reset
    rr = client.post("/auth/reset-password", json={"token": reset_token, "password": "newpass456"})
    assert rr.status_code == 200

    # old password no longer works; new one does
    assert client.post("/auth/login", data={"username": email, "password": "password123"}).status_code == 401
    assert client.post("/auth/login", data={"username": email, "password": "newpass456"}).status_code == 200

    # token is single-use
    again = client.post("/auth/reset-password", json={"token": reset_token, "password": "another789"})
    assert again.status_code == 400


def test_forgot_unknown_email_is_silent(client):
    # Always 200, never reveals whether the address exists, and issues no token.
    r = client.post("/auth/forgot-password", json={"email": "nobody@nowhere.edu"})
    assert r.status_code == 200
    assert r.json()["status"] == "reset_sent"
    assert r.json()["reset_token"] is None


def test_reset_with_bad_token_400(client):
    r = client.post("/auth/reset-password", json={"token": "not-a-real-token", "password": "whatever12"})
    assert r.status_code == 400
