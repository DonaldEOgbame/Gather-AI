import httpx
import sqlite3
import os

API_URL = "http://localhost:8000"

def cleanup_db():
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gather.db")
    if os.path.exists(db_path):
        print(f"Cleaning up previous enrollment for student@aduna.edu in {db_path}...")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM enrollments 
            WHERE student_id = (SELECT id FROM users WHERE email = 'student@aduna.edu')
        """)
        conn.commit()
        conn.close()
        print("Cleanup done.")

def main():
    cleanup_db()
    print("--- Starting UniPortal Gaps Solutions E2E Verification ---")

    # 1. Log in as Lecturer
    print("\n1. Logging in as Lecturer...")
    res = httpx.post(
        f"{API_URL}/auth/login",
        data={"username": "lecturer@aduna.edu", "password": "password123"},
        params={"device_name": "Test Script"}
    )
    assert res.status_code == 200, res.text
    lecturer_token = res.json()["access_token"]
    lecturer_headers = {"authorization": f"Bearer {lecturer_token}"}
    print("SUCCESS: Lecturer logged in.")

    # 2. Get Courses
    print("\n2. Getting assigned courses...")
    res = httpx.get(f"{API_URL}/courses", headers=lecturer_headers)
    assert res.status_code == 200, res.text
    courses = res.json()
    assert len(courses) > 0, "No courses found"
    course = courses[0]
    course_id = course["id"]
    print(f"SUCCESS: Course found: {course['code']} (ID: {course_id}), default enrollment mode: {course.get('enrollment_mode')}")

    # 3. Update Course Enrollment Mode to 'code'
    print("\n3. Updating enrollment mode to 'code'...")
    res = httpx.patch(
        f"{API_URL}/courses/{course_id}/enrollment-mode",
        headers=lecturer_headers,
        json={"enrollment_mode": "code"}
    )
    assert res.status_code == 200, res.text
    assert res.json()["enrollment_mode"] == "code"
    print("SUCCESS: Course enrollment mode is now 'code'.")

    # 4. Generate Join Code
    print("\n4. Generating course join code...")
    res = httpx.post(
        f"{API_URL}/courses/{course_id}/join-code",
        headers=lecturer_headers,
        json={"expires_in_hours": 24, "max_uses": 10}
    )
    assert res.status_code == 200, res.text
    join_code = res.json()["code"]
    print(f"SUCCESS: Join code generated: {join_code}")

    # 5. Log in as Student
    print("\n5. Logging in as Student...")
    res = httpx.post(
        f"{API_URL}/auth/login",
        data={"username": "student@aduna.edu", "password": "password123"},
        params={"device_name": "Test Student Device"}
    )
    assert res.status_code == 200, res.text
    student_token = res.json()["access_token"]
    student_headers = {"authorization": f"Bearer {student_token}"}
    print("SUCCESS: Student logged in.")

    # 6. Enroll Student via Join Code
    print("\n6. Enrolling student using join code...")
    res = httpx.post(
        f"{API_URL}/courses/{course_id}/enroll",
        headers=student_headers,
        json={"code": join_code}
    )
    assert res.status_code == 200, res.text
    print(f"SUCCESS: Student enrolled via code. Status: {res.json().get('status')}")

    # 7. Update Course Enrollment Mode to 'approval'
    print("\n7. Updating enrollment mode to 'approval'...")
    res = httpx.patch(
        f"{API_URL}/courses/{course_id}/enrollment-mode",
        headers=lecturer_headers,
        json={"enrollment_mode": "approval"}
    )
    assert res.status_code == 200, res.text
    assert res.json()["enrollment_mode"] == "approval"
    print("SUCCESS: Course enrollment mode is now 'approval'.")

    # 8. Create a Timetable Session (admin)
    print("\n8. Creating timetable session for course...")
    # Log in as Admin to perform timetable writes
    res_admin = httpx.post(
        f"{API_URL}/auth/login",
        data={"username": "admin@aduna.edu", "password": "password123"},
        params={"device_name": "Test Script"}
    )
    assert res_admin.status_code == 200, res_admin.text
    admin_headers = {"authorization": f"Bearer {res_admin.json()['access_token']}"}

    res = httpx.post(
        f"{API_URL}/timetable/course/{course_id}",
        headers=admin_headers,
        json={
            "weekday": 2, # Wednesday
            "start_time": "14:00",
            "end_time": "15:30",
            "room": "Lecture Theater 3"
        }
    )
    assert res.status_code == 200, res.text
    slot_id = res.json()["id"]
    print(f"SUCCESS: Timetable slot created. ID: {slot_id}")

    # 9. Get Today's Timetable (student)
    print("\n9. Getting student daily timetable...")
    res = httpx.get(f"{API_URL}/timetable/today", headers=student_headers)
    assert res.status_code == 200, res.text
    print(f"SUCCESS: Today's schedule size: {len(res.json())}")

    # 10. Post Lecturer Announcement
    print("\n10. Posting course announcement...")
    res = httpx.post(
        f"{API_URL}/courses/{course_id}/announcements",
        headers=lecturer_headers,
        json={
            "title": "Exam Prep session",
            "body": "Join us tomorrow at 2pm for prep.",
            "pinned": True,
            "send_push": True
        }
    )
    assert res.status_code == 200, res.text
    ann_id = res.json()["id"]
    print(f"SUCCESS: Announcement posted: {res.json()['title']} (ID: {ann_id})")

    # 11. Student List & Read Announcement
    print("\n11. Listing announcements and marking read as Student...")
    res = httpx.get(f"{API_URL}/courses/{course_id}/announcements", headers=student_headers)
    assert res.status_code == 200, res.text
    anns = res.json()
    assert len(anns) > 0, "No announcements found"
    
    # Mark read
    res = httpx.post(f"{API_URL}/courses/announcements/{ann_id}/read", headers=student_headers)
    assert res.status_code == 200, res.text
    print("SUCCESS: Announcement listed and marked read.")

    # 12. Upload Restricted Material
    print("\n12. Uploading restricted material (View-only)...")
    files = {"file": ("confidential_lecture.pdf", b"Secret study guide", "application/pdf")}
    # We will pass restriction = view-only
    data = {
        "course_id": course_id,
        "week": 2,
        "title": "Confidential Guide",
        "restriction": "view-only" # backend should receive and parse form parameters
    }
    res = httpx.post(
        f"{API_URL}/materials",
        headers=lecturer_headers,
        data=data,
        files=files
    )
    assert res.status_code == 201, res.text
    material = res.json()
    material_id = material["id"]
    assert material["restriction"] == "view-only"
    print(f"SUCCESS: Uploaded restricted material: {material['title']} (Restriction: {material['restriction']})")

    # Publish it
    res = httpx.post(
        f"{API_URL}/materials/{material_id}/publish",
        headers=lecturer_headers,
        json={"release_at": None}
    )
    assert res.status_code == 200, res.text

    # 13. Student Reports the File
    print("\n13. Student reporting the file...")
    res = httpx.post(
        f"{API_URL}/materials/{material_id}/report",
        headers=student_headers,
        json={"reason": "blurry pages", "note": "PDF is corrupted or has low quality."}
    )
    assert res.status_code == 200, res.text
    report_id = res.json()["id"]
    print(f"SUCCESS: Report submitted. ID: {report_id}")

    # 14. Lecturer Reviews and Resolves Report
    print("\n14. Lecturer reviewing and resolving report...")
    res = httpx.get(f"{API_URL}/courses/{course_id}/reports", headers=lecturer_headers)
    assert res.status_code == 200, res.text
    reports = res.json()
    assert any(r["id"] == report_id for r in reports), "Report not listed"
    
    # Resolve
    res = httpx.patch(
        f"{API_URL}/reports/{report_id}/resolve",
        headers=lecturer_headers,
        json={"status": "resolved"}
    )
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "resolved"
    print("SUCCESS: Report successfully reviewed and resolved by Lecturer.")

    # 15. Personal Backup Upload and Retrieval
    print("\n15. Personal backup sync check...")
    manifest = '{"files": [{"sha256": "abc123xyz", "path": "notes.pdf"}]}'
    res = httpx.put(
        f"{API_URL}/backup/manifest",
        headers=student_headers,
        json={"manifest_blob": manifest}
    )
    assert res.status_code == 200, res.text

    # Retrieve manifest
    res = httpx.get(f"{API_URL}/backup/manifest", headers=student_headers)
    assert res.status_code == 200, res.text
    assert res.json()["manifest_blob"] == manifest
    print("SUCCESS: Personal library encrypted backup successfully synced.")

    print("\n--- Gaps Solutions Verification Completed Successfully ---")

if __name__ == "__main__":
    main()
