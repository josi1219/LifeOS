import os
import re
import uuid

import pytest_asyncio
from httpx import ASGITransport, AsyncClient


def _derive_test_database_url() -> str:
    if explicit := os.environ.get("TEST_DATABASE_URL"):
        return explicit
    base_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://lifeos:lifeos@localhost:5432/lifeos")
    return re.sub(r"/[^/]+$", "/lifeos_test", base_url)


# Must happen before any `app.*` import so app.core.config.get_settings() reads the test database URL.
os.environ["DATABASE_URL"] = _derive_test_database_url()
# See app/database/session.py — avoids asyncpg connections leaking across pytest-asyncio's per-test event loops.
os.environ["SQLALCHEMY_NULLPOOL"] = "1"

from app.database.base import Base  # noqa: E402
from app.database.session import engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _prepare_database():
    import app.models  # noqa: F401  (registers every model on Base.metadata)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def unique_email() -> str:
    return f"user-{uuid.uuid4().hex[:12]}@example.com"


def auth_headers(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


async def register_user(client: AsyncClient, email: str | None = None, password: str = "StrongPass123!") -> dict:
    email = email or unique_email()
    res = await client.post("/api/auth/register", json={"email": email, "password": password})
    assert res.status_code == 201, res.text
    body = res.json()
    body["email"] = email
    body["password"] = password
    return body
