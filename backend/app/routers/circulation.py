"""Core circulation engine - shared by staff UI and RFID simulators."""
import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..db import q, one, execute
from ..auth import current_user
from .. import config

router = APIRouter(tags=["circulation"])


def log(kind, message):
    execute("INSERT INTO activity_log (kind,message) VALUES (%s,%s)", (kind, message))


def member_by_card(card_epc: str):
    return one(
        """SELECT m.*, mc.name AS category, mc.max_books, mc.loan_days,
             (SELECT count(*) FROM loans l WHERE l.member_id=m.id AND l.returned_at IS NULL) AS active_loans,
             (SELECT COALESCE(sum(amount),0) FROM fines f WHERE f.member_id=m.id AND f.paid_at IS NULL) AS unpaid_fines
           FROM members m JOIN member_categories mc ON mc.id=m.category_id
           WHERE m.card_epc=%s""", (card_epc,))


def copy_by_epc(tag_epc: str):
    return one(
        """SELECT c.*, b.title, b.author FROM copies c JOIN books b ON b.id=c.book_id
           WHERE c.tag_epc=%s""", (tag_epc,))


def do_issue(member: dict, copy: dict, via: str):
    """Validate + create loan. Returns dict with loan info; raises HTTPException on rule violation."""
    if member["status"] != "active":
        raise HTTPException(403, f"Membership is {member['status']}")
    max_fine = config.get("max_fine_before_block", 100.0)
    if float(member["unpaid_fines"]) > float(max_fine):
        raise HTTPException(403, f"Unpaid fines exceed limit ({member['unpaid_fines']})")
    if member["active_loans"] >= member["max_books"]:
        raise HTTPException(403, f"Loan limit reached ({member['max_books']} books)")
    if copy["status"] != "available":
        raise HTTPException(409, f"Copy {copy['accession_no']} is {copy['status']}")
    due = datetime.date.today() + datetime.timedelta(days=int(member["loan_days"]))
    loan = one(
        """INSERT INTO loans (copy_id, member_id, due_date, issued_via)
           VALUES (%s,%s,%s,%s) RETURNING id, due_date""",
        (copy["id"], member["id"], due, via))
    execute("UPDATE copies SET status='on_loan', security_bit=FALSE WHERE id=%s", (copy["id"],))
    log("issue", f"{'Kiosk' if via == 'kiosk' else 'Staff'} issue: {copy['title']} → {member['full_name']}")
    return {"loan_id": loan["id"], "title": copy["title"], "due_date": str(loan["due_date"])}


def do_return(copy: dict, via: str):
    loan = one(
        """SELECT l.*, m.full_name FROM loans l JOIN members m ON m.id=l.member_id
           WHERE l.copy_id=%s AND l.returned_at IS NULL""", (copy["id"],))
    fine_amount = 0.0
    if loan:
        overdue_days = (datetime.date.today() - loan["due_date"]).days
        if overdue_days > 0:
            fine_amount = overdue_days * float(config.get("fine_per_day", 5.0))
            execute(
                "INSERT INTO fines (loan_id, member_id, amount, reason) VALUES (%s,%s,%s,'overdue')",
                (loan["id"], loan["member_id"], fine_amount))
        execute("UPDATE loans SET returned_at=now(), returned_via=%s WHERE id=%s", (via, loan["id"]))
    execute("UPDATE copies SET status='available', security_bit=TRUE WHERE id=%s", (copy["id"],))
    # serve reservation queue
    nxt = one(
        """SELECT r.id, m.full_name FROM reservations r JOIN members m ON m.id=r.member_id
           WHERE r.book_id=%s AND r.status='pending' ORDER BY r.reserved_at LIMIT 1""",
        (copy["book_id"],))
    if nxt:
        execute("UPDATE reservations SET status='ready' WHERE id=%s", (nxt["id"],))
        log("reserve", f"Reservation ready: {copy['title']} for {nxt['full_name']}")
    log("return", f"{'Book drop' if via == 'bookdrop' else 'Staff'} return: {copy['title']}")
    return {
        "title": copy["title"],
        "member": loan["full_name"] if loan else None,
        "fine": fine_amount,
        "reservation_ready_for": nxt["full_name"] if nxt else None,
    }


class IssueIn(BaseModel):
    card_epc: str
    tag_epcs: list[str]


@router.post("/circulation/issue")
def staff_issue(body: IssueIn, user=Depends(current_user)):
    member = member_by_card(body.card_epc)
    if not member:
        raise HTTPException(404, "Member card not recognised")
    results = []
    for epc in body.tag_epcs:
        copy = copy_by_epc(epc)
        if not copy:
            raise HTTPException(404, f"Tag {epc} not recognised")
        results.append(do_issue(member, copy, "staff"))
    return {"member": member["full_name"], "issued": results}


class ReturnIn(BaseModel):
    tag_epcs: list[str]


@router.post("/circulation/return")
def staff_return(body: ReturnIn, user=Depends(current_user)):
    results = []
    for epc in body.tag_epcs:
        copy = copy_by_epc(epc)
        if not copy:
            raise HTTPException(404, f"Tag {epc} not recognised")
        results.append(do_return(copy, "staff"))
    return {"returned": results}


class RenewIn(BaseModel):
    loan_id: int


@router.post("/circulation/renew")
def renew(body: RenewIn, user=Depends(current_user)):
    loan = one(
        """SELECT l.*, c.book_id, b.title FROM loans l
           JOIN copies c ON c.id=l.copy_id JOIN books b ON b.id=c.book_id
           WHERE l.id=%s AND l.returned_at IS NULL""", (body.loan_id,))
    if not loan:
        raise HTTPException(404, "Open loan not found")
    if loan["renew_count"] >= int(config.get("max_renewals", 2)):
        raise HTTPException(403, "Maximum renewals reached")
    pending = one(
        "SELECT 1 FROM reservations WHERE book_id=%s AND status='pending' LIMIT 1",
        (loan["book_id"],))
    if pending:
        raise HTTPException(409, "Another member has reserved this title")
    days = int(config.get("default_loan_days", 14))
    row = one(
        """UPDATE loans SET due_date=CURRENT_DATE + %s, renew_count=renew_count+1
           WHERE id=%s RETURNING due_date""", (days, body.loan_id))
    log("renew", f"Renewed: {loan['title']}")
    return {"ok": True, "new_due_date": str(row["due_date"])}


class ReserveIn(BaseModel):
    book_id: int
    member_id: int


@router.post("/circulation/reserve")
def reserve(body: ReserveIn, user=Depends(current_user)):
    exists = one(
        "SELECT 1 FROM reservations WHERE book_id=%s AND member_id=%s AND status IN ('pending','ready')",
        (body.book_id, body.member_id))
    if exists:
        raise HTTPException(409, "Already reserved")
    row = one(
        "INSERT INTO reservations (book_id, member_id) VALUES (%s,%s) RETURNING id",
        (body.book_id, body.member_id))
    pos = one(
        "SELECT count(*) AS n FROM reservations WHERE book_id=%s AND status='pending'",
        (body.book_id,))
    return {"reservation_id": row["id"], "queue_position": pos["n"]}


@router.get("/circulation/loans")
def loans(status: str = "open", user=Depends(current_user)):
    where = "l.returned_at IS NULL" if status == "open" else "TRUE"
    if status == "overdue":
        where = "l.returned_at IS NULL AND l.due_date < CURRENT_DATE"
    return q(
        f"""SELECT l.*, b.title, c.accession_no, c.tag_epc, m.full_name, m.member_code,
              (l.returned_at IS NULL AND l.due_date < CURRENT_DATE) AS overdue,
              GREATEST(0, CURRENT_DATE - l.due_date) AS overdue_days
            FROM loans l JOIN copies c ON c.id=l.copy_id
            JOIN books b ON b.id=c.book_id JOIN members m ON m.id=l.member_id
            WHERE {where} ORDER BY l.issued_at DESC LIMIT 200""")


@router.get("/circulation/reservations")
def reservations(user=Depends(current_user)):
    return q(
        """SELECT r.*, b.title, m.full_name FROM reservations r
           JOIN books b ON b.id=r.book_id JOIN members m ON m.id=r.member_id
           ORDER BY r.reserved_at DESC LIMIT 100""")


@router.get("/circulation/fines")
def fines(user=Depends(current_user)):
    return q(
        """SELECT f.*, m.full_name, m.member_code FROM fines f
           JOIN members m ON m.id=f.member_id ORDER BY f.created_at DESC LIMIT 200""")


class PayFineIn(BaseModel):
    fine_id: int


@router.post("/circulation/fines/pay")
def pay_fine(body: PayFineIn, user=Depends(current_user)):
    n = execute("UPDATE fines SET paid_at=now() WHERE id=%s AND paid_at IS NULL", (body.fine_id,))
    if n == 0:
        raise HTTPException(404, "Unpaid fine not found")
    log("fine", "Fine collected")
    return {"ok": True}
