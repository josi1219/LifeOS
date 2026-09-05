from datetime import datetime

from pydantic import BaseModel, Field


class ExperimentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    purpose: str | None = None
    department_id: int | None = None
    time_budget_hours: float | None = None


class ExperimentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    purpose: str | None = None
    department_id: int | None = None
    time_budget_hours: float | None = None
    result: str | None = None


class ExperimentStatusRequest(BaseModel):
    status: str = Field(min_length=1)


class ExperimentResponse(BaseModel):
    id: int
    user_id: int
    department_id: int | None
    name: str
    description: str | None
    purpose: str | None
    time_budget_hours: float | None
    status: str
    result: str | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}
