"""Microsoft Entra ID JWT validation and role enforcement."""

import time
from typing import Any

import httpx
from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.core.config import Settings, get_settings

JWKS_CACHE_TTL_SECONDS = 86_400
_jwks_cache: dict[str, Any] = {"url": None, "expires_at": 0.0, "keys": []}


async def fetch_jwks(settings: Settings | None = None) -> list[dict[str, Any]]:
    """Fetch and cache JWKS signing keys from Entra discovery."""

    active_settings = settings or get_settings()
    jwks_url = active_settings.jwks_url
    if not jwks_url:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT validation is not configured",
        )

    now = time.time()
    if _jwks_cache["url"] == jwks_url and _jwks_cache["expires_at"] > now:
        return list(_jwks_cache["keys"])

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        payload = response.json()

    keys = payload.get("keys", [])
    _jwks_cache.update({"url": jwks_url, "expires_at": now + JWKS_CACHE_TTL_SECONDS, "keys": keys})
    return list(keys)


async def validate_jwt(token: str, settings: Settings | None = None) -> dict[str, Any]:
    """Validate a bearer token and return decoded claims."""

    active_settings = settings or get_settings()
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token header") from exc

    kid = header.get("kid")
    keys = await fetch_jwks(active_settings)
    key = next((candidate for candidate in keys if candidate.get("kid") == kid), None)
    if key is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Signing key not found")

    try:
        return jwt.decode(
            token,
            key,
            algorithms=[key.get("alg", "RS256")],
            audience=active_settings.entra_audience,
            issuer=active_settings.entra_issuer,
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


def require_role(claims: dict[str, Any], required_role: str | None = None) -> dict[str, Any]:
    """Return claims when the required app role is present, otherwise raise 403."""

    role = required_role or get_settings().admin_role
    roles = claims.get("roles") or []
    if role not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Required role missing")
    return claims
