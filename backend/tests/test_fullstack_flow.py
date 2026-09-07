from httpx import AsyncClient

from tests.conftest import auth_headers, register_user


async def _setup_user_and_department(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    dept_res = await client.post(
        "/api/departments",
        json={"name": "Engineering", "purpose": "Build software", "priority": 1},
        headers=headers,
    )
    assert dept_res.status_code == 201
    return user, headers, dept_res.json()


async def test_top_level_goals_crud(client: AsyncClient):
    user, headers, dept = await _setup_user_and_department(client)

    # 1. Create top-level goal without department_id (auto-assigned)
    res = await client.post(
        "/api/goals",
        json={"name": "Become ML Engineer", "description": "Master deep learning"},
        headers=headers,
    )
    assert res.status_code == 201
    goal = res.json()
    assert goal["name"] == "Become ML Engineer"
    assert goal["department_id"] == dept["id"]
    assert goal["department_name"] == "Engineering"

    # 2. List top-level goals
    list_res = await client.get("/api/goals", headers=headers)
    assert list_res.status_code == 200
    goals = list_res.json()
    assert len(goals) == 1
    assert goals[0]["id"] == goal["id"]


async def test_top_level_milestones_crud(client: AsyncClient):
    user, headers, dept = await _setup_user_and_department(client)

    # Create a goal
    goal = (
        await client.post(
            "/api/goals",
            json={"name": "Frontend Pro"},
            headers=headers,
        )
    ).json()

    # Create a skill
    skill = (
        await client.post(
            f"/api/departments/{dept['id']}/skills",
            json={"name": "React & Vite"},
            headers=headers,
        )
    ).json()

    # Create milestone with deadline and linked skill
    ms_res = await client.post(
        "/api/milestones",
        json={
            "name": "Ship Flow v1",
            "goal_id": goal["id"],
            "completion_date": "2025-04-25",
            "skill_ids": [skill["id"]],
        },
        headers=headers,
    )
    assert ms_res.status_code == 201
    ms = ms_res.json()
    assert ms["name"] == "Ship Flow v1"
    assert ms["completion_date"] == "2025-04-25"
    assert skill["id"] in ms["skill_ids"]
    assert "React & Vite" in ms["skill_names"]

    # List user milestones
    list_res = await client.get("/api/milestones", headers=headers)
    assert list_res.status_code == 200
    milestones = list_res.json()
    assert len(milestones) == 1
    assert milestones[0]["skill_names"] == ["React & Vite"]


async def test_goal_roadmap_auto_creation_and_tree(client: AsyncClient):
    user, headers, dept = await _setup_user_and_department(client)

    goal = (
        await client.post(
            "/api/goals",
            json={"name": "Data Science Journey"},
            headers=headers,
        )
    ).json()

    # Fetch roadmap for goal
    rm_res = await client.get(f"/api/goals/{goal['id']}/roadmap", headers=headers)
    assert rm_res.status_code == 200
    rm_data = rm_res.json()
    assert rm_data["roadmap"]["goal_id"] == goal["id"]
    roadmap_id = rm_data["roadmap"]["id"]

    # Add step 1 (root item)
    step1 = (
        await client.post(
            f"/api/roadmaps/{roadmap_id}/items",
            json={"name": "Statistics Fundamentals", "status": "completed", "estimated_hours": 20},
            headers=headers,
        )
    ).json()

    # Add child sub-skill under step 1
    sub1 = (
        await client.post(
            f"/api/roadmaps/{roadmap_id}/items",
            json={"name": "Hypothesis Testing", "parent_id": step1["id"], "status": "completed"},
            headers=headers,
        )
    ).json()

    # Verify tree
    tree_res = await client.get(f"/api/goals/{goal['id']}/roadmap", headers=headers)
    assert tree_res.status_code == 200
    updated_tree = tree_res.json()
    assert updated_tree["total_steps"] == 1
    assert len(updated_tree["items"][0]["children"]) == 1
    assert updated_tree["items"][0]["children"][0]["name"] == "Hypothesis Testing"


async def test_calendar_events_endpoint(client: AsyncClient):
    user, headers, dept = await _setup_user_and_department(client)

    # Create milestone on Apr 25, 2025
    await client.post(
        "/api/milestones",
        json={"name": "Complete Project", "completion_date": "2025-04-25"},
        headers=headers,
    )

    # Fetch calendar events for April 2025
    cal_res = await client.get("/api/calendar/events?year=2025&month=4", headers=headers)
    assert cal_res.status_code == 200
    cal_data = cal_res.json()
    assert cal_data["year"] == 2025
    assert cal_data["month"] == 4
    assert len(cal_data["events"]) >= 1
    assert cal_data["events"][0]["title"] == "Complete Project"
    assert cal_data["events"][0]["date"] == "2025-04-25"
