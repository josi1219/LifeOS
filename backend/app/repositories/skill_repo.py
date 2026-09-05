from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.skill import Skill, skill_roadmap_items


async def list_for_department(session: AsyncSession, department_id: int) -> list[Skill]:
    result = await session.execute(
        select(Skill).where(Skill.department_id == department_id).order_by(Skill.name)
    )
    return list(result.scalars())


async def get_for_user(session: AsyncSession, skill_id: int, user_id: int) -> Skill | None:
    result = await session.execute(
        select(Skill)
        .join(Department, Department.id == Skill.department_id)
        .where(Skill.id == skill_id, Department.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create(session: AsyncSession, department_id: int, **fields) -> Skill:
    skill = Skill(department_id=department_id, **fields)
    session.add(skill)
    await session.flush()
    return skill


async def delete(session: AsyncSession, skill: Skill) -> None:
    await session.delete(skill)
    await session.flush()


async def list_linked_roadmap_item_ids(session: AsyncSession, skill_id: int) -> list[int]:
    result = await session.execute(
        select(skill_roadmap_items.c.roadmap_item_id).where(skill_roadmap_items.c.skill_id == skill_id)
    )
    return list(result.scalars())


async def link_roadmap_item(session: AsyncSession, skill_id: int, roadmap_item_id: int) -> None:
    await session.execute(
        skill_roadmap_items.insert().values(skill_id=skill_id, roadmap_item_id=roadmap_item_id)
    )
    await session.flush()


async def unlink_roadmap_item(session: AsyncSession, skill_id: int, roadmap_item_id: int) -> None:
    await session.execute(
        skill_roadmap_items.delete().where(
            skill_roadmap_items.c.skill_id == skill_id,
            skill_roadmap_items.c.roadmap_item_id == roadmap_item_id,
        )
    )
    await session.flush()
