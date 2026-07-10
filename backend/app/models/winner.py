"""Winner ORM model."""

from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Winner(Base):
    """Published, archived, or removed award winner row."""

    __tablename__ = "winners"
    __table_args__ = (
        CheckConstraint("top_five_rank BETWEEN 1 AND 5", name="winners_top_five_rank_check"),
        CheckConstraint("array_length(charter_pillars, 1) >= 1", name="winners_charter_pillars_nonempty_check"),
        CheckConstraint("array_length(company_values, 1) >= 1", name="winners_company_values_nonempty_check"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    award_type: Mapped[str] = mapped_column(String(50), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    job_title: Mapped[str] = mapped_column(String(200), nullable=False)
    department: Mapped[str] = mapped_column(String(200), nullable=False)
    subcategory: Mapped[str] = mapped_column(String(200), nullable=False)
    charter_pillars: Mapped[list[str]] = mapped_column(ARRAY(String(200)), nullable=False)
    company_values: Mapped[list[str]] = mapped_column(ARRAY(String(100)), nullable=False)
    story: Mapped[str] = mapped_column(Text, nullable=False)
    nominated_by: Mapped[str | None] = mapped_column(String(200))
    photo_url: Mapped[str | None] = mapped_column(String(500))
    award_month: Mapped[str] = mapped_column(String(20), nullable=False)
    award_year: Mapped[int] = mapped_column(Integer, nullable=False)
    golden_ticket: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    golden_ticket_occasion: Mapped[str | None] = mapped_column(String(100))
    golden_ticket_ceo_message: Mapped[str | None] = mapped_column(Text)
    golden_ticket_triggered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    golden_ticket_triggered_by: Mapped[str | None] = mapped_column(String(200))
    is_top_five: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    top_five_rank: Mapped[int | None] = mapped_column(Integer)
    top_five_year: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="PUBLISHED")
    removed_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[str] = mapped_column(String(200), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_by: Mapped[str | None] = mapped_column(String(200))
