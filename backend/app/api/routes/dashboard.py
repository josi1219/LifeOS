from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.dashboard import DashboardOverviewResponse
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_overview(
    current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)
) -> DashboardOverviewResponse:
    return await dashboard_service.get_overview(session, current_user.id)
