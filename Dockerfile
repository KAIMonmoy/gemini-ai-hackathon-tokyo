# Single Cloud Run image: builds the SPA, then serves it + the API from FastAPI.

# --- Stage 1: build the React/Vite SPA ---------------------------------------
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
# `npm install` (not `npm ci`): the lockfile is generated on macOS and omits
# Linux-only optional native deps (@emnapi/*, rollup/tailwind linux binaries),
# which makes strict `npm ci` fail inside the Linux build image.
RUN npm install --no-audit --no-fund
COPY frontend/ ./
# Same-origin API in production (.env.production.local has highest Vite priority,
# so this overrides the empty VITE_API_BASE in .env while keeping the firebase keys).
RUN printf "VITE_API_BASE=/api\n" > .env.production.local && npm run build

# --- Stage 2: python runtime (API + static SPA) ------------------------------
FROM python:3.12-slim AS app
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app \
    USE_STUBS=true \
    STATIC_DIR=/app/backend/static

# tzdata keeps tzlocal (pulled in by ADK) happy on the slim base.
RUN apt-get update && apt-get install -y --no-install-recommends tzdata \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install -r backend/requirements.txt

COPY sourcing_sentinel/ ./sourcing_sentinel/
COPY backend/ ./backend/
COPY data/ ./data/
COPY --from=web /web/dist ./backend/static

EXPOSE 8080
# Cloud Run injects $PORT (defaults to 8080).
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
