"""Configuration API schemas for public read operations."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PillarOut(BaseModel):
    """Charter pillar returned to public Hall of Fame."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sort_order: int


class ValueOut(BaseModel):
    """Company value returned to public Hall of Fame."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sort_order: int


class SubcategoryOut(BaseModel):
    """Award subcategory returned to public Hall of Fame."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    award_type: str
    name: str
    sort_order: int


class PublicSettingsOut(BaseModel):
    """Safe subset of platform configuration exposed without auth."""

    hall_of_fame_url: str | None = None
    hall_of_fame_intro: str | None = None
    programme_launch_month: str | None = None
