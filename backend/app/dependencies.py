from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.user import User
from app.services import auth_service


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=401, detail="Authorization header missing"
        )
    payload = auth_service.decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=401, detail="User not found or inactive"
        )
    return user


from app.repositories.candidate_repository import CandidateRepository
from app.services.candidate_service import CandidateService
from app.repositories.duplicate_repository import DuplicateFlagRepository
from app.services.duplicate_service import DuplicateService


def get_candidate_service(
    db: AsyncSession = Depends(get_db),
) -> CandidateService:
    repo = CandidateRepository(db)
    return CandidateService(repo)


def get_duplicate_service(
    db: AsyncSession = Depends(get_db),
) -> DuplicateService:
    repo = DuplicateFlagRepository(db)
    return DuplicateService(repo)


from app.repositories.import_repository import ImportBatchRepository
from app.services.import_service import ImportService


def get_import_service(
    db: AsyncSession = Depends(get_db),
) -> ImportService:
    repo = ImportBatchRepository(db)
    return ImportService(repo)