import calendar
from datetime import date, datetime, time, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.department import Department
from app.models.milestone import Milestone
from app.models.task import Task
from app.models.time_session import TimeSession
from app.models.user import User
from app.schemas.calendar import CalendarEventItem, CalendarMonthResponse, UpcomingMilestoneSummary

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/events", response_model=CalendarMonthResponse)
async def get_calendar_events(
    year: int = Query(default=2025),
    month: int = Query(default=4, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> CalendarMonthResponse:
    # First & last day of the month
    num_days = calendar.monthrange(year, month)[1]
    start_dt = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
    end_dt = datetime(year, month, num_days, 23, 59, 59, tzinfo=timezone.utc)
    start_d = date(year, month, 1)
    end_d = date(year, month, num_days)

    events: list[CalendarEventItem] = []

    # 1. Milestones
    ms_query = (
        select(Milestone)
        .join(Department, Department.id == Milestone.department_id)
        .where(
            Department.user_id == current_user.id,
            Milestone.completion_date >= start_d,
            Milestone.completion_date <= end_d,
        )
    )
    ms_res = await session.execute(ms_query)
    for m in ms_res.scalars():
        events.append(
            CalendarEventItem(
                id=f"ms-{m.id}",
                title=m.name,
                type="milestone",
                date=m.completion_date.isoformat(),
                time="All day",
                duration="All day",
                dot_color="#00e599" if m.status == "completed" else "#f59e0b",
            )
        )

    # 2. Time Sessions
    ts_query = (
        select(TimeSession)
        .where(
            TimeSession.user_id == current_user.id,
            TimeSession.start_time >= start_dt,
            TimeSession.start_time <= end_dt,
            TimeSession.status.in_(["running", "paused", "completed"]),
        )
    )
    ts_res = await session.execute(ts_query)
    for s in ts_res.scalars():
        d_str = s.start_time.strftime("%Y-%m-%d")
        t_str = s.start_time.strftime("%H:%M")
        hours = s.duration_seconds // 3600
        mins = (s.duration_seconds % 3600) // 60
        dur_str = f"{hours}h {mins}m" if hours > 0 else f"{max(1, mins)}m"
        events.append(
            CalendarEventItem(
                id=f"ts-{s.id}",
                title=s.note or "Focus Session",
                type="session",
                date=d_str,
                time=t_str,
                duration=dur_str,
                dot_color="#00e599",
            )
        )

    # 3. Upcoming Milestones for sidebar
    upcoming_q = (
        select(Milestone)
        .join(Department, Department.id == Milestone.department_id)
        .where(Department.user_id == current_user.id, Milestone.status != "completed")
        .order_by(Milestone.completion_date.nulls_last(), Milestone.created_at)
        .limit(6)
    )
    up_res = await session.execute(upcoming_q)
    upcoming_ms: list[UpcomingMilestoneSummary] = []
    color_palette = ["#00e599", "#8b5cf6", "#38bdf8", "#f59e0b", "#ec4899"]
    for i, m in enumerate(up_res.scalars()):
        upcoming_ms.append(
            UpcomingMilestoneSummary(
                id=m.id,
                title=m.name,
                date=m.completion_date.strftime("%b %d, %Y") if m.completion_date else "No date",
                progress=m.progress,
                dot_color=color_palette[i % len(color_palette)],
            )
        )

    return CalendarMonthResponse(
        year=year,
        month=month,
        events=events,
        upcoming_milestones=upcoming_ms,
    )
