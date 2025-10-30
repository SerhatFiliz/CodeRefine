import bcrypt

def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    password_bytes = plain.encode('utf-8')[:72]
    hashed_bytes = hashed.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.settings import settings

def create_access_token(sub: str, role: str, scopes: list[str] | None = None, minutes: int | None= None) -> str:

    exp = datetime.now(timezone.utc) + timedelta(minutes=minutes or settings.access_token_expire_minutes)
    payload = {"sub": sub,"role": role, "scopes": scopes or [], "exp": exp}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)