from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..db import q, one, execute
from ..auth import current_user

router = APIRouter(tags=["books"])

BOOK_SQL = """
SELECT b.*,
  (SELECT count(*) FROM copies c WHERE c.book_id=b.id) AS total_copies,
  (SELECT count(*) FROM copies c WHERE c.book_id=b.id AND c.status='available') AS available_copies
FROM books b
"""


@router.get("/books")
def list_books(search: Optional[str] = None, category: Optional[str] = None,
               user=Depends(current_user)):
    sql, params = BOOK_SQL, []
    where = []
    if search:
        where.append("(b.title ILIKE %s OR b.author ILIKE %s OR b.isbn ILIKE %s)")
        params += [f"%{search}%"] * 3
    if category:
        where.append("b.category=%s")
        params.append(category)
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY b.title"
    return q(sql, params)


@router.get("/books/categories")
def categories(user=Depends(current_user)):
    return q("SELECT category, count(*) AS n FROM books GROUP BY category ORDER BY category")


@router.get("/books/{book_id}")
def get_book(book_id: int, user=Depends(current_user)):
    book = one(BOOK_SQL + " WHERE b.id=%s", (book_id,))
    if not book:
        raise HTTPException(404, "Book not found")
    book["copies"] = q("SELECT * FROM copies WHERE book_id=%s ORDER BY accession_no", (book_id,))
    return book


class BookIn(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    publisher: Optional[str] = None
    category: str = "General"
    year: Optional[int] = None
    shelf: Optional[str] = None
    copies: int = 1


@router.post("/books")
def create_book(body: BookIn, user=Depends(current_user)):
    book = one(
        """INSERT INTO books (isbn,title,author,publisher,category,year,shelf)
           VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
        (body.isbn, body.title, body.author, body.publisher, body.category, body.year, body.shelf),
    )
    nxt = one("SELECT COALESCE(MAX(id),0)+1 AS n FROM copies")["n"]
    for i in range(body.copies):
        execute(
            "INSERT INTO copies (book_id, tag_epc, accession_no) VALUES (%s,%s,%s)",
            (book["id"], f"E28011700000020000{nxt + i:04d}", f"ACC-{nxt + i:05d}"),
        )
    return {"id": book["id"], "ok": True}


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    publisher: Optional[str] = None
    category: Optional[str] = None
    year: Optional[int] = None
    shelf: Optional[str] = None


@router.put("/books/{book_id}")
def update_book(book_id: int, body: BookUpdate, user=Depends(current_user)):
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        return {"ok": True}
    sets = ", ".join(f"{k}=%s" for k in fields)
    n = execute(f"UPDATE books SET {sets} WHERE id=%s", list(fields.values()) + [book_id])
    if n == 0:
        raise HTTPException(404, "Book not found")
    return {"ok": True}


@router.delete("/books/{book_id}")
def delete_book(book_id: int, user=Depends(current_user)):
    on_loan = one(
        """SELECT 1 FROM copies c JOIN loans l ON l.copy_id=c.id
           WHERE c.book_id=%s AND l.returned_at IS NULL LIMIT 1""", (book_id,))
    if on_loan:
        raise HTTPException(409, "Cannot delete: copies are on loan")
    execute("DELETE FROM books WHERE id=%s", (book_id,))
    return {"ok": True}


# ---- Public OPAC (no auth) ----
@router.get("/opac/search")
def opac_search(search: Optional[str] = None, category: Optional[str] = None):
    sql, params, where = BOOK_SQL, [], []
    if search:
        where.append("(b.title ILIKE %s OR b.author ILIKE %s)")
        params += [f"%{search}%"] * 2
    if category:
        where.append("b.category=%s")
        params.append(category)
    if where:
        sql += " WHERE " + " AND ".join(where)
    return q(sql + " ORDER BY b.title LIMIT 100", params)
