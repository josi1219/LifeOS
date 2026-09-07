from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.change import ChangeRecordResponse
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate
from app.services import department_service, goal_service
from app.services.errors import NotFoundError

router = APIRouter(prefix="/api", tags=["goals"])


@router.get("/goals", response_model=list[GoalResponse])
async def list_user_goals(
    current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)
) -> list[GoalResponse]:
    goals = await goal_service.list_goals_for_user(session, current_user.id)
    return [await goal_service.enrich_goal_response(session, goal) for goal in goals]


@router.post("/goals", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_user_goal(
    payload: GoalCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> GoalResponse:
    dept_id = payload.department_id
    if dept_id is None:
        from app.repositories import department_repo
        user_depts = await department_repo.list_for_user(session, current_user.id)
        if user_depts:
            dept_id = user_depts[0].id
        else:
            dept = await department_repo.create(session, user_id=current_user.id, name="General")
            dept_id = dept.id
    try:
        department = await department_service.get_department_or_404(session, dept_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    goal = await goal_service.create_goal(session, department, payload)
    await session.commit()
    return await goal_service.enrich_goal_response(session, goal)


@router.get("/departments/{department_id}/goals", response_model=list[GoalResponse])
async def list_goals(
    department_id: int, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)
) -> list[GoalResponse]:
    try:
        department = await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    goals = await goal_service.list_goals(session, department)
    return [await goal_service.enrich_goal_response(session, goal) for goal in goals]


@router.post("/departments/{department_id}/goals", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    department_id: int,
    payload: GoalCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> GoalResponse:
    try:
        department = await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    goal = await goal_service.create_goal(session, department, payload)
    await session.commit()
    return await goal_service.enrich_goal_response(session, goal)


@router.get("/goals/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)
) -> GoalResponse:
    try:
        goal = await goal_service.get_goal_or_404(session, goal_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found") from exc
    return await goal_service.enrich_goal_response(session, goal)


@router.patch("/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> GoalResponse:
    try:
        goal = await goal_service.get_goal_or_404(session, goal_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found") from exc
    goal = await goal_service.update_goal(session, goal, current_user.id, payload)
    await session.commit()
    return await goal_service.enrich_goal_response(session, goal)


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)
) -> None:
    try:
        goal = await goal_service.get_goal_or_404(session, goal_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found") from exc
    await goal_service.delete_goal(session, goal)
    await session.commit()


@router.get("/goals/{goal_id}/changes", response_model=list[ChangeRecordResponse])
async def get_goal_changes(
    goal_id: int, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)
) -> list[ChangeRecordResponse]:
    try:
        goal = await goal_service.get_goal_or_404(session, goal_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found") from exc
    changes = await goal_service.list_changes(session, goal)
    return [ChangeRecordResponse.model_validate(change) for change in changes]
