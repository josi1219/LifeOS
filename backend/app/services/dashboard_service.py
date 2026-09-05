from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import department_repo, goal_repo
from app.schemas.dashboard import ActiveDepartmentSummary, DashboardOverviewResponse, RecentActivityItem
from app.services import focus_service

RECENT_ACTIVITY_LIMIT = 10


async def get_overview(session: AsyncSession, user_id: int) -> DashboardOverviewResponse:
    focus = await focus_service.resolve_current_focus(session, user_id)

    departments = await department_repo.list_for_user(session, user_id)
    active_departments = [
        ActiveDepartmentSummary.model_validate(department)
        for department in departments
        if department.status == "active"
    ]

    department_changes = await department_repo.list_recent_changes_for_user(session, user_id, RECENT_ACTIVITY_LIMIT)
    goal_changes = await goal_repo.list_recent_changes_for_user(session, user_id, RECENT_ACTIVITY_LIMIT)

    activity = [
        RecentActivityItem(
            entity_type="department",
            entity_id=change.department_id,
            entity_name=name,
            field_name=change.field_name,
            previous_value=change.previous_value,
            new_value=change.new_value,
            changed_at=change.changed_at,
        )
        for change, name in department_changes
    ] + [
        RecentActivityItem(
            entity_type="goal",
            entity_id=change.goal_id,
            entity_name=name,
            field_name=change.field_name,
            previous_value=change.previous_value,
            new_value=change.new_value,
            changed_at=change.changed_at,
        )
        for change, name in goal_changes
    ]
    activity.sort(key=lambda item: item.changed_at, reverse=True)

    return DashboardOverviewResponse(
        focus=focus, active_departments=active_departments, recent_activity=activity[:RECENT_ACTIVITY_LIMIT]
    )
