"""
Authentication service using JWT tokens.

Provides:
- Password hashing with bcrypt
- JWT token generation and validation
- Session management
"""

import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

from app.models.user import UserProfile, SessionData

# Load environment
load_dotenv()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


class AuthService:
    """
    Authentication service for user management.

    Handles password hashing and JWT token operations.
    """

    def __init__(self):
        """Initialize auth service."""
        self.secret = JWT_SECRET
        self.algorithm = JWT_ALGORITHM

    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)

    def create_access_token(
        self,
        user_id: str,
        email: str,
        name: str,
        profile: dict,
        expires_delta: timedelta | None = None
    ) -> str:
        """Create a JWT access token."""
        if expires_delta is None:
            expires_delta = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

        expire = datetime.now(timezone.utc) + expires_delta

        to_encode = {
            "sub": user_id,
            "email": email,
            "name": name,
            "profile": profile,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "access"
        }

        return jwt.encode(to_encode, self.secret, algorithm=self.algorithm)

    def create_refresh_token(self, user_id: str) -> tuple[str, datetime]:
        """Create a refresh token."""
        token = secrets.token_urlsafe(64)
        expires = datetime.now(timezone.utc) + timedelta(days=30)
        return token, expires

    def decode_token(self, token: str) -> SessionData | None:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(
                token,
                self.secret,
                algorithms=[self.algorithm]
            )

            # Parse profile
            profile_data = payload.get("profile", {})
            profile = UserProfile(
                software_background=profile_data.get("software_background", "beginner"),
                programming_languages=profile_data.get("programming_languages", []),
                ai_ml_experience=profile_data.get("ai_ml_experience", "beginner"),
                hardware_cpu=profile_data.get("hardware_cpu", "Unknown"),
                hardware_gpu=profile_data.get("hardware_gpu"),
                system_type=profile_data.get("system_type", "Desktop")
            )

            return SessionData(
                user_id=payload["sub"],
                email=payload["email"],
                name=payload["name"],
                profile=profile,
                exp=payload["exp"]
            )

        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def validate_token(self, token: str) -> bool:
        """Check if a token is valid."""
        return self.decode_token(token) is not None


# Singleton instance
_auth_service: AuthService | None = None


def get_auth_service() -> AuthService:
    """Get the singleton auth service instance."""
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService()
    return _auth_service
