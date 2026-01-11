"""
User models for authentication and profile management.

Supports:
- User authentication (signup/signin)
- User profile with background questions
- Session management
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class SkillLevel(str, Enum):
    """Skill level enumeration."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class UserProfile(BaseModel):
    """User profile with background information."""
    software_background: SkillLevel = SkillLevel.BEGINNER
    programming_languages: list[str] = Field(default_factory=list)
    ai_ml_experience: SkillLevel = SkillLevel.BEGINNER
    hardware_cpu: str = "Unknown"
    hardware_gpu: str | None = None
    system_type: str = "Desktop"  # Desktop, Laptop, Cloud, etc.


class UserCreate(BaseModel):
    """Request model for user registration."""
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=2, max_length=100)
    profile: UserProfile = Field(default_factory=UserProfile)


class UserLogin(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str


class User(BaseModel):
    """User model returned from database."""
    id: str
    email: str
    name: str
    profile: UserProfile
    created_at: datetime
    updated_at: datetime


class UserResponse(BaseModel):
    """Response model for user data (excludes sensitive info)."""
    id: str
    email: str
    name: str
    profile: UserProfile


class AuthResponse(BaseModel):
    """Response model for authentication."""
    user: UserResponse
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # 24 hours


class SessionData(BaseModel):
    """Session data stored in token."""
    user_id: str
    email: str
    name: str
    profile: UserProfile
    exp: int  # Expiration timestamp


class ProfileUpdate(BaseModel):
    """Request model for updating user profile."""
    name: str | None = None
    profile: UserProfile | None = None
