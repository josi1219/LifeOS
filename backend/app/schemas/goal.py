from datetime import date, datetime

from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str | None = None
    why: str | None = None
    success_definition: str | None = None
    priority: int | None = None
    target_date: date | None = None
    status: str = "active"


class GoalUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    why: str | None = None
    success_definition: str | None = None
    target_date: date | None = None
    status: str | None = None
    reason: str | None = None


class GoalResponse(BaseModel):
    id: int
    department_id: int
    name: str
    description: str | None
    why: str | None
    success_definition: str | None
    priority: int
    target_date: date | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
