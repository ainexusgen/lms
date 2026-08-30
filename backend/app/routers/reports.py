from fastapi import APIRouter, Depends
from ..db import q, one
from ..auth import current_user

router = APIRouter(tags=["reports"])


@router.get("/reports/dashboard")
def dashboard(user=Depends(current_user)):
    stats = one("""SELECT
      (SELECT count(*) FROM books) AS total_books,
      (SELECT count(*) FROM copies) AS total_copies,
      (SELECT count(*) FROM loans WHERE returned_at IS NULL) AS on_loan,
      (SELECT count(*) FROM loans WHERE returned_at IS NULL AND due_date < CURRENT_DATE) AS overdue,
      (SELECT count(*) FROM members WHERE status='active') AS active_members,
      (SELECT COALESCE(sum(amount),0) FROM fines WHERE paid_at IS NULL) AS unpaid_fines,
      (SELECT count(*) FROM attendance WHERE entered_at::date=CURRENT_DATE) AS todays_footfall,
      (SELECT count(*) FROM gate_events WHERE alarm AND occurred_at > now()-interval '7 days') AS alarms_7d,
      (SELECT count(*) FROM reservations WHERE status IN ('pending','ready')) AS reservations""")
    activity = q("SELECT * FROM activity_log ORDER BY at DESC LIMIT 12")
    return {"stats": stats, "activity": activity}


@router.get("/reports/circulation-daily")
def circulation_daily(days: int = 14, user=Depends(current_user)):
    return q("""
      SELECT d::date AS day,
        (SELECT count(*) FROM loans WHERE issued_at::date=d::date) AS issues,
        (SELECT count(*) FROM loans WHERE returned_at::date=d::date) AS returns
      FROM generate_series(CURRENT_DATE - (%s - 1), CURRENT_DATE, interval '1 day') d
      ORDER BY day""", (days,))


@router.get("/reports/top-books")
def top_books(limit: int = 8, user=Depends(current_user)):
    return q("""
      SELECT b.title, b.author, count(*) AS loans FROM loans l
      JOIN copies c ON c.id=l.copy_id JOIN books b ON b.id=c.book_id
      GROUP BY b.id ORDER BY loans DESC LIMIT %s""", (limit,))


@router.get("/reports/category-distribution")
def category_distribution(user=Depends(current_user)):
    return q("""
      SELECT b.category, count(c.id) AS copies,
             count(*) FILTER (WHERE c.status='on_loan') AS on_loan
      FROM books b JOIN copies c ON c.book_id=b.id
      GROUP BY b.category ORDER BY copies DESC""")


@router.get("/reports/attendance-daily")
def attendance_daily(days: int = 14, user=Depends(current_user)):
    return q("""
      SELECT d::date AS day,
        (SELECT count(*) FROM attendance WHERE entered_at::date=d::date) AS entries
      FROM generate_series(CURRENT_DATE - (%s - 1), CURRENT_DATE, interval '1 day') d
      ORDER BY day""", (days,))


@router.get("/reports/overdue")
def overdue(user=Depends(current_user)):
    return q("""
      SELECT l.id, b.title, m.full_name, m.member_code, m.phone, l.due_date,
             CURRENT_DATE - l.due_date AS days_overdue
      FROM loans l JOIN copies c ON c.id=l.copy_id
      JOIN books b ON b.id=c.book_id JOIN members m ON m.id=l.member_id
      WHERE l.returned_at IS NULL AND l.due_date < CURRENT_DATE
      ORDER BY days_overdue DESC""")
