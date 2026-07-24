from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.rate_limit import limiter
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse, ForgotPasswordRequest, ResetPasswordRequest
from app.services import auth_service

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    req_body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(func.lower(User.email) == req_body.email.lower())
    )
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not auth_service.verify_password(req_body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = auth_service.create_access_token(
        {"sub": str(user.id), "email": user.email, "role": user.role}
    )
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"success": True, "message": "Logged out successfully"}


@router.post("/forgot-password")
async def forgot_password(
    req_body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == req_body.email))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        # Don't reveal if email exists or not
        return {"success": True, "message": "If the email exists, a reset link was generated."}
    
    token = auth_service.create_reset_token(user.email)
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    print("\n" + "="*60)
    print("PASSWORD RESET REQUESTED")
    print(f"User: {user.email}")
    print(f"Link: {reset_link}")
    print("="*60 + "\n")
    return {"success": True, "message": "If the email exists, a reset link was generated."}


@router.post("/reset-password")
async def reset_password(
    req_body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    email = auth_service.verify_reset_token(req_body.token)
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Invalid user")

    user.hashed_password = auth_service.hash_password(req_body.new_password)
    await db.commit()
    return {"success": True, "message": "Password updated successfully"}