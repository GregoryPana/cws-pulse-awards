"""Authentication API routes for Phase 0 verification."""

from typing import Any

from fastapi import APIRouter, Depends

from app.core.dependencies import require_admin_claims

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.get("/admin-check")
async def admin_check(claims: dict[str, Any] = Depends(require_admin_claims)) -> dict[str, Any]:
    """Validate admin JWT wiring for Phase 0 verification."""

    return {"status": "ok", "claims": claims}
