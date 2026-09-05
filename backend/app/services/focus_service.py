from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.goal import Goal
from app.models.milestone import Milestone
from app.models.roadmap_item import RoadmapItem
from app.repositories import department_repo, focus_repo, goal_repo, milestone_repo, roadmap_item_repo
from app.schemas.focus import FocusOverrideRequest, FocusResponse
from app.schemas.milestone import MilestoneResponse
from app.schemas.roadmap_item import RoadmapItemResponse
from app.services.errors import NotFoundError


async def _auto_derive(session: AsyncSession, user_id: int) -> tuple[Department | None, Goal | None]:
    result = await session.execute(
        select(Department)
        .where(Department.user_id == user_id, Department.status == "active")
        .order_by(Department.priority)
        .limit(1)
    )
    department = result.scalar_one_or_none()
    if department is None:
        return None, None

    goals = await goal_repo.list_for_department(session, department.id)
    active_goals = [goal for goal in goals if goal.status != "completed"]
    goal = active_goals[0] if active_goals else (goals[0] if goals else None)
    return department, goal


async def resolve_current_focus(session: AsyncSession, user_id: int) -> FocusResponse:
    focus = await focus_repo.get_for_user(session, user_id)

    if focus is not None and focus.is_manual_override:
        department = (
            await department_repo.get_for_user(session, focus.department_id, user_id)
            if focus.department_id
            else None
        )
        goal = await goal_repo.get_for_user(session, focus.goal_id, user_id) if focus.goal_id else None
        milestone = (
            await milestone_repo.get_for_user(session, focus.milestone_id, user_id)
            if focus.milestone_id
            else None
        )
        next_action = (
            await roadmap_item_repo.get_for_user(session, focus.next_action_roadmap_item_id, user_id)
            if focus.next_action_roadmap_item_id
            else None
        )
        return FocusResponse(
            department=department,
            goal=goal,
            note=focus.note,
            is_manual_override=True,
            milestone=MilestoneResponse.model_validate(milestone) if milestone else None,
            next_action_roadmap_item=RoadmapItemResponse.model_validate(next_action) if next_action else None,
        )

    department, goal = await _auto_derive(session, user_id)
    return FocusResponse(
        department=department, goal=goal, note=focus.note if focus else None, is_manual_override=False
    )


async def set_manual_override(session: AsyncSession, user_id: int, data: FocusOverrideRequest) -> FocusResponse:
    updates = data.model_dump(exclude_unset=True)

    if "department_id" in updates and updates["department_id"] is not None:
        if await department_repo.get_for_user(session, updates["department_id"], user_id) is None:
            raise NotFoundError()
    if "goal_id" in updates and updates["goal_id"] is not None:
        if await goal_repo.get_for_user(session, updates["goal_id"], user_id) is None:
            raise NotFoundError()
    if "milestone_id" in updates and updates["milestone_id"] is not None:
        if await milestone_repo.get_for_user(session, updates["milestone_id"], user_id) is None:
            raise NotFoundError()
    if "next_action_roadmap_item_id" in updates and updates["next_action_roadmap_item_id"] is not None:
        if await roadmap_item_repo.get_for_user(session, updates["next_action_roadmap_item_id"], user_id) is None:
            raise NotFoundError()

    focus = await focus_repo.get_for_user(session, user_id)
    if focus is None:
        focus = await focus_repo.create(session, user_id=user_id, is_manual_override=True, **updates)
    else:
        for field, value in updates.items():
            setattr(focus, field, value)
        focus.is_manual_override = True
        await session.flush()

    return await resolve_current_focus(session, user_id)


async def clear_manual_override(session: AsyncSession, user_id: int) -> FocusResponse:
    focus = await focus_repo.get_for_user(session, user_id)
    if focus is not None:
        focus.is_manual_override = False
        await session.flush()
    return await resolve_current_focus(session, user_id)
