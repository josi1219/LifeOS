from httpx import AsyncClient

from conftest import auth_headers, register_user


async def _setup(client: AsyncClient) -> tuple[dict, dict]:
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    dep = (await client.post("/api/departments", json={"name": "Coding"}, headers=headers)).json()
    return headers, dep


async def test_create_and_list_skills(client: AsyncClient):
    headers, dep = await _setup(client)

    res = await client.post(
        f"/api/departments/{dep['id']}/skills",
        json={"name": "Python", "purpose": "Backend development"},
        headers=headers,
    )
    assert res.status_code == 201
    assert res.json()["name"] == "Python"

    list_res = await client.get(f"/api/departments/{dep['id']}/skills", headers=headers)
    assert len(list_res.json()) == 1


async def test_update_skill(client: AsyncClient):
    headers, dep = await _setup(client)
    skill = (await client.post(f"/api/departments/{dep['id']}/skills", json={"name": "Python"}, headers=headers)).json()

    res = await client.patch(f"/api/skills/{skill['id']}", json={"progress": 50}, headers=headers)
    assert res.status_code == 200
    assert res.json()["progress"] == 50


async def test_delete_skill(client: AsyncClient):
    headers, dep = await _setup(client)
    skill = (await client.post(f"/api/departments/{dep['id']}/skills", json={"name": "Python"}, headers=headers)).json()

    assert (await client.delete(f"/api/skills/{skill['id']}", headers=headers)).status_code == 204
    assert (await client.get(f"/api/skills/{skill['id']}", headers=headers)).status_code == 404


async def test_link_roadmap_item_to_skill(client: AsyncClient):
    headers, dep = await _setup(client)
    skill = (await client.post(f"/api/departments/{dep['id']}/skills", json={"name": "Python"}, headers=headers)).json()
    roadmap = (await client.post(f"/api/departments/{dep['id']}/roadmaps", json={"name": "R"}, headers=headers)).json()
    item = (await client.post(f"/api/roadmaps/{roadmap['id']}/items", json={"name": "Learn basics"}, headers=headers)).json()

    res = await client.post(f"/api/skills/{skill['id']}/roadmap-items/{item['id']}", headers=headers)
    assert res.status_code == 201

    res = await client.delete(f"/api/skills/{skill['id']}/roadmap-items/{item['id']}", headers=headers)
    assert res.status_code == 204
