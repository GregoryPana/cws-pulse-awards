"""Public API routes for Phase 0 health checks."""

import asyncio

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.database import check_database

router = APIRouter(prefix="/api/v1", tags=["public"])

settings = get_settings()


async def check_smtp() -> None:
    """Raise if the configured SMTP endpoint cannot be reached."""

    reader, writer = await asyncio.wait_for(
        asyncio.open_connection(settings.smtp_host, settings.smtp_port),
        timeout=settings.smtp_timeout_seconds,
    )
    writer.close()
    await writer.wait_closed()
    del reader


@router.get("/health")
async def health() -> dict[str, str]:
    """Return a basic liveness response."""

    return {"status": "ok", "version": settings.app_version}


@router.get("/health/ready")
async def ready() -> JSONResponse:
    """Return dependency readiness for database and SMTP connectivity."""

    checks: dict[str, str] = {"db": "ok", "smtp": "ok"}

    try:
        await check_database()
    except Exception:
        checks["db"] = "error"

    try:
        await check_smtp()
    except Exception:
        checks["smtp"] = "error"

    is_ready = all(value == "ok" for value in checks.values())
    payload = {"status": "ready" if is_ready else "not_ready", **checks}
    return JSONResponse(
        status_code=status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE,
        content=payload,
    )
