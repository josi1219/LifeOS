from datetime import date, datetime

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    purpose: str | None = None
    goal_id: int | None = None
    status: str = "not_started"
    start_date: date | None = None
    end_date: date | None = None
    repo_url: str | None = None
    deployment_url: str | None = None
    notes: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    purpose: str | None = None
    goal_id: int | None = None
    status: str | None = None
    progress: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    repo_url: str | None = None
    deployment_url: str | None = None
    notes: str | None = None


class ProjectResponse(BaseModel):
    id: int
    department_id: int
    goal_id: int | None
    name: str
    purpose: str | None
    status: str
    progress: int
    start_date: date | None
    end_date: date | None
    repo_url: str | None
    deployment_url: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
