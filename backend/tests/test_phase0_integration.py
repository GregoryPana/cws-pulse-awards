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
    """The initial migration should apply and seed the required Phase 0 data."""

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
                    (SELECT COUNT(*) FROM config_settings)
                """
            )
            pillars, values, subcategories, settings_count = cursor.fetchone()

    assert pillars == 8
    assert values == 5
    assert subcategories == 6
    assert settings_count >= 1


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
            json={"html": "<html><body><h1>Pulse Awards</h1></body></html>", "filename": "phase0-test.pdf"},
            timeout=30.0,
        )
        if response.is_success:
            break
        time.sleep(1)

    assert response is not None
    response.raise_for_status()

    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
