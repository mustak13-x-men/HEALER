def test_medication_creation_and_reminder_acknowledgment(client):
    # 1. Login as patient
    login_res = client.post("/api/auth/login", json={"email": "patient@healer.health", "password": "Patient@123456"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a medication with reminder schedules
    med_payload = {
        "name": "Atorvastatin",
        "dosage": "20mg",
        "frequency": "Once daily at bedtime",
        "instructions": "Take with water before sleeping",
        "start_date": "2026-10-26",
        "end_date": "2026-12-31",
        "prescribing_doctor": "Dr. Sarah Jenkins",
        "schedules": [
            {"reminder_time": "21:00", "days_of_week": "0,1,2,3,4,5,6"}
        ]
    }
    create_res = client.post("/api/medications", json=med_payload, headers=headers)
    assert create_res.status_code == 201
    med_data = create_res.json()
    assert med_data["name"] == "Atorvastatin"
    assert len(med_data["schedules"]) == 1

    # 3. List reminders
    reminders_res = client.get("/api/reminders", headers=headers)
    assert reminders_res.status_code == 200
    reminders = reminders_res.json()
    assert len(reminders) > 0
    target_rem = reminders[0]

    # 4. Acknowledge reminder
    ack_res = client.patch(
        f"/api/reminders/{target_rem['id']}/acknowledge",
        json={"status": "acknowledged", "notes": "Taken on time"},
        headers=headers
    )
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "acknowledged"
    assert ack_res.json()["acknowledged_at"] is not None
