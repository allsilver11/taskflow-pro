from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

_ALLOWED_STATUS = {"todo", "in_progress", "done"}


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: str = Field(default="todo")
    due_at: Optional[datetime] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in _ALLOWED_STATUS:
            raise ValueError(f"허용된 status 값: {sorted(_ALLOWED_STATUS)}")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[str] = None
    due_at: Optional[datetime] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in _ALLOWED_STATUS:
            raise ValueError(f"허용된 status 값: {sorted(_ALLOWED_STATUS)}")
        return v


class TaskListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: str
    due_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class TaskDetail(TaskListItem):
    description: Optional[str]
