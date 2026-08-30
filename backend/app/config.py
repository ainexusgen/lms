"""Typed access to the settings table."""
from . import db  # noqa
from .db import q, one, execute

CASTS = {"int": int, "float": float, "bool": lambda v: str(v).lower() == "true", "str": str}


def all_settings():
    rows = q("SELECT key,value,type,label,category FROM settings ORDER BY category,key")
    return rows


def get(key: str, default=None):
    row = one("SELECT value,type FROM settings WHERE key=%s", (key,))
    if not row:
        return default
    return CASTS.get(row["type"], str)(row["value"])


def set_value(key: str, value) -> bool:
    return execute("UPDATE settings SET value=%s WHERE key=%s", (str(value), key)) > 0
