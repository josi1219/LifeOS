from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.project import Project
from app.models.task import Task


async def list_for_project(session: AsyncSession, project_id: int) -> list[Task]:
    result = await session.execute(
        select(Task).where(Task.project_id == project_id).order_by(Task.created_at)
    )
    return list(result.scalars())


async def get_for_user(session: AsyncSession, task_id: int, user_id: int) -> Task | None:
    result = await session.execute(
        select(Task)
        .join(Project, Project.id == Task.project_id)
        .join(Department, Department.id == Project.department_id)
        .where(Task.id == task_id, Department.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create(session: AsyncSession, project_id: int, **fields) -> Task:
    task = Task(project_id=project_id, **fields)
    session.add(task)
    await session.flush()
    return task


async def delete(session: AsyncSession, task: Task) -> None:
    await session.delete(task)
    await session.flush()
