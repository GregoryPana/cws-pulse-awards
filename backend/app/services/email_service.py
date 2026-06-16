"""SMTP email delivery service."""

import logging
import smtplib
from email.message import EmailMessage
from typing import Any

from app.core.config import get_settings
from app.services.email_renderer import render_email

logger = logging.getLogger(__name__)


def _subject_for_template(template_name: str, context: dict[str, Any]) -> str:
    """Build the email subject for a supported template."""

    first_name = str(context.get("winner_first_name", "")).strip()
    last_name = str(context.get("winner_last_name", "")).strip()
    full_name = f"{first_name} {last_name}".strip()

    if template_name == "golden_ticket.html":
        subject = f"CWS Golden Ticket — {full_name}"
        occasion = str(context.get("occasion_label") or "").strip()
        if occasion:
            subject += f" | {occasion}"
        return subject

    award_type_label = str(context.get("award_type_label", "Pulse Award")).strip()
    return f"CWS Pulse Awards — New {award_type_label}: {full_name}"


async def send_templated_email(template_name: str, context: dict[str, Any], recipients: list[str]) -> None:
    """Render and send an HTML email through the configured internal SMTP relay."""

    if not recipients:
        raise ValueError("At least one email recipient is required")

    settings = get_settings()
    html = render_email(template_name, context)
    subject = _subject_for_template(template_name, context)

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from
    message["To"] = ", ".join(recipients)
    message.set_content(
        "This CWS Pulse Awards email requires an HTML-capable email client."
    )
    message.add_alternative(html, subtype="html")

    logger.info("Sending templated email", extra={"template_name": template_name, "recipients": recipients})

    with smtplib.SMTP(
        host=settings.smtp_host,
        port=settings.smtp_port,
        timeout=settings.smtp_timeout_seconds,
    ) as smtp:
        smtp.ehlo()
        if smtp.has_extn("starttls"):
            smtp.starttls()
            smtp.ehlo()
        smtp.send_message(message)
