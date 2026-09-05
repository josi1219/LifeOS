from pydantic import BaseModel

from app.schemas.department import DepartmentResponse
from app.schemas.goal import GoalResponse
from app.schemas.milestone import MilestoneResponse
from app.schemas.roadmap_item import RoadmapItemResponse


class FocusOverrideRequest(BaseModel):
    department_id: int | None = None
    goal_id: int | None = None
    note: str | None = None
    milestone_id: int | None = None
    next_action_roadmap_item_id: int | None = None


class FocusResponse(BaseModel):
    department: DepartmentResponse | None
    goal: GoalResponse | None
    note: str | None
    is_manual_override: bool
    milestone: MilestoneResponse | None = None
    next_action_roadmap_item: RoadmapItemResponse | None = None
