from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base so Alembic and `create_all` see every model."""

    # Forces RETURNING on INSERT/UPDATE so server-generated columns (e.g. onupdate=func.now()) are populated
    # on the object immediately — without this, accessing them post-commit triggers an async lazy-load that
    # fails outside of a greenlet context (MissingGreenlet).
    __mapper_args__ = {"eager_defaults": True}
