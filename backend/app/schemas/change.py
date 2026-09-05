from datetime import datetime

from pydantic import BaseModel


class ChangeRecordResponse(BaseModel):
    id: int
    field_name: str
    previous_value: str | None
    new_value: str | None
    reason: str | None
    changed_at: datetime

    model_config = {"from_attributes": True}
