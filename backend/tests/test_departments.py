from httpx import AsyncClient

from conftest import auth_headers, register_user


async def test_create_and_list_departments(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])

    res = await client.post(
        "/api/departments", json={"name": "Coding", "purpose": "Ship software"}, headers=headers
    )
    assert res.status_code == 201
    department = res.json()
    assert department["name"] == "Coding"
    assert department["priority"] == 1

    list_res = await client.get("/api/departments", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1


async def test_departments_are_scoped_to_owner(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    await client.post("/api/departments", json={"name": "Coding"}, headers=headers)

    other_user = await register_user(client)
    other_headers = auth_headers(other_user["access_token"])
    res = await client.get("/api/departments", headers=other_headers)
    assert res.json() == []


async def test_reorder_priority_persists(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])

    dep_a = (await client.post("/api/departments", json={"name": "Coding"}, headers=headers)).json()
    dep_b = (await client.post("/api/departments", json={"name": "Forex"}, headers=headers)).json()

    reorder_res = await client.patch(
        "/api/departments/reorder", json={"ordered_ids": [dep_b["id"], dep_a["id"]]}, headers=headers
    )
    assert reorder_res.status_code == 200

    list_res = await client.get("/api/departments", headers=headers)
    ordered = list_res.json()
    assert ordered[0]["id"] == dep_b["id"]
    assert ordered[0]["priority"] == 1
    assert ordered[1]["priority"] == 2


async def test_editing_department_records_change_history(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    dep = (await client.post("/api/departments", json={"name": "Coding"}, headers=headers)).json()

    await client.patch(f"/api/departments/{dep['id']}", json={"current_phase": "Backend"}, headers=headers)
    await client.patch(f"/api/departments/{dep['id']}", json={"current_phase": "Databases"}, headers=headers)

    changes_res = await client.get(f"/api/departments/{dep['id']}/changes", headers=headers)
    assert changes_res.status_code == 200
    changes = changes_res.json()
    assert len(changes) == 2
    assert changes[0]["field_name"] == "current_phase"
    assert changes[0]["new_value"] == "Databases"
    assert changes[0]["previous_value"] == "Backend"
    # Both edits must remain recorded — history is never overwritten.
    assert changes[1]["new_value"] == "Backend"


async def test_delete_department(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    dep = (await client.post("/api/departments", json={"name": "Coding"}, headers=headers)).json()

    res = await client.delete(f"/api/departments/{dep['id']}", headers=headers)
    assert res.status_code == 204

    res = await client.get(f"/api/departments/{dep['id']}", headers=headers)
    assert res.status_code == 404
