"""
Content API endpoints for personalization and translation.

Provides:
- POST /content/personalize - Personalize chapter for user
- GET /content/personalized/{chapter} - Get personalized version
- DELETE /content/personalized/{chapter} - Revert to original
- POST /content/translate/urdu - Translate content to Urdu
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import hashlib

from app.api.auth import require_auth, get_current_user
from app.models.user import SessionData, UserProfile
from app.services.content import get_content_service
from app.services.database import get_database_service

router = APIRouter(prefix="/content", tags=["content"])


class PersonalizeRequest(BaseModel):
    """Request model for chapter personalization."""
    chapter_path: str
    content: str
    title: str = "Chapter"


class PersonalizeResponse(BaseModel):
    """Response model for personalization."""
    personalized_content: str
    is_personalized: bool = True


class TranslateRequest(BaseModel):
    """Request model for translation."""
    content: str
    target_language: str = "ur"  # Urdu


class TranslateResponse(BaseModel):
    """Response model for translation."""
    translated_content: str
    source_language: str = "en"
    target_language: str


class ContentStatusResponse(BaseModel):
    """Response model for content status check."""
    has_personalized: bool
    has_translation: bool


@router.post("/personalize", response_model=PersonalizeResponse)
async def personalize_chapter(
    request: PersonalizeRequest,
    user: SessionData = Depends(require_auth)
):
    """
    Personalize chapter content for the current user.

    Uses user profile to adapt:
    - Explanation depth based on experience level
    - Code examples for preferred languages
    - Hardware-specific recommendations

    Requires: Bearer token in Authorization header
    """
    content_service = get_content_service()
    db = get_database_service()

    # Personalize content
    personalized = await content_service.personalize_chapter(
        content=request.content,
        user_profile=user.profile,
        chapter_title=request.title
    )

    # Save to database
    db.save_personalized_content(
        user_id=user.user_id,
        chapter_path=request.chapter_path,
        original_content=request.content,
        personalized_content=personalized
    )

    return PersonalizeResponse(
        personalized_content=personalized,
        is_personalized=True
    )


@router.get("/personalized/{chapter_path:path}")
async def get_personalized_chapter(
    chapter_path: str,
    user: SessionData = Depends(require_auth)
):
    """
    Get personalized version of a chapter.

    Returns the stored personalized content if available.

    Requires: Bearer token in Authorization header
    """
    db = get_database_service()

    personalized = db.get_personalized_content(
        user_id=user.user_id,
        chapter_path=chapter_path
    )

    if not personalized:
        raise HTTPException(
            status_code=404,
            detail="No personalized content found for this chapter"
        )

    return PersonalizeResponse(
        personalized_content=personalized,
        is_personalized=True
    )


@router.delete("/personalized/{chapter_path:path}")
async def revert_to_original(
    chapter_path: str,
    user: SessionData = Depends(require_auth)
):
    """
    Delete personalized content and revert to original.

    Requires: Bearer token in Authorization header
    """
    db = get_database_service()

    success = db.delete_personalized_content(
        user_id=user.user_id,
        chapter_path=chapter_path
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to revert content"
        )

    return {"message": "Reverted to original content"}


@router.post("/translate/urdu", response_model=TranslateResponse)
async def translate_to_urdu(
    request: TranslateRequest,
    user: SessionData = Depends(require_auth)
):
    """
    Translate content to Urdu.

    Translation is cached for performance.
    Code blocks are preserved unchanged.

    Requires: Bearer token in Authorization header
    """
    content_service = get_content_service()

    translated = await content_service.translate_to_urdu(
        content=request.content,
        use_cache=True
    )

    return TranslateResponse(
        translated_content=translated,
        source_language="en",
        target_language="ur"
    )


@router.get("/status/{chapter_path:path}", response_model=ContentStatusResponse)
async def check_content_status(
    chapter_path: str,
    user: SessionData | None = Depends(get_current_user)
):
    """
    Check if personalized/translated versions exist for a chapter.

    Requires: Bearer token in Authorization header (optional)
    """
    if not user:
        return ContentStatusResponse(
            has_personalized=False,
            has_translation=False
        )

    db = get_database_service()

    has_personalized = db.get_personalized_content(
        user_id=user.user_id,
        chapter_path=chapter_path
    ) is not None

    # Check translation cache
    content_hash = hashlib.sha256(chapter_path.encode()).hexdigest()
    has_translation = db.get_cached_translation(content_hash, "ur") is not None

    return ContentStatusResponse(
        has_personalized=has_personalized,
        has_translation=has_translation
    )
