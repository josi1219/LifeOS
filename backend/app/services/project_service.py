from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.repositories import project_repo
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.errors import NotFoundError


async def list_projects(session: AsyncSession, department_id: int) -> list[Project]:
    return await project_repo.list_for_department(session, department_id)


async def get_project_or_404(session: AsyncSession, project_id: int, user_id: int) -> Project:
    project = await project_repo.get_for_user(session, project_id, user_id)
    if project is None:
        raise NotFoundError()
    return project


async def create_project(session: AsyncSession, department_id: int, data: ProjectCreate) -> Project:
    fields = data.model_dump()
    return await project_repo.create(session, department_id=department_id, **fields)


async def update_project(session: AsyncSession, project: Project, data: ProjectUpdate) -> Project:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(project, field, value)
    await session.flush()
    return project


async def delete_project(session: AsyncSession, project: Project) -> None:
    await project_repo.delete(session, project)


async def link_required_skill(
    session: AsyncSession, project_id: int, skill_id: int, user_id: int
) -> None:
    from app.repositories import skill_repo

    project = await project_repo.get_for_user(session, project_id, user_id)
    if project is None:
        raise NotFoundError()
    skill = await skill_repo.get_for_user(session, skill_id, user_id)
    if skill is None:
        raise NotFoundError()
    await project_repo.link_required_skill(session, project_id, skill_id)


async def unlink_required_skill(
    session: AsyncSession, project_id: int, skill_id: int, user_id: int
) -> None:
    project = await project_repo.get_for_user(session, project_id, user_id)
    if project is None:
        raise NotFoundError()
    await project_repo.unlink_required_skill(session, project_id, skill_id)
