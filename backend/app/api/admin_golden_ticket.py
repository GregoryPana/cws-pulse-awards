"""Admin Golden Ticket API routes — email preview."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.dependencies import require_admin_claims
from app.models import ConfigSetting, Winner
from app.schemas.email import EmailPreviewResponse
from app.services.email_renderer import render_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["admin-golden-ticket"])


@router.get(
    "/admin/winners/{winner_id}/golden-ticket/email-preview",
    response_model=EmailPreviewResponse,
)
async def preview_golden_ticket_email(
    winner_id: int,
    claims: dict = Depends(require_admin_claims),
    db: AsyncSession = Depends(get_db_session),
) -> EmailPreviewResponse:
    """Render a preview of the Golden Ticket email HTML for the specified winner."""

    result = await db.execute(select(Winner).where(Winner.id == winner_id))
    winner = result.scalar_one_or_none()

    if winner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Winner not found"
        )

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
    config_rows = {row.key: row.value for row in settings_result.scalars().all()}

    award_type_label = (
        "Charter Champion"
        if winner.award_type == "CHARTER_CHAMPION"
        else "Instant Impact"
    )
    nominated_by = winner.nominated_by or "A colleague"

    context = {
        "winner_first_name": winner.first_name,
        "winner_last_name": winner.last_name,
        "winner_job_title": winner.job_title,
        "winner_department": winner.department,
        "award_type_label": award_type_label,
        "subcategory": winner.subcategory,
        "charter_pillar": winner.charter_pillar,
        "company_value": winner.company_value,
        "story": winner.story,
        "nominated_by": nominated_by,
        "award_month": winner.award_month,
        "hall_of_fame_url": config_rows.get("hall_of_fame_url", ""),
        "photo_url": winner.photo_url,
        "ceo_message": winner.golden_ticket_ceo_message or "",
        "ceo_name": config_rows.get("ceo_name", ""),
        "ceo_title": config_rows.get("ceo_title", ""),
        "ccco_name": config_rows.get("ccco_name", ""),
        "ccco_title": config_rows.get("ccco_title", ""),
        "chief_pc_name": config_rows.get("chief_pc_name"),
        "chief_pc_title": config_rows.get("chief_pc_title"),
        "occasion_label": winner.golden_ticket_occasion,
    }

    html = render_email("golden_ticket.html", context)

    subject = f"CWS Golden Ticket — {winner.first_name} {winner.last_name}"
    if winner.golden_ticket_occasion:
        subject += f" | {winner.golden_ticket_occasion}"

    return EmailPreviewResponse(html=html, subject=subject)
