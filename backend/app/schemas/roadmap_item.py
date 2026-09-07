from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class RoadmapItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    parent_id: int | None = None
    status: str = "not_started"
    estimated_hours: float | None = None
    sort_order: int = 0


class RoadmapItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: str | None = None
    progress: int | None = None
    estimated_hours: float | None = None
    sort_order: int | None = None


class RoadmapItemResponse(BaseModel):
    id: int
    roadmap_id: int
    parent_id: int | None
    name: str
    description: str | None
    status: str
    progress: int
    estimated_hours: float | None
    sort_order: int
    prerequisite_ids: list[int] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RoadmapItemTreeResponse(BaseModel):
    id: int
    roadmap_id: int
    parent_id: int | None
    name: str
    description: str | None
    status: str
    progress: int
    estimated_hours: float | None
    sort_order: int
    prerequisite_ids: list[int] = []
    children: list[RoadmapItemTreeResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PrerequisiteRequest(BaseModel):
    prerequisite_item_id: int


class ReorderRequest(BaseModel):
    ordered_ids: list[int]
