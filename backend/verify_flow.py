import httpx

API_URL = "http://localhost:8000"

def main():
    print("--- Starting UniPortal End-to-End Verification ---")
    
    # 1. Log in as Lecturer
    print("\n1. Logging in as Lecturer...")
    res = httpx.post(
        f"{API_URL}/auth/login",
        data={"username": "lecturer@aduna.edu", "password": "password123"},
        params={"device_name": "Test Script"}
    )
    if res.status_code != 200:
        print(f"FAILED to login lecturer: {res.text}")
        return
    
    lecturer_token = res.json()["access_token"]
    lecturer_headers = {"authorization": f"Bearer {lecturer_token}"}
    print("SUCCESS: Lecturer logged in.")
    
    # 2. Get courses
    print("\n2. Getting assigned courses...")
    res = httpx.get(f"{API_URL}/courses", headers=lecturer_headers)
    assert res.status_code == 200, res.text
    courses = res.json()
    assert len(courses) > 0, "No courses found"
    course = courses[0]
    course_id = course["id"]
    print(f"SUCCESS: Assigned course found: {course['code']} - {course['title']} (ID: {course_id})")
    
    # 3. Upload a draft material
    print("\n3. Uploading draft material...")
    files = {"file": ("lecture1_intro.pdf", b"Some pdf contents here", "application/pdf")}
    data = {"course_id": course_id, "week": 1, "title": "Intro Lecture"}
    res = httpx.post(
        f"{API_URL}/materials",
        headers=lecturer_headers,
        data=data,
        files=files
    )
    assert res.status_code == 201, res.text
    material = res.json()
    material_id = material["id"]
    assert material["status"] == "draft"
    print(f"SUCCESS: Material uploaded as draft. ID: {material_id}, status: {material['status']}")
    
    # 4. List materials as Lecturer
    print("\n4. Listing materials as Lecturer...")
    res = httpx.get(f"{API_URL}/materials", headers=lecturer_headers, params={"course_id": course_id})
    assert res.status_code == 200, res.text
    mats = res.json()
    assert any(m["id"] == material_id for m in mats), "Uploaded material not listed for lecturer"
    print("SUCCESS: Draft material is visible to teaching staff.")
    
    # 5. Log in as Student
    print("\n5. Logging in as Student...")
    res = httpx.post(
        f"{API_URL}/auth/login",
        data={"username": "student@aduna.edu", "password": "password123"},
        params={"device_name": "Test Script Student"}
    )
    assert res.status_code == 200, res.text
    student_token = res.json()["access_token"]
    student_headers = {"authorization": f"Bearer {student_token}"}
    print("SUCCESS: Student logged in.")
    
    # 6. List materials as Student (draft should be hidden)
    print("\n6. Checking material visibility for Student...")
    res = httpx.get(f"{API_URL}/materials", headers=student_headers, params={"course_id": course_id})
    assert res.status_code == 200, res.text
    student_mats = res.json()
    assert not any(m["id"] == material_id for m in student_mats), "Draft material is visible to student!"
    print("SUCCESS: Draft material is hidden from student.")
    
    # 7. Publish the draft material as Lecturer
    print("\n7. Publishing draft material as Lecturer...")
    res = httpx.post(
        f"{API_URL}/materials/{material_id}/publish",
        headers=lecturer_headers,
        json={"release_at": None}
    )
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "live"
    print("SUCCESS: Material status is now live.")
    
    # 8. List materials as Student (should now be visible)
    print("\n8. Verifying material visibility for Student after publish...")
    res = httpx.get(f"{API_URL}/materials", headers=student_headers, params={"course_id": course_id})
    assert res.status_code == 200, res.text
    student_mats_after = res.json()
    assert any(m["id"] == material_id for m in student_mats_after), "Published material is not visible to student!"
    print("SUCCESS: Published material is now visible to student.")
    
    # 9. Verify Student received notification
    print("\n9. Verifying notifications for Student...")
    res = httpx.get(f"{API_URL}/auth/notifications", headers=student_headers)
    assert res.status_code == 200, res.text
    notifs = res.json()
    assert len(notifs) > 0, "No notifications found"
    new_mat_notif = notifs[0]
    print(f"SUCCESS: Student notification received: '{new_mat_notif['title']}' - '{new_mat_notif['body']}'")
    
    # 10. Check Audit Logs
    print("\n10. Checking lecturer audit logs...")
    res = httpx.get(f"{API_URL}/courses/audit-logs", headers=lecturer_headers)
    assert res.status_code == 200, res.text
    logs = res.json()
    publish_actions = [l for l in logs if l["action"] == "publish_material" and l["target_id"] == material_id]
    assert len(publish_actions) > 0, "No audit log for publishing"
    print(f"SUCCESS: Audit trail recorded: {publish_actions[0]['action']} by user {publish_actions[0]['user_id']}")
    
    print("\n--- E2E Verification Completed Successfully ---")

if __name__ == "__main__":
    main()
