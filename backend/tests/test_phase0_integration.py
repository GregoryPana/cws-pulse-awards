"""Phase 0 integration tests against local support services."""

import subprocess
import sys
import time
from pathlib import Path

import httpx
import psycopg

from app.core.config import get_settings

BACKEND_DIR = Path(__file__).resolve().parents[1]


def test_alembic_upgrade_head_and_seed_counts() -> None:
    """The migration chain should apply and seed all Phase 0 data including winners and recipients."""

    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_DIR,
        check=True,
    )

    settings = get_settings()
    dsn = settings.resolved_database_url.replace("+asyncpg", "")

    with psycopg.connect(dsn) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    (SELECT COUNT(*) FROM config_pillars),
                    (SELECT COUNT(*) FROM config_values),
                    (SELECT COUNT(*) FROM config_subcategories),
                    (SELECT COUNT(*) FROM config_settings),
                    (SELECT COUNT(*) FROM email_recipients WHERE created_by = 'system'),
                    (SELECT COUNT(*) FROM winners WHERE created_by = 'admin@cwseychelles.com')
                """
            )
            (
                pillars,
                values,
                subcategories,
                settings_count,
                email_recipient_count,
                winner_count,
            ) = cursor.fetchone()

    assert pillars == 9  # includes the "Ethics" pillar added by migration 003
    assert values == 5
    assert subcategories == 6
    assert settings_count >= 1
    assert email_recipient_count == 3, (
        f"Expected 3 email recipients, got {email_recipient_count}"
    )
    assert winner_count == 12, f"Expected 12 winners, got {winner_count}"


def test_pdf_sidecar_renders_pdf_bytes() -> None:
    """The PDF sidecar should render HTML into a PDF response."""

    for _ in range(10):
        health = httpx.get("http://127.0.0.1:8001/health", timeout=5.0)
        if health.is_success:
            break
        time.sleep(1)

    response = None
    for _ in range(5):
        response = httpx.post(
            "http://127.0.0.1:8001/generate",
            json={
                "html": "<html><body><h1>Pulse Awards</h1></body></html>",
                "filename": "phase0-test.pdf",
            },
            timeout=30.0,
        )
        if response.is_success:
            break
        time.sleep(1)

    assert response is not None
    response.raise_for_status()

    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
