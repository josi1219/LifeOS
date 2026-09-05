from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resource import Resource


async def list_for_user(
    session: AsyncSession,
    user_id: int,
    *,
    department_id: int | None = None,
    goal_id: int | None = None,
    skill_id: int | None = None,
    roadmap_item_id: int | None = None,
    project_id: int | None = None,
) -> list[Resource]:
    query = select(Resource).where(Resource.user_id == user_id)
    if department_id is not None:
        query = query.where(Resource.department_id == department_id)
    if goal_id is not None:
        query = query.where(Resource.goal_id == goal_id)
    if skill_id is not None:
        query = query.where(Resource.skill_id == skill_id)
    if roadmap_item_id is not None:
        query = query.where(Resource.roadmap_item_id == roadmap_item_id)
    if project_id is not None:
        query = query.where(Resource.project_id == project_id)
    result = await session.execute(query.order_by(Resource.created_at.desc()))
    return list(result.scalars())


async def get_for_user(session: AsyncSession, resource_id: int, user_id: int) -> Resource | None:
    result = await session.execute(
        select(Resource).where(Resource.id == resource_id, Resource.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create(session: AsyncSession, user_id: int, **fields) -> Resource:
    resource = Resource(user_id=user_id, **fields)
    session.add(resource)
    await session.flush()
    return resource


async def delete(session: AsyncSession, resource: Resource) -> None:
    await session.delete(resource)
    await session.flush()
