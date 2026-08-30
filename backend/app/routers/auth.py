from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..db import one
from ..auth import verify_password, make_token

router = APIRouter(tags=["auth"])


class LoginIn(BaseModel):
    username: str
    password: str


@router.post("/auth/login")
def login(body: LoginIn):
    user = one("SELECT * FROM users WHERE username=%s", (body.username,))
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {
        "token": make_token(user),
        "user": {"username": user["username"], "name": user["full_name"], "role": user["role"]},
    }
