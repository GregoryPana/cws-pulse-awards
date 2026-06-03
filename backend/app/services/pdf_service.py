"""PDF service client stub for the Playwright sidecar."""

from typing import Final

import httpx

from app.core.config import get_settings

PLACEHOLDER_PDF_BYTES: Final[bytes] = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]/Contents 4 0 R>>endobj\n"
    b"4 0 obj<</Length 44>>stream\nBT /F1 12 Tf 24 72 Td (Pulse Awards Placeholder PDF) Tj ET\nendstream endobj\n"
    b"xref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000110 00000 n \n0000000193 00000 n \n"
    b"trailer<</Size 5/Root 1 0 R>>\nstartxref\n289\n%%EOF"
)


async def request_placeholder_pdf() -> bytes:
    """Request a placeholder PDF from the Playwright sidecar."""

    settings = get_settings()
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{settings.pdf_service_url}/generate",
            json={"html": "<html><body><p>Pulse Awards Placeholder PDF</p></body></html>", "filename": "placeholder.pdf"},
        )
        response.raise_for_status()
        return response.content
