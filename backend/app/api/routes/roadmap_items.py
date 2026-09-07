from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.roadmap_item import (
    PrerequisiteRequest,
    ReorderRequest,
    RoadmapItemCreate,
    RoadmapItemResponse,
    RoadmapItemTreeResponse,
    RoadmapItemUpdate,
)
from app.services import roadmap_item_service, roadmap_service
from app.services.errors import NotFoundError, ValidationError

router = APIRouter(prefix="/api", tags=["roadmap-items"])


@router.get("/roadmaps/{roadmap_id}/items", response_model=list[RoadmapItemTreeResponse])
async def get_roadmap_tree(
    roadmap_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[RoadmapItemTreeResponse]:
    try:
        await roadmap_service.get_roadmap_or_404(session, roadmap_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found") from exc
    return await roadmap_item_service.get_tree(session, roadmap_id)


@router.post(
    "/roadmaps/{roadmap_id}/items",
    response_model=RoadmapItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_roadmap_item(
    roadmap_id: int,
    payload: RoadmapItemCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> RoadmapItemResponse:
    try:
        await roadmap_service.get_roadmap_or_404(session, roadmap_id, current_user.id)
        item = await roadmap_item_service.create_item(session, roadmap_id, payload)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found") from exc
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc
    await session.commit()
    return RoadmapItemResponse(
        id=item.id,
        roadmap_id=item.roadmap_id,
        parent_id=item.parent_id,
        name=item.name,
        description=item.description,
        status=item.status,
        progress=item.progress,
        estimated_hours=item.estimated_hours,
        sort_order=item.sort_order,
        prerequisite_ids=[],
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.patch("/roadmaps/{roadmap_id}/items/reorder", response_model=list[RoadmapItemResponse])
async def reorder_roadmap_items(
    roadmap_id: int,
    payload: ReorderRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[RoadmapItemResponse]:
    try:
        await roadmap_service.get_roadmap_or_404(session, roadmap_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found") from exc
    items = await roadmap_item_service.reorder_items(session, roadmap_id, payload.ordered_ids)
    await session.commit()
    return [await roadmap_item_service.get_item_response(session, item) for item in items]


@router.get("/roadmap-items/{item_id}", response_model=RoadmapItemResponse)
async def get_roadmap_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> RoadmapItemResponse:
    try:
        item = await roadmap_item_service.get_item_or_404(session, item_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found") from exc
    return await roadmap_item_service.get_item_response(session, item)


@router.patch("/roadmap-items/{item_id}", response_model=RoadmapItemResponse)
async def update_roadmap_item(
    item_id: int,
    payload: RoadmapItemUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> RoadmapItemResponse:
    try:
        item = await roadmap_item_service.get_item_or_404(session, item_id, current_user.id)
        item = await roadmap_item_service.update_item(session, item, payload)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found") from exc
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc
    await session.commit()
    return await roadmap_item_service.get_item_response(session, item)



@router.delete("/roadmap-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_roadmap_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        item = await roadmap_item_service.get_item_or_404(session, item_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found") from exc
    await roadmap_item_service.delete_item(session, item)
    await session.commit()


@router.post("/roadmap-items/{item_id}/prerequisites", status_code=status.HTTP_201_CREATED)
async def add_prerequisite(
    item_id: int,
    payload: PrerequisiteRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        await roadmap_item_service.add_prerequisite(
            session, item_id, payload.prerequisite_item_id, current_user.id
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found") from exc
    await session.commit()


@router.delete(
    "/roadmap-items/{item_id}/prerequisites/{prerequisite_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_prerequisite(
    item_id: int,
    prerequisite_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        await roadmap_item_service.remove_prerequisite(session, item_id, prerequisite_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found") from exc
    await session.commit()
