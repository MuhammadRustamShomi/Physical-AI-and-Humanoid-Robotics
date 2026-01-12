"""Health check endpoint."""
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthStatus(BaseModel):
    """Health check response model."""

    status: str
    version: str
    services: dict[str, Any]


class ServiceStatus(BaseModel):
    """Individual service status."""

    connected: bool
    message: str | None = None


@router.get("/health", response_model=HealthStatus)
async def health_check() -> HealthStatus:
    """
    Check application health and service connectivity.

    Returns status of:
    - API server
    - Qdrant vector database (optional)
    - Neon PostgreSQL database (optional)
    """
    from app.config import get_settings

    settings = get_settings()

    # Check Qdrant connectivity (optional - don't fail if not configured)
    qdrant_status = await check_qdrant()

    # Check database connectivity (optional - don't fail if not configured)
    db_status = await check_database()

    # Server is healthy as long as FastAPI is running
    # Database/Qdrant are optional services
    return HealthStatus(
        status="healthy",  # Always healthy if we reach this point
        version=settings.app_version,
        services={
            "qdrant": {
                "connected": qdrant_status.connected,
                "message": qdrant_status.message,
            },
            "database": {
                "connected": db_status.connected,
                "message": db_status.message,
            },
        },
    )


async def check_qdrant() -> ServiceStatus:
    """Check Qdrant vector database connectivity."""
    try:
        from qdrant_client import QdrantClient

        from app.config import get_settings

        settings = get_settings()
        client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )
        # Try to list collections as a health check
        client.get_collections()
        return ServiceStatus(connected=True, message="Connected to Qdrant")
    except Exception as e:
        return ServiceStatus(connected=False, message=f"Qdrant error: {str(e)}")


async def check_database() -> ServiceStatus:
    """Check Neon PostgreSQL database connectivity."""
    try:
        import psycopg2

        from app.config import get_settings

        settings = get_settings()
        conn = psycopg2.connect(settings.neon_database_url)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        return ServiceStatus(connected=True, message="Connected to Neon PostgreSQL")
    except Exception as e:
        return ServiceStatus(connected=False, message=f"Database error: {str(e)}")
