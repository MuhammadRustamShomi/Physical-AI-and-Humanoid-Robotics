"""Health check endpoint."""
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SimpleHealthResponse(BaseModel):
    """Simple health check for Railway/load balancers."""

    status: str


class HealthStatus(BaseModel):
    """Detailed health check response model."""

    status: str
    version: str
    services: dict[str, Any]


class ServiceStatus(BaseModel):
    """Individual service status."""

    connected: bool
    message: str | None = None


@router.get("/health", response_model=SimpleHealthResponse)
async def health_check() -> SimpleHealthResponse:
    """
    Simple health check for Railway deployment.

    Returns immediately with HTTP 200 - no external service checks.
    This endpoint is used by Railway's health probe.
    """
    return SimpleHealthResponse(status="ok")


@router.get("/health/detailed", response_model=HealthStatus)
async def health_check_detailed() -> HealthStatus:
    """
    Detailed health check with service connectivity status.

    Returns status of:
    - API server
    - Qdrant vector database (optional)
    - Neon PostgreSQL database (optional)

    Use this endpoint for debugging, not for load balancer health checks.
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
