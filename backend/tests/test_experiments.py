from httpx import AsyncClient

from conftest import auth_headers, register_user


async def test_create_and_list_experiments(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])

    res = await client.post(
        "/api/experiments",
        json={"name": "Try Rust", "purpose": "Explore systems programming"},
        headers=headers,
    )
    assert res.status_code == 201
    assert res.json()["name"] == "Try Rust"
    assert res.json()["status"] == "exploring"

    list_res = await client.get("/api/experiments", headers=headers)
    assert len(list_res.json()) == 1


async def test_status_transition(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    exp = (await client.post("/api/experiments", json={"name": "Try Rust"}, headers=headers)).json()

    # exploring -> continue
    res = await client.post(f"/api/experiments/{exp['id']}/status", json={"status": "continue"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "continue"

    # continue -> promote
    res = await client.post(f"/api/experiments/{exp['id']}/status", json={"status": "promote"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "promote"
    assert res.json()["completed_at"] is not None


async def test_cannot_transition_from_terminal_status(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    exp = (await client.post("/api/experiments", json={"name": "X"}, headers=headers)).json()

    await client.post(f"/api/experiments/{exp['id']}/status", json={"status": "reject"}, headers=headers)

    # reject is terminal — should fail
    res = await client.post(f"/api/experiments/{exp['id']}/status", json={"status": "exploring"}, headers=headers)
    assert res.status_code == 422


async def test_update_experiment(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    exp = (await client.post("/api/experiments", json={"name": "E"}, headers=headers)).json()

    res = await client.patch(f"/api/experiments/{exp['id']}", json={"result": "Learned a lot"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["result"] == "Learned a lot"


async def test_delete_experiment(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    exp = (await client.post("/api/experiments", json={"name": "E"}, headers=headers)).json()

    assert (await client.delete(f"/api/experiments/{exp['id']}", headers=headers)).status_code == 204
    assert (await client.get(f"/api/experiments/{exp['id']}", headers=headers)).status_code == 404
