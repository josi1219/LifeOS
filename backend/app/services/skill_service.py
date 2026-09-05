from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill import Skill
from app.repositories import skill_repo
from app.schemas.skill import SkillCreate, SkillUpdate
from app.services.errors import NotFoundError


async def list_skills(session: AsyncSession, department_id: int) -> list[Skill]:
    return await skill_repo.list_for_department(session, department_id)


async def get_skill_or_404(session: AsyncSession, skill_id: int, user_id: int) -> Skill:
    skill = await skill_repo.get_for_user(session, skill_id, user_id)
    if skill is None:
        raise NotFoundError()
    return skill


async def create_skill(session: AsyncSession, department_id: int, data: SkillCreate) -> Skill:
    fields = data.model_dump()
    return await skill_repo.create(session, department_id=department_id, **fields)


async def update_skill(session: AsyncSession, skill: Skill, data: SkillUpdate) -> Skill:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(skill, field, value)
    await session.flush()
    return skill


async def delete_skill(session: AsyncSession, skill: Skill) -> None:
    await skill_repo.delete(session, skill)


async def link_roadmap_item(
    session: AsyncSession, skill_id: int, roadmap_item_id: int, user_id: int
) -> None:
    from app.repositories import roadmap_item_repo

    skill = await skill_repo.get_for_user(session, skill_id, user_id)
    if skill is None:
        raise NotFoundError()
    item = await roadmap_item_repo.get_for_user(session, roadmap_item_id, user_id)
    if item is None:
        raise NotFoundError()
    await skill_repo.link_roadmap_item(session, skill_id, roadmap_item_id)


async def unlink_roadmap_item(
    session: AsyncSession, skill_id: int, roadmap_item_id: int, user_id: int
) -> None:
    skill = await skill_repo.get_for_user(session, skill_id, user_id)
    if skill is None:
        raise NotFoundError()
    await skill_repo.unlink_roadmap_item(session, skill_id, roadmap_item_id)
