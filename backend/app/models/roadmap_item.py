from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Table, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base

roadmap_item_prerequisites = Table(
    "roadmap_item_prerequisites",
    Base.metadata,
    Column("roadmap_item_id", Integer, ForeignKey("roadmap_items.id", ondelete="CASCADE"), primary_key=True),
    Column("prerequisite_item_id", Integer, ForeignKey("roadmap_items.id", ondelete="CASCADE"), primary_key=True),
)


class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    roadmap_id: Mapped[int] = mapped_column(
        ForeignKey("roadmaps.id", ondelete="CASCADE"), index=True, nullable=False
    )
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("roadmap_items.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="not_started")
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    estimated_hours: Mapped[float | None] = mapped_column(Float)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
