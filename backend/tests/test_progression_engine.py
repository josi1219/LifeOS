from datetime import datetime, timezone
from httpx import AsyncClient

from conftest import auth_headers, register_user


async def _setup(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    dep = (await client.post("/api/departments", json={"name": "Engineering"}, headers=headers)).json()
    goal = (await client.post(
        "/api/goals",
        json={"name": "Become AI Engineer", "department_id": dep["id"]},
        headers=headers,
    )).json()
    roadmap = (await client.post(
        f"/api/departments/{dep['id']}/roadmaps",
        json={"name": "AI Roadmap", "goal_id": goal["id"]},
        headers=headers,
    )).json()
    return headers, dep, goal, roadmap


async def test_subskill_hours_budget_enforcement(client: AsyncClient):
    headers, dep, goal, roadmap = await _setup(client)

    step = (await client.post(
        f"/api/roadmaps/{roadmap['id']}/items",
        json={"name": "Python Mastery", "estimated_hours": 40.0},
        headers=headers,
    )).json()
    assert step["estimated_hours"] == 40.0

    sub1 = (await client.post(
        f"/api/roadmaps/{roadmap['id']}/items",
        json={"name": "AsyncIO", "parent_id": step["id"], "estimated_hours": 25.0},
        headers=headers,
    ))
    assert sub1.status_code == 201

    sub2 = (await client.post(
        f"/api/roadmaps/{roadmap['id']}/items",
        json={"name": "Type Hints", "parent_id": step["id"], "estimated_hours": 20.0},
        headers=headers,
    ))
    assert sub2.status_code == 400
    assert "cannot exceed" in sub2.json()["detail"]

    sub2_ok = (await client.post(
        f"/api/roadmaps/{roadmap['id']}/items",
        json={"name": "Type Hints", "parent_id": step["id"], "estimated_hours": 15.0},
        headers=headers,
    ))
    assert sub2_ok.status_code == 201


async def test_milestone_linked_to_roadmap_subskills(client: AsyncClient):
    headers, dep, goal, roadmap = await _setup(client)

    step = (await client.post(
        f"/api/roadmaps/{roadmap['id']}/items",
        json={"name": "Foundations", "estimated_hours": 30.0},
        headers=headers,
    )).json()

    sub = (await client.post(
        f"/api/roadmaps/{roadmap['id']}/items",
        json={"name": "Math & Linear Algebra", "parent_id": step["id"], "estimated_hours": 10.0},
        headers=headers,
    )).json()

    ms_res = await client.post(
        "/api/milestones",
        json={
            "name": "Complete Math Foundations",
            "goal_id": goal["id"],
            "department_id": dep["id"],
            "skill_ids": [sub["id"]],
        },
        headers=headers,
    )
    assert ms_res.status_code == 201
    ms = ms_res.json()
    assert ms["skill_ids"] == [sub["id"]]
    assert ms["skill_names"] == ["Math & Linear Algebra"]
    assert ms["skills_total_count"] == 1
    assert ms["skills_completed_count"] == 0
    assert ms["progress"] == 0


async def test_cascading_progress_on_session_stop(client: AsyncClient):
    headers, dep, goal, roadmap = await _setup(client)

    step = (await client.post(
        f"/api/roadmaps/{roadmap['id']}/items",
        json={"name": "Deep Learning", "estimated_hours": 10.0},
        headers=headers,
    )).json()

    sub = (await client.post(
        f"/api/roadmaps/{roadmap['id']}/items",
        json={"name": "PyTorch Tensors", "parent_id": step["id"], "estimated_hours": 5.0},
        headers=headers,
    )).json()

    ms = (await client.post(
        "/api/milestones",
        json={
            "name": "PyTorch Certification",
            "goal_id": goal["id"],
            "department_id": dep["id"],
            "skill_ids": [sub["id"]],
        },
        headers=headers,
    )).json()

    start = datetime(2026, 9, 1, 10, 0, 0, tzinfo=timezone.utc)
    end = datetime(2026, 9, 1, 12, 30, 0, tzinfo=timezone.utc)
    log_res = await client.post(
        "/api/time-sessions/manual",
        json={
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "roadmap_item_id": sub["id"],
            "goal_id": goal["id"],
            "department_id": dep["id"],
            "note": "Worked on tensors",
        },
        headers=headers,
    )
    assert log_res.status_code == 201

    sub_updated = (await client.get(f"/api/roadmap-items/{sub['id']}", headers=headers)).json()
    assert sub_updated["progress"] == 50
    assert sub_updated["status"] == "in_progress"

    step_updated = (await client.get(f"/api/roadmap-items/{step['id']}", headers=headers)).json()
    assert step_updated["progress"] == 50
    assert step_updated["status"] == "in_progress"

    goals = (await client.get("/api/goals", headers=headers)).json()
    my_goal = next(g for g in goals if g["id"] == goal["id"])
    assert my_goal["progress"] == 50

    ms_updated = (await client.get(f"/api/milestones/{ms['id']}", headers=headers)).json()
    assert ms_updated["progress"] == 50
