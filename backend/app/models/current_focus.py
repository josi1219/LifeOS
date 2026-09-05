from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class CurrentFocus(Base):
    """One row per user. Only ever changed by explicit user action, never by analytics/AI."""

    __tablename__ = "current_focus"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id", ondelete="SET NULL"))
    goal_id: Mapped[int | None] = mapped_column(ForeignKey("goals.id", ondelete="SET NULL"))
    # Supplementary user commentary only — current_phase/next_action are resolved via joins, never duplicated here.
    note: Mapped[str | None] = mapped_column(Text)
    milestone_id: Mapped[int | None] = mapped_column(ForeignKey("milestones.id", ondelete="SET NULL"))
    next_action_roadmap_item_id: Mapped[int | None] = mapped_column(
        ForeignKey("roadmap_items.id", ondelete="SET NULL")
    )
    is_manual_override: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
