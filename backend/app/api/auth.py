"""
Authentication API endpoints.

Provides:
- POST /auth/signup - Register new user
- POST /auth/signin - Login user
- POST /auth/signout - Logout user
- GET /auth/me - Get current user
- PUT /auth/profile - Update user profile
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional

from app.models.user import (
    UserCreate, UserLogin, UserResponse, AuthResponse,
    ProfileUpdate, SessionData
)
from app.services.auth import get_auth_service
from app.services.database import get_database_service

router = APIRouter(prefix="/auth", tags=["auth"])


def get_current_user(authorization: str | None = Header(None)) -> SessionData | None:
    """
    Dependency to get current user from Authorization header.
    Returns None if not authenticated.
    """
    if not authorization:
        return None

    if not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ")[1]
    auth_service = get_auth_service()
    return auth_service.decode_token(token)


def require_auth(authorization: str = Header(...)) -> SessionData:
    """
    Dependency to require authentication.
    Raises 401 if not authenticated.
    """
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user


@router.post("/signup", response_model=AuthResponse)
async def signup(user_data: UserCreate):
    """
    Register a new user.

    Request body:
    - email: User email (unique)
    - password: Password (min 8 characters)
    - name: Display name
    - profile: User profile with background questions
    """
    db = get_database_service()
    auth = get_auth_service()

    # Check if user exists
    existing = db.get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash password and create user
    password_hash = auth.hash_password(user_data.password)
    profile_dict = user_data.profile.model_dump()

    user = db.create_user(
        email=user_data.email,
        password_hash=password_hash,
        name=user_data.name,
        profile=profile_dict
    )

    if not user:
        raise HTTPException(
            status_code=500,
            detail="Failed to create user"
        )

    # Generate access token
    access_token = auth.create_access_token(
        user_id=str(user['id']),
        email=user['email'],
        name=user['name'],
        profile=profile_dict
    )

    return AuthResponse(
        user=UserResponse(
            id=str(user['id']),
            email=user['email'],
            name=user['name'],
            profile=user_data.profile
        ),
        access_token=access_token
    )


@router.post("/signin", response_model=AuthResponse)
async def signin(credentials: UserLogin):
    """
    Login with email and password.

    Request body:
    - email: User email
    - password: User password
    """
    db = get_database_service()
    auth = get_auth_service()

    # Get user
    user = db.get_user_by_email(credentials.email)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Verify password
    if not auth.verify_password(credentials.password, user['password_hash']):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Parse profile
    profile = user.get('profile', {})
    if isinstance(profile, str):
        import json
        profile = json.loads(profile)

    # Generate access token
    access_token = auth.create_access_token(
        user_id=str(user['id']),
        email=user['email'],
        name=user['name'],
        profile=profile
    )

    from app.models.user import UserProfile
    user_profile = UserProfile(**profile)

    return AuthResponse(
        user=UserResponse(
            id=str(user['id']),
            email=user['email'],
            name=user['name'],
            profile=user_profile
        ),
        access_token=access_token
    )


@router.post("/signout")
async def signout():
    """
    Logout user.

    Client should discard the access token.
    """
    return {"message": "Signed out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: SessionData = Depends(require_auth)):
    """
    Get current authenticated user.

    Requires: Bearer token in Authorization header
    """
    db = get_database_service()

    user_data = db.get_user_by_id(user.user_id)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    profile = user_data.get('profile', {})
    if isinstance(profile, str):
        import json
        profile = json.loads(profile)

    from app.models.user import UserProfile
    user_profile = UserProfile(**profile)

    return UserResponse(
        id=str(user_data['id']),
        email=user_data['email'],
        name=user_data['name'],
        profile=user_profile
    )


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    update: ProfileUpdate,
    user: SessionData = Depends(require_auth)
):
    """
    Update user profile.

    Request body:
    - name: New display name (optional)
    - profile: Updated profile data (optional)

    Requires: Bearer token in Authorization header
    """
    db = get_database_service()

    profile_dict = update.profile.model_dump() if update.profile else None

    user_data = db.update_user_profile(
        user_id=user.user_id,
        name=update.name,
        profile=profile_dict
    )

    if not user_data:
        raise HTTPException(status_code=500, detail="Failed to update profile")

    profile = user_data.get('profile', {})
    if isinstance(profile, str):
        import json
        profile = json.loads(profile)

    from app.models.user import UserProfile
    user_profile = UserProfile(**profile)

    return UserResponse(
        id=str(user_data['id']),
        email=user_data['email'],
        name=user_data['name'],
        profile=user_profile
    )
