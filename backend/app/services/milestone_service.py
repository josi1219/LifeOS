from sqlalchemy.ext.asyncio import AsyncSession

from app.models.milestone import Milestone
from app.repositories import milestone_repo
from app.schemas.milestone import MilestoneCreate, MilestoneUpdate
from app.services.errors import NotFoundError


async def list_milestones(session: AsyncSession, department_id: int) -> list[Milestone]:
    return await milestone_repo.list_for_department(session, department_id)


async def get_milestone_or_404(session: AsyncSession, milestone_id: int, user_id: int) -> Milestone:
    milestone = await milestone_repo.get_for_user(session, milestone_id, user_id)
    if milestone is None:
        raise NotFoundError()
    return milestone


async def create_milestone(session: AsyncSession, department_id: int, data: MilestoneCreate) -> Milestone:
    fields = data.model_dump()
    return await milestone_repo.create(session, department_id=department_id, **fields)


async def update_milestone(session: AsyncSession, milestone: Milestone, data: MilestoneUpdate) -> Milestone:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(milestone, field, value)
    await session.flush()
    return milestone


async def delete_milestone(session: AsyncSession, milestone: Milestone) -> None:
    await milestone_repo.delete(session, milestone)


async def link_skill(
    session: AsyncSession, milestone_id: int, skill_id: int, user_id: int
) -> None:
    from app.repositories import skill_repo

    milestone = await milestone_repo.get_for_user(session, milestone_id, user_id)
    if milestone is None:
        raise NotFoundError()
    skill = await skill_repo.get_for_user(session, skill_id, user_id)
    if skill is None:
        raise NotFoundError()
    await milestone_repo.link_skill(session, milestone_id, skill_id)


async def unlink_skill(
    session: AsyncSession, milestone_id: int, skill_id: int, user_id: int
) -> None:
    milestone = await milestone_repo.get_for_user(session, milestone_id, user_id)
    if milestone is None:
        raise NotFoundError()
    await milestone_repo.unlink_skill(session, milestone_id, skill_id)


async def link_project(
    session: AsyncSession, milestone_id: int, project_id: int, user_id: int
) -> None:
    from app.repositories import project_repo

    milestone = await milestone_repo.get_for_user(session, milestone_id, user_id)
    if milestone is None:
        raise NotFoundError()
    project = await project_repo.get_for_user(session, project_id, user_id)
    if project is None:
        raise NotFoundError()
    await milestone_repo.link_project(session, milestone_id, project_id)


async def unlink_project(
    session: AsyncSession, milestone_id: int, project_id: int, user_id: int
) -> None:
    milestone = await milestone_repo.get_for_user(session, milestone_id, user_id)
    if milestone is None:
        raise NotFoundError()
    await milestone_repo.unlink_project(session, milestone_id, project_id)
