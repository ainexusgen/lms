"""RFID device simulator endpoints - kiosk, book drop, security gate, entrance.
No auth: these mimic devices on the library floor (real deployments use device keys)."""
import random
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..db import q, one, execute
from .. import config
from .circulation import member_by_card, copy_by_epc, do_issue, do_return, log

router = APIRouter(tags=["rfid"])


@router.get("/rfid/kiosk/card/{card_epc}")
def kiosk_read_card(card_epc: str):
    m = member_by_card(card_epc)
    if not m:
        raise HTTPException(404, "Card not recognised")
    loans = q(
        """SELECT l.id, b.title, l.due_date,
                  (l.due_date < CURRENT_DATE) AS overdue
           FROM loans l JOIN copies c ON c.id=l.copy_id JOIN books b ON b.id=c.book_id
           WHERE l.member_id=%s AND l.returned_at IS NULL ORDER BY l.due_date""", (m["id"],))
    return {
        "member": {"id": m["id"], "name": m["full_name"], "code": m["member_code"],
                   "category": m["category"], "status": m["status"],
                   "max_books": m["max_books"], "active_loans": m["active_loans"],
                   "unpaid_fines": float(m["unpaid_fines"])},
        "loans": loans,
        "kiosk_max_books": config.get("kiosk_max_books", 5),
    }


class KioskCheckout(BaseModel):
    card_epc: str
    tag_epcs: list[str]


@router.post("/rfid/kiosk/checkout")
def kiosk_checkout(body: KioskCheckout):
    m = member_by_card(body.card_epc)
    if not m:
        raise HTTPException(404, "Card not recognised")
    if len(body.tag_epcs) > int(config.get("kiosk_max_books", 5)):
        raise HTTPException(400, "Too many books for one kiosk transaction")
    issued, errors = [], []
    for epc in body.tag_epcs:
        copy = copy_by_epc(epc)
        if not copy:
            errors.append({"tag_epc": epc, "error": "Tag not recognised"})
            continue
        try:
            res = do_issue(member_by_card(body.card_epc), copy, "kiosk")
            issued.append({**res, "tag_epc": epc})
        except HTTPException as e:
            errors.append({"tag_epc": epc, "title": copy["title"], "error": e.detail})
    return {"member": m["full_name"], "issued": issued, "errors": errors}


class TagEvent(BaseModel):
    tag_epc: str


@router.post("/rfid/bookdrop/return")
def bookdrop_return(body: TagEvent):
    copy = copy_by_epc(body.tag_epc)
    if not copy:
        raise HTTPException(404, "Tag not recognised")
    return do_return(copy, "bookdrop")


class GateScan(BaseModel):
    tag_epcs: list[str]
    direction: str = "out"


@router.post("/rfid/gate/scan")
def gate_scan(body: GateScan):
    """Security corridor: alarm on any tag whose security bit is armed."""
    results, alarm = [], False
    for epc in body.tag_epcs:
        copy = copy_by_epc(epc)
        armed = bool(copy and copy["security_bit"])
        if copy:
            execute(
                "INSERT INTO gate_events (tag_epc, copy_id, alarm, direction) VALUES (%s,%s,%s,%s)",
                (epc, copy["id"], armed, body.direction))
        results.append({
            "tag_epc": epc,
            "title": copy["title"] if copy else "Unknown tag",
            "alarm": armed,
        })
        if armed:
            alarm = True
            log("alarm", f"Security alarm at exit gate — {copy['title'] if copy else epc} not checked out")
    return {"alarm": alarm, "alarm_sound": config.get("gate_alarm_sound", True), "tags": results}


class EntranceScan(BaseModel):
    card_epc: str
    gate: str = "Lane 1"


@router.post("/rfid/entrance/scan")
def entrance_scan(body: EntranceScan):
    m = member_by_card(body.card_epc)
    if not m:
        return {"open": False, "reason": "Card not recognised"}
    if m["status"] != "active":
        return {"open": False, "reason": f"Membership {m['status']}", "member": m["full_name"]}
    execute(
        "INSERT INTO attendance (member_id, card_epc, gate) VALUES (%s,%s,%s)",
        (m["id"], body.card_epc, body.gate))
    log("entry", f"Member entry: {m['full_name']} ({body.gate})")
    return {"open": True, "member": m["full_name"], "category": m["category"],
            "open_ms": config.get("entrance_open_ms", 1200)}


@router.get("/rfid/demo/tags")
def demo_tags():
    """Convenience for the simulator UI: books to 'place on the pad'."""
    available = q(
        """SELECT c.tag_epc, c.accession_no, b.title, b.author, b.cover_color, c.security_bit
           FROM copies c JOIN books b ON b.id=c.book_id
           WHERE c.status='available' ORDER BY random() LIMIT 8""")
    on_loan = q(
        """SELECT c.tag_epc, c.accession_no, b.title, b.author, b.cover_color, c.security_bit,
                  m.full_name AS borrower
           FROM copies c JOIN books b ON b.id=c.book_id
           JOIN loans l ON l.copy_id=c.id AND l.returned_at IS NULL
           JOIN members m ON m.id=l.member_id
           ORDER BY random() LIMIT 8""")
    cards = q(
        """SELECT m.card_epc, m.full_name, m.member_code, m.status, mc.name AS category
           FROM members m JOIN member_categories mc ON mc.id=m.category_id
           ORDER BY m.member_code LIMIT 12""")
    return {"available": available, "on_loan": on_loan, "cards": cards}
