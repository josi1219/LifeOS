from httpx import AsyncClient

from conftest import auth_headers, register_user


async def _setup(client: AsyncClient) -> tuple[dict, dict]:
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    dep = (await client.post("/api/departments", json={"name": "Coding"}, headers=headers)).json()
    return headers, dep


async def test_create_and_list_projects(client: AsyncClient):
    headers, dep = await _setup(client)

    res = await client.post(
        f"/api/departments/{dep['id']}/projects",
        json={"name": "LifeOS", "purpose": "Personal dev system"},
        headers=headers,
    )
    assert res.status_code == 201
    assert res.json()["name"] == "LifeOS"

    list_res = await client.get(f"/api/departments/{dep['id']}/projects", headers=headers)
    assert len(list_res.json()) == 1


async def test_update_project(client: AsyncClient):
    headers, dep = await _setup(client)
    proj = (await client.post(f"/api/departments/{dep['id']}/projects", json={"name": "P"}, headers=headers)).json()

    res = await client.patch(f"/api/projects/{proj['id']}", json={"progress": 30, "repo_url": "https://github.com/test"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["progress"] == 30
    assert res.json()["repo_url"] == "https://github.com/test"


async def test_delete_project(client: AsyncClient):
    headers, dep = await _setup(client)
    proj = (await client.post(f"/api/departments/{dep['id']}/projects", json={"name": "P"}, headers=headers)).json()

    assert (await client.delete(f"/api/projects/{proj['id']}", headers=headers)).status_code == 204
    assert (await client.get(f"/api/projects/{proj['id']}", headers=headers)).status_code == 404


async def test_link_required_skill(client: AsyncClient):
    headers, dep = await _setup(client)
    proj = (await client.post(f"/api/departments/{dep['id']}/projects", json={"name": "P"}, headers=headers)).json()
    skill = (await client.post(f"/api/departments/{dep['id']}/skills", json={"name": "Python"}, headers=headers)).json()

    res = await client.post(f"/api/projects/{proj['id']}/required-skills/{skill['id']}", headers=headers)
    assert res.status_code == 201

    res = await client.delete(f"/api/projects/{proj['id']}/required-skills/{skill['id']}", headers=headers)
    assert res.status_code == 204
