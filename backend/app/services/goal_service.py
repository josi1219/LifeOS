from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.goal import Goal
from app.models.goal_change import GoalChange
from app.models.milestone import Milestone
from app.repositories import goal_repo
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate
from app.services.change_history import record_field_changes
from app.services.errors import NotFoundError


async def list_goals(session: AsyncSession, department: Department) -> list[Goal]:
    return await goal_repo.list_for_department(session, department.id)


async def list_goals_for_user(session: AsyncSession, user_id: int) -> list[Goal]:
    return await goal_repo.list_for_user(session, user_id)


async def enrich_goal_response(session: AsyncSession, goal: Goal) -> GoalResponse:
    dept_name = None
    dept_res = await session.execute(select(Department.name).where(Department.id == goal.department_id))
    dept_name = dept_res.scalar_one_or_none()

    # Milestones metrics
    total_ms = (
        await session.execute(
            select(func.count(Milestone.id)).where(Milestone.goal_id == goal.id)
        )
    ).scalar_one() or 0

    completed_ms = (
        await session.execute(
            select(func.count(Milestone.id)).where(
                Milestone.goal_id == goal.id, Milestone.status == "completed"
            )
        )
    ).scalar_one() or 0

    progress = 0
    if total_ms > 0:
        avg_prog = (
            await session.execute(
                select(func.avg(Milestone.progress)).where(Milestone.goal_id == goal.id)
            )
        ).scalar_one()
        progress = int(round(avg_prog or ((completed_ms / total_ms) * 100)))

    resp = GoalResponse.model_validate(goal)
    resp.department_name = dept_name
    resp.milestones_count = total_ms
    resp.completed_milestones_count = completed_ms
    resp.progress = progress
    return resp


async def get_goal_or_404(session: AsyncSession, goal_id: int, user_id: int) -> Goal:
    goal = await goal_repo.get_for_user(session, goal_id, user_id)
    if goal is None:
        raise NotFoundError()
    return goal


async def create_goal(session: AsyncSession, department: Department, data: GoalCreate) -> Goal:
    priority = data.priority
    if priority is None:
        priority = await goal_repo.count_for_department(session, department.id) + 1
    fields = data.model_dump(exclude={"priority", "department_id"})
    return await goal_repo.create(session, department_id=department.id, priority=priority, **fields)


async def update_goal(session: AsyncSession, goal: Goal, user_id: int, data: GoalUpdate) -> Goal:
    updates = data.model_dump(exclude={"reason"}, exclude_unset=True)
    before = {field: getattr(goal, field) for field in updates}
    for field, value in updates.items():
        setattr(goal, field, value)
    await session.flush()
    await record_field_changes(session, GoalChange, "goal_id", goal.id, user_id, before, updates, data.reason)
    return goal


async def delete_goal(session: AsyncSession, goal: Goal) -> None:
    await goal_repo.delete(session, goal)


async def list_changes(session: AsyncSession, goal: Goal) -> list[GoalChange]:
    return await goal_repo.list_changes(session, goal.id)
