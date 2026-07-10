# ProEx Labs ATS

Internal Applicant Tracking System for ProEx Labs.

## Prerequisites

- Python 3.11+
- Docker Desktop (for PostgreSQL)
- Node.js 18+ (for frontend, later phases)

## Quick Start (Backend)

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Create and activate virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment config
cp .env.example .env

# 5. Start the server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

- Interactive docs: `http://localhost:8000/docs`
- Health check: `GET /health`
- pgAdmin: `http://localhost:5050` (admin@proexlabs.com / admin)

## Architecture

See `PLAN.md` for full architecture, database schema, and API contracts.
See `context.md` for development conventions and code patterns.
