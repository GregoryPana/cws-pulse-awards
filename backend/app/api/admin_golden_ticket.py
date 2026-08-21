"""Admin Golden Ticket API routes."""

import logging
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db_session
from app.core.dependencies import require_admin_claims
from app.models import ConfigSetting, EmailRecipient, Winner
from app.schemas.email import EmailPreviewResponse, EmailSendResponse
from app.schemas.winner import GoldenTicketUpdate, WinnerAdmin
from app.services.certificate_renderer import render_certificate
from app.services.email_renderer import render_email
from app.services.email_service import send_templated_email
from app.services.pdf_service import render_certificate_pdf
from app.services.text_format import natural_join

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["admin-golden-ticket"])


def _admin_identifier(claims: dict[str, Any]) -> str:
    """Return a stable audit identifier from Entra claims."""

    return str(
        claims.get("preferred_username")
        or claims.get("upn")
        or claims.get("email")
        or claims.get("sub")
        or "unknown-admin"
    )


async def _get_winner(db: AsyncSession, winner_id: int) -> Winner:
    """Return a winner or raise a 404."""

    result = await db.execute(select(Winner).where(Winner.id == winner_id))
    winner = result.scalar_one_or_none()

    if winner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Winner not found"
        )
    return winner


async def _golden_ticket_settings(db: AsyncSession) -> dict[str, str | None]:
    """Load config settings used in Golden Ticket emails."""

    settings_result = await db.execute(
        select(ConfigSetting).where(
            ConfigSetting.key.in_(
                [
                    "ceo_name",
                    "ceo_title",
                    "ccco_name",
                    "ccco_title",
                    "chief_pc_name",
                    "chief_pc_title",
                    "hall_of_fame_url",
                ]
            )
        )
    )
    return {row.key: row.value for row in settings_result.scalars().all()}


async def _active_recipient_emails(db: AsyncSession) -> list[str]:
    """Return all active configured recipient email addresses."""

    result = await db.execute(
        select(EmailRecipient).where(EmailRecipient.active.is_(True))
    )
    return [row.email for row in result.scalars().all()]


def _hall_of_fame_url_for(award_type: str, base_url: str | None) -> str:
    """Return the Hall of Fame link for a winner's own award wall, not the generic root."""

    if not base_url:
        return ""
    path = "/instant-impact" if award_type == "INSTANT_IMPACT" else "/charter-champions"
    return base_url.rstrip("/") + path


def _golden_ticket_context(winner: Winner, config_rows: dict[str, str | None]) -> dict[str, Any]:
    """Build the template context for Golden Ticket emails."""

    award_type_label = (
        "Charter Champion"
        if winner.award_type == "CHARTER_CHAMPION"
        else "Instant Impact"
    )
    nominated_by = winner.nominated_by or "A colleague"

    return {
        "winner_first_name": winner.first_name,
        "winner_last_name": winner.last_name,
        "winner_job_title": winner.job_title,
        "winner_department": winner.department,
        "award_type_label": award_type_label,
        "subcategory": winner.subcategory,
        "charter_pillars": winner.charter_pillars,
        "company_values": winner.company_values,
        "charter_pillars_text": natural_join(winner.charter_pillars),
        "company_values_text": natural_join(winner.company_values),
        "story": winner.story,
        "nominated_by": nominated_by,
        "award_month": winner.award_month,
        "hall_of_fame_url": _hall_of_fame_url_for(winner.award_type, config_rows.get("hall_of_fame_url")),
        "photo_url": winner.photo_url,
        "ceo_message": winner.golden_ticket_ceo_message or "",
        "ceo_name": config_rows.get("ceo_name", ""),
        "ceo_title": config_rows.get("ceo_title", ""),
        "ccco_name": config_rows.get("ccco_name", ""),
        "ccco_title": config_rows.get("ccco_title", ""),
        "chief_pc_name": config_rows.get("chief_pc_name"),
        "chief_pc_title": config_rows.get("chief_pc_title"),
        "occasion_label": winner.golden_ticket_occasion,
        "logo_url": get_settings().logo_url,
        "golden_ticket_image_url": get_settings().golden_ticket_image_url,
    }


def _golden_ticket_subject(winner: Winner) -> str:
    """Return the Golden Ticket email subject."""

    subject = f"CWS Golden Ticket — {winner.first_name} {winner.last_name}"
    if winner.golden_ticket_occasion:
        subject += f" | {winner.golden_ticket_occasion}"
    return subject


@router.patch("/admin/winners/{winner_id}/golden-ticket", response_model=WinnerAdmin)
async def mark_golden_ticket(
    winner_id: int,
    payload: GoldenTicketUpdate,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> WinnerAdmin:
    """Mark and personalise a winner as a Golden Ticket selection."""

    winner = await _get_winner(db, winner_id)
    winner.golden_ticket = True
    winner.golden_ticket_occasion = payload.occasion_label
    winner.golden_ticket_ceo_message = payload.ceo_message
    winner.updated_by = _admin_identifier(claims)
    winner.updated_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(winner)
    return WinnerAdmin.model_validate(winner)


@router.get(
    "/admin/winners/{winner_id}/golden-ticket/email-preview",
    response_model=EmailPreviewResponse,
)
async def preview_golden_ticket_email(
    winner_id: int,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> EmailPreviewResponse:
    """Render a preview of the Golden Ticket email HTML for the specified winner."""

    del claims
    winner = await _get_winner(db, winner_id)
    if not winner.golden_ticket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Winner is not marked for Golden Ticket",
        )

    config_rows = await _golden_ticket_settings(db)
    context = _golden_ticket_context(winner, config_rows)

    html = render_email("golden_ticket.html", context)
    return EmailPreviewResponse(html=html, subject=_golden_ticket_subject(winner))


@router.post(
    "/admin/winners/{winner_id}/golden-ticket/email-send",
    response_model=EmailSendResponse,
)
async def send_golden_ticket_email(
    winner_id: int,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> EmailSendResponse:
    """Send the Golden Ticket email for a marked and personalised winner."""

    admin_id = _admin_identifier(claims)
    winner = await _get_winner(db, winner_id)
    if not winner.golden_ticket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Winner is not marked for Golden Ticket",
        )
    if not winner.golden_ticket_ceo_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Golden Ticket CEO message is required",
        )

    recipients = await _active_recipient_emails(db)
    if not recipients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active email recipients configured",
        )

    config_rows = await _golden_ticket_settings(db)
    context = _golden_ticket_context(winner, config_rows)
    subject = _golden_ticket_subject(winner)

    try:
        await send_templated_email("golden_ticket.html", context, recipients)
    except Exception as exc:
        logger.exception("Golden Ticket email send failed for winner %s", winner_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Golden Ticket email send failed",
        ) from exc

    winner.golden_ticket_triggered_at = datetime.now(UTC)
    winner.golden_ticket_triggered_by = admin_id
    winner.updated_by = admin_id
    winner.updated_at = datetime.now(UTC)
    await db.commit()

    return EmailSendResponse(email_sent=True, recipients=recipients, subject=subject)


@router.get("/admin/winners/{winner_id}/golden-ticket/certificate.pdf")
async def download_golden_ticket_certificate(
    winner_id: int,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    """Render and download the Golden Ticket certificate as a print-ready PDF."""

    del claims
    winner = await _get_winner(db, winner_id)
    if not winner.golden_ticket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Winner is not marked for Golden Ticket",
        )

    config_rows = await _golden_ticket_settings(db)
    context = _golden_ticket_context(winner, config_rows)
    # The PDF sidecar runs in its own container, so it needs its own reachable asset URLs
    # for the logo and ticket artwork — see pdf_asset_base_url in core/config.py.
    context["logo_url"] = get_settings().pdf_logo_url
    context["golden_ticket_image_url"] = get_settings().pdf_golden_ticket_image_url
    html = render_certificate("certificate_golden_ticket.html", context)

    filename = f"{winner.first_name}-{winner.last_name}-golden-ticket-certificate.pdf".replace(" ", "-")
    try:
        pdf_bytes = await render_certificate_pdf(html, filename)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Certificate generation failed. The PDF service may be unavailable.",
        ) from exc

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
