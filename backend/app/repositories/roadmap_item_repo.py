from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.roadmap import Roadmap
from app.models.roadmap_item import RoadmapItem, roadmap_item_prerequisites


async def list_for_roadmap(session: AsyncSession, roadmap_id: int) -> list[RoadmapItem]:
    result = await session.execute(
        select(RoadmapItem)
        .where(RoadmapItem.roadmap_id == roadmap_id)
        .order_by(RoadmapItem.sort_order)
    )
    return list(result.scalars())


async def get_for_user(session: AsyncSession, item_id: int, user_id: int) -> RoadmapItem | None:
    result = await session.execute(
        select(RoadmapItem)
        .join(Roadmap, Roadmap.id == RoadmapItem.roadmap_id)
        .join(Department, Department.id == Roadmap.department_id)
        .where(RoadmapItem.id == item_id, Department.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create(session: AsyncSession, roadmap_id: int, **fields) -> RoadmapItem:
    item = RoadmapItem(roadmap_id=roadmap_id, **fields)
    session.add(item)
    await session.flush()
    return item


async def delete(session: AsyncSession, item: RoadmapItem) -> None:
    await session.delete(item)
    await session.flush()


async def list_prerequisite_ids(session: AsyncSession, item_id: int) -> list[int]:
    result = await session.execute(
        select(roadmap_item_prerequisites.c.prerequisite_item_id).where(
            roadmap_item_prerequisites.c.roadmap_item_id == item_id
        )
    )
    return list(result.scalars())


async def add_prerequisite(session: AsyncSession, item_id: int, prerequisite_id: int) -> None:
    await session.execute(
        roadmap_item_prerequisites.insert().values(
            roadmap_item_id=item_id, prerequisite_item_id=prerequisite_id
        )
    )
    await session.flush()


async def remove_prerequisite(session: AsyncSession, item_id: int, prerequisite_id: int) -> None:
    await session.execute(
        roadmap_item_prerequisites.delete().where(
            roadmap_item_prerequisites.c.roadmap_item_id == item_id,
            roadmap_item_prerequisites.c.prerequisite_item_id == prerequisite_id,
        )
    )
    await session.flush()
