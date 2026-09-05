import hashlib
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


def hash_token_id(jti: str) -> str:
    return hashlib.sha256(jti.encode("utf-8")).hexdigest()


async def create(session: AsyncSession, user_id: int, jti: str, expires_at: datetime) -> RefreshToken:
    token = RefreshToken(user_id=user_id, token_hash=hash_token_id(jti), expires_at=expires_at)
    session.add(token)
    await session.flush()
    return token


async def get_active_by_jti(session: AsyncSession, jti: str) -> RefreshToken | None:
    result = await session.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_token_id(jti),
            RefreshToken.revoked.is_(False),
        )
    )
    return result.scalar_one_or_none()


async def revoke(session: AsyncSession, token: RefreshToken) -> None:
    token.revoked = True
    await session.flush()


async def revoke_all_for_user(session: AsyncSession, user_id: int) -> None:
    result = await session.execute(
        select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
    )
    for token in result.scalars():
        token.revoked = True
    await session.flush()
