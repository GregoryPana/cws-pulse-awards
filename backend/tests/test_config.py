"""Configuration loading tests."""

from app.core.config import Settings


def test_settings_default_jwks_url_falls_back_from_tenant(monkeypatch) -> None:
    """Blank ENTRA_JWKS_URL should fall back to the Entra discovery URL."""

    settings = Settings(ENTRA_TENANT_ID="tenant-123", ENTRA_JWKS_URL="")

    assert settings.jwks_url == "https://login.microsoftonline.com/tenant-123/discovery/v2.0/keys"


def test_settings_explicit_jwks_url_overrides_fallback(monkeypatch) -> None:
    """Explicit JWKS URL should be used as-is."""

    settings = Settings(
        ENTRA_TENANT_ID="tenant-123",
        ENTRA_JWKS_URL="https://example.test/keys",
    )

    assert settings.jwks_url == "https://example.test/keys"


def test_settings_build_database_url_from_component_fields() -> None:
    """Blank DATABASE_URL should be built from non-secret component settings."""

    settings = Settings(
        DATABASE_URL="",
        DB_HOST="127.0.0.1",
        DB_PORT=5433,
        DB_NAME="pulse_awards",
        DB_USER="pulse",
        DB_PASSWORD="test-password",
        _env_file=None,
    )

    assert settings.resolved_database_url == "postgresql+asyncpg://pulse:test-password@127.0.0.1:5433/pulse_awards"


def test_settings_explicit_database_url_overrides_component_fields() -> None:
    """Explicit DATABASE_URL should take precedence over component settings."""

    settings = Settings(
        DATABASE_URL="postgresql+asyncpg://pulse:override@127.0.0.1:5433/pulse_awards",
        DB_PASSWORD="ignored",
        _env_file=None,
    )

    assert settings.resolved_database_url == "postgresql+asyncpg://pulse:override@127.0.0.1:5433/pulse_awards"
