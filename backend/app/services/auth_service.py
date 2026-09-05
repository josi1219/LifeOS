from datetime import datetime

import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.models.user import User
from app.repositories import refresh_token_repo, user_repo


class EmailAlreadyRegisteredError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class InvalidRefreshTokenError(Exception):
    pass


async def register(session: AsyncSession, email: str, password: str) -> User:
    if await user_repo.get_by_email(session, email) is not None:
        raise EmailAlreadyRegisteredError()
    return await user_repo.create(session, email=email, hashed_password=hash_password(password))


async def authenticate(session: AsyncSession, email: str, password: str) -> User:
    user = await user_repo.get_by_email(session, email)
    if user is None or not verify_password(password, user.hashed_password):
        raise InvalidCredentialsError()
    return user


async def issue_tokens(session: AsyncSession, user: User) -> tuple[str, str, datetime]:
    access_token = create_access_token(user.id)
    refresh_token, jti, expires_at = create_refresh_token(user.id)
    await refresh_token_repo.create(session, user_id=user.id, jti=jti, expires_at=expires_at)
    return access_token, refresh_token, expires_at


async def rotate_refresh_token(session: AsyncSession, refresh_token: str) -> tuple[str, str, datetime]:
    try:
        payload = decode_token(refresh_token, expected_type="refresh")
    except jwt.InvalidTokenError as exc:
        raise InvalidRefreshTokenError() from exc

    stored = await refresh_token_repo.get_active_by_jti(session, payload["jti"])
    if stored is None:
        raise InvalidRefreshTokenError()

    user = await user_repo.get_by_id(session, int(payload["sub"]))
    if user is None:
        raise InvalidRefreshTokenError()

    # Rotate: revoke the presented token and issue a fresh pair, per revocable-refresh-token requirement.
    await refresh_token_repo.revoke(session, stored)
    return await issue_tokens(session, user)


async def logout(session: AsyncSession, refresh_token: str) -> None:
    try:
        payload = decode_token(refresh_token, expected_type="refresh")
    except jwt.InvalidTokenError:
        return
    stored = await refresh_token_repo.get_active_by_jti(session, payload["jti"])
    if stored is not None:
        await refresh_token_repo.revoke(session, stored)
