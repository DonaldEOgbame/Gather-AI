from app.notifier import get_notifier


def _admin(client):
    inst = client.post(
        "/courses/institutions",
        json={"name": "U", "join_code": "JC-REG", "timezone": "UTC"},
    ).json()["id"]
    client.post(
        "/auth/bootstrap",
        params={
            "institution_id": inst,
            "email": "admin@u.edu",
            "password": "password123",
        },
    )
    tok = client.post(
        "/auth/login",
        data={"username": "admin@u.edu", "password": "password123"},
    )
    return inst, {"authorization": f"Bearer {tok.json()['access_token']}"}


def _student(client, inst, admin_headers):
    client.post(
        "/auth/roster-import",
        headers=admin_headers,
        json={
            "institution_id": inst,
            "rows": [
                {
                    "email": "student@u.edu",
                    "matric_or_staff_id": "S1",
                    "global_role": "student",
                }
            ],
        },
    )
    token = next(
        m.body.split("token: ")[-1].strip()
        for m in reversed(get_notifier().outbox)
        if m.to == "student@u.edu" and "token: " in m.body
    )
    client.post("/auth/activate", json={"token": token, "password": "password123"})
    tok = client.post(
        "/auth/login",
        data={"username": "student@u.edu", "password": "password123"},
    )
    return {"authorization": f"Bearer {tok.json()['access_token']}"}


def test_student_registration_lists_unenrolled_semester_offerings(client):
    inst, admin_headers = _admin(client)
    semester = client.post(
        "/courses/semesters",
        headers=admin_headers,
        json={"university_id": inst, "name": "2026/2027"},
    ).json()
    department = client.post(
        "/courses/departments",
        headers=admin_headers,
        json={"university_id": inst, "name": "Computer Science"},
    ).json()
    offering = client.post(
        "/courses",
        headers=admin_headers,
        json={
            "semester_id": semester["id"],
            "department_id": department["id"],
            "code": "CSC401",
            "title": "Algorithms",
            "credit_units": 3,
        },
    ).json()
    student_headers = _student(client, inst, admin_headers)

    available = client.get(
        f"/registration/available-offerings/{semester['id']}",
        headers=student_headers,
    )

    assert available.status_code == 200
    assert available.json()[0]["id"] == offering["id"]
    assert available.json()[0]["code"] == "CSC401"
    assert available.json()[0]["enrollment_status"] == "unenrolled"

    submitted = client.post(
        "/registration",
        headers=student_headers,
        json={"semester_id": semester["id"], "offering_ids": [offering["id"]]},
    )
    assert submitted.status_code == 201

    available_after_submit = client.get(
        f"/registration/available-offerings/{semester['id']}",
        headers=student_headers,
    )
    assert available_after_submit.status_code == 200
    assert available_after_submit.json()[0]["enrollment_status"] == "advisor_pending"
