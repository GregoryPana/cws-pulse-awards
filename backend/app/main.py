"""FastAPI application entry point for CWS Pulse Awards."""

from fastapi import FastAPI

from app.api.admin_golden_ticket import router as admin_golden_ticket_router
from app.api.admin_winners import router as admin_winners_router
from app.api.auth import router as auth_router
from app.api.public import router as public_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="CWS Pulse Awards API", version=settings.app_version)

app.include_router(public_router)
app.include_router(auth_router)
app.include_router(admin_winners_router)
app.include_router(admin_golden_ticket_router)
