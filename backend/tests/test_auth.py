from httpx import AsyncClient

from conftest import register_user, unique_email


async def test_register_creates_user_and_returns_access_token(client: AsyncClient):
    res = await client.post("/api/auth/register", json={"email": unique_email(), "password": "StrongPass123!"})
    assert res.status_code == 201
    assert "access_token" in res.json()
    assert "refresh_token" in client.cookies


async def test_register_rejects_duplicate_email(client: AsyncClient):
    email = unique_email()
    await client.post("/api/auth/register", json={"email": email, "password": "StrongPass123!"})
    res = await client.post("/api/auth/register", json={"email": email, "password": "AnotherPass123!"})
    assert res.status_code == 409


async def test_login_with_wrong_password_is_rejected(client: AsyncClient):
    email = unique_email()
    await client.post("/api/auth/register", json={"email": email, "password": "StrongPass123!"})
    res = await client.post("/api/auth/login", json={"email": email, "password": "WrongPassword"})
    assert res.status_code == 401


async def test_me_requires_valid_access_token(client: AsyncClient):
    res = await client.get("/api/auth/me")
    assert res.status_code == 401


async def test_me_returns_current_user(client: AsyncClient):
    user = await register_user(client)
    res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {user['access_token']}"})
    assert res.status_code == 200
    assert res.json()["email"] == user["email"]


async def test_refresh_rotates_token_and_logout_revokes_it(client: AsyncClient):
    await register_user(client)

    refresh_res = await client.post("/api/auth/refresh")
    assert refresh_res.status_code == 200
    assert refresh_res.json()["access_token"]

    logout_res = await client.post("/api/auth/logout")
    assert logout_res.status_code == 204

    second_refresh = await client.post("/api/auth/refresh")
    assert second_refresh.status_code == 401


async def test_refresh_without_cookie_is_rejected(client: AsyncClient):
    res = await client.post("/api/auth/refresh")
    assert res.status_code == 401
