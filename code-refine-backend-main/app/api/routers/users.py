from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.schemas import UserRead
from app.api.deps import get_current_user, require_admin
from app.db.models import User
from app.db.session import get_session

router = APIRouter()

@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/", response_model=list[UserRead])
async def get_all_users(
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(User))
    return result.scalars().all()