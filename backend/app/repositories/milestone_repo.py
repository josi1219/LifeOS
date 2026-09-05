from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.milestone import Milestone, milestone_projects, milestone_skills


async def list_for_department(session: AsyncSession, department_id: int) -> list[Milestone]:
    result = await session.execute(
        select(Milestone).where(Milestone.department_id == department_id).order_by(Milestone.name)
    )
    return list(result.scalars())


async def get_for_user(session: AsyncSession, milestone_id: int, user_id: int) -> Milestone | None:
    result = await session.execute(
        select(Milestone)
        .join(Department, Department.id == Milestone.department_id)
        .where(Milestone.id == milestone_id, Department.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create(session: AsyncSession, department_id: int, **fields) -> Milestone:
    milestone = Milestone(department_id=department_id, **fields)
    session.add(milestone)
    await session.flush()
    return milestone


async def delete(session: AsyncSession, milestone: Milestone) -> None:
    await session.delete(milestone)
    await session.flush()


async def list_linked_skill_ids(session: AsyncSession, milestone_id: int) -> list[int]:
    result = await session.execute(
        select(milestone_skills.c.skill_id).where(milestone_skills.c.milestone_id == milestone_id)
    )
    return list(result.scalars())


async def link_skill(session: AsyncSession, milestone_id: int, skill_id: int) -> None:
    await session.execute(
        milestone_skills.insert().values(milestone_id=milestone_id, skill_id=skill_id)
    )
    await session.flush()


async def unlink_skill(session: AsyncSession, milestone_id: int, skill_id: int) -> None:
    await session.execute(
        milestone_skills.delete().where(
            milestone_skills.c.milestone_id == milestone_id,
            milestone_skills.c.skill_id == skill_id,
        )
    )
    await session.flush()


async def list_linked_project_ids(session: AsyncSession, milestone_id: int) -> list[int]:
    result = await session.execute(
        select(milestone_projects.c.project_id).where(milestone_projects.c.milestone_id == milestone_id)
    )
    return list(result.scalars())


async def link_project(session: AsyncSession, milestone_id: int, project_id: int) -> None:
    await session.execute(
        milestone_projects.insert().values(milestone_id=milestone_id, project_id=project_id)
    )
    await session.flush()


async def unlink_project(session: AsyncSession, milestone_id: int, project_id: int) -> None:
    await session.execute(
        milestone_projects.delete().where(
            milestone_projects.c.milestone_id == milestone_id,
            milestone_projects.c.project_id == project_id,
        )
    )
    await session.flush()
