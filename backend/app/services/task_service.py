from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.repositories import task_repo
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.errors import NotFoundError


async def list_tasks(session: AsyncSession, project_id: int) -> list[Task]:
    return await task_repo.list_for_project(session, project_id)


async def get_task_or_404(session: AsyncSession, task_id: int, user_id: int) -> Task:
    task = await task_repo.get_for_user(session, task_id, user_id)
    if task is None:
        raise NotFoundError()
    return task


async def create_task(session: AsyncSession, project_id: int, data: TaskCreate) -> Task:
    fields = data.model_dump()
    return await task_repo.create(session, project_id=project_id, **fields)


async def update_task(session: AsyncSession, task: Task, data: TaskUpdate) -> Task:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(task, field, value)
    await session.flush()
    return task


async def delete_task(session: AsyncSession, task: Task) -> None:
    await task_repo.delete(session, task)
