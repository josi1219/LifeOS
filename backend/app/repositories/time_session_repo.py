from datetime import datetime
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.time_session import TimeSession


async def create(
    session: AsyncSession,
    user_id: int,
    start_time: datetime,
    status: str = "running",
    department_id: int | None = None,
    goal_id: int | None = None,
    roadmap_item_id: int | None = None,
    skill_id: int | None = None,
    project_id: int | None = None,
    task_id: int | None = None,
    duration_seconds: int = 0,
    pause_duration_seconds: int = 0,
    end_time: datetime | None = None,
    note: str | None = None,
) -> TimeSession:
    time_session = TimeSession(
        user_id=user_id,
        start_time=start_time,
        status=status,
        department_id=department_id,
        goal_id=goal_id,
        roadmap_item_id=roadmap_item_id,
        skill_id=skill_id,
        project_id=project_id,
        task_id=task_id,
        duration_seconds=duration_seconds,
        pause_duration_seconds=pause_duration_seconds,
        end_time=end_time,
        note=note,
    )
    session.add(time_session)
    await session.flush()
    return time_session


async def get_active_for_user(session: AsyncSession, user_id: int) -> TimeSession | None:
    result = await session.execute(
        select(TimeSession)
        .where(
            TimeSession.user_id == user_id,
            TimeSession.status.in_(["running", "paused"]),
        )
        .order_by(TimeSession.start_time.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_for_user(session: AsyncSession, session_id: int, user_id: int) -> TimeSession | None:
    result = await session.execute(
        select(TimeSession).where(
            TimeSession.id == session_id,
            TimeSession.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def list_for_user(
    session: AsyncSession,
    user_id: int,
    department_id: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[TimeSession]:
    query = select(TimeSession).where(
        TimeSession.user_id == user_id,
        TimeSession.status == "completed",
    )
    if department_id is not None:
        query = query.where(TimeSession.department_id == department_id)
    if start_date is not None:
        query = query.where(TimeSession.start_time >= start_date)
    if end_date is not None:
        query = query.where(TimeSession.start_time <= end_date)

    query = query.order_by(TimeSession.start_time.desc()).offset(offset).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


async def delete(session: AsyncSession, time_session: TimeSession) -> None:
    await session.delete(time_session)
    await session.flush()


async def get_total_duration(
    session: AsyncSession, user_id: int, since: datetime | None = None
) -> int:
    query = select(func.coalesce(func.sum(TimeSession.duration_seconds), 0)).where(
        TimeSession.user_id == user_id,
        TimeSession.status == "completed",
    )
    if since is not None:
        query = query.where(TimeSession.start_time >= since)
    result = await session.execute(query)
    return int(result.scalar_one())


async def get_department_breakdown(
    session: AsyncSession, user_id: int, since: datetime | None = None
) -> list[tuple[int, str, int]]:
    query = (
        select(
            Department.id,
            Department.name,
            func.coalesce(func.sum(TimeSession.duration_seconds), 0).label("total_seconds"),
        )
        .join(Department, Department.id == TimeSession.department_id)
        .where(
            TimeSession.user_id == user_id,
            TimeSession.status == "completed",
        )
    )
    if since is not None:
        query = query.where(TimeSession.start_time >= since)
    query = query.group_by(Department.id, Department.name).order_by(func.sum(TimeSession.duration_seconds).desc())
    result = await session.execute(query)
    return [(row[0], row[1], int(row[2])) for row in result.all()]
