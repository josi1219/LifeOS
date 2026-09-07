from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.roadmap import (
    GoalRoadmapDetailResponse,
    RoadmapCreate,
    RoadmapResponse,
    RoadmapUpdate,
)
from app.services import department_service, roadmap_item_service, roadmap_service
from app.services.errors import NotFoundError

router = APIRouter(prefix="/api", tags=["roadmaps"])


@router.get("/goals/{goal_id}/roadmap", response_model=GoalRoadmapDetailResponse)
async def get_goal_roadmap(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> GoalRoadmapDetailResponse:
    try:
        roadmap = await roadmap_service.get_or_create_for_goal(session, goal_id, current_user.id)
        await session.commit()
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found") from exc
    items = await roadmap_item_service.get_tree(session, roadmap.id)
    total_steps = len(items)
    completed_steps = sum(1 for it in items if it.status == "completed")
    prog = int(round((completed_steps / total_steps) * 100)) if total_steps > 0 else 0
    return GoalRoadmapDetailResponse(
        roadmap=RoadmapResponse.model_validate(roadmap),
        items=items,
        total_steps=total_steps,
        completed_steps=completed_steps,
        progress=prog,
    )


@router.get("/departments/{department_id}/roadmaps", response_model=list[RoadmapResponse])
async def list_roadmaps(
    department_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[RoadmapResponse]:
    try:
        await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    roadmaps = await roadmap_service.list_roadmaps(session, department_id)
    return [RoadmapResponse.model_validate(roadmap) for roadmap in roadmaps]


@router.post(
    "/departments/{department_id}/roadmaps",
    response_model=RoadmapResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_roadmap(
    department_id: int,
    payload: RoadmapCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    try:
        await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    roadmap = await roadmap_service.create_roadmap(session, department_id, payload)
    await session.commit()
    return RoadmapResponse.model_validate(roadmap)


@router.get("/roadmaps/{roadmap_id}", response_model=RoadmapResponse)
async def get_roadmap(
    roadmap_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    try:
        roadmap = await roadmap_service.get_roadmap_or_404(session, roadmap_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found") from exc
    return RoadmapResponse.model_validate(roadmap)


@router.patch("/roadmaps/{roadmap_id}", response_model=RoadmapResponse)
async def update_roadmap(
    roadmap_id: int,
    payload: RoadmapUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    try:
        roadmap = await roadmap_service.get_roadmap_or_404(session, roadmap_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found") from exc
    roadmap = await roadmap_service.update_roadmap(session, roadmap, payload)
    await session.commit()
    return RoadmapResponse.model_validate(roadmap)


@router.delete("/roadmaps/{roadmap_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_roadmap(
    roadmap_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        roadmap = await roadmap_service.get_roadmap_or_404(session, roadmap_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found") from exc
    await roadmap_service.delete_roadmap(session, roadmap)
    await session.commit()
