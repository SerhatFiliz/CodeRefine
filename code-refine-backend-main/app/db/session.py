from sqlalchemy.ext.asyncio import create_async_engine,async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.settings import settings

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()

async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session