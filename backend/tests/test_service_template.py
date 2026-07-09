"""systemd template sanity checks."""

from pathlib import Path


def test_service_template_uses_expected_phase0_settings() -> None:
    """The service template should match the documented Phase 0 host runtime."""

    service_file = Path(__file__).resolve().parents[1] / "pulse-awards.service"
    content = service_file.read_text(encoding="utf-8")

    assert "WorkingDirectory=/opt/pulse-awards/backend" in content
    assert "EnvironmentFile=/opt/pulse-awards/.env" in content
    assert "User=pulse" in content
    assert "Type=exec" in content
    assert "ExecStart=/opt/pulse-awards/backend/venv/bin/uvicorn app.main:app" in content
    assert "--host 127.0.0.1 --port ${BACKEND_PORT}" in content
    assert "Restart=on-failure" in content
    assert "RestartSec=5s" in content
    assert "WantedBy=multi-user.target" in content
