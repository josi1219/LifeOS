from datetime import datetime

from pydantic import BaseModel, Field


class DepartmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    purpose: str | None = None
    long_term_goal: str | None = None
    # If omitted, the service assigns the next available priority (appended to the end).
    priority: int | None = None
    status: str = "active"
    current_phase: str | None = None
    secondary_purpose: str | None = None


class DepartmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    purpose: str | None = None
    long_term_goal: str | None = None
    status: str | None = None
    current_phase: str | None = None
    secondary_purpose: str | None = None
    reason: str | None = None


class DepartmentReorderRequest(BaseModel):
    ordered_ids: list[int]


class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: str | None
    purpose: str | None
    long_term_goal: str | None
    priority: int
    status: str
    current_phase: str | None
    secondary_purpose: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
