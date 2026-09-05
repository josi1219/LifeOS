from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services import department_service, project_service
from app.services.errors import NotFoundError

router = APIRouter(prefix="/api", tags=["projects"])


@router.get("/departments/{department_id}/projects", response_model=list[ProjectResponse])
async def list_projects(
    department_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[ProjectResponse]:
    try:
        await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    projects = await project_service.list_projects(session, department_id)
    return [ProjectResponse.model_validate(project) for project in projects]


@router.post(
    "/departments/{department_id}/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_project(
    department_id: int,
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    try:
        await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    project = await project_service.create_project(session, department_id, payload)
    await session.commit()
    return ProjectResponse.model_validate(project)


@router.post(
    "/projects/{project_id}/required-skills/{skill_id}",
    status_code=status.HTTP_201_CREATED,
)
async def link_required_skill(
    project_id: int,
    skill_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        await project_service.link_required_skill(session, project_id, skill_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project or skill not found") from exc
    await session.commit()


@router.delete(
    "/projects/{project_id}/required-skills/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unlink_required_skill(
    project_id: int,
    skill_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        await project_service.unlink_required_skill(session, project_id, skill_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found") from exc
    await session.commit()


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    try:
        project = await project_service.get_project_or_404(session, project_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found") from exc
    return ProjectResponse.model_validate(project)


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    payload: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    try:
        project = await project_service.get_project_or_404(session, project_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found") from exc
    project = await project_service.update_project(session, project, payload)
    await session.commit()
    return ProjectResponse.model_validate(project)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        project = await project_service.get_project_or_404(session, project_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found") from exc
    await project_service.delete_project(session, project)
    await session.commit()
