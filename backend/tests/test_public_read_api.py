"""Public read API endpoint tests for Hall of Fame and config."""

from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.main import app


def _build_mock_session(return_value: Any) -> AsyncSession:
    """Build a minimal mock async session that returns fixed data for any query."""

    class MockResult:
        """Stub result with scalars().all() or scalar_one_or_none()."""

        def __init__(self, data: Any) -> None:
            self._data = data

        def scalars(self) -> "MockResult":
            return self

        def all(self) -> list[Any]:
            return self._data if isinstance(self._data, list) else []

        def scalar_one_or_none(self) -> Any | None:
            return self._data if not isinstance(self._data, list) else None

    class MockSession:
        """Stub async session returning configured data for any select."""

        async def execute(self, statement) -> MockResult:
            return MockResult(return_value)

        async def __aenter__(self) -> "MockSession":
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
            pass

    return MockSession()  # type: ignore[return-value]


class FakeWinner:
    """Minimal winner stub for tests."""

    id = 1
    award_type = "CHARTER_CHAMPION"
    first_name = "Jane"
    last_name = "Doe"
    job_title = "Engineer"
    department = "Tech"
    subcategory = "Collaboration Catalyst"
    charter_pillar = "Accountability"
    company_value = "Team"
    story = "Great work"
    nominated_by = "A colleague"
    photo_url = None
    award_month = "Jun 2026"
    award_year = 2026
    golden_ticket = False
    golden_ticket_occasion = None
    is_top_five = False
    top_five_rank = None
    top_five_year = None
    status = "PUBLISHED"


class FakePillar:
    """Stub pillar."""

    id = 1
    name = "Test Pillar"
    sort_order = 1


class FakeValue:
    """Stub value."""

    id = 1
    name = "Customer"
    sort_order = 1


class FakeSubcategory:
    """Stub subcategory."""

    id = 1
    award_type = "CHARTER_CHAMPION"
    name = "Collaboration Catalyst"
    sort_order = 1


class TestListWinners:
    """Tests for GET /api/v1/winners."""

    def test_returns_empty_list_when_no_winners(self) -> None:
        """Should return an empty list when no winners match the filters."""

        async def override_get_db():
            yield _build_mock_session([])

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get("/api/v1/winners?award_type=CHARTER_CHAMPION")
            assert response.status_code == 200
            data = response.json()
            assert data["winners"] == []
            assert data["total"] == 0
        finally:
            app.dependency_overrides.clear()

    def test_returns_winners_for_given_award_type(self) -> None:
        """Should return winners matching the specified award_type."""

        async def override_get_db():
            yield _build_mock_session([FakeWinner()])

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get("/api/v1/winners?award_type=CHARTER_CHAMPION")
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 1
            assert data["winners"][0]["first_name"] == "Jane"
        finally:
            app.dependency_overrides.clear()

    def test_filters_by_month(self) -> None:
        """Should filter winners by month when the parameter is provided."""

        async def override_get_db():
            yield _build_mock_session([])

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get(
                "/api/v1/winners?award_type=INSTANT_IMPACT&month=Jun%202026"
            )
            assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

    def test_filters_by_year(self) -> None:
        """Should filter winners by year when the parameter is provided."""

        async def override_get_db():
            yield _build_mock_session([])

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get(
                "/api/v1/winners?award_type=CHARTER_CHAMPION&year=2026"
            )
            assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

    def test_returns_422_when_award_type_missing(self) -> None:
        """Should return 422 when award_type query parameter is omitted."""

        async def override_get_db():
            yield _build_mock_session([])

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get("/api/v1/winners")
            assert response.status_code == 422
        finally:
            app.dependency_overrides.clear()


class TestGetWinner:
    """Tests for GET /api/v1/winners/{id}."""

    def test_returns_winner_when_found(self) -> None:
        """Should return the winner when the ID exists."""

        async def override_get_db():
            yield _build_mock_session(FakeWinner())

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get("/api/v1/winners/1")
            assert response.status_code == 200
            data = response.json()
            assert data["first_name"] == "Jane"
            assert data["last_name"] == "Doe"
        finally:
            app.dependency_overrides.clear()

    def test_returns_404_when_not_found(self) -> None:
        """Should return 404 when the winner ID does not exist."""

        async def override_get_db():
            yield _build_mock_session(None)

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get("/api/v1/winners/999")
            assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()

    def test_returns_422_for_invalid_id(self) -> None:
        """Should return 422 when the winner ID is not a valid integer."""

        async def override_get_db():
            yield _build_mock_session([])

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get("/api/v1/winners/abc")
            assert response.status_code == 422
        finally:
            app.dependency_overrides.clear()


class TestConfigPillars:
    """Tests for GET /api/v1/config/pillars."""

    def test_returns_active_pillars_sorted(self) -> None:
        """Should return active pillars sorted by sort_order."""

        async def override_get_db():
            yield _build_mock_session([FakePillar()])

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get("/api/v1/config/pillars")
            assert response.status_code == 200
            assert isinstance(response.json(), list)
        finally:
            app.dependency_overrides.clear()


class TestConfigValues:
    """Tests for GET /api/v1/config/values."""

    def test_returns_active_values_sorted(self) -> None:
        """Should return active values sorted by sort_order."""

        async def override_get_db():
            yield _build_mock_session([FakeValue()])

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get("/api/v1/config/values")
            assert response.status_code == 200
            assert isinstance(response.json(), list)
        finally:
            app.dependency_overrides.clear()


class TestConfigSubcategories:
    """Tests for GET /api/v1/config/subcategories."""

    def test_returns_all_when_no_filter(self) -> None:
        """Should return all active subcategories when no award_type filter is provided."""

        async def override_get_db():
            yield _build_mock_session([FakeSubcategory()])

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get("/api/v1/config/subcategories")
            assert response.status_code == 200
            assert isinstance(response.json(), list)
        finally:
            app.dependency_overrides.clear()

    def test_filters_by_award_type(self) -> None:
        """Should filter subcategories by award_type."""

        async def override_get_db():
            yield _build_mock_session([])

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get(
                "/api/v1/config/subcategories?award_type=INSTANT_IMPACT"
            )
            assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()


class TestPublicSettings:
    """Tests for GET /api/v1/config/settings/public."""

    class FakeSetting:
        """Stub config setting row."""

        def __init__(self, key: str, value: str | None) -> None:
            self.key = key
            self.value = value

    def test_returns_public_settings(self) -> None:
        """Should return a dict with the expected public settings keys."""

        async def override_get_db():
            yield _build_mock_session(
                [
                    self.FakeSetting("hall_of_fame_url", "https://pulse.cwsey.com"),
                    self.FakeSetting(
                        "hall_of_fame_intro", "Welcome to the Hall of Fame"
                    ),
                    self.FakeSetting("programme_launch_month", "Jun 2026"),
                ]
            )

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get("/api/v1/config/settings/public")
            assert response.status_code == 200
            data = response.json()
            assert data["hall_of_fame_url"] == "https://pulse.cwsey.com"
            assert data["hall_of_fame_intro"] == "Welcome to the Hall of Fame"
            assert data["programme_launch_month"] == "Jun 2026"
        finally:
            app.dependency_overrides.clear()

    def test_returns_partial_data_when_settings_missing(self) -> None:
        """Should return nulls for missing settings rather than erroring."""

        async def override_get_db():
            yield _build_mock_session([])

        app.dependency_overrides[get_db_session] = override_get_db
        client = TestClient(app)

        try:
            response = client.get("/api/v1/config/settings/public")
            assert response.status_code == 200
            data = response.json()
            assert data["hall_of_fame_url"] is None
        finally:
            app.dependency_overrides.clear()
