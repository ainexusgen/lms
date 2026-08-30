"""Create schema + seed on first boot; upgrade placeholder passwords."""
import os, time
import psycopg2
from .db import q, one, execute, DATABASE_URL
from .auth import hash_password

SQL_DIR = os.path.join(os.path.dirname(__file__), "..", "sql")


def wait_for_db(retries=30):
    for i in range(retries):
        try:
            conn = psycopg2.connect(DATABASE_URL)
            conn.close()
            return
        except Exception:
            time.sleep(1)
    raise RuntimeError("Postgres not reachable at " + DATABASE_URL)


def run_sql_file(name):
    with open(os.path.join(SQL_DIR, name)) as f:
        sql = f.read()
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
    finally:
        conn.close()


def bootstrap():
    wait_for_db()
    run_sql_file("schema.sql")
    if not one("SELECT 1 FROM books LIMIT 1"):
        run_sql_file("seed.sql")
    # hash placeholder passwords
    for u in q("SELECT id,password_hash FROM users WHERE password_hash LIKE 'PLACEHOLDER:%%'"):
        plain = u["password_hash"].split(":", 1)[1]
        execute("UPDATE users SET password_hash=%s WHERE id=%s", (hash_password(plain), u["id"]))
