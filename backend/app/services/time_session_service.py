from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goal import Goal
from app.models.roadmap import Roadmap
from app.models.roadmap_item import RoadmapItem
from app.models.time_session import TimeSession
from app.repositories import (
    department_repo,
    focus_repo,
    goal_repo,
    milestone_repo,
    project_repo,
    roadmap_item_repo,
    skill_repo,
    task_repo,
    time_session_repo,
)
from app.schemas.time_session import (
    DepartmentTimeSummary,
    TimeSessionManualCreate,
    TimeSessionResponse,
    TimeSessionStartRequest,
    TimeSessionStopRequest,
    TimeSummaryResponse,
)
from app.services.errors import NotFoundError


async def _enrich_response(session: AsyncSession, ts: TimeSession, user_id: int) -> TimeSessionResponse:
    dep_name = None
    goal_name = None
    item_name = None
    skill_name = None
    project_name = None
    task_name = None

    if ts.department_id:
        dep = await department_repo.get_for_user(session, ts.department_id, user_id)
        if dep:
            dep_name = dep.name
    if ts.goal_id:
        goal = await goal_repo.get_for_user(session, ts.goal_id, user_id)
        if goal:
            goal_name = goal.name
    if ts.roadmap_item_id:
        item = await roadmap_item_repo.get_for_user(session, ts.roadmap_item_id, user_id)
        if item:
            item_name = item.name
    if ts.skill_id:
        skill = await skill_repo.get_for_user(session, ts.skill_id, user_id)
        if skill:
            skill_name = skill.name
    if ts.project_id:
        proj = await project_repo.get_for_user(session, ts.project_id, user_id)
        if proj:
            project_name = proj.name
    if ts.task_id:
        task = await task_repo.get_for_user(session, ts.task_id, user_id)
        if task:
            task_name = task.name

    resp = TimeSessionResponse.model_validate(ts)
    resp.department_name = dep_name
    resp.goal_name = goal_name
    resp.roadmap_item_name = item_name
    resp.skill_name = skill_name
    resp.project_name = project_name
    resp.task_name = task_name
    return resp


async def get_active_session(session: AsyncSession, user_id: int) -> TimeSessionResponse | None:
    active = await time_session_repo.get_active_for_user(session, user_id)
    if active is None:
        return None
    return await _enrich_response(session, active, user_id)


async def start_session(
    session: AsyncSession, user_id: int, payload: TimeSessionStartRequest
) -> TimeSessionResponse:
    now = datetime.now(timezone.utc)

    # Validate ownership of any explicitly specified entities
    if payload.department_id is not None:
        if await department_repo.get_for_user(session, payload.department_id, user_id) is None:
            raise NotFoundError()
    if payload.goal_id is not None:
        if await goal_repo.get_for_user(session, payload.goal_id, user_id) is None:
            raise NotFoundError()
    if payload.roadmap_item_id is not None:
        if await roadmap_item_repo.get_for_user(session, payload.roadmap_item_id, user_id) is None:
            raise NotFoundError()
    if payload.skill_id is not None:
        if await skill_repo.get_for_user(session, payload.skill_id, user_id) is None:
            raise NotFoundError()
    if payload.project_id is not None:
        if await project_repo.get_for_user(session, payload.project_id, user_id) is None:
            raise NotFoundError()
    if payload.task_id is not None:
        if await task_repo.get_for_user(session, payload.task_id, user_id) is None:
            raise NotFoundError()

    dep_id = payload.department_id
    goal_id = payload.goal_id
    roadmap_item_id = payload.roadmap_item_id
    skill_id = payload.skill_id
    project_id = payload.project_id
    task_id = payload.task_id
    note = payload.note

    # Auto-fill from CurrentFocus if no entity was specified
    if not any([dep_id, goal_id, roadmap_item_id, skill_id, project_id, task_id]):
        focus = await focus_repo.get_for_user(session, user_id)
        if focus:
            dep_id = focus.department_id
            goal_id = focus.goal_id
            roadmap_item_id = focus.next_action_roadmap_item_id
            if not note:
                note = focus.note

    # Single Active Timer Rule: auto-complete any existing active session
    active = await time_session_repo.get_active_for_user(session, user_id)
    if active:
        if active.status == "paused" and active.last_paused_at:
            active.pause_duration_seconds += max(
                0, int((now - active.last_paused_at).total_seconds())
            )
            active.last_paused_at = None
        duration = max(0, int((now - active.start_time).total_seconds() - active.pause_duration_seconds))
        active.duration_seconds = duration
        active.end_time = now
        active.status = "completed"
        await session.flush()

    new_session = await time_session_repo.create(
        session,
        user_id=user_id,
        start_time=now,
        status="running",
        department_id=dep_id,
        goal_id=goal_id,
        roadmap_item_id=roadmap_item_id,
        skill_id=skill_id,
        project_id=project_id,
        task_id=task_id,
        note=note,
    )
    return await _enrich_response(session, new_session, user_id)


async def pause_session(session: AsyncSession, session_id: int, user_id: int) -> TimeSessionResponse:
    ts = await time_session_repo.get_for_user(session, session_id, user_id)
    if ts is None:
        raise NotFoundError()

    if ts.status == "running":
        ts.status = "paused"
        ts.last_paused_at = datetime.now(timezone.utc)
        await session.flush()

    return await _enrich_response(session, ts, user_id)


async def resume_session(session: AsyncSession, session_id: int, user_id: int) -> TimeSessionResponse:
    ts = await time_session_repo.get_for_user(session, session_id, user_id)
    if ts is None:
        raise NotFoundError()

    if ts.status == "paused" and ts.last_paused_at:
        now = datetime.now(timezone.utc)
        pause_delta = int((now - ts.last_paused_at).total_seconds())
        ts.pause_duration_seconds += max(0, pause_delta)
        ts.last_paused_at = None
        ts.status = "running"
        await session.flush()

    return await _enrich_response(session, ts, user_id)


async def _cascade_progress_update(session: AsyncSession, user_id: int, roadmap_item_id: int) -> None:
    item = await session.get(RoadmapItem, roadmap_item_id)
    if item is None:
        return

    # 1. Update sub-skill progress based on total completed duration
    result = await session.execute(
        select(func.sum(TimeSession.duration_seconds)).where(
            TimeSession.user_id == user_id,
            TimeSession.roadmap_item_id == item.id,
            TimeSession.status == "completed",
        )
    )
    total_seconds = result.scalar() or 0
    invested_hours = total_seconds / 3600.0

    if item.estimated_hours and item.estimated_hours > 0:
        new_progress = min(100, round((invested_hours / item.estimated_hours) * 100))
    else:
        new_progress = 100 if invested_hours > 0 else 0

    item.progress = new_progress
    if new_progress >= 100:
        item.status = "completed"
    elif new_progress > 0:
        item.status = "in_progress"
    await session.flush()

    # 2. Update Parent Step (if this is a sub-skill with parent_id)
    if item.parent_id is not None:
        parent = await session.get(RoadmapItem, item.parent_id)
        if parent is not None:
            children = await roadmap_item_repo.list_children(session, parent.id)
            if children:
                parent.progress = round(sum(c.progress for c in children) / len(children))
                if all(c.status == "completed" for c in children):
                    parent.status = "completed"
                elif any(c.progress > 0 for c in children):
                    parent.status = "in_progress"
                await session.flush()

    # 3. Update Roadmap / Goal
    roadmap = await session.get(Roadmap, item.roadmap_id)
    if roadmap and roadmap.goal_id:
        goal = await session.get(Goal, roadmap.goal_id)
        if goal:
            all_items = await roadmap_item_repo.list_for_roadmap(session, roadmap.id)
            root_items = [i for i in all_items if i.parent_id is None]
            if root_items:
                goal.progress = round(sum(r.progress for r in root_items) / len(root_items))
                if goal.progress >= 100:
                    goal.status = "completed"
                elif goal.progress > 0:
                    goal.status = "in_progress"
                await session.flush()

    # 4. Update any Milestones attached to this roadmap_item
    milestones = await milestone_repo.list_milestones_for_roadmap_item(session, item.id)
    for ms in milestones:
        linked_items = await milestone_repo.list_linked_roadmap_items(session, ms.id)
        if linked_items:
            ms.progress = round(sum(li.progress for li in linked_items) / len(linked_items))
            if all(li.status == "completed" for li in linked_items):
                ms.status = "completed"
            elif any(li.progress > 0 for li in linked_items):
                ms.status = "in_progress"
    await session.flush()


async def stop_session(
    session: AsyncSession, session_id: int, user_id: int, payload: TimeSessionStopRequest
) -> TimeSessionResponse:
    ts = await time_session_repo.get_for_user(session, session_id, user_id)
    if ts is None:
        raise NotFoundError()

    now = datetime.now(timezone.utc)
    if ts.status == "paused" and ts.last_paused_at:
        ts.pause_duration_seconds += max(0, int((now - ts.last_paused_at).total_seconds()))
        ts.last_paused_at = None

    duration = max(0, int((now - ts.start_time).total_seconds() - ts.pause_duration_seconds))
    ts.duration_seconds = duration
    ts.end_time = now
    ts.status = "completed"

    if payload.note is not None:
        ts.note = payload.note
        if payload.update_focus_note:
            focus = await focus_repo.get_for_user(session, user_id)
            if focus:
                focus.note = payload.note

    await session.flush()

    if ts.roadmap_item_id:
        await _cascade_progress_update(session, user_id, ts.roadmap_item_id)

    return await _enrich_response(session, ts, user_id)


async def discard_session(session: AsyncSession, session_id: int, user_id: int) -> None:
    ts = await time_session_repo.get_for_user(session, session_id, user_id)
    if ts is None:
        raise NotFoundError()
    await time_session_repo.delete(session, ts)


async def log_manual_session(
    session: AsyncSession, user_id: int, payload: TimeSessionManualCreate
) -> TimeSessionResponse:
    if payload.department_id is not None:
        if await department_repo.get_for_user(session, payload.department_id, user_id) is None:
            raise NotFoundError()
    if payload.goal_id is not None:
        if await goal_repo.get_for_user(session, payload.goal_id, user_id) is None:
            raise NotFoundError()
    if payload.roadmap_item_id is not None:
        if await roadmap_item_repo.get_for_user(session, payload.roadmap_item_id, user_id) is None:
            raise NotFoundError()
    if payload.skill_id is not None:
        if await skill_repo.get_for_user(session, payload.skill_id, user_id) is None:
            raise NotFoundError()
    if payload.project_id is not None:
        if await project_repo.get_for_user(session, payload.project_id, user_id) is None:
            raise NotFoundError()
    if payload.task_id is not None:
        if await task_repo.get_for_user(session, payload.task_id, user_id) is None:
            raise NotFoundError()

    duration = max(0, int((payload.end_time - payload.start_time).total_seconds()))
    ts = await time_session_repo.create(
        session,
        user_id=user_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration_seconds=duration,
        status="completed",
        department_id=payload.department_id,
        goal_id=payload.goal_id,
        roadmap_item_id=payload.roadmap_item_id,
        skill_id=payload.skill_id,
        project_id=payload.project_id,
        task_id=payload.task_id,
        note=payload.note,
    )
    if ts.roadmap_item_id:
        await _cascade_progress_update(session, user_id, ts.roadmap_item_id)
    return await _enrich_response(session, ts, user_id)


async def list_sessions(
    session: AsyncSession,
    user_id: int,
    department_id: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[TimeSessionResponse]:
    sessions = await time_session_repo.list_for_user(
        session,
        user_id,
        department_id=department_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )
    return [await _enrich_response(session, s, user_id) for s in sessions]


async def get_summary(session: AsyncSession, user_id: int) -> TimeSummaryResponse:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)

    today_seconds = await time_session_repo.get_total_duration(session, user_id, since=today_start)
    week_seconds = await time_session_repo.get_total_duration(session, user_id, since=week_start)
    total_seconds = await time_session_repo.get_total_duration(session, user_id)

    dept_rows = await time_session_repo.get_department_breakdown(session, user_id)
    by_dept = [
        DepartmentTimeSummary(
            department_id=row[0],
            department_name=row[1],
            duration_seconds=row[2],
        )
        for row in dept_rows
    ]

    return TimeSummaryResponse(
        today_seconds=today_seconds,
        week_seconds=week_seconds,
        total_seconds=total_seconds,
        by_department=by_dept,
    )
