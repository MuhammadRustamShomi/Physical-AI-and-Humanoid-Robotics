"""Chat session Pydantic models."""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ChatSessionCreate(BaseModel):
    """Request model for creating a new chat session."""

    metadata: dict[str, Any] | None = Field(
        default=None,
        description="Optional metadata (initial_chapter_id, user_agent, referrer)",
    )


class ChatSession(BaseModel):
    """Chat session model."""

    id: str = Field(..., description="Unique session identifier (sess-{uuid})")
    created_at: datetime = Field(..., description="Session creation timestamp")
    updated_at: datetime = Field(..., description="Last activity timestamp")
    expires_at: datetime = Field(..., description="Session expiration timestamp (24h TTL)")
    metadata: dict[str, Any] | None = Field(
        default=None,
        description="Session metadata",
    )

    class Config:
        """Pydantic config."""

        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "sess-abc123",
                "created_at": "2026-01-08T10:00:00Z",
                "updated_at": "2026-01-08T10:30:00Z",
                "expires_at": "2026-01-09T10:30:00Z",
                "metadata": {
                    "initial_chapter_id": "ch-2-3",
                    "user_agent": "Mozilla/5.0...",
                },
            }
        }


class ChatSessionWithMessages(ChatSession):
    """Chat session with message history."""

    messages: list["Message"] = Field(default_factory=list)


# Avoid circular import
from .message import Message  # noqa: E402

ChatSessionWithMessages.model_rebuild()
