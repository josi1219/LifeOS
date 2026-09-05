from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.resource import ResourceCreate, ResourceResponse, ResourceUpdate
from app.services import resource_service
from app.services.errors import NotFoundError

router = APIRouter(prefix="/api/resources", tags=["resources"])


@router.get("", response_model=list[ResourceResponse])
async def list_resources(
    department_id: int | None = Query(default=None),
    goal_id: int | None = Query(default=None),
    skill_id: int | None = Query(default=None),
    roadmap_item_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[ResourceResponse]:
    resources = await resource_service.list_resources(
        session,
        current_user.id,
        department_id=department_id,
        goal_id=goal_id,
        skill_id=skill_id,
        roadmap_item_id=roadmap_item_id,
        project_id=project_id,
    )
    return [ResourceResponse.model_validate(resource) for resource in resources]


@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    payload: ResourceCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ResourceResponse:
    resource = await resource_service.create_resource(session, current_user.id, payload)
    await session.commit()
    return ResourceResponse.model_validate(resource)


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ResourceResponse:
    try:
        resource = await resource_service.get_resource_or_404(session, resource_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found") from exc
    return ResourceResponse.model_validate(resource)


@router.patch("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: int,
    payload: ResourceUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ResourceResponse:
    try:
        resource = await resource_service.get_resource_or_404(session, resource_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found") from exc
    resource = await resource_service.update_resource(session, resource, payload)
    await session.commit()
    return ResourceResponse.model_validate(resource)


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        resource = await resource_service.get_resource_or_404(session, resource_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found") from exc
    await resource_service.delete_resource(session, resource)
    await session.commit()
