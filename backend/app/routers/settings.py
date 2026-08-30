from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from .. import config
from ..auth import current_user, require_admin
from ..db import q

router = APIRouter(tags=["settings"])


@router.get("/settings")
def get_settings(user=Depends(current_user)):
    return config.all_settings()


@router.get("/settings/public")
def public_settings():
    """Branding values needed before login (landing page, kiosk, OPAC)."""
    rows = q("SELECT key,value FROM settings WHERE category IN ('Branding','Devices','Billing')")
    return {r["key"]: r["value"] for r in rows}


class SettingIn(BaseModel):
    key: str
    value: str


@router.put("/settings")
def update_setting(body: SettingIn, user=Depends(require_admin)):
    if not config.set_value(body.key, body.value):
        raise HTTPException(404, "Unknown setting")
    return {"ok": True}
