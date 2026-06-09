"""Public API routes — health checks, Hall of Fame reads, config reads."""

import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


from app.core.config import get_settings
from app.core.database import check_database, get_db_session
from app.models import (
    ConfigPillar,
    ConfigSetting,
    ConfigSubcategory,
    ConfigValue,
    Winner,
)
from app.schemas.config import PillarOut, PublicSettingsOut, SubcategoryOut, ValueOut
from app.schemas.winner import WinnerListResponse, WinnerPublic

router = APIRouter(prefix="/api/v1", tags=["public"])

settings = get_settings()


async def check_smtp() -> None:
    """Raise if the configured SMTP endpoint cannot be reached."""

    reader, writer = await asyncio.wait_for(
        asyncio.open_connection(settings.smtp_host, settings.smtp_port),
        timeout=settings.smtp_timeout_seconds,
    )
    writer.close()
    await writer.wait_closed()
    del reader


@router.get("/health")
async def health() -> dict[str, str]:
    """Return a basic liveness response."""

    return {"status": "ok"}


@router.get("/health/ready")
async def ready() -> JSONResponse:
    """Return dependency readiness for database and SMTP connectivity."""

    checks: dict[str, str] = {"db": "ok", "smtp": "ok"}

    try:
        await check_database()
    except Exception:
        checks["db"] = "error"

    try:
        await check_smtp()
    except Exception:
        checks["smtp"] = "error"

    is_ready = all(value == "ok" for value in checks.values())
    payload = {"status": "ready" if is_ready else "not_ready", **checks}
    return JSONResponse(
        status_code=status.HTTP_200_OK
        if is_ready
        else status.HTTP_503_SERVICE_UNAVAILABLE,
        content=payload,
    )


@router.get("/winners", response_model=WinnerListResponse)
async def list_winners(
    award_type: str = Query(
        ..., description="Filter by award type (CHARTER_CHAMPION or INSTANT_IMPACT)"
    ),
    month: str | None = Query(
        None, description="Filter by award month (e.g. Jun 2026)"
    ),
    year: int | None = Query(None, description="Filter by award year (e.g. 2026)"),
    db: AsyncSession = Depends(get_db_session),
) -> WinnerListResponse:
    """Return published winners for the Hall of Fame, filtered by award type and optionally by month/year."""

    query = select(Winner).where(
        Winner.status == "PUBLISHED", Winner.award_type == award_type
    )

    if month:
        query = query.where(Winner.award_month == month)
    if year:
        query = query.where(Winner.award_year == year)

    query = query.order_by(
        Winner.award_year.desc(), Winner.award_month.desc(), Winner.id.desc()
    )

    result = await db.execute(query)
    rows = list(result.scalars().all())

    return WinnerListResponse(
        winners=[WinnerPublic.model_validate(w) for w in rows],
        total=len(rows),
    )


@router.get("/winners/{winner_id}", response_model=WinnerPublic)
async def get_winner(
    winner_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> WinnerPublic:
    """Return a single published winner by ID."""

    result = await db.execute(
        select(Winner).where(Winner.id == winner_id, Winner.status == "PUBLISHED")
    )
    winner = result.scalar_one_or_none()

    if winner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Winner not found"
        )

    return WinnerPublic.model_validate(winner)


@router.get("/config/pillars", response_model=list[PillarOut])
async def list_pillars(
    db: AsyncSession = Depends(get_db_session),
) -> list[PillarOut]:
    """Return active charter pillars sorted by sort_order."""

    result = await db.execute(
        select(ConfigPillar)
        .where(ConfigPillar.active.is_(True))
        .order_by(ConfigPillar.sort_order)
    )
    return [PillarOut.model_validate(row) for row in result.scalars().all()]


@router.get("/config/values", response_model=list[ValueOut])
async def list_values(
    db: AsyncSession = Depends(get_db_session),
) -> list[ValueOut]:
    """Return active company values sorted by sort_order."""

    result = await db.execute(
        select(ConfigValue)
        .where(ConfigValue.active.is_(True))
        .order_by(ConfigValue.sort_order)
    )
    return [ValueOut.model_validate(row) for row in result.scalars().all()]


@router.get("/config/subcategories", response_model=list[SubcategoryOut])
async def list_subcategories(
    award_type: str | None = Query(None, description="Filter by award type"),
    db: AsyncSession = Depends(get_db_session),
) -> list[SubcategoryOut]:
    """Return active subcategories, optionally filtered by award type."""

    query = select(ConfigSubcategory).where(ConfigSubcategory.active.is_(True))
    if award_type:
        query = query.where(ConfigSubcategory.award_type == award_type)
    query = query.order_by(ConfigSubcategory.sort_order)

    result = await db.execute(query)
    return [SubcategoryOut.model_validate(row) for row in result.scalars().all()]


@router.get("/config/settings/public", response_model=PublicSettingsOut)
async def get_public_settings(
    db: AsyncSession = Depends(get_db_session),
) -> PublicSettingsOut:
    """Return safe public settings (hall_of_fame_url, hall_of_fame_intro, programme_launch_month)."""

    allowed_keys = ["hall_of_fame_url", "hall_of_fame_intro", "programme_launch_month"]

    result = await db.execute(
        select(ConfigSetting).where(ConfigSetting.key.in_(allowed_keys))
    )
    rows = result.scalars().all()

    data: dict[str, str | None] = {}
    for row in rows:
        data[row.key] = row.value

    return PublicSettingsOut(**data)
