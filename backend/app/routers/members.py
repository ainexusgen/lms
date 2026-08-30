from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..db import q, one, execute
from ..auth import current_user

router = APIRouter(tags=["members"])

MEMBER_SQL = """
SELECT m.*, mc.name AS category, mc.max_books, mc.loan_days,
  (SELECT count(*) FROM loans l WHERE l.member_id=m.id AND l.returned_at IS NULL) AS active_loans,
  (SELECT COALESCE(sum(f.amount),0) FROM fines f WHERE f.member_id=m.id AND f.paid_at IS NULL) AS unpaid_fines
FROM members m JOIN member_categories mc ON mc.id=m.category_id
"""


@router.get("/members")
def list_members(search: Optional[str] = None, user=Depends(current_user)):
    sql, params = MEMBER_SQL, []
    if search:
        sql += " WHERE m.full_name ILIKE %s OR m.member_code ILIKE %s OR m.card_epc ILIKE %s"
        params = [f"%{search}%"] * 3
    return q(sql + " ORDER BY m.member_code", params)


@router.get("/members/categories")
def member_categories(user=Depends(current_user)):
    return q("SELECT * FROM member_categories ORDER BY id")


@router.get("/members/{member_id}")
def get_member(member_id: int, user=Depends(current_user)):
    m = one(MEMBER_SQL + " WHERE m.id=%s", (member_id,))
    if not m:
        raise HTTPException(404, "Member not found")
    m["loans"] = q(
        """SELECT l.*, b.title, c.accession_no,
                  (l.returned_at IS NULL AND l.due_date < CURRENT_DATE) AS overdue
           FROM loans l JOIN copies c ON c.id=l.copy_id JOIN books b ON b.id=c.book_id
           WHERE l.member_id=%s ORDER BY l.issued_at DESC LIMIT 25""", (member_id,))
    m["fines"] = q("SELECT * FROM fines WHERE member_id=%s ORDER BY created_at DESC", (member_id,))
    return m


class MemberIn(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    category_id: int = 1


@router.post("/members")
def create_member(body: MemberIn, user=Depends(current_user)):
    nxt = one("SELECT COALESCE(MAX(id),0)+1 AS n FROM members")["n"]
    code = f"MEM-{1000 + nxt}"
    epc = f"E2000017221101441890A{nxt:03d}"
    row = one(
        """INSERT INTO members (member_code, card_epc, full_name, email, phone, category_id)
           VALUES (%s,%s,%s,%s,%s,%s) RETURNING id, member_code, card_epc""",
        (code, epc, body.full_name, body.email, body.phone, body.category_id))
    return row


class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    category_id: Optional[int] = None
    status: Optional[str] = None


@router.put("/members/{member_id}")
def update_member(member_id: int, body: MemberUpdate, user=Depends(current_user)):
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        return {"ok": True}
    sets = ", ".join(f"{k}=%s" for k in fields)
    n = execute(f"UPDATE members SET {sets} WHERE id=%s", list(fields.values()) + [member_id])
    if n == 0:
        raise HTTPException(404, "Member not found")
    return {"ok": True}
