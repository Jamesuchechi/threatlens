import httpx
import asyncio
import uuid

API_BASE = "http://localhost:8000"

async def test_e2e():
    print("Starting E2E API flow test...")
    user_email = f"e2e_{uuid.uuid4()}@example.com"
    password = "StrongPassword123!"

    async with httpx.AsyncClient() as client:
        # 1. Register
        print(f"Registering user {user_email}...")
        res = await client.post(f"{API_BASE}/auth/register", json={
            "name": "E2E Tester",
            "email": user_email,
            "password": password,
            "industry": "technology",
            "tech_stack": ["React", "Docker"]
        })
        assert res.status_code == 201, f"Register failed: {res.text}"
        token = res.json()["token"]

        # 2. Login
        print("Logging in...")
        res = await client.post(f"{API_BASE}/auth/login", json={
            "email": user_email,
            "password": password
        })
        assert res.status_code == 200, f"Login failed: {res.text}"
        
        headers = {"Authorization": f"Bearer {token}"}

        # 3. View Dashboard Stats
        print("Fetching dashboard stats...")
        res = await client.get(f"{API_BASE}/threats/stats", headers=headers)
        assert res.status_code == 200, f"Stats failed: {res.text}"
        print(f"Stats: {res.json()}")

        # 4. Get Threats (Pagination check)
        print("Fetching threats page 1...")
        res = await client.get(f"{API_BASE}/threats", params={"page": 1, "limit": 10}, headers=headers)
        assert res.status_code == 200, f"Threats failed: {res.text}"
        threats_data = res.json()
        assert len(threats_data["threats"]) > 0, "No threats found"
        print(f"Got {len(threats_data['threats'])} threats out of {threats_data['total']}")

        first_threat_id = threats_data["threats"][0]["id"]

        # 5. Click threat (Get Detail)
        print(f"Fetching threat detail for {first_threat_id}...")
        res = await client.get(f"{API_BASE}/threats/{first_threat_id}", headers=headers)
        assert res.status_code == 200, f"Threat detail failed: {res.text}"
        print(f"Threat detail title: {res.json()['title']}")

        # 6. Check Alerts
        print("Fetching alerts...")
        res = await client.get(f"{API_BASE}/alerts", headers=headers)
        assert res.status_code == 200, f"Alerts failed: {res.text}"
        print(f"Got {len(res.json()['alerts'])} alerts")

        print("✅ E2E Integration test passed!")

if __name__ == "__main__":
    asyncio.run(test_e2e())
