from httpx import AsyncClient

from conftest import auth_headers, register_user


async def _setup(client: AsyncClient) -> tuple[dict, dict]:
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    dep = (await client.post("/api/departments", json={"name": "Coding"}, headers=headers)).json()
    return headers, dep


async def test_create_and_list_milestones(client: AsyncClient):
    headers, dep = await _setup(client)

    res = await client.post(
        f"/api/departments/{dep['id']}/milestones",
        json={"name": "MVP Launch", "completion_criteria": "All features deployed"},
        headers=headers,
    )
    assert res.status_code == 201
    assert res.json()["name"] == "MVP Launch"

    list_res = await client.get(f"/api/departments/{dep['id']}/milestones", headers=headers)
    assert len(list_res.json()) == 1


async def test_update_milestone(client: AsyncClient):
    headers, dep = await _setup(client)
    ms = (await client.post(f"/api/departments/{dep['id']}/milestones", json={"name": "M"}, headers=headers)).json()

    res = await client.patch(f"/api/milestones/{ms['id']}", json={"progress": 75}, headers=headers)
    assert res.status_code == 200
    assert res.json()["progress"] == 75


async def test_delete_milestone(client: AsyncClient):
    headers, dep = await _setup(client)
    ms = (await client.post(f"/api/departments/{dep['id']}/milestones", json={"name": "M"}, headers=headers)).json()

    assert (await client.delete(f"/api/milestones/{ms['id']}", headers=headers)).status_code == 204
    assert (await client.get(f"/api/milestones/{ms['id']}", headers=headers)).status_code == 404


async def test_link_skill_to_milestone(client: AsyncClient):
    headers, dep = await _setup(client)
    ms = (await client.post(f"/api/departments/{dep['id']}/milestones", json={"name": "M"}, headers=headers)).json()
    skill = (await client.post(f"/api/departments/{dep['id']}/skills", json={"name": "Python"}, headers=headers)).json()

    res = await client.post(f"/api/milestones/{ms['id']}/skills/{skill['id']}", headers=headers)
    assert res.status_code == 201

    res = await client.delete(f"/api/milestones/{ms['id']}/skills/{skill['id']}", headers=headers)
    assert res.status_code == 204
