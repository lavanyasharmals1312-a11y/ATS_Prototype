from contextlib import asynccontextmanager
import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.routes.health import router as health_router


# ── Logging setup ──────────────────────────────────────────

logger.remove()

logger.add(
    sys.stderr,
    level=settings.log_level,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
           "<level>{level: <8}</level> | "
           "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
           "<level>{message}</level>",
)


# ── Lifespan ───────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        f"Starting ProEx Labs ATS v{settings.app_version} "
        f"({settings.app_env})"
    )

    yield

    logger.info("Shutting down ProEx Labs ATS")


# ── Rate Limiter ───────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)


# ── FastAPI Application ────────────────────────────────────

app = FastAPI(
    title="ProEx Labs ATS",
    version=settings.app_version,
    lifespan=lifespan,
)


# ── Rate Limiter Configuration ─────────────────────────────

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)


# ── CORS Configuration ─────────────────────────────────────

origins = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ─────────────────────────────────────────────────

app.include_router(health_router)


# ── Global Exception Handler ───────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error: {exc}")

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
        },
    )


# ── Root Endpoint ──────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "app": "ProEx Labs ATS",
        "version": settings.app_version,
    }