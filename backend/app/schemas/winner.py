"""Winner API schemas for public and admin read operations."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


AwardType = Literal["CHARTER_CHAMPION", "INSTANT_IMPACT"]
WinnerStatus = Literal["PUBLISHED", "ARCHIVED", "REMOVED"]


class WinnerCreate(BaseModel):
    """Admin payload for creating an award winner."""

    award_type: AwardType
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    job_title: str = Field(min_length=1, max_length=200)
    department: str = Field(min_length=1, max_length=200)
    subcategory: str = Field(min_length=1, max_length=200)
    charter_pillars: list[str] = Field(min_length=1)
    company_values: list[str] = Field(min_length=1)
    story: str = Field(min_length=1)
    nominated_by: str | None = Field(default=None, max_length=200)
    award_month: str = Field(min_length=1, max_length=20)
    award_year: int = Field(ge=2026, le=2100)
    photo_url: str | None = Field(default=None, max_length=500)
    status: WinnerStatus = "PUBLISHED"


class WinnerPublic(BaseModel):
    """Public winner representation shown on Hall of Fame pages."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    award_type: str
    first_name: str
    last_name: str
    job_title: str
    department: str
    subcategory: str
    charter_pillars: list[str]
    company_values: list[str]
    story: str
    nominated_by: str | None
    photo_url: str | None
    award_month: str
    award_year: int
    golden_ticket: bool
    golden_ticket_occasion: str | None
    is_top_five: bool
    top_five_rank: int | None
    top_five_year: int | None
    status: str


class WinnerAdmin(WinnerPublic):
    """Admin winner representation returned after create/list/detail operations."""

    golden_ticket_ceo_message: str | None
    created_by: str
    updated_by: str | None


class GoldenTicketUpdate(BaseModel):
    """Admin payload for marking and personalising a Golden Ticket winner."""

    occasion_label: str = Field(min_length=1, max_length=100)
    ceo_message: str = Field(min_length=1)


class WinnerListResponse(BaseModel):
    """Paginated list of winners returned to the Hall of Fame."""

    winners: list[WinnerPublic]
    total: int


class WinnerAdminListResponse(BaseModel):
    """List of admin winner records."""

    winners: list[WinnerAdmin]
    total: int
