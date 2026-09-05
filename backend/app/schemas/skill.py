from datetime import datetime

from pydantic import BaseModel, Field


class SkillCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    purpose: str | None = None
    prerequisite_text: str | None = None
    status: str = "not_started"


class SkillUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    purpose: str | None = None
    prerequisite_text: str | None = None
    status: str | None = None
    progress: int | None = None


class SkillResponse(BaseModel):
    id: int
    department_id: int
    name: str
    purpose: str | None
    prerequisite_text: str | None
    status: str
    progress: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
