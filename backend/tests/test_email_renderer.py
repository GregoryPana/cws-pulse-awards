"""Email renderer service tests."""

from app.services.email_renderer import render_email


def test_render_email_renders_charter_champion_template() -> None:
    """Should render the Charter Champion email template with context variables."""

    context = {
        "winner_first_name": "Marie-Celina",
        "winner_last_name": "Esther",
        "winner_job_title": "Customer Service Officer",
        "winner_department": "Customer Operations",
        "award_type_label": "Charter Champion",
        "subcategory": "Collaboration Catalyst",
        "charter_pillar": "Professionalism & Respect",
        "company_value": "Customer",
        "story": "Great collaboration story.",
        "nominated_by": "A colleague",
        "award_month": "Jun 2026",
        "hall_of_fame_url": "https://pulse.cwsey.com",
        "photo_url": None,
    }

    html = render_email("award_charter_champion.html", context)

    assert "Marie-Celina" in html
    assert "Esther" in html
    assert "Charter Champion" in html
    assert "Great collaboration story" in html
    assert "A New" in html
    assert "Peer-to-Peer Recognition" in html
    assert "colleague-to-colleague" in html
    assert "View this peer recognition" in html
    assert "Open Hall of Fame" in html
    assert "Peer recognised. Charter led. Techco ready." in html


def test_render_email_renders_instant_impact_template() -> None:
    """Should render the Instant Impact email template with context variables."""

    context = {
        "winner_first_name": "Vania",
        "winner_last_name": "Malbrook",
        "winner_job_title": "Operations Manager",
        "winner_department": "Operations",
        "award_type_label": "Instant Impact",
        "subcategory": "Service Recovery Excellence",
        "charter_pillar": "Customer Centricity & Insights Driven",
        "company_value": "Customer",
        "story": "Service recovery story.",
        "nominated_by": "Naadir Hassan",
        "award_month": "Jun 2026",
        "hall_of_fame_url": "https://pulse.cwsey.com",
        "photo_url": None,
    }

    html = render_email("award_instant_impact.html", context)

    assert "Vania" in html
    assert "Malbrook" in html
    assert "Instant Impact" in html
    assert "Recognising action that moved the needle" not in html
    assert "Manager-to-Staff Recognition" in html
    assert "A leadership recognition" in html
    assert "View this manager recognition" in html
    assert "Open Hall of Fame" in html


def test_render_email_renders_golden_ticket_template() -> None:
    """Should render the Golden Ticket email template with all context variables."""

    context = {
        "winner_first_name": "Tania",
        "winner_last_name": "Labonte",
        "winner_job_title": "Customer Service Manager",
        "winner_department": "Customer Operations",
        "award_type_label": "Charter Champion",
        "subcategory": "Collaboration Catalyst",
        "charter_pillar": "Proactive Problem Solving, Urgency & Ownership",
        "company_value": "Accountability",
        "story": "Leadership story.",
        "nominated_by": "Maria Pouponneau",
        "award_month": "Sep 2026",
        "hall_of_fame_url": "https://pulse.cwsey.com",
        "photo_url": None,
        "ceo_message": "Thank you for your dedication.",
        "ceo_name": "Naadir Hassan",
        "ceo_title": "Chief Executive Officer",
        "ccco_name": "Maria Pouponneau",
        "ccco_title": "Chief Customer Centric Officer",
        "chief_pc_name": None,
        "chief_pc_title": None,
        "occasion_label": "Q3 2026",
    }

    html = render_email("golden_ticket.html", context)

    assert "Tania" in html
    assert "Labonte" in html
    assert "Thank you for your dedication" in html
    assert "Naadir Hassan" in html
    assert "Golden Ticket Recognition" in html
    assert "An elevated recognition reserved" in html
    assert "Executive recognition" in html


def test_render_email_handles_missing_optional_fields() -> None:
    """Should render gracefully when optional fields are missing."""

    context = {
        "winner_first_name": "Test",
        "winner_last_name": "User",
        "winner_job_title": "Tester",
        "winner_department": "QA",
        "award_type_label": "Charter Champion",
        "subcategory": "Collaboration Catalyst",
        "charter_pillar": "Accountability",
        "company_value": "Team",
        "story": "Test story.",
        "nominated_by": "A colleague",
        "award_month": "Jun 2026",
        "hall_of_fame_url": "https://pulse.cwsey.com",
        "photo_url": None,
    }

    html = render_email("award_charter_champion.html", context)
    assert "Test" in html
    assert "Test story" in html


def test_render_email_handles_empty_context_gracefully() -> None:
    """Should not crash when context variables are empty strings."""

    context = {
        "winner_first_name": "",
        "winner_last_name": "",
        "winner_job_title": "",
        "winner_department": "",
        "award_type_label": "",
        "subcategory": "",
        "charter_pillar": "",
        "company_value": "",
        "story": "",
        "nominated_by": "",
        "award_month": "",
        "hall_of_fame_url": "",
        "photo_url": None,
    }

    html = render_email("award_charter_champion.html", context)
    assert isinstance(html, str)
    assert len(html) > 0
