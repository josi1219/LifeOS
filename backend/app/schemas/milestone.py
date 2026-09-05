from datetime import date, datetime

from pydantic import BaseModel, Field


class MilestoneCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    completion_criteria: str | None = None
    goal_id: int | None = None
    status: str = "not_started"


class MilestoneUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    completion_criteria: str | None = None
    goal_id: int | None = None
    status: str | None = None
    progress: int | None = None
    completion_date: date | None = None


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
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
