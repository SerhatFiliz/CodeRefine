from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Literal

class UserCreate(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: str
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    is_active: bool
    role: Literal["user", "admin"] = "user"
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"