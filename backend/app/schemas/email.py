"""Email service schemas for preview and send operations."""

from pydantic import BaseModel, ConfigDict, Field


class EmailRecipientCreate(BaseModel):
    """Payload for creating a notification email recipient."""

    email: str = Field(min_length=3, max_length=200, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    name: str | None = Field(default=None, max_length=200)
    active: bool = True


class EmailRecipientOut(BaseModel):
    """Admin representation of a configured notification recipient."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str | None
    active: bool
    created_by: str | None


class EmailPreviewResponse(BaseModel):
    """Rendered HTML preview of an award or Golden Ticket email."""

    html: str
    subject: str


class EmailSendResponse(BaseModel):
    """Result of an award notification email send attempt."""

    email_sent: bool
    recipients: list[str]
    subject: str
