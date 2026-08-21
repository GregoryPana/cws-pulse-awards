"""Admin winner API routes for MVP entry and email preview."""

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db_session
from app.core.dependencies import require_admin_claims
from app.models import ConfigSetting, EmailRecipient, Winner
from app.schemas.email import EmailPreviewResponse, EmailSendResponse
from app.schemas.winner import WinnerAdmin, WinnerAdminListResponse, WinnerCreate
from app.services.certificate_renderer import render_certificate
from app.services.email_renderer import render_email
from app.services.email_service import send_templated_email
from app.services.pdf_service import render_certificate_pdf
from app.services.text_format import natural_join

router = APIRouter(prefix="/api/v1", tags=["admin-winners"])


def _admin_identifier(claims: dict[str, Any]) -> str:
    """Return a stable audit identifier from Entra claims."""

    return str(
        claims.get("preferred_username")
        or claims.get("upn")
        or claims.get("email")
        or claims.get("sub")
        or "unknown-admin"
    )


def _award_type_label(award_type: str) -> str:
    """Return the display label for an award type."""

    if award_type == "CHARTER_CHAMPION":
        return "Charter Champion"
    if award_type == "INSTANT_IMPACT":
        return "Instant Impact"
    return award_type.replace("_", " ").title()


def _award_template_name(award_type: str) -> str:
    """Return the email template for a standard award notification."""

    if award_type == "CHARTER_CHAMPION":
        return "award_charter_champion.html"
    if award_type == "INSTANT_IMPACT":
        return "award_instant_impact.html"
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported award type")


def _certificate_template_name(award_type: str) -> str:
    """Return the certificate template for a standard award — distinct per
    classification (Charter Champion = Peer-to-Peer, Instant Impact = Manager-to-Staff)."""

    if award_type == "CHARTER_CHAMPION":
        return "certificate_charter_champion.html"
    if award_type == "INSTANT_IMPACT":
        return "certificate_instant_impact.html"
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported award type")


async def _public_settings(db: AsyncSession) -> dict[str, str | None]:
    """Load public settings used in notification previews."""

    result = await db.execute(
        select(ConfigSetting).where(ConfigSetting.key.in_(["hall_of_fame_url"]))
    )
    return {row.key: row.value for row in result.scalars().all()}


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


def _award_email_context(winner: Winner, settings: dict[str, str | None]) -> dict[str, Any]:
    """Build the template context for standard award notification emails."""

    return {
        "winner_first_name": winner.first_name,
        "winner_last_name": winner.last_name,
        "winner_job_title": winner.job_title,
        "winner_department": winner.department,
        "award_type_label": _award_type_label(winner.award_type),
        "subcategory": winner.subcategory,
        "charter_pillars": winner.charter_pillars,
        "company_values": winner.company_values,
        "charter_pillars_text": natural_join(winner.charter_pillars),
        "company_values_text": natural_join(winner.company_values),
        "story": winner.story,
        "nominated_by": winner.nominated_by or "A colleague",
        "award_month": winner.award_month,
        "hall_of_fame_url": _hall_of_fame_url_for(winner.award_type, settings.get("hall_of_fame_url")),
        "photo_url": winner.photo_url,
        "logo_url": get_settings().logo_url,
        "trophy_image_url": get_settings().trophy_image_url,
    }


def _award_email_subject(winner: Winner) -> str:
    """Return the standard award notification email subject."""

    return (
        f"CWS Pulse Awards — New {_award_type_label(winner.award_type)}: "
        f"{winner.first_name} {winner.last_name}"
    )


@router.get("/admin/winners", response_model=WinnerAdminListResponse)
async def list_admin_winners(
    award_type: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    month: str | None = Query(None),
    year: int | None = Query(None),
    golden_ticket: bool | None = Query(None),
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> WinnerAdminListResponse:
    """Return winner records for the admin interface."""

    del claims
    query = select(Winner)
    if award_type:
        query = query.where(Winner.award_type == award_type)
    if status_filter:
        query = query.where(Winner.status == status_filter)
    if month:
        query = query.where(Winner.award_month == month)
    if year:
        query = query.where(Winner.award_year == year)
    if golden_ticket is not None:
        query = query.where(Winner.golden_ticket.is_(golden_ticket))
    query = query.order_by(Winner.id.desc())

    result = await db.execute(query)
    rows = list(result.scalars().all())
    return WinnerAdminListResponse(
        winners=[WinnerAdmin.model_validate(winner) for winner in rows],
        total=len(rows),
    )


@router.post("/admin/winners/preview", response_model=EmailPreviewResponse)
async def preview_award_email_from_payload(
    payload: WinnerCreate,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> EmailPreviewResponse:
    """Render a preview of the award email from an unsaved payload."""

    del claims
    settings = await _public_settings(db)

    context = {
        "winner_first_name": payload.first_name,
        "winner_last_name": payload.last_name,
        "winner_job_title": payload.job_title,
        "winner_department": payload.department,
        "award_type_label": _award_type_label(payload.award_type),
        "subcategory": payload.subcategory,
        "charter_pillars": payload.charter_pillars,
        "company_values": payload.company_values,
        "charter_pillars_text": natural_join(payload.charter_pillars),
        "company_values_text": natural_join(payload.company_values),
        "story": payload.story,
        "nominated_by": payload.nominated_by or "A colleague",
        "award_month": payload.award_month,
        "hall_of_fame_url": _hall_of_fame_url_for(payload.award_type, settings.get("hall_of_fame_url")),
        "photo_url": payload.photo_url,
        "logo_url": get_settings().logo_url,
        "trophy_image_url": get_settings().trophy_image_url,
    }

    html = render_email(_award_template_name(payload.award_type), context)
    subject = f"CWS Pulse Awards — New {_award_type_label(payload.award_type)}: {payload.first_name} {payload.last_name}"
    return EmailPreviewResponse(html=html, subject=subject)


@router.post("/admin/winners", response_model=WinnerAdmin, status_code=status.HTTP_201_CREATED)
async def create_admin_winner(
    payload: WinnerCreate,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> WinnerAdmin:
    """Create and persist a winner record without sending email."""

    admin_id = _admin_identifier(claims)
    winner = Winner(
        award_type=payload.award_type,
        first_name=payload.first_name,
        last_name=payload.last_name,
        job_title=payload.job_title,
        department=payload.department,
        subcategory=payload.subcategory,
        charter_pillars=payload.charter_pillars,
        company_values=payload.company_values,
        story=payload.story,
        nominated_by=payload.nominated_by,
        photo_url=payload.photo_url,
        award_month=payload.award_month,
        award_year=payload.award_year,
        status=payload.status,
        created_by=admin_id,
        updated_by=admin_id,
    )
    db.add(winner)
    await db.commit()
    await db.refresh(winner)

    return WinnerAdmin.model_validate(winner)


@router.get("/admin/winners/{winner_id}", response_model=WinnerAdmin)
async def get_admin_winner(
    winner_id: int,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> WinnerAdmin:
    """Return a winner record for admin preview/edit screens."""

    del claims
    result = await db.execute(select(Winner).where(Winner.id == winner_id))
    winner = result.scalar_one_or_none()
    if winner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Winner not found")
    return WinnerAdmin.model_validate(winner)


@router.patch("/admin/winners/{winner_id}", response_model=WinnerAdmin)
async def update_admin_winner(
    winner_id: int,
    payload: WinnerCreate,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> WinnerAdmin:
    """Update an existing winner record without sending email."""

    result = await db.execute(select(Winner).where(Winner.id == winner_id))
    winner = result.scalar_one_or_none()
    if winner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Winner not found")

    winner.award_type = payload.award_type
    winner.first_name = payload.first_name
    winner.last_name = payload.last_name
    winner.job_title = payload.job_title
    winner.department = payload.department
    winner.subcategory = payload.subcategory
    winner.charter_pillars = payload.charter_pillars
    winner.company_values = payload.company_values
    winner.story = payload.story
    winner.nominated_by = payload.nominated_by
    winner.photo_url = payload.photo_url
    winner.award_month = payload.award_month
    winner.award_year = payload.award_year
    winner.status = payload.status
    winner.updated_by = _admin_identifier(claims)
    winner.updated_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(winner)
    return WinnerAdmin.model_validate(winner)


@router.patch("/admin/winners/{winner_id}/archive", response_model=WinnerAdmin)
async def archive_admin_winner(
    winner_id: int,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> WinnerAdmin:
    """Archive a winner so it is no longer returned by public Hall of Fame routes."""

    result = await db.execute(select(Winner).where(Winner.id == winner_id))
    winner = result.scalar_one_or_none()
    if winner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Winner not found")

    winner.status = "ARCHIVED"
    winner.updated_by = _admin_identifier(claims)
    winner.updated_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(winner)
    return WinnerAdmin.model_validate(winner)


@router.get("/admin/winners/{winner_id}/email-preview", response_model=EmailPreviewResponse)
async def preview_award_email(
    winner_id: int,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> EmailPreviewResponse:
    """Render the standard award notification email for a saved winner."""

    del claims
    result = await db.execute(select(Winner).where(Winner.id == winner_id))
    winner = result.scalar_one_or_none()
    if winner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Winner not found")

    settings = await _public_settings(db)
    context = _award_email_context(winner, settings)
    html = render_email(_award_template_name(winner.award_type), context)
    return EmailPreviewResponse(html=html, subject=_award_email_subject(winner))


@router.post("/admin/winners/{winner_id}/email-send", response_model=EmailSendResponse)
async def send_award_email(
    winner_id: int,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> EmailSendResponse:
    """Send the standard award notification email for a saved winner."""

    del claims
    result = await db.execute(select(Winner).where(Winner.id == winner_id))
    winner = result.scalar_one_or_none()
    if winner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Winner not found")

    recipients = await _active_recipient_emails(db)
    if not recipients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active email recipients configured",
        )

    settings = await _public_settings(db)
    context = _award_email_context(winner, settings)
    template_name = _award_template_name(winner.award_type)
    subject = _award_email_subject(winner)

    try:
        await send_templated_email(template_name, context, recipients)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Award email send failed",
        ) from exc

    return EmailSendResponse(email_sent=True, recipients=recipients, subject=subject)


@router.get("/admin/winners/{winner_id}/certificate.pdf")
async def download_award_certificate(
    winner_id: int,
    claims: dict[str, Any] = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    """Render and download the standard award certificate as a print-ready PDF."""

    del claims
    result = await db.execute(select(Winner).where(Winner.id == winner_id))
    winner = result.scalar_one_or_none()
    if winner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Winner not found")

    settings = await _public_settings(db)
    context = _award_email_context(winner, settings)
    # The PDF sidecar runs in its own container, so it needs its own reachable asset URLs
    # for the logo and trophy — see pdf_asset_base_url in core/config.py.
    context["logo_url"] = get_settings().pdf_logo_url
    context["trophy_image_url"] = get_settings().pdf_trophy_image_url
    html = render_certificate(_certificate_template_name(winner.award_type), context)

    filename = f"{winner.first_name}-{winner.last_name}-certificate.pdf".replace(" ", "-")
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
