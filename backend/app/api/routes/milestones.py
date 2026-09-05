from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.milestone import MilestoneCreate, MilestoneResponse, MilestoneUpdate
from app.services import department_service, milestone_service
from app.services.errors import NotFoundError

router = APIRouter(prefix="/api", tags=["milestones"])


@router.get("/departments/{department_id}/milestones", response_model=list[MilestoneResponse])
async def list_milestones(
    department_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[MilestoneResponse]:
    try:
        await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    milestones = await milestone_service.list_milestones(session, department_id)
    return [MilestoneResponse.model_validate(m) for m in milestones]


@router.post(
    "/departments/{department_id}/milestones",
    response_model=MilestoneResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_milestone(
    department_id: int,
    payload: MilestoneCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> MilestoneResponse:
    try:
        await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    milestone = await milestone_service.create_milestone(session, department_id, payload)
    await session.commit()
    return MilestoneResponse.model_validate(milestone)


@router.get("/milestones/{milestone_id}", response_model=MilestoneResponse)
async def get_milestone(
    milestone_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> MilestoneResponse:
    try:
        milestone = await milestone_service.get_milestone_or_404(session, milestone_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found") from exc
    return MilestoneResponse.model_validate(milestone)


@router.patch("/milestones/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(
    milestone_id: int,
    payload: MilestoneUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> MilestoneResponse:
    try:
        milestone = await milestone_service.get_milestone_or_404(session, milestone_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found") from exc
    milestone = await milestone_service.update_milestone(session, milestone, payload)
    await session.commit()
    return MilestoneResponse.model_validate(milestone)


@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_milestone(
    milestone_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        milestone = await milestone_service.get_milestone_or_404(session, milestone_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found") from exc
    await milestone_service.delete_milestone(session, milestone)
    await session.commit()


@router.post(
    "/milestones/{milestone_id}/skills/{skill_id}",
    status_code=status.HTTP_201_CREATED,
)
async def link_skill(
    milestone_id: int,
    skill_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        await milestone_service.link_skill(session, milestone_id, skill_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone or skill not found") from exc
    await session.commit()


@router.delete(
    "/milestones/{milestone_id}/skills/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unlink_skill(
    milestone_id: int,
    skill_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        await milestone_service.unlink_skill(session, milestone_id, skill_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found") from exc
    await session.commit()


@router.post(
    "/milestones/{milestone_id}/projects/{project_id}",
    status_code=status.HTTP_201_CREATED,
)
async def link_project(
    milestone_id: int,
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        await milestone_service.link_project(session, milestone_id, project_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone or project not found") from exc
    await session.commit()


@router.delete(
    "/milestones/{milestone_id}/projects/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unlink_project(
    milestone_id: int,
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        await milestone_service.unlink_project(session, milestone_id, project_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found") from exc
    await session.commit()
