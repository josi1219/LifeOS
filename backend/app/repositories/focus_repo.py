from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.current_focus import CurrentFocus


async def get_for_user(session: AsyncSession, user_id: int) -> CurrentFocus | None:
    result = await session.execute(select(CurrentFocus).where(CurrentFocus.user_id == user_id))
    return result.scalar_one_or_none()


async def create(session: AsyncSession, user_id: int, **fields) -> CurrentFocus:
    focus = CurrentFocus(user_id=user_id, **fields)
    session.add(focus)
    await session.flush()
    return focus
