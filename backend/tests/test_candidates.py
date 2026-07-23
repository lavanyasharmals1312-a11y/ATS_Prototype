import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.candidate import Candidate


async def _create_test_candidate(db: AsyncSession, **kwargs) -> Candidate:
    defaults = {
        "candidate_name": "Test Candidate",
        "candidate_email": "test.candidate@example.com",
        "candidate_phone": "9876543210",
        "current_company": "Test Corp",
        "experience_years": 4.0,
        "current_location": "Bangalore",
        "skills": ["Python", "FastAPI"],
        "source": "upload",
        "is_active": True,
        "duplicate_status": "clean",
    }
    defaults.update(kwargs)
    candidate = Candidate(**defaults)
    db.add(candidate)
    await db.commit()
    await db.refresh(candidate)
    return candidate


@pytest.mark.asyncio
async def test_list_candidates_empty(client: AsyncClient, auth_token):
    response = await client.get(
        "/api/v1/candidates",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_candidates_with_data(
    client: AsyncClient, auth_token, db_session: AsyncSession
):
    await _create_test_candidate(db_session)
    response = await client.get(
        "/api/v1/candidates",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total"] == 1
    assert data["items"][0]["candidate_name"] == "Test Candidate"


@pytest.mark.asyncio
async def test_get_candidate_by_id(
    client: AsyncClient, auth_token, db_session: AsyncSession
):
    candidate = await _create_test_candidate(db_session)
    response = await client.get(
        f"/api/v1/candidates/{candidate.id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["candidate_email"] == "test.candidate@example.com"


@pytest.mark.asyncio
async def test_get_candidate_not_found(client: AsyncClient, auth_token):
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(
        f"/api/v1/candidates/{fake_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_candidate(
    client: AsyncClient, auth_token, db_session: AsyncSession
):
    candidate = await _create_test_candidate(db_session)
    response = await client.patch(
        f"/api/v1/candidates/{candidate.id}",
        json={"notes": "Strong Python developer", "tags": ["senior"]},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["notes"] == "Strong Python developer"
    assert "senior" in data["tags"]


@pytest.mark.asyncio
async def test_soft_delete_candidate(
    client: AsyncClient, auth_token, db_session: AsyncSession
):
    candidate = await _create_test_candidate(db_session)
    response = await client.delete(
        f"/api/v1/candidates/{candidate.id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    response = await client.get(
        f"/api/v1/candidates/{candidate.id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 404
    response = await client.get(
        "/api/v1/candidates",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.json()["data"]["total"] == 0


@pytest.mark.asyncio
async def test_search_candidates(
    client: AsyncClient, auth_token, db_session: AsyncSession
):
    await _create_test_candidate(db_session, candidate_name="Rahul Sharma")
    await _create_test_candidate(
        db_session,
        candidate_name="Priya Patel",
        candidate_email="priya@example.com"
    )
    response = await client.get(
        "/api/v1/candidates?search=Rahul",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200