import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import websocket_router, auth_router, settings_router, sessions_router, tts_router
from app.core.database import init_db

app = FastAPI()

@app.on_event("startup")
def on_startup():
    init_db()

# Configure CORS based on environment
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:8080"
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

app.include_router(auth_router)
app.include_router(settings_router)
app.include_router(sessions_router)
app.include_router(websocket_router)
app.include_router(tts_router)

@app.get("/", tags=['Root'])
def read_root():
    return {"message": "Clario Backend!"}



