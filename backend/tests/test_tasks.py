from httpx import AsyncClient

from conftest import auth_headers, register_user


async def _setup(client: AsyncClient) -> tuple[dict, dict]:
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    dep = (await client.post("/api/departments", json={"name": "Coding"}, headers=headers)).json()
    proj = (await client.post(f"/api/departments/{dep['id']}/projects", json={"name": "LifeOS"}, headers=headers)).json()
    return headers, proj


async def test_create_and_list_tasks(client: AsyncClient):
    headers, proj = await _setup(client)

    res = await client.post(
        f"/api/projects/{proj['id']}/tasks",
        json={"name": "Write tests"},
        headers=headers,
    )
    assert res.status_code == 201
    assert res.json()["name"] == "Write tests"
    assert res.json()["status"] == "not_started"

    list_res = await client.get(f"/api/projects/{proj['id']}/tasks", headers=headers)
    assert len(list_res.json()) == 1


async def test_update_task(client: AsyncClient):
    headers, proj = await _setup(client)
    task = (await client.post(f"/api/projects/{proj['id']}/tasks", json={"name": "T"}, headers=headers)).json()

    res = await client.patch(f"/api/tasks/{task['id']}", json={"status": "completed"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "completed"


async def test_delete_task(client: AsyncClient):
    headers, proj = await _setup(client)
    task = (await client.post(f"/api/projects/{proj['id']}/tasks", json={"name": "T"}, headers=headers)).json()

    assert (await client.delete(f"/api/tasks/{task['id']}", headers=headers)).status_code == 204
    assert (await client.get(f"/api/tasks/{task['id']}", headers=headers)).status_code == 404
