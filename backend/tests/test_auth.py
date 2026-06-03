"""JWT validation tests."""

from datetime import UTC, datetime, timedelta

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException
from jose import jwt

from app.core.auth import require_role, validate_jwt
from app.core.config import Settings


def build_test_keypair() -> tuple[rsa.RSAPrivateKey, dict[str, str]]:
    """Create an RSA keypair and matching JWK for tests."""

    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key().public_numbers()
    exponent = public_key.e.to_bytes((public_key.e.bit_length() + 7) // 8, "big")
    modulus = public_key.n.to_bytes((public_key.n.bit_length() + 7) // 8, "big")

    import base64

    def encode_part(value: bytes) -> str:
        """Base64-url encode a JWK integer component."""

        return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")

    jwk = {
        "kty": "RSA",
        "use": "sig",
        "alg": "RS256",
        "kid": "test-kid",
        "n": encode_part(modulus),
        "e": encode_part(exponent),
    }
    return private_key, jwk


def build_test_token(private_key: rsa.RSAPrivateKey, claims: dict[str, object]) -> str:
    """Sign a JWT for tests."""

    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    return jwt.encode(claims, pem, algorithm="RS256", headers={"kid": "test-kid"})


@pytest.mark.asyncio
async def test_validate_jwt_accepts_valid_token(monkeypatch) -> None:
    """A correctly signed token with the expected issuer and audience should validate."""

    private_key, jwk = build_test_keypair()
    settings = Settings(ENTRA_AUDIENCE="api://client-id", ENTRA_ISSUER="https://issuer.test")
    claims = {
        "sub": "user-1",
        "iss": settings.entra_issuer,
        "aud": settings.entra_audience,
        "exp": int((datetime.now(UTC) + timedelta(minutes=5)).timestamp()),
        "roles": ["CWS-Pulse-Admin"],
    }

    async def fake_fetch_jwks(_settings: Settings | None = None) -> list[dict[str, str]]:
        """Return the local test JWK."""

        return [jwk]

    monkeypatch.setattr("app.core.auth.fetch_jwks", fake_fetch_jwks)
    token = build_test_token(private_key, claims)

    decoded = await validate_jwt(token, settings)

    assert decoded["sub"] == "user-1"


@pytest.mark.asyncio
async def test_validate_jwt_rejects_invalid_token(monkeypatch) -> None:
    """A token signed by another key should be rejected."""

    private_key, jwk = build_test_keypair()
    wrong_private_key, _ = build_test_keypair()
    settings = Settings(ENTRA_AUDIENCE="api://client-id", ENTRA_ISSUER="https://issuer.test")
    claims = {
        "sub": "user-1",
        "iss": settings.entra_issuer,
        "aud": settings.entra_audience,
        "exp": int((datetime.now(UTC) + timedelta(minutes=5)).timestamp()),
        "roles": ["CWS-Pulse-Admin"],
    }

    async def fake_fetch_jwks(_settings: Settings | None = None) -> list[dict[str, str]]:
        """Return the local test JWK."""

        return [jwk]

    monkeypatch.setattr("app.core.auth.fetch_jwks", fake_fetch_jwks)
    token = build_test_token(wrong_private_key, claims)

    with pytest.raises(HTTPException) as exc_info:
        await validate_jwt(token, settings)

    assert exc_info.value.status_code == 401


def test_require_role_rejects_missing_role() -> None:
    """A valid token without the admin role should be rejected."""

    with pytest.raises(HTTPException) as exc_info:
        require_role({"roles": ["User"]}, required_role="CWS-Pulse-Admin")

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_validate_jwt_rejects_expired_token(monkeypatch) -> None:
    """An expired token should be rejected."""

    private_key, jwk = build_test_keypair()
    settings = Settings(ENTRA_AUDIENCE="api://client-id", ENTRA_ISSUER="https://issuer.test")
    claims = {
        "sub": "user-1",
        "iss": settings.entra_issuer,
        "aud": settings.entra_audience,
        "exp": int((datetime.now(UTC) - timedelta(minutes=5)).timestamp()),
        "roles": ["CWS-Pulse-Admin"],
    }

    async def fake_fetch_jwks(_settings: Settings | None = None) -> list[dict[str, str]]:
        """Return the local test JWK."""

        return [jwk]

    monkeypatch.setattr("app.core.auth.fetch_jwks", fake_fetch_jwks)
    token = build_test_token(private_key, claims)

    with pytest.raises(HTTPException) as exc_info:
        await validate_jwt(token, settings)

    assert exc_info.value.status_code == 401
