"""SMTP email delivery service."""

import logging
import smtplib
from email.message import EmailMessage
from email.utils import make_msgid
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.services.email_renderer import render_email

logger = logging.getLogger(__name__)

BRAND_ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets" / "brand"

# cwscx-tst01.cwsey.com only resolves on CWS's internal DNS — public resolvers
# return NXDOMAIN. Corporate mail (Exchange Online image proxying / Safe Links)
# fetches remote images from Microsoft's own cloud, which can't reach an
# internal-only hostname, so <img src="https://..."> always renders broken in
# sent mail. Embedding these three as inline CID attachments avoids any
# external fetch. The admin preview and PDF certificates are unaffected — they
# keep using the real URLs, rendered in a browser/Playwright that's already on
# the corporate network and resolves internal DNS fine.
_INLINE_IMAGE_CONTEXT_KEYS = {
    "logo_url": "cws-logo.png",
    "trophy_image_url": "trophy.png",
    "golden_ticket_image_url": "golden-ticket.png",
}


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

    inline_context = dict(context)
    cid_by_filename: dict[str, str] = {}
    for context_key, filename in _INLINE_IMAGE_CONTEXT_KEYS.items():
        if inline_context.get(context_key):
            cid = make_msgid(domain="pulse-awards.local")[1:-1]
            cid_by_filename[filename] = cid
            inline_context[context_key] = f"cid:{cid}"

    html = render_email(template_name, inline_context)
    subject = _subject_for_template(template_name, context)

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from
    message["To"] = ", ".join(recipients)
    message.set_content(
        "This CWS Pulse Awards email requires an HTML-capable email client."
    )
    message.add_alternative(html, subtype="html")

    html_part = message.get_payload()[-1]
    for filename, cid in cid_by_filename.items():
        html_part.add_related(
            (BRAND_ASSETS_DIR / filename).read_bytes(),
            maintype="image",
            subtype="png",
            cid=f"<{cid}>",
        )

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
