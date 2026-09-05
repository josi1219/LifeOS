from httpx import AsyncClient

from conftest import auth_headers, register_user


async def _create_department(client: AsyncClient, headers: dict) -> dict:
    res = await client.post("/api/departments", json={"name": "Coding"}, headers=headers)
    return res.json()


async def test_create_goal_preserves_why_and_success_definition(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    department = await _create_department(client, headers)

    res = await client.post(
        f"/api/departments/{department['id']}/goals",
        json={
            "name": "Become a backend engineer",
            "why": "Build and ship software independently",
            "success_definition": "Can design, build, test, and deploy a production backend",
        },
        headers=headers,
    )
    assert res.status_code == 201
    goal = res.json()
    assert goal["why"] == "Build and ship software independently"
    assert goal["success_definition"] == "Can design, build, test, and deploy a production backend"


async def test_changing_goal_records_history_and_keeps_previous_value(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    department = await _create_department(client, headers)
    goal = (
        await client.post(
            f"/api/departments/{department['id']}/goals",
            json={"name": "Become a backend engineer", "why": "Original why"},
            headers=headers,
        )
    ).json()

    res = await client.patch(f"/api/goals/{goal['id']}", json={"why": "Updated why"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["why"] == "Updated why"

    changes = (await client.get(f"/api/goals/{goal['id']}/changes", headers=headers)).json()
    assert len(changes) == 1
    assert changes[0]["field_name"] == "why"
    assert changes[0]["previous_value"] == "Original why"
    assert changes[0]["new_value"] == "Updated why"


async def test_goal_requires_department_ownership_to_create(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    department = await _create_department(client, headers)

    other_user = await register_user(client)
    other_headers = auth_headers(other_user["access_token"])

    res = await client.post(
        f"/api/departments/{department['id']}/goals", json={"name": "Steal this goal"}, headers=other_headers
    )
    assert res.status_code == 404
