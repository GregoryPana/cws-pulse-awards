"""FastAPI dependency callables."""

from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.auth import require_role, validate_jwt

bearer_scheme = HTTPBearer(auto_error=False)


async def require_admin_claims(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict[str, Any]:
    """Require a valid bearer token with the CWS Pulse admin role."""

    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    claims = await validate_jwt(credentials.credentials)
    return require_role(claims)
