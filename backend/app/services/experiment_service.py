from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.experiment import Experiment
from app.repositories import experiment_repo
from app.schemas.experiment import ExperimentCreate, ExperimentStatusRequest, ExperimentUpdate
from app.services.errors import NotFoundError

VALID_STATUSES = {"exploring", "continue", "pause", "reject", "promote"}
TERMINAL_STATUSES = {"reject", "promote"}


class InvalidStatusTransitionError(Exception):
    pass


async def list_experiments(session: AsyncSession, user_id: int) -> list[Experiment]:
    return await experiment_repo.list_for_user(session, user_id)


async def get_experiment_or_404(session: AsyncSession, experiment_id: int, user_id: int) -> Experiment:
    experiment = await experiment_repo.get_for_user(session, experiment_id, user_id)
    if experiment is None:
        raise NotFoundError()
    return experiment


async def create_experiment(session: AsyncSession, user_id: int, data: ExperimentCreate) -> Experiment:
    fields = data.model_dump()
    return await experiment_repo.create(session, user_id=user_id, **fields)


async def update_experiment(session: AsyncSession, experiment: Experiment, data: ExperimentUpdate) -> Experiment:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(experiment, field, value)
    await session.flush()
    return experiment


async def delete_experiment(session: AsyncSession, experiment: Experiment) -> None:
    await experiment_repo.delete(session, experiment)


async def transition_status(
    session: AsyncSession, experiment: Experiment, data: ExperimentStatusRequest
) -> Experiment:
    new_status = data.status
    if new_status not in VALID_STATUSES:
        raise InvalidStatusTransitionError(f"Invalid status: {new_status}")

    if experiment.status in TERMINAL_STATUSES:
        raise InvalidStatusTransitionError(
            f"Cannot transition from terminal status '{experiment.status}'"
        )

    experiment.status = new_status

    # Set completed_at when moving to a terminal status
    if new_status in TERMINAL_STATUSES:
        experiment.completed_at = datetime.now(timezone.utc)

    await session.flush()
    return experiment
