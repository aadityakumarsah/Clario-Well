import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env into os.environ so os.getenv() calls anywhere in the app see the values
load_dotenv(Path(__file__).parent.parent / ".env")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import websocket_router, auth_router, settings_router, sessions_router, tts_router, relief_router, payments_router, avatar_router
from app.routers.daily_checks import daily_checks_router
from app.core.database import init_db
from app.db.subscriptions import init_subscriptions_table
from app.services import voice_session as voice_session_service

app = FastAPI()

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all: log the error and always include CORS headers so the browser
    gets a proper JSON error instead of a CORS-blocked empty response."""
    from loguru import logger
    logger.exception("Unhandled exception on {} {}: {}", request.method, request.url.path, exc)
    origin = request.headers.get("origin", "")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(status_code=500, content={"detail": str(exc)}, headers=headers)

app.include_router(auth_router)
app.include_router(settings_router)
app.include_router(sessions_router)
app.include_router(websocket_router)
app.include_router(tts_router)
app.include_router(relief_router)
app.include_router(payments_router)
app.include_router(avatar_router)
app.include_router(daily_checks_router)

@app.api_route("/", methods=["GET", "HEAD"], tags=['Root'])
def read_root():
    return {"message": "Clario Backend!"}

@app.api_route("/health", methods=["GET", "HEAD"], tags=['Root'])
def health_check():
    # HEAD is used by UptimeRobot and load balancers — must return 200 with no body
    return {"status": "ok"}



