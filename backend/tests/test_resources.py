from httpx import AsyncClient

from conftest import auth_headers, register_user


async def test_create_and_list_resources(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])

    res = await client.post(
        "/api/resources",
        json={"type": "url", "title": "FastAPI Docs", "url_or_path": "https://fastapi.tiangolo.com"},
        headers=headers,
    )
    assert res.status_code == 201
    assert res.json()["title"] == "FastAPI Docs"
    assert res.json()["type"] == "url"

    list_res = await client.get("/api/resources", headers=headers)
    assert len(list_res.json()) == 1


async def test_filter_resources_by_department(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    dep = (await client.post("/api/departments", json={"name": "Coding"}, headers=headers)).json()

    await client.post("/api/resources", json={"type": "url", "title": "A", "department_id": dep["id"]}, headers=headers)
    await client.post("/api/resources", json={"type": "url", "title": "B"}, headers=headers)

    filtered = await client.get(f"/api/resources?department_id={dep['id']}", headers=headers)
    assert len(filtered.json()) == 1
    assert filtered.json()[0]["title"] == "A"


async def test_update_resource(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    r = (await client.post("/api/resources", json={"type": "url", "title": "Old"}, headers=headers)).json()

    res = await client.patch(f"/api/resources/{r['id']}", json={"title": "New"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["title"] == "New"


async def test_delete_resource(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    r = (await client.post("/api/resources", json={"type": "url", "title": "R"}, headers=headers)).json()

    assert (await client.delete(f"/api/resources/{r['id']}", headers=headers)).status_code == 204
    assert (await client.get(f"/api/resources/{r['id']}", headers=headers)).status_code == 404
