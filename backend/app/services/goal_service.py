from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.goal import Goal
from app.models.goal_change import GoalChange
from app.repositories import goal_repo
from app.schemas.goal import GoalCreate, GoalUpdate
from app.services.change_history import record_field_changes
from app.services.errors import NotFoundError


async def list_goals(session: AsyncSession, department: Department) -> list[Goal]:
    return await goal_repo.list_for_department(session, department.id)


async def get_goal_or_404(session: AsyncSession, goal_id: int, user_id: int) -> Goal:
    goal = await goal_repo.get_for_user(session, goal_id, user_id)
    if goal is None:
        raise NotFoundError()
    return goal


async def create_goal(session: AsyncSession, department: Department, data: GoalCreate) -> Goal:
    priority = data.priority
    if priority is None:
        priority = await goal_repo.count_for_department(session, department.id) + 1
    fields = data.model_dump(exclude={"priority"})
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
