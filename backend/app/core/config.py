"""Application configuration loaded from environment variables."""

from functools import lru_cache
from urllib.parse import quote_plus

from pydantic import Field, computed_field
from pydantic_settings import (
    BaseSettings,
    DotEnvSettingsSource,
    EnvSettingsSource,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
)


class Settings(BaseSettings):
    """Runtime settings for the Pulse Awards backend."""

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env", "/opt/pulse-awards/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = Field(default="local", alias="APP_ENV")
    app_secret_key: str = Field(default="local-development-only", alias="APP_SECRET_KEY")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    dev_auth_enabled: bool = Field(default=False, alias="DEV_AUTH_ENABLED")

    database_url: str = Field(default="", alias="DATABASE_URL")
    db_host: str = Field(default="127.0.0.1", alias="DB_HOST")
    db_port: int = Field(default=5433, alias="DB_PORT")
    db_name: str = Field(default="pulse_awards", alias="DB_NAME")
    db_user: str = Field(default="pulse", alias="DB_USER")
    db_password: str = Field(default="", alias="DB_PASSWORD")

    entra_tenant_id: str = Field(default="", alias="ENTRA_TENANT_ID")
    entra_client_id: str = Field(default="", alias="ENTRA_CLIENT_ID")
    entra_authority: str = Field(default="", alias="ENTRA_AUTHORITY")
    entra_issuer: str = Field(default="", alias="ENTRA_ISSUER")
    entra_audience: str = Field(default="", alias="ENTRA_AUDIENCE")
    entra_jwks_url: str = Field(default="", alias="ENTRA_JWKS_URL")
    admin_role: str = Field(default="CWS-Pulse-Admin", alias="ADMIN_ROLE")

    smtp_host: str = Field(default="172.16.77.10", alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_timeout_seconds: float = Field(default=3.0, alias="SMTP_TIMEOUT_SECONDS")
    smtp_from: str = Field(default="noreply@cwseychelles.com", alias="SMTP_FROM")

    photo_storage_path: str = Field(default="/data/pulse/photos", alias="PHOTO_STORAGE_PATH")
    pdf_service_url: str = Field(default="http://127.0.0.1:8001", alias="PDF_SERVICE_URL")

    # The frontend's own reachable origin, used to build fully-qualified static asset
    # URLs (e.g. the logo) inside emails and PDFs. Deliberately separate from the
    # admin-configurable `hall_of_fame_url` ConfigSetting: that one is a business-level
    # "where's the wall of fame" link an admin can retarget, while this is a technical
    # "where do my own static files actually live right now" value that must match the
    # real frontend origin in each environment (local dev vs deployed) for images to load.
    app_base_url: str = Field(default="http://127.0.0.1:5173", alias="APP_BASE_URL")

    # Separate origin used ONLY when building asset URLs for the PDF sidecar to fetch.
    # The sidecar runs in its own Docker container with its own network namespace, so
    # in local dev "127.0.0.1" from inside that container is not the host machine —
    # it must use the special "host.docker.internal" DNS name instead. In production,
    # where everything sits behind one real domain, this is identical to APP_BASE_URL.
    pdf_asset_base_url: str = Field(
        default="http://host.docker.internal:5173", alias="PDF_ASSET_BASE_URL"
    )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: EnvSettingsSource,
        dotenv_settings: DotEnvSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        """Prefer repo-local dotenv values over ambient machine environment variables."""

        return init_settings, dotenv_settings, env_settings, file_secret_settings

    @computed_field
    @property
    def jwks_url(self) -> str:
        """Return the configured JWKS URL or the Entra discovery default."""

        if self.entra_jwks_url.strip():
            return self.entra_jwks_url.strip()
        if self.entra_tenant_id.strip():
            return f"https://login.microsoftonline.com/{self.entra_tenant_id}/discovery/v2.0/keys"
        return ""

    @computed_field
    @property
    def logo_url(self) -> str:
        """Return the CWS logo URL for emails and the browser-rendered admin preview."""

        return f"{self.app_base_url.rstrip('/')}/brand/cws-logo.png"

    @computed_field
    @property
    def golden_ticket_image_url(self) -> str:
        """Return the Golden Ticket artwork URL for emails and the browser-rendered admin preview."""

        return f"{self.app_base_url.rstrip('/')}/brand/golden-ticket.png"

    @computed_field
    @property
    def trophy_image_url(self) -> str:
        """Return the trophy artwork URL for standard award emails and the admin preview."""

        return f"{self.app_base_url.rstrip('/')}/brand/trophy.png"

    @computed_field
    @property
    def pdf_logo_url(self) -> str:
        """Return the CWS logo URL reachable from inside the PDF sidecar container."""

        return f"{self.pdf_asset_base_url.rstrip('/')}/brand/cws-logo.png"

    @computed_field
    @property
    def pdf_golden_ticket_image_url(self) -> str:
        """Return the Golden Ticket artwork URL reachable from inside the PDF sidecar container."""

        return f"{self.pdf_asset_base_url.rstrip('/')}/brand/golden-ticket.png"

    @computed_field
    @property
    def pdf_trophy_image_url(self) -> str:
        """Return the trophy artwork URL reachable from inside the PDF sidecar container."""

        return f"{self.pdf_asset_base_url.rstrip('/')}/brand/trophy.png"

    @computed_field
    @property
    def resolved_database_url(self) -> str:
        """Return the configured async database URL or build one from component settings."""

        if self.database_url.strip():
            return self.database_url.strip()

        password = quote_plus(self.db_password)
        return (
            f"postgresql+asyncpg://{self.db_user}:{password}@{self.db_host}:{self.db_port}/{self.db_name}"
        )


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings()
