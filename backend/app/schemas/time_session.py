from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TimeSessionStartRequest(BaseModel):
    department_id: int | None = None
    goal_id: int | None = None
    roadmap_item_id: int | None = None
    skill_id: int | None = None
    project_id: int | None = None
    task_id: int | None = None
    note: str | None = None


class TimeSessionStopRequest(BaseModel):
    note: str | None = None
    update_focus_note: bool = True


class TimeSessionManualCreate(BaseModel):
    start_time: datetime
    end_time: datetime
    department_id: int | None = None
    goal_id: int | None = None
    roadmap_item_id: int | None = None
    skill_id: int | None = None
    project_id: int | None = None
    task_id: int | None = None
    note: str | None = None


class TimeSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    department_id: int | None = None
    goal_id: int | None = None
    roadmap_item_id: int | None = None
    skill_id: int | None = None
    project_id: int | None = None
    task_id: int | None = None
    start_time: datetime
    end_time: datetime | None = None
    last_paused_at: datetime | None = None
    duration_seconds: int
    pause_duration_seconds: int
    status: str
    note: str | None = None
    created_at: datetime

    # Display helper labels
    department_name: str | None = None
    goal_name: str | None = None
    roadmap_item_name: str | None = None
    skill_name: str | None = None
    project_name: str | None = None
    task_name: str | None = None


class DepartmentTimeSummary(BaseModel):
    department_id: int
    department_name: str
    duration_seconds: int


class TimeSummaryResponse(BaseModel):
    today_seconds: int
    week_seconds: int
    total_seconds: int
    by_department: list[DepartmentTimeSummary]
