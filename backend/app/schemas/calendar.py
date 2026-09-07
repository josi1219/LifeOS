from datetime import date
from pydantic import BaseModel


class CalendarEventItem(BaseModel):
    id: str
    title: str
    type: str  # "milestone" | "session" | "task"
    date: str  # YYYY-MM-DD
    time: str
    duration: str
    dot_color: str


class UpcomingMilestoneSummary(BaseModel):
    id: int
    title: str
    date: str
    progress: int
    dot_color: str


class CalendarMonthResponse(BaseModel):
    year: int
    month: int
    events: list[CalendarEventItem]
    upcoming_milestones: list[UpcomingMilestoneSummary]
