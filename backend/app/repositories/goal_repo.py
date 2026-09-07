from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.goal import Goal
from app.models.goal_change import GoalChange


async def list_for_department(session: AsyncSession, department_id: int) -> list[Goal]:
    result = await session.execute(select(Goal).where(Goal.department_id == department_id).order_by(Goal.priority))
    return list(result.scalars())


async def list_for_user(session: AsyncSession, user_id: int) -> list[Goal]:
    result = await session.execute(
        select(Goal)
        .join(Department, Department.id == Goal.department_id)
        .where(Department.user_id == user_id)
        .order_by(Goal.priority, Goal.created_at)
    )
    return list(result.scalars())


async def get_for_user(session: AsyncSession, goal_id: int, user_id: int) -> Goal | None:
    """Owns-through-department check: a goal belongs to the user only if its department does."""
    result = await session.execute(
        select(Goal).join(Department, Department.id == Goal.department_id).where(
            Goal.id == goal_id, Department.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def count_for_department(session: AsyncSession, department_id: int) -> int:
    result = await session.execute(select(func.count()).select_from(Goal).where(Goal.department_id == department_id))
    return result.scalar_one()


async def create(session: AsyncSession, department_id: int, **fields) -> Goal:
    goal = Goal(department_id=department_id, **fields)
    session.add(goal)
    await session.flush()
    return goal


async def delete(session: AsyncSession, goal: Goal) -> None:
    await session.delete(goal)
    await session.flush()


async def list_changes(session: AsyncSession, goal_id: int) -> list[GoalChange]:
    result = await session.execute(
        select(GoalChange).where(GoalChange.goal_id == goal_id).order_by(GoalChange.changed_at.desc())
    )
    return list(result.scalars())


async def list_recent_changes_for_user(session: AsyncSession, user_id: int, limit: int) -> list[tuple[GoalChange, str]]:
    """Returns (change, goal_name) pairs — the dashboard's recent-activity feed needs a display name."""
    result = await session.execute(
        select(GoalChange, Goal.name)
        .join(Goal, Goal.id == GoalChange.goal_id)
        .join(Department, Department.id == Goal.department_id)
        .where(Department.user_id == user_id)
        .order_by(GoalChange.changed_at.desc())
        .limit(limit)
    )
    return [(row[0], row[1]) for row in result.all()]
