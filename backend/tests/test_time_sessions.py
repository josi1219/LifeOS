from datetime import datetime, timedelta, timezone
from httpx import AsyncClient

from conftest import auth_headers, register_user


async def _setup_entities(client: AsyncClient, headers: dict) -> dict:
    dep = (await client.post("/api/departments", json={"name": "Coding"}, headers=headers)).json()
    goal = (await client.post(f"/api/departments/{dep['id']}/goals", json={"name": "FastAPI Master"}, headers=headers)).json()
    roadmap = (await client.post(f"/api/departments/{dep['id']}/roadmaps", json={"name": "Backend"}, headers=headers)).json()
    item = (await client.post(f"/api/roadmaps/{roadmap['id']}/items", json={"name": "Auth Endpoint"}, headers=headers)).json()
    return {"department": dep, "goal": goal, "roadmap": roadmap, "item": item}


async def test_start_active_and_stop_session(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    entities = await _setup_entities(client, headers)

    # Start session
    res = await client.post(
        "/api/time-sessions/start",
        json={
            "department_id": entities["department"]["id"],
            "goal_id": entities["goal"]["id"],
            "roadmap_item_id": entities["item"]["id"],
            "note": "Working on auth",
        },
        headers=headers,
    )
    assert res.status_code == 201
    session = res.json()
    assert session["status"] == "running"
    assert session["department_id"] == entities["department"]["id"]
    assert session["department_name"] == "Coding"
    assert session["goal_name"] == "FastAPI Master"
    assert session["roadmap_item_name"] == "Auth Endpoint"

    # Query active session
    active_res = await client.get("/api/time-sessions/active", headers=headers)
    assert active_res.status_code == 200
    assert active_res.json()["id"] == session["id"]

    # Stop session
    stop_res = await client.post(
        f"/api/time-sessions/{session['id']}/stop",
        json={"note": "Completed auth successfully", "update_focus_note": True},
        headers=headers,
    )
    assert stop_res.status_code == 200
    stopped = stop_res.json()
    assert stopped["status"] == "completed"
    assert stopped["note"] == "Completed auth successfully"
    assert stopped["end_time"] is not None

    # No active session remaining
    active_res2 = await client.get("/api/time-sessions/active", headers=headers)
    assert active_res2.status_code == 200
    assert active_res2.json() is None


async def test_pause_and_resume_session(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])

    start_res = await client.post("/api/time-sessions/start", json={}, headers=headers)
    session_id = start_res.json()["id"]

    # Pause
    pause_res = await client.post(f"/api/time-sessions/{session_id}/pause", headers=headers)
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "paused"
    assert pause_res.json()["last_paused_at"] is not None

    # Resume
    resume_res = await client.post(f"/api/time-sessions/{session_id}/resume", headers=headers)
    assert resume_res.status_code == 200
    assert resume_res.json()["status"] == "running"
    assert resume_res.json()["last_paused_at"] is None


async def test_start_auto_fills_from_current_focus(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    entities = await _setup_entities(client, headers)

    # Set manual focus
    await client.patch(
        "/api/focus",
        json={
            "department_id": entities["department"]["id"],
            "goal_id": entities["goal"]["id"],
            "next_action_roadmap_item_id": entities["item"]["id"],
            "note": "Context from focus",
        },
        headers=headers,
    )

    # Start timer with empty payload -> should auto-fill from focus
    res = await client.post("/api/time-sessions/start", json={}, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["department_id"] == entities["department"]["id"]
    assert data["goal_id"] == entities["goal"]["id"]
    assert data["roadmap_item_id"] == entities["item"]["id"]
    assert data["note"] == "Context from focus"


async def test_starting_new_timer_auto_stops_existing(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])

    s1 = (await client.post("/api/time-sessions/start", json={"note": "Task 1"}, headers=headers)).json()
    assert s1["status"] == "running"

    # Start second timer
    s2 = (await client.post("/api/time-sessions/start", json={"note": "Task 2"}, headers=headers)).json()
    assert s2["status"] == "running"
    assert s2["id"] != s1["id"]

    # Check active session is s2
    active = (await client.get("/api/time-sessions/active", headers=headers)).json()
    assert active["id"] == s2["id"]

    # Check s1 was finalized to completed in history
    history = (await client.get("/api/time-sessions", headers=headers)).json()
    s1_history = next(s for s in history if s["id"] == s1["id"])
    assert s1_history["status"] == "completed"


async def test_manual_time_logging(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    entities = await _setup_entities(client, headers)

    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(hours=1)

    res = await client.post(
        "/api/time-sessions/manual",
        json={
            "department_id": entities["department"]["id"],
            "start_time": one_hour_ago.isoformat(),
            "end_time": now.isoformat(),
            "note": "Manual entry for deep work",
        },
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "completed"
    assert data["duration_seconds"] >= 3590  # approximately 3600 seconds
    assert data["note"] == "Manual entry for deep work"


async def test_discard_session(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])

    start_res = await client.post("/api/time-sessions/start", json={}, headers=headers)
    session_id = start_res.json()["id"]

    del_res = await client.post(f"/api/time-sessions/{session_id}/discard", headers=headers)
    assert del_res.status_code == 204

    active = (await client.get("/api/time-sessions/active", headers=headers)).json()
    assert active is None


async def test_summary_aggregations(client: AsyncClient):
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    entities = await _setup_entities(client, headers)

    now = datetime.now(timezone.utc)
    # Log two 30-minute manual sessions
    await client.post(
        "/api/time-sessions/manual",
        json={
            "department_id": entities["department"]["id"],
            "start_time": (now - timedelta(minutes=60)).isoformat(),
            "end_time": (now - timedelta(minutes=30)).isoformat(),
            "note": "Session 1",
        },
        headers=headers,
    )
    await client.post(
        "/api/time-sessions/manual",
        json={
            "department_id": entities["department"]["id"],
            "start_time": (now - timedelta(minutes=30)).isoformat(),
            "end_time": now.isoformat(),
            "note": "Session 2",
        },
        headers=headers,
    )

    summary_res = await client.get("/api/time-sessions/summary", headers=headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["today_seconds"] >= 3500
    assert len(summary["by_department"]) == 1
    assert summary["by_department"][0]["department_name"] == "Coding"
    assert summary["by_department"][0]["duration_seconds"] >= 3500
