"""FastAPI dependency callables."""

from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings
from app.core.auth import require_role, validate_jwt

bearer_scheme = HTTPBearer(auto_error=False)


async def require_admin_claims(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict[str, Any]:
    """Require a valid bearer token with the CWS Pulse admin role."""

    settings = get_settings()
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    if settings.dev_auth_enabled and credentials.credentials == "local-dev-admin":
        return {
            "sub": "local-dev-admin",
            "preferred_username": "local-dev-admin@localhost",
            "roles": [settings.admin_role],
        }

    claims = await validate_jwt(credentials.credentials)
    return require_role(claims)
