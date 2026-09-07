from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.time_session import (
    TimeSessionManualCreate,
    TimeSessionResponse,
    TimeSessionStartRequest,
    TimeSessionStopRequest,
    TimeSummaryResponse,
)
from app.services import time_session_service
from app.services.errors import NotFoundError

router = APIRouter(prefix="/api/time-sessions", tags=["time-sessions"])


# Static routes first to avoid path collisions with /{session_id}
@router.get("/active", response_model=TimeSessionResponse | None)
async def get_active_session(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> TimeSessionResponse | None:
    return await time_session_service.get_active_session(session, current_user.id)


@router.post("/start", response_model=TimeSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    payload: TimeSessionStartRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> TimeSessionResponse:
    try:
        ts = await time_session_service.start_session(session, current_user.id, payload)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Associated entity not found"
        ) from exc
    await session.commit()
    return ts


@router.post("/manual", response_model=TimeSessionResponse, status_code=status.HTTP_201_CREATED)
async def log_manual_session(
    payload: TimeSessionManualCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> TimeSessionResponse:
    try:
        ts = await time_session_service.log_manual_session(session, current_user.id, payload)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Associated entity not found"
        ) from exc
    await session.commit()
    return ts


@router.get("/summary", response_model=TimeSummaryResponse)
async def get_time_summary(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> TimeSummaryResponse:
    return await time_session_service.get_summary(session, current_user.id)


@router.get("", response_model=list[TimeSessionResponse])
async def list_sessions(
    department_id: int | None = Query(default=None),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[TimeSessionResponse]:
    return await time_session_service.list_sessions(
        session,
        current_user.id,
        department_id=department_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )


# Parameterized routes
@router.post("/{session_id}/pause", response_model=TimeSessionResponse)
async def pause_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> TimeSessionResponse:
    try:
        ts = await time_session_service.pause_session(session, session_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Time session not found"
        ) from exc
    await session.commit()
    return ts


@router.post("/{session_id}/resume", response_model=TimeSessionResponse)
async def resume_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> TimeSessionResponse:
    try:
        ts = await time_session_service.resume_session(session, session_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Time session not found"
        ) from exc
    await session.commit()
    return ts


@router.post("/{session_id}/stop", response_model=TimeSessionResponse)
async def stop_session(
    session_id: int,
    payload: TimeSessionStopRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> TimeSessionResponse:
    try:
        ts = await time_session_service.stop_session(session, session_id, current_user.id, payload)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Time session not found"
        ) from exc
    await session.commit()
    return ts


@router.post("/{session_id}/discard", status_code=status.HTTP_204_NO_CONTENT)
async def discard_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    try:
        await time_session_service.discard_session(session, session_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Time session not found"
        ) from exc
    await session.commit()
