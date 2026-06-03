"""Minimal Playwright-backed PDF sidecar for Phase 0."""

from fastapi import FastAPI
from fastapi.responses import Response
from pydantic import BaseModel
from playwright.async_api import async_playwright


class GenerateRequest(BaseModel):
    """PDF render request body."""

    html: str
    filename: str


app = FastAPI(title="Pulse Awards PDF Service", version="0.1.0")


async def render_pdf(html: str) -> bytes:
    """Render HTML to PDF bytes with headless Chromium."""

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(args=["--no-sandbox"])
        try:
            page = await browser.new_page()
            await page.set_content(html, wait_until="networkidle")
            return await page.pdf(format="A4", print_background=True)
        finally:
            await browser.close()


@app.get("/health")
async def health() -> dict[str, str]:
    """Return sidecar health."""

    return {"status": "ok"}


@app.post("/generate")
async def generate_pdf(request: GenerateRequest) -> Response:
    """Render the supplied HTML into a print-ready PDF."""

    headers = {"Content-Disposition": f'attachment; filename="{request.filename}"'}
    return Response(content=await render_pdf(request.html), media_type="application/pdf", headers=headers)
