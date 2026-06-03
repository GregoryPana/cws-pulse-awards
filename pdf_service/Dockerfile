FROM mcr.microsoft.com/playwright/python:v1.53.0-jammy

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir -r requirements.txt

COPY pdf_service.py ./pdf_service.py
COPY templates ./templates

EXPOSE 8001

CMD ["uvicorn", "pdf_service:app", "--host", "0.0.0.0", "--port", "8001"]
