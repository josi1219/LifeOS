from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession


async def record_field_changes(
    session: AsyncSession,
    change_model: type,
    fk_field: str,
    entity_id: int,
    user_id: int,
    before: dict[str, Any],
    after: dict[str, Any],
    reason: str | None = None,
) -> None:
    """Diffs `before`/`after` field snapshots and inserts one append-only change row per changed field."""
    for field_name, previous_value in before.items():
        new_value = after.get(field_name)
        if previous_value == new_value:
            continue
        session.add(
            change_model(
                **{fk_field: entity_id},
                user_id=user_id,
                field_name=field_name,
                previous_value=None if previous_value is None else str(previous_value),
                new_value=None if new_value is None else str(new_value),
                reason=reason,
            )
        )
    await session.flush()
