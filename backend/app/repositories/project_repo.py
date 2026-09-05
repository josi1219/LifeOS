from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.project import Project, project_required_skills


async def list_for_department(session: AsyncSession, department_id: int) -> list[Project]:
    result = await session.execute(
        select(Project).where(Project.department_id == department_id).order_by(Project.name)
    )
    return list(result.scalars())


async def get_for_user(session: AsyncSession, project_id: int, user_id: int) -> Project | None:
    result = await session.execute(
        select(Project)
        .join(Department, Department.id == Project.department_id)
        .where(Project.id == project_id, Department.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create(session: AsyncSession, department_id: int, **fields) -> Project:
    project = Project(department_id=department_id, **fields)
    session.add(project)
    await session.flush()
    return project


async def delete(session: AsyncSession, project: Project) -> None:
    await session.delete(project)
    await session.flush()


async def list_required_skill_ids(session: AsyncSession, project_id: int) -> list[int]:
    result = await session.execute(
        select(project_required_skills.c.skill_id).where(project_required_skills.c.project_id == project_id)
    )
    return list(result.scalars())


async def link_required_skill(session: AsyncSession, project_id: int, skill_id: int) -> None:
    await session.execute(
        project_required_skills.insert().values(project_id=project_id, skill_id=skill_id)
    )
    await session.flush()


async def unlink_required_skill(session: AsyncSession, project_id: int, skill_id: int) -> None:
    await session.execute(
        project_required_skills.delete().where(
            project_required_skills.c.project_id == project_id,
            project_required_skills.c.skill_id == skill_id,
        )
    )
    await session.flush()
