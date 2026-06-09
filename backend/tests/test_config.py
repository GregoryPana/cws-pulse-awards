"""Configuration loading tests."""

from pathlib import Path

from app.core.config import Settings


ROOT_DIR = Path(__file__).resolve().parents[2]


def parse_env_example_keys() -> set[str]:
    """Return declared environment variable keys from .env.example."""

    keys: set[str] = set()
    content = (ROOT_DIR / ".env.example").read_text(encoding="utf-8").splitlines()
    for line in content:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _value = stripped.split("=", 1)
        keys.add(key)
    return keys


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


def test_env_example_covers_backend_and_frontend_runtime_keys() -> None:
    """The example environment file should include all required documented keys."""

    env_keys = parse_env_example_keys()
    settings_aliases = {
        field.alias
        for field in Settings.model_fields.values()
        if isinstance(field.alias, str) and field.alias
    }
    expected_keys = settings_aliases | {
        "VITE_API_BASE_URL",
        "VITE_APP_URL",
        "VITE_ENTRA_CLIENT_ID",
        "VITE_ENTRA_TENANT_ID",
        "VITE_ENTRA_AUTHORITY",
        "VITE_ENTRA_API_SCOPE",
    }

    assert expected_keys.issubset(env_keys)
