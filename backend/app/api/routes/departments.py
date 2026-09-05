from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.change import ChangeRecordResponse
from app.schemas.department import (
    DepartmentCreate,
    DepartmentReorderRequest,
    DepartmentResponse,
    DepartmentUpdate,
)
from app.services import department_service
from app.services.errors import NotFoundError

router = APIRouter(prefix="/api/departments", tags=["departments"])


@router.get("", response_model=list[DepartmentResponse])
async def list_departments(
    current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)
) -> list[DepartmentResponse]:
    departments = await department_service.list_departments(session, current_user.id)
    return [DepartmentResponse.model_validate(department) for department in departments]


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    payload: DepartmentCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> DepartmentResponse:
    department = await department_service.create_department(session, current_user.id, payload)
    await session.commit()
    return DepartmentResponse.model_validate(department)


# Registered before "/{department_id}" so "reorder" is never captured as a path parameter.
@router.patch("/reorder", response_model=list[DepartmentResponse])
async def reorder_departments(
    payload: DepartmentReorderRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[DepartmentResponse]:
    try:
        departments = await department_service.reorder_departments(session, current_user.id, payload.ordered_ids)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    await session.commit()
    return [DepartmentResponse.model_validate(department) for department in departments]


@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_department(
    department_id: int, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)
) -> DepartmentResponse:
    try:
        department = await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    return DepartmentResponse.model_validate(department)


@router.patch("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: int,
    payload: DepartmentUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> DepartmentResponse:
    try:
        department = await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    department = await department_service.update_department(session, department, current_user.id, payload)
    await session.commit()
    return DepartmentResponse.model_validate(department)


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: int, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)
) -> None:
    try:
        department = await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    await department_service.delete_department(session, department)
    await session.commit()


@router.get("/{department_id}/changes", response_model=list[ChangeRecordResponse])
async def get_department_changes(
    department_id: int, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)
) -> list[ChangeRecordResponse]:
    try:
        department = await department_service.get_department_or_404(session, department_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    changes = await department_service.list_changes(session, department)
    return [ChangeRecordResponse.model_validate(change) for change in changes]
