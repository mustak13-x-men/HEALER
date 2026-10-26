def test_chatbot_emergency_and_rag_fallback(client):
    # 1. Login
    login_res = client.post("/api/auth/login", json={"email": "patient@healer.health", "password": "Patient@123456"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test emergency red-flag detection (e.g. chest pain)
    emergency_res = client.post("/api/chat", json={"message": "I have sudden severe chest pain and cannot breathe"}, headers=headers)
    assert emergency_res.status_code == 200
    em_data = emergency_res.json()
    assert em_data["is_emergency"] is True
    assert "EMERGENCY" in em_data["reply"]
    assert "911" in em_data["reply"]
    assert len(em_data["sources"]) > 0

    # 3. Test non-emergency health inquiry with RAG citation
    inquiry_res = client.post("/api/chat", json={"message": "What is normal blood pressure and how to manage hypertension?"}, headers=headers)
    assert inquiry_res.status_code == 200
    inq_data = inquiry_res.json()
    assert inq_data["is_emergency"] is False
    assert len(inq_data["sources"]) > 0
    assert "Disclaimer" in inq_data["disclaimer"]
    assert inq_data["conversation_id"] is not None

    # 4. Check conversation history
    conv_id = inq_data["conversation_id"]
    hist_res = client.get(f"/api/chat/conversations/{conv_id}", headers=headers)
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert len(hist_data["messages"]) >= 2
