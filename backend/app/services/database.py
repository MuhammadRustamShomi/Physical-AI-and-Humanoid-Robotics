"""
Database service for Neon Serverless PostgreSQL.

Handles:
- Connection management
- User CRUD operations
- Personalized content storage
- Translation cache
"""

import os
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional
from contextlib import asynccontextmanager

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment
load_dotenv()


class DatabaseService:
    """
    Database service for Neon PostgreSQL.

    Manages users, personalized content, and translation cache.
    """

    def __init__(self):
        """Initialize database connection."""
        self.database_url = os.getenv("NEON_DATABASE_URL")
        self._initialized = False
        if not self.database_url:
            print("Warning: NEON_DATABASE_URL not set. Database features disabled.")
        else:
            self._init_tables()

    def _get_connection(self):
        """Get database connection."""
        if not self.database_url:
            raise ValueError("Database URL not configured")
        return psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)

    def _init_tables(self):
        """Initialize database tables."""
        if not self.database_url:
            return

        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    # Users table
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS users (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            email VARCHAR(255) UNIQUE NOT NULL,
                            password_hash VARCHAR(255) NOT NULL,
                            name VARCHAR(100) NOT NULL,
                            profile JSONB DEFAULT '{}',
                            created_at TIMESTAMPTZ DEFAULT NOW(),
                            updated_at TIMESTAMPTZ DEFAULT NOW()
                        );

                        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                    """)

                    # Personalized content table
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS personalized_content (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                            chapter_path VARCHAR(255) NOT NULL,
                            original_content_hash VARCHAR(64) NOT NULL,
                            personalized_content TEXT NOT NULL,
                            created_at TIMESTAMPTZ DEFAULT NOW(),
                            UNIQUE(user_id, chapter_path)
                        );

                        CREATE INDEX IF NOT EXISTS idx_personalized_user
                            ON personalized_content(user_id);
                    """)

                    # Translation cache table
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS translation_cache (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            content_hash VARCHAR(64) UNIQUE NOT NULL,
                            source_language VARCHAR(10) DEFAULT 'en',
                            target_language VARCHAR(10) NOT NULL,
                            translated_content TEXT NOT NULL,
                            created_at TIMESTAMPTZ DEFAULT NOW()
                        );

                        CREATE INDEX IF NOT EXISTS idx_translation_hash
                            ON translation_cache(content_hash, target_language);
                    """)

                    # Sessions table for refresh tokens
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS sessions (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                            refresh_token VARCHAR(255) UNIQUE NOT NULL,
                            expires_at TIMESTAMPTZ NOT NULL,
                            created_at TIMESTAMPTZ DEFAULT NOW()
                        );

                        CREATE INDEX IF NOT EXISTS idx_sessions_user
                            ON sessions(user_id);
                        CREATE INDEX IF NOT EXISTS idx_sessions_token
                            ON sessions(refresh_token);
                    """)

                    conn.commit()
                    print("Database tables initialized successfully")

        except Exception as e:
            print(f"Database initialization error: {e}")

    # =========================================================================
    # USER OPERATIONS
    # =========================================================================

    def create_user(self, email: str, password_hash: str, name: str, profile: dict) -> dict | None:
        """Create a new user."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO users (email, password_hash, name, profile)
                        VALUES (%s, %s, %s, %s)
                        RETURNING id, email, name, profile, created_at, updated_at
                    """, (email, password_hash, name, json.dumps(profile)))

                    user = cur.fetchone()
                    conn.commit()
                    return dict(user) if user else None

        except psycopg2.errors.UniqueViolation:
            return None
        except Exception as e:
            print(f"Create user error: {e}")
            return None

    def get_user_by_email(self, email: str) -> dict | None:
        """Get user by email."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, email, password_hash, name, profile,
                               created_at, updated_at
                        FROM users WHERE email = %s
                    """, (email,))

                    user = cur.fetchone()
                    return dict(user) if user else None

        except Exception as e:
            print(f"Get user error: {e}")
            return None

    def get_user_by_id(self, user_id: str) -> dict | None:
        """Get user by ID."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, email, name, profile, created_at, updated_at
                        FROM users WHERE id = %s
                    """, (user_id,))

                    user = cur.fetchone()
                    return dict(user) if user else None

        except Exception as e:
            print(f"Get user error: {e}")
            return None

    def update_user_profile(self, user_id: str, name: str | None, profile: dict | None) -> dict | None:
        """Update user profile."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    updates = []
                    params = []

                    if name:
                        updates.append("name = %s")
                        params.append(name)

                    if profile:
                        updates.append("profile = %s")
                        params.append(json.dumps(profile))

                    updates.append("updated_at = NOW()")
                    params.append(user_id)

                    cur.execute(f"""
                        UPDATE users SET {', '.join(updates)}
                        WHERE id = %s
                        RETURNING id, email, name, profile, created_at, updated_at
                    """, params)

                    user = cur.fetchone()
                    conn.commit()
                    return dict(user) if user else None

        except Exception as e:
            print(f"Update user error: {e}")
            return None

    # =========================================================================
    # PERSONALIZED CONTENT OPERATIONS
    # =========================================================================

    def save_personalized_content(
        self,
        user_id: str,
        chapter_path: str,
        original_content: str,
        personalized_content: str
    ) -> bool:
        """Save personalized chapter content for a user."""
        try:
            content_hash = hashlib.sha256(original_content.encode()).hexdigest()

            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO personalized_content
                            (user_id, chapter_path, original_content_hash, personalized_content)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (user_id, chapter_path)
                        DO UPDATE SET
                            personalized_content = EXCLUDED.personalized_content,
                            original_content_hash = EXCLUDED.original_content_hash
                    """, (user_id, chapter_path, content_hash, personalized_content))

                    conn.commit()
                    return True

        except Exception as e:
            print(f"Save personalized content error: {e}")
            return False

    def get_personalized_content(self, user_id: str, chapter_path: str) -> str | None:
        """Get personalized chapter content for a user."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT personalized_content
                        FROM personalized_content
                        WHERE user_id = %s AND chapter_path = %s
                    """, (user_id, chapter_path))

                    result = cur.fetchone()
                    return result['personalized_content'] if result else None

        except Exception as e:
            print(f"Get personalized content error: {e}")
            return None

    def delete_personalized_content(self, user_id: str, chapter_path: str) -> bool:
        """Delete personalized content (revert to original)."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        DELETE FROM personalized_content
                        WHERE user_id = %s AND chapter_path = %s
                    """, (user_id, chapter_path))

                    conn.commit()
                    return True

        except Exception as e:
            print(f"Delete personalized content error: {e}")
            return False

    # =========================================================================
    # TRANSLATION CACHE OPERATIONS
    # =========================================================================

    def get_cached_translation(self, content_hash: str, target_language: str) -> str | None:
        """Get cached translation."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT translated_content
                        FROM translation_cache
                        WHERE content_hash = %s AND target_language = %s
                    """, (content_hash, target_language))

                    result = cur.fetchone()
                    return result['translated_content'] if result else None

        except Exception as e:
            print(f"Get cached translation error: {e}")
            return None

    def cache_translation(
        self,
        content: str,
        translated_content: str,
        target_language: str
    ) -> bool:
        """Cache a translation."""
        try:
            content_hash = hashlib.sha256(content.encode()).hexdigest()

            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO translation_cache
                            (content_hash, target_language, translated_content)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (content_hash) DO UPDATE SET
                            translated_content = EXCLUDED.translated_content
                    """, (content_hash, target_language, translated_content))

                    conn.commit()
                    return True

        except Exception as e:
            print(f"Cache translation error: {e}")
            return False


# Singleton instance
_db_service: DatabaseService | None = None


def get_database_service() -> DatabaseService:
    """Get the singleton database service instance."""
    global _db_service
    if _db_service is None:
        _db_service = DatabaseService()
    return _db_service
