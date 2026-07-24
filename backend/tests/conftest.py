import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import ARRAY, types


# ── Patch PostgreSQL types BEFORE any models are imported ───
# SQLite can't handle ARRAY, JSONB, UUID compile/bind processing.
# We fix at two levels: DDL (via @compiles) and runtime (via monkey-patch).

import json as _json

# Runtime patch for UUID — handles both uuid.UUID and str values
_original_uuid_bind = UUID.bind_processor
_original_uuid_result = UUID.result_processor

def _patched_uuid_bind(self, dialect):
    if dialect.name != "sqlite":
        return _original_uuid_bind(self, dialect)
    def process(value):
        if value is not None:
            return str(value)
        return None
    return process

def _patched_uuid_result(self, dialect, coltype):
    if dialect.name != "sqlite":
        return _original_uuid_result(self, dialect, coltype) if _original_uuid_result else None
    return None

UUID.bind_processor = _patched_uuid_bind
UUID.result_processor = _patched_uuid_result

# Runtime patch for ARRAY — serialize/deserialize JSON for SQLite
_original_array_bind = ARRAY.bind_processor
_original_array_result = ARRAY.result_processor

def _patched_array_bind(self, dialect):
    if dialect.name != "sqlite":
        return _original_array_bind(self, dialect) if _original_array_bind else None
    def process(value):
        if value is not None:
            return _json.dumps(value)
        return None
    return process

def _patched_array_result(self, dialect, coltype):
    if dialect.name != "sqlite":
        return _original_array_result(self, dialect, coltype) if _original_array_result else None
    def process(value):
        if value is not None:
            return _json.loads(value)
        return None
    return process

ARRAY.bind_processor = _patched_array_bind
ARRAY.result_processor = _patched_array_result

# Runtime patch for JSONB — JSON as string for SQLite
_original_jsonb_bind = JSONB.bind_processor
_original_jsonb_result = JSONB.result_processor

def _patched_jsonb_bind(self, dialect):
    if dialect.name != "sqlite":
        return _original_jsonb_bind(self, dialect) if _original_jsonb_bind else None
    def process(value):
        if value is not None:
            return _json.dumps(value)
        return None
    return process

def _patched_jsonb_result(self, dialect, coltype):
    if dialect.name != "sqlite":
        return _original_jsonb_result(self, dialect, coltype) if _original_jsonb_result else None
    def process(value):
        if value is not None:
            return _json.loads(value)
        return None
    return process

JSONB.bind_processor = _patched_jsonb_bind
JSONB.result_processor = _patched_jsonb_result


@compiles(ARRAY, "sqlite")
def compile_array_sqlite(type_, compiler, **kw):
    return "JSON"


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"


@compiles(UUID, "sqlite")
def compile_uuid_sqlite(type_, compiler, **kw):
    return "CHAR(36)"


# Now it's safe to import models
from app.main import app
from app.database import Base
from app.dependencies import get_db
from app.services.auth_service import hash_password
from app.models.user import User

# ── Patch SearchSpec to use LIKE-based search for SQLite ───
# PostgreSQL full-text functions (to_tsvector, plainto_tsquery, array_to_string)
# are not available on SQLite. Override with simple ILIKE search.
from app.repositories.candidate_repository import SearchSpec as _OriginalSearchSpec
from sqlalchemy import Select

def _sqlite_search_apply(self, stmt: Select) -> Select:
    term = self.term
    return stmt.where(
        Candidate.candidate_name.ilike(f"%{term}%")
        | Candidate.current_company.ilike(f"%{term}%")
        | Candidate.candidate_email.ilike(f"%{term}%")
        | Candidate.candidate_phone.contains(term)
    )

_OriginalSearchSpec.apply = _sqlite_search_apply

# Need Candidate model for the patch above
from app.models.candidate import Candidate


@pytest_asyncio.fixture(scope="function")
async def db_session():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    TestSession = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with TestSession() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def admin_user(db_session: AsyncSession):
    user = User(
        email="test@proexlabs.com",
        hashed_password=hash_password("testpass123"),
        full_name="Test Admin",
        role="admin",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def auth_token(client: AsyncClient, admin_user):
    from app.services.auth_service import create_access_token
    return create_access_token({"sub": str(admin_user.id), "email": admin_user.email})