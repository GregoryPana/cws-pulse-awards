"""Email service schemas for preview and send operations."""

from pydantic import BaseModel


class EmailPreviewResponse(BaseModel):
    """Rendered HTML preview of an award or Golden Ticket email."""

    html: str
    subject: str


class EmailSendResponse(BaseModel):
    """Result of an award notification email send attempt."""

    email_sent: bool
    recipients: list[str]
    subject: str
