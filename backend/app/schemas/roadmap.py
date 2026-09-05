from datetime import datetime

from pydantic import BaseModel, Field


class RoadmapCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    goal_id: int | None = None


class RoadmapUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    goal_id: int | None = None


class RoadmapResponse(BaseModel):
    id: int
    department_id: int
    goal_id: int | None
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
