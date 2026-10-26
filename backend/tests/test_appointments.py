import uuid
import random

def test_appointment_booking_and_double_booking_prevention(client):
    # 1. Login as seeded patient
    login_res = client.post("/api/auth/login", json={"email": "patient@healer.health", "password": "Patient@123456"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get doctors
    docs_res = client.get("/api/doctors")
    assert docs_res.status_code == 200
    doctors = docs_res.json()
    assert len(doctors) > 0
    doctor_id = doctors[0]["id"]

    # 3. Check slots for a unique random future test date
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    test_date = f"2028-{month:02d}-{day:02d}"
    slots_res = client.get(f"/api/doctors/{doctor_id}/availability?date={test_date}")
    assert slots_res.status_code == 200
    slots = slots_res.json()
    assert len(slots) > 0
    target_slot = slots[0]["time"]

    # 4. Book appointment
    booking_payload = {
        "doctor_id": doctor_id,
        "appointment_date": test_date,
        "start_time": target_slot,
        "reason": "Cardiovascular consultation"
    }
    book_res = client.post("/api/appointments", json=booking_payload, headers=headers)
    assert book_res.status_code == 201
    appt_data = book_res.json()
    assert appt_data["status"] == "confirmed"
    appt_id = appt_data["id"]

    # 5. ATTEMPT DOUBLE BOOKING on the exact same doctor, date, and slot
    dup_book_res = client.post("/api/appointments", json=booking_payload, headers=headers)
    assert dup_book_res.status_code == 409
    assert "already been booked" in dup_book_res.json()["detail"].lower()

    # 6. Verify slot now reflects as unavailable
    slots_after = client.get(f"/api/doctors/{doctor_id}/availability?date={test_date}").json()
    slot_match = next(s for s in slots_after if s["time"] == target_slot)
    assert slot_match["available"] is False

    # 7. Cancel appointment
    cancel_res = client.delete(f"/api/appointments/{appt_id}", headers=headers)
    assert cancel_res.status_code == 200

    # 8. Slot becomes available again
    slots_after_cancel = client.get(f"/api/doctors/{doctor_id}/availability?date={test_date}").json()
    slot_match_2 = next(s for s in slots_after_cancel if s["time"] == target_slot)
    assert slot_match_2["available"] is True

