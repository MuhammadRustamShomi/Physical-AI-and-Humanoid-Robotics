"""FastAPI application entry point for Physical AI Textbook backend."""
import os
import sys
import logging
from contextlib import asynccontextmanager

# Configure logging early for Railway visibility
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

# Log startup immediately
logger.info("Starting Physical AI Backend...")
logger.info(f"Python version: {sys.version}")
logger.info(f"PORT environment: {os.environ.get('PORT', 'not set')}")

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    logger.info("FastAPI imported successfully")
except ImportError as e:
    logger.error(f"Failed to import FastAPI: {e}")
    sys.exit(1)

try:
    from app.api import health, chat, auth, content
    from app.config import get_settings
    logger.info("App modules imported successfully")
except ImportError as e:
    logger.error(f"Failed to import app modules: {e}")
    sys.exit(1)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    settings = get_settings()
    print(f"Starting {settings.app_name} v{settings.app_version}")
    print(f"Environment: {settings.environment}")
    yield
    # Shutdown
    print("Shutting down...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Backend API for Physical AI & Humanoid Robotics Textbook",
        lifespan=lifespan,
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
    )

    # Configure CORS
    allowed_origins = [
        "http://localhost:3000",
        "https://physical-ai-and-humanoid-robotics-hdum6v5dd.vercel.app",
        "https://physical-ai-textbook.vercel.app",
        settings.frontend_url,
    ]

    # Filter out empty/None values and duplicates
    allowed_origins = list(set(filter(None, allowed_origins)))

    if settings.is_development:
        allowed_origins.append("*")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health.router, prefix="/api/v1", tags=["health"])
    app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
    app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
    app.include_router(content.router, prefix="/api/v1", tags=["content"])

    return app


app = create_app()


# Root endpoint for basic health check
@app.get("/")
async def root():
    return {"status": "ok", "message": "Physical AI Backend is running"}


if __name__ == "__main__":
    import uvicorn

    # Get port from environment (Railway sets this)
    port = int(os.environ.get("PORT", 8080))

    logger.info(f"Starting uvicorn server on 0.0.0.0:{port}")

    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=port,
            reload=False,  # Never reload in production
            log_level="info",
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)
