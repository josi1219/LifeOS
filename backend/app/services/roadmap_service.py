from sqlalchemy.ext.asyncio import AsyncSession

from app.models.roadmap import Roadmap
from app.repositories import roadmap_repo
from app.schemas.roadmap import RoadmapCreate, RoadmapUpdate
from app.services.errors import NotFoundError


async def list_roadmaps(session: AsyncSession, department_id: int) -> list[Roadmap]:
    return await roadmap_repo.list_for_department(session, department_id)


async def get_roadmap_or_404(session: AsyncSession, roadmap_id: int, user_id: int) -> Roadmap:
    roadmap = await roadmap_repo.get_for_user(session, roadmap_id, user_id)
    if roadmap is None:
        raise NotFoundError()
    return roadmap


async def create_roadmap(session: AsyncSession, department_id: int, data: RoadmapCreate) -> Roadmap:
    fields = data.model_dump()
    return await roadmap_repo.create(session, department_id=department_id, **fields)


async def update_roadmap(session: AsyncSession, roadmap: Roadmap, data: RoadmapUpdate) -> Roadmap:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(roadmap, field, value)
    await session.flush()
    return roadmap


async def delete_roadmap(session: AsyncSession, roadmap: Roadmap) -> None:
    await roadmap_repo.delete(session, roadmap)
