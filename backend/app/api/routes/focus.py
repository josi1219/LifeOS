from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.focus import FocusOverrideRequest, FocusResponse
from app.services import focus_service
from app.services.errors import NotFoundError

router = APIRouter(prefix="/api/focus", tags=["focus"])


@router.get("", response_model=FocusResponse)
async def get_focus(
    current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)
) -> FocusResponse:
    return await focus_service.resolve_current_focus(session, current_user.id)


@router.patch("", response_model=FocusResponse)
async def set_focus_override(
    payload: FocusOverrideRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> FocusResponse:
    try:
        focus = await focus_service.set_manual_override(session, current_user.id, payload)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department or goal not found") from exc
    await session.commit()
    return focus


@router.delete("/override", response_model=FocusResponse)
async def clear_focus_override(
    current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)
) -> FocusResponse:
    focus = await focus_service.clear_manual_override(session, current_user.id)
    await session.commit()
    return focus
