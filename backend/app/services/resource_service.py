from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resource import Resource
from app.repositories import resource_repo
from app.schemas.resource import ResourceCreate, ResourceUpdate
from app.services.errors import NotFoundError


async def list_resources(
    session: AsyncSession,
    user_id: int,
    *,
    department_id: int | None = None,
    goal_id: int | None = None,
    skill_id: int | None = None,
    roadmap_item_id: int | None = None,
    project_id: int | None = None,
) -> list[Resource]:
    return await resource_repo.list_for_user(
        session,
        user_id,
        department_id=department_id,
        goal_id=goal_id,
        skill_id=skill_id,
        roadmap_item_id=roadmap_item_id,
        project_id=project_id,
    )


async def get_resource_or_404(session: AsyncSession, resource_id: int, user_id: int) -> Resource:
    resource = await resource_repo.get_for_user(session, resource_id, user_id)
    if resource is None:
        raise NotFoundError()
    return resource


async def create_resource(session: AsyncSession, user_id: int, data: ResourceCreate) -> Resource:
    fields = data.model_dump()
    return await resource_repo.create(session, user_id=user_id, **fields)


async def update_resource(session: AsyncSession, resource: Resource, data: ResourceUpdate) -> Resource:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(resource, field, value)
    await session.flush()
    return resource


async def delete_resource(session: AsyncSession, resource: Resource) -> None:
    await resource_repo.delete(session, resource)
