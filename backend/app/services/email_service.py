"""Email service stub for Phase 0."""

import logging
from typing import Any

logger = logging.getLogger(__name__)


async def send_templated_email(template_name: str, context: dict[str, Any], recipients: list[str]) -> None:
    """Log email send requests without sending real email."""

    logger.info(
        "Email stub invoked",
        extra={"template_name": template_name, "context": context, "recipients": recipients},
    )
