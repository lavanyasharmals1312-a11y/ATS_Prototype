from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict


T = TypeVar("T")


class BaseResponse(BaseModel):
    """Standard success envelope used across all routes."""

    model_config = ConfigDict(from_attributes=True)

    success: bool
    message: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list envelope. Generic over the item type T."""

    model_config = ConfigDict(from_attributes=True)

    items: List[T]
    total: int
    page: int
    pages: int
    page_size: int


class ErrorResponse(BaseModel):
    """Standard error envelope."""

    model_config = ConfigDict(from_attributes=True)

    success: bool = False
    error: str
    detail: Optional[dict] = None
