from datetime import datetime

from pydantic import BaseModel, Field


class RoadmapCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    goal_id: int | None = None


class RoadmapUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    goal_id: int | None = None


from app.schemas.roadmap_item import RoadmapItemTreeResponse


class RoadmapResponse(BaseModel):
    id: int
    department_id: int
    goal_id: int | None
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GoalRoadmapDetailResponse(BaseModel):
    roadmap: RoadmapResponse
    items: list[RoadmapItemTreeResponse] = []
    total_steps: int = 0
    completed_steps: int = 0
    progress: int = 0
