from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.department_change import DepartmentChange
from app.repositories import department_repo
from app.schemas.department import DepartmentCreate, DepartmentUpdate
from app.services.change_history import record_field_changes
from app.services.errors import NotFoundError

TRACKED_FIELDS = ["name", "description", "purpose", "long_term_goal", "status", "current_phase", "secondary_purpose"]


async def list_departments(session: AsyncSession, user_id: int) -> list[Department]:
    return await department_repo.list_for_user(session, user_id)


async def get_department_or_404(session: AsyncSession, department_id: int, user_id: int) -> Department:
    department = await department_repo.get_for_user(session, department_id, user_id)
    if department is None:
        raise NotFoundError()
    return department


async def create_department(session: AsyncSession, user_id: int, data: DepartmentCreate) -> Department:
    priority = data.priority
    if priority is None:
        priority = await department_repo.count_for_user(session, user_id) + 1
    fields = data.model_dump(exclude={"priority"})
    return await department_repo.create(session, user_id=user_id, priority=priority, **fields)


async def update_department(
    session: AsyncSession, department: Department, user_id: int, data: DepartmentUpdate
) -> Department:
    updates = data.model_dump(exclude={"reason"}, exclude_unset=True)
    before = {field: getattr(department, field) for field in updates}
    for field, value in updates.items():
        setattr(department, field, value)
    await session.flush()
    await record_field_changes(
        session, DepartmentChange, "department_id", department.id, user_id, before, updates, data.reason
    )
    return department


async def delete_department(session: AsyncSession, department: Department) -> None:
    await department_repo.delete(session, department)


async def reorder_departments(session: AsyncSession, user_id: int, ordered_ids: list[int]) -> list[Department]:
    departments = await department_repo.list_for_user(session, user_id)
    by_id = {department.id: department for department in departments}

    if set(ordered_ids) != set(by_id.keys()):
        raise NotFoundError()

    for index, department_id in enumerate(ordered_ids, start=1):
        department = by_id[department_id]
        if department.priority != index:
            before = {"priority": department.priority}
            department.priority = index
            await session.flush()
            await record_field_changes(
                session, DepartmentChange, "department_id", department.id, user_id, before, {"priority": index}
            )
    return await department_repo.list_for_user(session, user_id)


async def list_changes(session: AsyncSession, department: Department) -> list[DepartmentChange]:
    return await department_repo.list_changes(session, department.id)
