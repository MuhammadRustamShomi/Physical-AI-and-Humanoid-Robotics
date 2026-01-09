"""Message Pydantic models."""
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    """Message author role."""

    USER = "user"
    ASSISTANT = "assistant"


class Source(BaseModel):
    """RAG source citation."""

    chunk_id: str = Field(..., description="Content block ID")
    chapter_id: str = Field(..., description="Source chapter ID")
    section: str = Field(..., description="Section heading path")
    excerpt: str = Field(..., description="Relevant text excerpt")
    relevance_score: float = Field(..., ge=0, le=1, description="Relevance score 0-1")


class MessageCreate(BaseModel):
    """Request model for creating a new message."""

    session_id: str | None = Field(
        default=None,
        description="Existing session ID (optional, creates new if not provided)",
    )
    chapter_id: str | None = Field(
        default=None,
        description="Current chapter context",
    )
    content: str = Field(..., min_length=1, max_length=4000, description="User message text")
    selected_text: str | None = Field(
        default=None,
        max_length=2000,
        description="Highlighted text context (FR-007)",
    )


class Message(BaseModel):
    """Message model."""

    id: str = Field(..., description="Unique message identifier (msg-{uuid})")
    session_id: str = Field(..., description="Parent session ID")
    role: MessageRole = Field(..., description="Message author (user/assistant)")
    content: str = Field(..., description="Message text content")
    created_at: datetime = Field(..., description="Message timestamp")
    chapter_id: str | None = Field(default=None, description="Context chapter")
    selected_text: str | None = Field(default=None, description="Highlighted text (user messages)")
    sources: list[Source] | None = Field(default=None, description="RAG citations (assistant messages)")

    class Config:
        """Pydantic config."""

        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "msg-xyz789",
                "session_id": "sess-abc123",
                "role": "assistant",
                "content": "ROS 2 topics use a publish-subscribe pattern...",
                "created_at": "2026-01-08T10:31:00Z",
                "chapter_id": "ch-2-3",
                "selected_text": None,
                "sources": [
                    {
                        "chunk_id": "cb-123",
                        "chapter_id": "ch-2-3",
                        "section": "2.3.1 ROS 2 Topics",
                        "excerpt": "Topics use publish-subscribe...",
                        "relevance_score": 0.87,
                    }
                ],
            }
        }


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""

    session_id: str = Field(..., description="Session ID (new or existing)")
    response: str = Field(..., description="Assistant response text")
    sources: list[Source] = Field(default_factory=list, description="Source citations")
    error: str | None = Field(default=None, description="Error message if applicable")

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "session_id": "sess-abc123",
                "response": "Based on the textbook, ROS 2 topics use a publish-subscribe pattern...",
                "sources": [
                    {
                        "chunk_id": "cb-123",
                        "chapter_id": "ch-2-3",
                        "section": "2.3.1 ROS 2 Topics",
                        "excerpt": "Topics use publish-subscribe...",
                        "relevance_score": 0.87,
                    }
                ],
                "error": None,
            }
        }
