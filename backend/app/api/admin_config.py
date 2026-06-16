"""Admin configuration API routes."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.dependencies import require_admin_claims
from app.models import EmailRecipient
from app.schemas.email import EmailRecipientCreate, EmailRecipientOut

router = APIRouter(prefix="/api/v1", tags=["admin-config"])


def _admin_identifier(claims: dict[str, Any]) -> str:
    """Return a stable audit identifier from Entra claims."""

    return str(
        claims.get("preferred_username")
        or claims.get("upn")
        or claims.get("email")
        or claims.get("sub")
        or "unknown-admin"
    )


@router.get("/admin/config/recipients", response_model=list[EmailRecipientOut])
async def list_email_recipients(
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> list[EmailRecipientOut]:
    """Return configured email recipients for the admin UI."""

    del claims
    result = await db.execute(select(EmailRecipient).order_by(EmailRecipient.id.desc()))
    return [EmailRecipientOut.model_validate(row) for row in result.scalars().all()]


@router.post(
    "/admin/config/recipients",
    response_model=EmailRecipientOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_email_recipient(
    payload: EmailRecipientCreate,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> EmailRecipientOut:
    """Create a notification email recipient."""

    recipient = EmailRecipient(
        email=str(payload.email).lower(),
        name=payload.name,
        active=payload.active,
        created_by=_admin_identifier(claims),
    )
    db.add(recipient)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email recipient already exists",
        ) from exc
    await db.refresh(recipient)
    return EmailRecipientOut.model_validate(recipient)


@router.patch(
    "/admin/config/recipients/{recipient_id}/toggle",
    response_model=EmailRecipientOut,
)
async def toggle_email_recipient(
    recipient_id: int,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> EmailRecipientOut:
    """Toggle a notification recipient's active status."""

    del claims
    result = await db.execute(select(EmailRecipient).where(EmailRecipient.id == recipient_id))
    recipient = result.scalar_one_or_none()
    if recipient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found")

    recipient.active = not recipient.active
    await db.commit()
    await db.refresh(recipient)
    return EmailRecipientOut.model_validate(recipient)


@router.delete("/admin/config/recipients/{recipient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email_recipient(
    recipient_id: int,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Delete a notification email recipient."""

    del claims
    result = await db.execute(select(EmailRecipient).where(EmailRecipient.id == recipient_id))
    recipient = result.scalar_one_or_none()
    if recipient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found")

    await db.delete(recipient)
    await db.commit()
