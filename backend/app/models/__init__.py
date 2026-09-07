"""Import every model here so Base.metadata (and Alembic autogenerate) sees the full schema."""

from app.models.current_focus import CurrentFocus
from app.models.department import Department
from app.models.department_change import DepartmentChange
from app.models.experiment import Experiment
from app.models.goal import Goal
from app.models.goal_change import GoalChange
from app.models.milestone import Milestone, milestone_projects, milestone_skills
from app.models.project import Project, project_required_skills
from app.models.refresh_token import RefreshToken
from app.models.resource import Resource
from app.models.roadmap import Roadmap
from app.models.roadmap_item import RoadmapItem, roadmap_item_prerequisites
from app.models.skill import Skill, skill_roadmap_items
from app.models.task import Task
from app.models.time_session import TimeSession
from app.models.user import User

__all__ = [
    "CurrentFocus",
    "Department",
    "DepartmentChange",
    "Experiment",
    "Goal",
    "GoalChange",
    "Milestone",
    "Project",
    "RefreshToken",
    "Resource",
    "Roadmap",
    "RoadmapItem",
    "Skill",
    "Task",
    "TimeSession",
    "User",
    "milestone_projects",
    "milestone_skills",
    "project_required_skills",
    "roadmap_item_prerequisites",
    "skill_roadmap_items",
]
