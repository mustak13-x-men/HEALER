import uuid

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_register_and_login(client):
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Test Patient",
        "phone": "+1234567890",
        "date_of_birth": "1995-05-20",
        "gender": "Female",
        "blood_group": "A+"
    }
    # 1. Register
    reg_res = client.post("/api/auth/register", json=payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == unique_email
    assert reg_data["user"]["role"] == "patient"

    # 2. Duplicate registration fails
    dup_res = client.post("/api/auth/register", json=payload)
    assert dup_res.status_code == 400

    # 3. Login
    login_res = client.post("/api/auth/login", json={"email": unique_email, "password": "Password123!"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 4. Access /me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == unique_email
    assert me_data["full_name"] == "Test Patient"
