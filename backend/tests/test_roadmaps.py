from httpx import AsyncClient

from conftest import auth_headers, register_user


async def _create_department(client: AsyncClient, headers: dict) -> dict:
    res = await client.post("/api/departments", json={"name": "Coding"}, headers=headers)
    return res.json()


async def test_create_and_list_roadmaps(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    dep = await _create_department(client, headers)

    res = await client.post(
        f"/api/departments/{dep['id']}/roadmaps",
        json={"name": "Backend Roadmap"},
        headers=headers,
    )
    assert res.status_code == 201
    roadmap = res.json()
    assert roadmap["name"] == "Backend Roadmap"
    assert roadmap["department_id"] == dep["id"]

    list_res = await client.get(f"/api/departments/{dep['id']}/roadmaps", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1


async def test_update_roadmap(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    dep = await _create_department(client, headers)
    roadmap = (await client.post(f"/api/departments/{dep['id']}/roadmaps", json={"name": "Old"}, headers=headers)).json()

    res = await client.patch(f"/api/roadmaps/{roadmap['id']}", json={"name": "New"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "New"


async def test_delete_roadmap(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    dep = await _create_department(client, headers)
    roadmap = (await client.post(f"/api/departments/{dep['id']}/roadmaps", json={"name": "R"}, headers=headers)).json()

    res = await client.delete(f"/api/roadmaps/{roadmap['id']}", headers=headers)
    assert res.status_code == 204

    res = await client.get(f"/api/roadmaps/{roadmap['id']}", headers=headers)
    assert res.status_code == 404
