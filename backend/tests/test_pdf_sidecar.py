"""PDF sidecar application route tests."""

from __future__ import annotations

import importlib.util
import sys
import types
from pathlib import Path

from fastapi.testclient import TestClient


def load_pdf_sidecar_module() -> types.ModuleType:
    """Load the sidecar module with a stubbed Playwright import."""

    module_name = "pulse_awards_pdf_sidecar_test"
    module_path = Path(__file__).resolve().parents[2] / "pdf_service" / "pdf_service.py"

    fake_async_api = types.ModuleType("playwright.async_api")
    fake_async_api.async_playwright = lambda: None
    fake_playwright = types.ModuleType("playwright")
    fake_playwright.async_api = fake_async_api

    sys.modules.pop(module_name, None)
    sys.modules["playwright"] = fake_playwright
    sys.modules["playwright.async_api"] = fake_async_api

    spec = importlib.util.spec_from_file_location(module_name, module_path)
    assert spec is not None
    assert spec.loader is not None

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def test_pdf_sidecar_health_endpoint_returns_ok() -> None:
    """The sidecar liveness endpoint should return 200."""

    module = load_pdf_sidecar_module()
    client = TestClient(module.app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_pdf_sidecar_generate_returns_pdf_response(monkeypatch) -> None:
    """The sidecar generate endpoint should return rendered PDF bytes."""

    module = load_pdf_sidecar_module()

    async def fake_render_pdf(html: str, landscape: bool = False) -> bytes:
        """Return deterministic PDF bytes without launching Chromium."""

        assert html == "<html><body><h1>Pulse Awards</h1></body></html>"
        assert landscape is False
        return b"%PDF-test"

    monkeypatch.setattr(module, "render_pdf", fake_render_pdf)
    client = TestClient(module.app)

    response = client.post(
        "/generate",
        json={"html": "<html><body><h1>Pulse Awards</h1></body></html>", "filename": "award-letter.pdf"},
    )

    assert response.status_code == 200
    assert response.content == b"%PDF-test"
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["content-disposition"] == 'attachment; filename="award-letter.pdf"'
