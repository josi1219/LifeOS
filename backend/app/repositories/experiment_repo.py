from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.experiment import Experiment


async def list_for_user(session: AsyncSession, user_id: int) -> list[Experiment]:
    result = await session.execute(
        select(Experiment).where(Experiment.user_id == user_id).order_by(Experiment.created_at.desc())
    )
    return list(result.scalars())


async def get_for_user(session: AsyncSession, experiment_id: int, user_id: int) -> Experiment | None:
    result = await session.execute(
        select(Experiment).where(Experiment.id == experiment_id, Experiment.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create(session: AsyncSession, user_id: int, **fields) -> Experiment:
    experiment = Experiment(user_id=user_id, **fields)
    session.add(experiment)
    await session.flush()
    return experiment


async def delete(session: AsyncSession, experiment: Experiment) -> None:
    await session.delete(experiment)
    await session.flush()
