"""Cross-user authorization matrix: any access to another user's resource must return 404, never 403,
so unauthorized requests can't even infer that the resource exists.
"""

from httpx import AsyncClient

from conftest import auth_headers, register_user


async def _make_user_with_full_setup(client: AsyncClient) -> dict:
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    department = (await client.post("/api/departments", json={"name": "Coding"}, headers=headers)).json()
    goal = (
        await client.post(
            f"/api/departments/{department['id']}/goals", json={"name": "Ship software"}, headers=headers
        )
    ).json()
    roadmap = (await client.post(f"/api/departments/{department['id']}/roadmaps", json={"name": "R"}, headers=headers)).json()
    item = (await client.post(f"/api/roadmaps/{roadmap['id']}/items", json={"name": "Item"}, headers=headers)).json()
    skill = (await client.post(f"/api/departments/{department['id']}/skills", json={"name": "Python"}, headers=headers)).json()
    milestone = (await client.post(f"/api/departments/{department['id']}/milestones", json={"name": "MVP"}, headers=headers)).json()
    project = (await client.post(f"/api/departments/{department['id']}/projects", json={"name": "Proj"}, headers=headers)).json()
    task = (await client.post(f"/api/projects/{project['id']}/tasks", json={"name": "Task"}, headers=headers)).json()
    resource = (await client.post("/api/resources", json={"type": "url", "title": "Res"}, headers=headers)).json()
    experiment = (await client.post("/api/experiments", json={"name": "Exp"}, headers=headers)).json()
    return {
        "user": user, "headers": headers, "department": department, "goal": goal,
        "roadmap": roadmap, "item": item, "skill": skill, "milestone": milestone,
        "project": project, "task": task, "resource": resource, "experiment": experiment,
    }


async def test_user_cannot_access_another_users_department(client: AsyncClient):
    owner = await _make_user_with_full_setup(client)
    other = await register_user(client)
    other_headers = auth_headers(other["access_token"])
    dep_id = owner["department"]["id"]

    assert (await client.get(f"/api/departments/{dep_id}", headers=other_headers)).status_code == 404
    assert (await client.patch(f"/api/departments/{dep_id}", json={"name": "Hijacked"}, headers=other_headers)).status_code == 404
    assert (await client.delete(f"/api/departments/{dep_id}", headers=other_headers)).status_code == 404
    assert (await client.get(f"/api/departments/{dep_id}/changes", headers=other_headers)).status_code == 404


async def test_user_cannot_access_another_users_goal(client: AsyncClient):
    owner = await _make_user_with_full_setup(client)
    other = await register_user(client)
    other_headers = auth_headers(other["access_token"])
    goal_id = owner["goal"]["id"]

    assert (await client.get(f"/api/goals/{goal_id}", headers=other_headers)).status_code == 404
    assert (await client.patch(f"/api/goals/{goal_id}", json={"name": "Hijacked"}, headers=other_headers)).status_code == 404
    assert (await client.delete(f"/api/goals/{goal_id}", headers=other_headers)).status_code == 404


async def test_user_cannot_access_another_users_roadmap(client: AsyncClient):
    owner = await _make_user_with_full_setup(client)
    other = await register_user(client)
    other_headers = auth_headers(other["access_token"])

    assert (await client.get(f"/api/roadmaps/{owner['roadmap']['id']}", headers=other_headers)).status_code == 404
    assert (await client.patch(f"/api/roadmaps/{owner['roadmap']['id']}", json={"name": "X"}, headers=other_headers)).status_code == 404
    assert (await client.delete(f"/api/roadmaps/{owner['roadmap']['id']}", headers=other_headers)).status_code == 404


async def test_user_cannot_access_another_users_roadmap_item(client: AsyncClient):
    owner = await _make_user_with_full_setup(client)
    other = await _make_user_with_full_setup(client)

    assert (await client.get(f"/api/roadmap-items/{owner['item']['id']}", headers=other["headers"])).status_code == 404
    assert (await client.patch(f"/api/roadmap-items/{owner['item']['id']}", json={"name": "X"}, headers=other["headers"])).status_code == 404
    assert (await client.delete(f"/api/roadmap-items/{owner['item']['id']}", headers=other["headers"])).status_code == 404
    # Cross-user prerequisite must also fail
    assert (await client.post(
        f"/api/roadmap-items/{other['item']['id']}/prerequisites",
        json={"prerequisite_item_id": owner["item"]["id"]},
        headers=other["headers"],
    )).status_code == 404


async def test_user_cannot_access_another_users_skill(client: AsyncClient):
    owner = await _make_user_with_full_setup(client)
    other = await register_user(client)
    other_headers = auth_headers(other["access_token"])

    assert (await client.get(f"/api/skills/{owner['skill']['id']}", headers=other_headers)).status_code == 404
    assert (await client.patch(f"/api/skills/{owner['skill']['id']}", json={"name": "X"}, headers=other_headers)).status_code == 404
    assert (await client.delete(f"/api/skills/{owner['skill']['id']}", headers=other_headers)).status_code == 404


async def test_user_cannot_access_another_users_milestone(client: AsyncClient):
    owner = await _make_user_with_full_setup(client)
    other = await register_user(client)
    other_headers = auth_headers(other["access_token"])

    assert (await client.get(f"/api/milestones/{owner['milestone']['id']}", headers=other_headers)).status_code == 404
    assert (await client.patch(f"/api/milestones/{owner['milestone']['id']}", json={"name": "X"}, headers=other_headers)).status_code == 404
    assert (await client.delete(f"/api/milestones/{owner['milestone']['id']}", headers=other_headers)).status_code == 404


async def test_user_cannot_access_another_users_project(client: AsyncClient):
    owner = await _make_user_with_full_setup(client)
    other = await register_user(client)
    other_headers = auth_headers(other["access_token"])

    assert (await client.get(f"/api/projects/{owner['project']['id']}", headers=other_headers)).status_code == 404
    assert (await client.patch(f"/api/projects/{owner['project']['id']}", json={"name": "X"}, headers=other_headers)).status_code == 404
    assert (await client.delete(f"/api/projects/{owner['project']['id']}", headers=other_headers)).status_code == 404


async def test_user_cannot_access_another_users_task(client: AsyncClient):
    owner = await _make_user_with_full_setup(client)
    other = await register_user(client)
    other_headers = auth_headers(other["access_token"])

    assert (await client.get(f"/api/tasks/{owner['task']['id']}", headers=other_headers)).status_code == 404
    assert (await client.patch(f"/api/tasks/{owner['task']['id']}", json={"name": "X"}, headers=other_headers)).status_code == 404
    assert (await client.delete(f"/api/tasks/{owner['task']['id']}", headers=other_headers)).status_code == 404


async def test_user_cannot_access_another_users_resource(client: AsyncClient):
    owner = await _make_user_with_full_setup(client)
    other = await register_user(client)
    other_headers = auth_headers(other["access_token"])

    assert (await client.get(f"/api/resources/{owner['resource']['id']}", headers=other_headers)).status_code == 404
    assert (await client.patch(f"/api/resources/{owner['resource']['id']}", json={"title": "X"}, headers=other_headers)).status_code == 404
    assert (await client.delete(f"/api/resources/{owner['resource']['id']}", headers=other_headers)).status_code == 404


async def test_user_cannot_access_another_users_experiment(client: AsyncClient):
    owner = await _make_user_with_full_setup(client)
    other = await register_user(client)
    other_headers = auth_headers(other["access_token"])

    assert (await client.get(f"/api/experiments/{owner['experiment']['id']}", headers=other_headers)).status_code == 404
    assert (await client.patch(f"/api/experiments/{owner['experiment']['id']}", json={"name": "X"}, headers=other_headers)).status_code == 404
    assert (await client.delete(f"/api/experiments/{owner['experiment']['id']}", headers=other_headers)).status_code == 404
    assert (await client.post(f"/api/experiments/{owner['experiment']['id']}/status", json={"status": "reject"}, headers=other_headers)).status_code == 404
