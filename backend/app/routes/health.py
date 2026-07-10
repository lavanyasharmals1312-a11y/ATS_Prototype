from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.config import settings
from app.dependencies import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {
            "success": True,
            "data": {
                "status": "ok",
                "version": settings.app_version,
                "db_status": "connected",
            },
        }
    except Exception as e:
        logger.warning(f"Health check DB connection failed: {e}")
        return {
            "success": False,
            "data": {
                "status": "degraded",
                "db_status": "unavailable",
            },
        }
