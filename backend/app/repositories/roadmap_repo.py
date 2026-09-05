from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.roadmap import Roadmap


async def list_for_department(session: AsyncSession, department_id: int) -> list[Roadmap]:
    result = await session.execute(
        select(Roadmap).where(Roadmap.department_id == department_id).order_by(Roadmap.name)
    )
    return list(result.scalars())


async def get_for_user(session: AsyncSession, roadmap_id: int, user_id: int) -> Roadmap | None:
    result = await session.execute(
        select(Roadmap)
        .join(Department, Department.id == Roadmap.department_id)
        .where(Roadmap.id == roadmap_id, Department.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create(session: AsyncSession, department_id: int, **fields) -> Roadmap:
    roadmap = Roadmap(department_id=department_id, **fields)
    session.add(roadmap)
    await session.flush()
    return roadmap


async def delete(session: AsyncSession, roadmap: Roadmap) -> None:
    await session.delete(roadmap)
    await session.flush()
