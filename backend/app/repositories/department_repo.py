from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.department_change import DepartmentChange


async def list_for_user(session: AsyncSession, user_id: int) -> list[Department]:
    result = await session.execute(
        select(Department).where(Department.user_id == user_id).order_by(Department.priority)
    )
    return list(result.scalars())


async def get_for_user(session: AsyncSession, department_id: int, user_id: int) -> Department | None:
    result = await session.execute(
        select(Department).where(Department.id == department_id, Department.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def count_for_user(session: AsyncSession, user_id: int) -> int:
    result = await session.execute(
        select(func.count()).select_from(Department).where(Department.user_id == user_id)
    )
    return result.scalar_one()


async def create(session: AsyncSession, user_id: int, **fields) -> Department:
    department = Department(user_id=user_id, **fields)
    session.add(department)
    await session.flush()
    return department


async def delete(session: AsyncSession, department: Department) -> None:
    await session.delete(department)
    await session.flush()


async def list_changes(session: AsyncSession, department_id: int) -> list[DepartmentChange]:
    result = await session.execute(
        select(DepartmentChange)
        .where(DepartmentChange.department_id == department_id)
        .order_by(DepartmentChange.changed_at.desc())
    )
    return list(result.scalars())


async def list_recent_changes_for_user(session: AsyncSession, user_id: int, limit: int) -> list[tuple[DepartmentChange, str]]:
    """Returns (change, department_name) pairs — the dashboard's recent-activity feed needs a display name."""
    result = await session.execute(
        select(DepartmentChange, Department.name)
        .join(Department, Department.id == DepartmentChange.department_id)
        .where(Department.user_id == user_id)
        .order_by(DepartmentChange.changed_at.desc())
        .limit(limit)
    )
    return [(row[0], row[1]) for row in result.all()]
