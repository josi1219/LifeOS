from sqlalchemy.ext.asyncio import AsyncSession

from app.models.milestone import Milestone
from app.models.roadmap_item import RoadmapItem
from app.repositories import milestone_repo
from app.schemas.milestone import MilestoneCreate, MilestoneResponse, MilestoneUpdate
from app.services.errors import NotFoundError


async def list_milestones(session: AsyncSession, department_id: int) -> list[Milestone]:
    return await milestone_repo.list_for_department(session, department_id)


async def list_milestones_for_user(
    session: AsyncSession, user_id: int, goal_id: int | None = None, department_id: int | None = None
) -> list[Milestone]:
    return await milestone_repo.list_for_user(session, user_id, goal_id=goal_id, department_id=department_id)


async def enrich_milestone_response(session: AsyncSession, milestone: Milestone) -> MilestoneResponse:
    # Check linked roadmap items (sub-skills) first
    r_items = await milestone_repo.list_linked_roadmap_items(session, milestone.id)
    if r_items:
        skill_ids = [item.id for item in r_items]
        skill_names = [item.name for item in r_items]
        skills_total_count = len(r_items)
        skills_completed_count = sum(1 for item in r_items if item.status == "completed")
        calc_progress = round(sum(item.progress for item in r_items) / len(r_items))
        resp = MilestoneResponse.model_validate(milestone)
        resp.skill_ids = skill_ids
        resp.skill_names = skill_names
        resp.skills_total_count = skills_total_count
        resp.skills_completed_count = skills_completed_count
        resp.progress = calc_progress
        return resp

    # Fallback to legacy skills
    skill_ids = await milestone_repo.list_linked_skill_ids(session, milestone.id)
    skills = await milestone_repo.list_linked_skills(session, milestone.id)
    resp = MilestoneResponse.model_validate(milestone)
    resp.skill_ids = skill_ids
    resp.skill_names = [s.name for s in skills]
    resp.skills_total_count = len(skills)
    resp.skills_completed_count = sum(1 for s in skills if s.status == "completed")
    return resp


async def get_milestone_or_404(session: AsyncSession, milestone_id: int, user_id: int) -> Milestone:
    milestone = await milestone_repo.get_for_user(session, milestone_id, user_id)
    if milestone is None:
        raise NotFoundError()
    return milestone


async def create_milestone(session: AsyncSession, department_id: int, data: MilestoneCreate) -> Milestone:
    fields = data.model_dump(exclude={"skill_ids", "department_id"})
    milestone = await milestone_repo.create(session, department_id=department_id, **fields)
    if data.skill_ids:
        for sid in data.skill_ids:
            r_item = await session.get(RoadmapItem, sid)
            if r_item is not None:
                await milestone_repo.link_roadmap_item(session, milestone.id, sid)
            else:
                await milestone_repo.link_skill(session, milestone.id, sid)
    return milestone


async def update_milestone(session: AsyncSession, milestone: Milestone, data: MilestoneUpdate) -> Milestone:
    updates = data.model_dump(exclude_unset=True, exclude={"skill_ids"})
    for field, value in updates.items():
        setattr(milestone, field, value)
    if data.skill_ids is not None:
        current_r_skills = await milestone_repo.list_linked_roadmap_item_ids(session, milestone.id)
        for sid in current_r_skills:
            if sid not in data.skill_ids:
                await milestone_repo.unlink_roadmap_item(session, milestone.id, sid)
        for sid in data.skill_ids:
            if sid not in current_r_skills:
                r_item = await session.get(RoadmapItem, sid)
                if r_item is not None:
                    await milestone_repo.link_roadmap_item(session, milestone.id, sid)
                else:
                    await milestone_repo.link_skill(session, milestone.id, sid)
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
