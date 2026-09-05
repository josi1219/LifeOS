from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.skill import SkillCreate, SkillResponse, SkillUpdate
from app.services import department_service, skill_service
from app.services.errors import NotFoundError

router = APIRouter(prefix="/api", tags=["skills"])


@router.get("/departments/{department_id}/skills", response_model=list[SkillResponse])
async def list_skills(
    department_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[SkillResponse]:
    try:
        await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    skills = await skill_service.list_skills(session, department_id)
    return [SkillResponse.model_validate(skill) for skill in skills]


@router.post(
    "/departments/{department_id}/skills",
    response_model=SkillResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_skill(
    department_id: int,
    payload: SkillCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> SkillResponse:
    try:
        await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    skill = await skill_service.create_skill(session, department_id, payload)
    await session.commit()
    return SkillResponse.model_validate(skill)


@router.get("/skills/{skill_id}", response_model=SkillResponse)
async def get_skill(
    skill_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> SkillResponse:
    try:
        skill = await skill_service.get_skill_or_404(session, skill_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found") from exc
    return SkillResponse.model_validate(skill)


@router.patch("/skills/{skill_id}", response_model=SkillResponse)
async def update_skill(
    skill_id: int,
    payload: SkillUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> SkillResponse:
    try:
        skill = await skill_service.get_skill_or_404(session, skill_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found") from exc
    skill = await skill_service.update_skill(session, skill, payload)
    await session.commit()
    return SkillResponse.model_validate(skill)


@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        skill = await skill_service.get_skill_or_404(session, skill_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found") from exc
    await skill_service.delete_skill(session, skill)
    await session.commit()


@router.post(
    "/skills/{skill_id}/roadmap-items/{roadmap_item_id}",
    status_code=status.HTTP_201_CREATED,
)
async def link_roadmap_item(
    skill_id: int,
    roadmap_item_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        await skill_service.link_roadmap_item(session, skill_id, roadmap_item_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill or roadmap item not found") from exc
    await session.commit()


@router.delete(
    "/skills/{skill_id}/roadmap-items/{roadmap_item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unlink_roadmap_item(
    skill_id: int,
    roadmap_item_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        await skill_service.unlink_roadmap_item(session, skill_id, roadmap_item_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found") from exc
    await session.commit()
