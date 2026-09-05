from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.experiment import (
    ExperimentCreate,
    ExperimentResponse,
    ExperimentStatusRequest,
    ExperimentUpdate,
)
from app.services import experiment_service
from app.services.errors import NotFoundError
from app.services.experiment_service import InvalidStatusTransitionError

router = APIRouter(prefix="/api/experiments", tags=["experiments"])


@router.get("", response_model=list[ExperimentResponse])
async def list_experiments(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[ExperimentResponse]:
    experiments = await experiment_service.list_experiments(session, current_user.id)
    return [ExperimentResponse.model_validate(experiment) for experiment in experiments]


@router.post("", response_model=ExperimentResponse, status_code=status.HTTP_201_CREATED)
async def create_experiment(
    payload: ExperimentCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ExperimentResponse:
    experiment = await experiment_service.create_experiment(session, current_user.id, payload)
    await session.commit()
    return ExperimentResponse.model_validate(experiment)


# Registered before "/{experiment_id}" routes to avoid path conflicts.
@router.post("/{experiment_id}/status", response_model=ExperimentResponse)
async def transition_experiment_status(
    experiment_id: int,
    payload: ExperimentStatusRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ExperimentResponse:
    try:
        experiment = await experiment_service.get_experiment_or_404(session, experiment_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found") from exc
    try:
        experiment = await experiment_service.transition_status(session, experiment, payload)
    except InvalidStatusTransitionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    await session.commit()
    return ExperimentResponse.model_validate(experiment)


@router.get("/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ExperimentResponse:
    try:
        experiment = await experiment_service.get_experiment_or_404(session, experiment_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found") from exc
    return ExperimentResponse.model_validate(experiment)


@router.patch("/{experiment_id}", response_model=ExperimentResponse)
async def update_experiment(
    experiment_id: int,
    payload: ExperimentUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ExperimentResponse:
    try:
        experiment = await experiment_service.get_experiment_or_404(session, experiment_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found") from exc
    experiment = await experiment_service.update_experiment(session, experiment, payload)
    await session.commit()
    return ExperimentResponse.model_validate(experiment)


@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experiment(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        experiment = await experiment_service.get_experiment_or_404(session, experiment_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found") from exc
    await experiment_service.delete_experiment(session, experiment)
    await session.commit()
