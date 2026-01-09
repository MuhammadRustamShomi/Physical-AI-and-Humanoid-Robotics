"""Chat API endpoints."""
from datetime import datetime, timedelta, timezone
import uuid

from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.models.message import ChatResponse, MessageCreate, Source
from app.models.session import ChatSession, ChatSessionWithMessages
from app.services.rag import RAGQueryEngine, get_rag_engine
from app.services.oos_detector import OutOfScopeDetector, get_oos_detector

router = APIRouter(prefix="/chat", tags=["chat"])

# In-memory session store (replace with PostgreSQL in production)
_sessions: dict[str, dict] = {}


def create_session(metadata: dict | None = None) -> ChatSession:
    """Create a new chat session."""
    now = datetime.now(timezone.utc)
    session_id = f"sess-{uuid.uuid4().hex[:12]}"
    settings = get_settings()

    session = ChatSession(
        id=session_id,
        created_at=now,
        updated_at=now,
        expires_at=now + timedelta(hours=settings.session_ttl_hours),
        metadata=metadata,
    )

    _sessions[session_id] = {
        "session": session,
        "messages": [],
    }

    return session


def get_session(session_id: str) -> dict | None:
    """Get a session by ID."""
    session_data = _sessions.get(session_id)
    if not session_data:
        return None

    # Check expiration
    if session_data["session"].expires_at < datetime.now(timezone.utc):
        del _sessions[session_id]
        return None

    return session_data


@router.post("/message", response_model=ChatResponse)
async def send_message(message: MessageCreate) -> ChatResponse:
    """
    Send a message and receive an AI response.

    This endpoint:
    1. Creates or retrieves a chat session
    2. Checks if the question is in scope
    3. Retrieves relevant context from the textbook
    4. Generates a response using Claude
    5. Returns the response with source citations
    """
    settings = get_settings()

    # Get or create session
    session_id = message.session_id
    if session_id:
        session_data = get_session(session_id)
        if not session_data:
            # Session expired or not found, create new
            session = create_session({"initial_chapter_id": message.chapter_id})
            session_id = session.id
        else:
            session = session_data["session"]
            # Update session activity
            session.updated_at = datetime.now(timezone.utc)
            session.expires_at = session.updated_at + timedelta(hours=settings.session_ttl_hours)
    else:
        session = create_session({"initial_chapter_id": message.chapter_id})
        session_id = session.id

    session_data = _sessions[session_id]

    try:
        # Check if question is out of scope
        oos_detector = get_oos_detector()
        oos_result = await oos_detector.check(message.content)

        if oos_result.is_out_of_scope:
            return ChatResponse(
                session_id=session_id,
                response=oos_result.response,
                sources=[],
                error=None,
            )

        # Query RAG engine
        rag_engine = get_rag_engine()
        rag_result = await rag_engine.query(
            question=message.content,
            chapter_id=message.chapter_id,
            selected_text=message.selected_text,
            conversation_history=session_data["messages"],
        )

        # Store messages
        now = datetime.now(timezone.utc)
        user_msg = {
            "id": f"msg-{uuid.uuid4().hex[:12]}",
            "role": "user",
            "content": message.content,
            "created_at": now.isoformat(),
            "chapter_id": message.chapter_id,
            "selected_text": message.selected_text,
        }
        assistant_msg = {
            "id": f"msg-{uuid.uuid4().hex[:12]}",
            "role": "assistant",
            "content": rag_result.response,
            "created_at": now.isoformat(),
            "chapter_id": message.chapter_id,
            "sources": [s.model_dump() for s in rag_result.sources],
        }

        session_data["messages"].extend([user_msg, assistant_msg])

        return ChatResponse(
            session_id=session_id,
            response=rag_result.response,
            sources=rag_result.sources,
            error=None,
        )

    except Exception as e:
        return ChatResponse(
            session_id=session_id,
            response="I apologize, but I encountered an error processing your question. Please try again.",
            sources=[],
            error=str(e),
        )


@router.get("/session/{session_id}", response_model=ChatSessionWithMessages)
async def get_chat_session(session_id: str) -> ChatSessionWithMessages:
    """
    Retrieve a chat session with its message history.

    Returns the session metadata and all messages in chronological order.
    """
    session_data = get_session(session_id)

    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    from app.models.message import Message, MessageRole

    messages = [
        Message(
            id=m["id"],
            session_id=session_id,
            role=MessageRole(m["role"]),
            content=m["content"],
            created_at=datetime.fromisoformat(m["created_at"]),
            chapter_id=m.get("chapter_id"),
            selected_text=m.get("selected_text"),
            sources=[Source(**s) for s in m.get("sources", [])] if m.get("sources") else None,
        )
        for m in session_data["messages"]
    ]

    return ChatSessionWithMessages(
        **session_data["session"].model_dump(),
        messages=messages,
    )
