from httpx import AsyncClient

from conftest import auth_headers, register_user


async def test_focus_defaults_to_highest_priority_active_department(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])

    await client.post("/api/departments", json={"name": "Coding", "priority": 2}, headers=headers)
    forex = (await client.post("/api/departments", json={"name": "Forex", "priority": 1}, headers=headers)).json()

    res = await client.get("/api/focus", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["is_manual_override"] is False
    assert body["department"]["id"] == forex["id"]


async def test_manual_override_pins_focus_regardless_of_priority(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])

    coding = (await client.post("/api/departments", json={"name": "Coding", "priority": 2}, headers=headers)).json()
    await client.post("/api/departments", json={"name": "Forex", "priority": 1}, headers=headers)

    res = await client.patch(
        "/api/focus", json={"department_id": coding["id"], "note": "Deep in backend work"}, headers=headers
    )
    assert res.status_code == 200
    body = res.json()
    assert body["is_manual_override"] is True
    assert body["department"]["id"] == coding["id"]
    assert body["note"] == "Deep in backend work"

    # Overriding focus must never change department priority values themselves.
    departments = (await client.get("/api/departments", headers=headers)).json()
    coding_after = next(d for d in departments if d["id"] == coding["id"])
    assert coding_after["priority"] == 2


async def test_clearing_override_reverts_to_auto_derived(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])

    coding = (await client.post("/api/departments", json={"name": "Coding", "priority": 2}, headers=headers)).json()
    forex = (await client.post("/api/departments", json={"name": "Forex", "priority": 1}, headers=headers)).json()

    await client.patch("/api/focus", json={"department_id": coding["id"]}, headers=headers)
    res = await client.delete("/api/focus/override", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["is_manual_override"] is False
    assert body["department"]["id"] == forex["id"]


async def test_override_cannot_point_at_another_users_department(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    coding = (await client.post("/api/departments", json={"name": "Coding"}, headers=headers)).json()

    other_user = await register_user(client)
    other_headers = auth_headers(other_user["access_token"])
    res = await client.patch("/api/focus", json={"department_id": coding["id"]}, headers=other_headers)
    assert res.status_code == 404
