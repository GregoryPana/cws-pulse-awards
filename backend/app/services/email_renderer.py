"""Jinja2 email template rendering for preview and send."""

from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates" / "emails"

_env: Environment | None = None


def _get_env() -> Environment:
    global _env
    if _env is None:
        _env = Environment(
            loader=FileSystemLoader(str(TEMPLATES_DIR)),
            autoescape=select_autoescape(["html"]),
        )
    return _env


def render_email(template_name: str, context: dict) -> str:
    """Render a Jinja2 email template with the supplied context."""

    template = _get_env().get_template(template_name)
    return template.render(**context)
