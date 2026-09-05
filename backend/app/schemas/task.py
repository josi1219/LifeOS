from datetime import date, datetime

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    status: str = "not_started"
    due_date: date | None = None


class TaskUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    status: str | None = None
    due_date: date | None = None


class TaskResponse(BaseModel):
    id: int
    project_id: int
    name: str
    status: str
    due_date: date | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
