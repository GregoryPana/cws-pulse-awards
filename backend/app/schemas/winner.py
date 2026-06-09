"""Winner API schemas for public and admin read operations."""

from pydantic import BaseModel, ConfigDict


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
    charter_pillar: str
    company_value: str
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


class WinnerListResponse(BaseModel):
    """Paginated list of winners returned to the Hall of Fame."""

    winners: list[WinnerPublic]
    total: int
