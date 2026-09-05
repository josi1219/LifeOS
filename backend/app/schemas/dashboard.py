from datetime import datetime

from pydantic import BaseModel

from app.schemas.focus import FocusResponse


class ActiveDepartmentSummary(BaseModel):
    id: int
    name: str
    priority: int
    status: str
    current_phase: str | None

    model_config = {"from_attributes": True}


class RecentActivityItem(BaseModel):
    entity_type: str  # "department" | "goal"
    entity_id: int
    entity_name: str
    field_name: str
    previous_value: str | None
    new_value: str | None
    changed_at: datetime


class DashboardOverviewResponse(BaseModel):
    focus: FocusResponse
    active_departments: list[ActiveDepartmentSummary]
    recent_activity: list[RecentActivityItem]
