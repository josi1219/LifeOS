from sqlalchemy.ext.asyncio import AsyncSession

from app.models.roadmap_item import RoadmapItem
from app.repositories import roadmap_item_repo
from app.schemas.roadmap_item import (
    RoadmapItemCreate,
    RoadmapItemResponse,
    RoadmapItemTreeResponse,
    RoadmapItemUpdate,
)
from app.services.errors import NotFoundError, ValidationError


async def get_item_or_404(session: AsyncSession, item_id: int, user_id: int) -> RoadmapItem:
    item = await roadmap_item_repo.get_for_user(session, item_id, user_id)
    if item is None:
        raise NotFoundError()
    return item


async def get_item_response(session: AsyncSession, item: RoadmapItem) -> RoadmapItemResponse:
    prereq_ids = await roadmap_item_repo.list_prerequisite_ids(session, item.id)
    resp = RoadmapItemResponse.model_validate(item)
    resp.prerequisite_ids = prereq_ids
    return resp



async def get_tree(session: AsyncSession, roadmap_id: int) -> list[RoadmapItemTreeResponse]:
    items = await roadmap_item_repo.list_for_roadmap(session, roadmap_id)

    # Build prerequisite map
    prereq_map: dict[int, list[int]] = {}
    for item in items:
        prereq_map[item.id] = await roadmap_item_repo.list_prerequisite_ids(session, item.id)

    # Build flat response objects
    item_responses: dict[int, dict] = {}
    for item in items:
        item_responses[item.id] = {
            "id": item.id,
            "roadmap_id": item.roadmap_id,
            "parent_id": item.parent_id,
            "name": item.name,
            "description": item.description,
            "status": item.status,
            "progress": item.progress,
            "estimated_hours": item.estimated_hours,
            "sort_order": item.sort_order,
            "prerequisite_ids": prereq_map.get(item.id, []),
            "children": [],
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }

    # Assemble tree
    roots: list[dict] = []
    for item in items:
        data = item_responses[item.id]
        if item.parent_id is not None and item.parent_id in item_responses:
            item_responses[item.parent_id]["children"].append(data)
        else:
            roots.append(data)

    return [RoadmapItemTreeResponse(**r) for r in roots]


async def get_flat_items(session: AsyncSession, roadmap_id: int) -> list[RoadmapItemResponse]:
    items = await roadmap_item_repo.list_for_roadmap(session, roadmap_id)
    result = []
    for item in items:
        prereq_ids = await roadmap_item_repo.list_prerequisite_ids(session, item.id)
        resp = RoadmapItemResponse.model_validate(item)
        resp.prerequisite_ids = prereq_ids
        result.append(resp)
    return result


async def create_item(session: AsyncSession, roadmap_id: int, data: RoadmapItemCreate) -> RoadmapItem:
    if data.parent_id is not None:
        parent = await session.get(RoadmapItem, data.parent_id)
        if parent is not None and parent.estimated_hours is not None:
            existing_children = await roadmap_item_repo.list_children(session, data.parent_id)
            allocated = sum(c.estimated_hours or 0.0 for c in existing_children)
            new_sub_hours = data.estimated_hours or 0.0
            if allocated + new_sub_hours > parent.estimated_hours:
                raise ValidationError(
                    f"Sub-skills total allocated hours ({allocated + new_sub_hours}h) cannot exceed parent step allocated hours ({parent.estimated_hours}h)."
                )
    fields = data.model_dump()
    return await roadmap_item_repo.create(session, roadmap_id=roadmap_id, **fields)


async def update_item(session: AsyncSession, item: RoadmapItem, data: RoadmapItemUpdate) -> RoadmapItem:
    updates = data.model_dump(exclude_unset=True)
    if "estimated_hours" in updates and item.parent_id is not None:
        parent = await session.get(RoadmapItem, item.parent_id)
        if parent is not None and parent.estimated_hours is not None:
            existing_children = await roadmap_item_repo.list_children(session, item.parent_id)
            allocated = sum(c.estimated_hours or 0.0 for c in existing_children if c.id != item.id)
            new_sub_hours = updates["estimated_hours"] or 0.0
            if allocated + new_sub_hours > parent.estimated_hours:
                raise ValidationError(
                    f"Sub-skills total allocated hours ({allocated + new_sub_hours}h) cannot exceed parent step allocated hours ({parent.estimated_hours}h)."
                )
    for field, value in updates.items():
        setattr(item, field, value)
    await session.flush()
    return item


async def delete_item(session: AsyncSession, item: RoadmapItem) -> None:
    await roadmap_item_repo.delete(session, item)


async def reorder_items(
    session: AsyncSession, roadmap_id: int, ordered_ids: list[int]
) -> list[RoadmapItem]:
    """Update sort_order for items based on their position in ordered_ids."""
    items = await roadmap_item_repo.list_for_roadmap(session, roadmap_id)
    id_to_item = {item.id: item for item in items}
    result: list[RoadmapItem] = []
    for idx, item_id in enumerate(ordered_ids):
        if item_id in id_to_item:
            id_to_item[item_id].sort_order = idx
            result.append(id_to_item[item_id])
    await session.flush()
    return result


async def add_prerequisite(
    session: AsyncSession, item_id: int, prerequisite_id: int, user_id: int
) -> None:
    # Validate both items belong to the same user
    item = await roadmap_item_repo.get_for_user(session, item_id, user_id)
    if item is None:
        raise NotFoundError()
    prereq = await roadmap_item_repo.get_for_user(session, prerequisite_id, user_id)
    if prereq is None:
        raise NotFoundError()
    await roadmap_item_repo.add_prerequisite(session, item_id, prerequisite_id)


async def remove_prerequisite(
    session: AsyncSession, item_id: int, prerequisite_id: int, user_id: int
) -> None:
    item = await roadmap_item_repo.get_for_user(session, item_id, user_id)
    if item is None:
        raise NotFoundError()
    await roadmap_item_repo.remove_prerequisite(session, item_id, prerequisite_id)
