from datetime import date, datetime

from pydantic import BaseModel, Field


class MilestoneCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    completion_criteria: str | None = None
    goal_id: int | None = None
    department_id: int | None = None
    status: str = "not_started"
    progress: int = 0
    completion_date: date | None = None
    skill_ids: list[int] = []


class MilestoneUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    completion_criteria: str | None = None
    goal_id: int | None = None
    status: str | None = None
    progress: int | None = None
    completion_date: date | None = None
    skill_ids: list[int] | None = None


class MilestoneResponse(BaseModel):
    id: int
    department_id: int
    goal_id: int | None
    name: str
    description: str | None
    completion_criteria: str | None
    status: str
    progress: int
    completion_date: date | None
    skill_ids: list[int] = []
    skill_names: list[str] = []
    skills_completed_count: int = 0
    skills_total_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
