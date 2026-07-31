import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env into os.environ so os.getenv() calls anywhere in the app see the values
load_dotenv(Path(__file__).parent.parent / ".env")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.routers import websocket_router, auth_router, settings_router, sessions_router, tts_router, relief_router, payments_router, avatar_router, nepal_payments_router
from app.routers.daily_checks import daily_checks_router
from app.core.database import init_db
from app.db.subscriptions import init_subscriptions_table
from app.services import voice_session as voice_session_service

app = FastAPI(docs_url="/docs" if settings.DEBUG else None, redoc_url="/redoc" if settings.DEBUG else None)

@app.on_event("startup")
def on_startup():
    init_db()
    init_subscriptions_table()
    # Prune sessions (+ their conversation history) older than 10 days on every cold start.
    # Render spins down free-tier instances between requests, so this runs frequently enough
    # to stay within budget without a dedicated cron job.
    removed = voice_session_service.cleanup_sessions_older_than(days=10)
    if removed:
        from loguru import logger
        logger.info("Startup: pruned {} session(s) older than 10 days", removed)

# Configure CORS based on environment
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:8080,https://clario-np.vercel.app"
)
ALLOWED_ORIGINS = [o.strip().rstrip("/") for o in _raw_origins.split(",") if o.strip()]

# Dev/preview origin regex is opt-in via env; production uses the exact list only.
_preview_regex = os.getenv("CORS_PREVIEW_REGEX", "").strip() or None

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=_preview_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)


@app.middleware("http")
async def _security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    return response


def _origin_allowed(origin: str) -> bool:
    if origin in ALLOWED_ORIGINS:
        return True
    if _preview_regex:
        import re
        return re.fullmatch(_preview_regex, origin) is not None
    return False


@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all: log the full error server-side, return a generic message to the
    client (no internal details), and only attach CORS headers for allowed origins."""
    from loguru import logger
    logger.exception("Unhandled exception on {} {}: {}", request.method, request.url.path, exc)
    origin = request.headers.get("origin", "")
    headers = {"X-Content-Type-Options": "nosniff"}
    if origin and _origin_allowed(origin):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
        headers=headers,
    )

app.include_router(auth_router)
app.include_router(settings_router)
app.include_router(sessions_router)
app.include_router(websocket_router)
app.include_router(tts_router)
app.include_router(relief_router)
app.include_router(payments_router)
app.include_router(avatar_router)
app.include_router(daily_checks_router)
app.include_router(nepal_payments_router)

@app.api_route("/", methods=["GET", "HEAD"], tags=['Root'])
def read_root():
    return {"message": "Clario Backend!"}

@app.api_route("/health", methods=["GET", "HEAD"], tags=['Root'])
def health_check():
    # HEAD is used by UptimeRobot and load balancers — must return 200 with no body
    return {"status": "ok"}



