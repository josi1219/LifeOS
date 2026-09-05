from datetime import datetime

from pydantic import BaseModel, Field


class ResourceCreate(BaseModel):
    type: str = Field(min_length=1, max_length=30)
    title: str = Field(min_length=1, max_length=200)
    url_or_path: str | None = None
    department_id: int | None = None
    goal_id: int | None = None
    skill_id: int | None = None
    roadmap_item_id: int | None = None
    project_id: int | None = None


class ResourceUpdate(BaseModel):
    type: str | None = Field(default=None, min_length=1, max_length=30)
    title: str | None = Field(default=None, min_length=1, max_length=200)
    url_or_path: str | None = None
    department_id: int | None = None
    goal_id: int | None = None
    skill_id: int | None = None
    roadmap_item_id: int | None = None
    project_id: int | None = None


class ResourceResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    url_or_path: str | None
    department_id: int | None
    goal_id: int | None
    skill_id: int | None
    roadmap_item_id: int | None
    project_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
