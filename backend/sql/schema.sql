-- UHF RFID Library Management System - schema
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'str',      -- str | int | float | bool
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General'
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','librarian')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS member_categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  max_books INT NOT NULL DEFAULT 3,
  loan_days INT NOT NULL DEFAULT 14
);

CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  member_code TEXT UNIQUE NOT NULL,
  card_epc TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  category_id INT NOT NULL REFERENCES member_categories(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','expired')),
  joined_on DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  isbn TEXT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publisher TEXT,
  category TEXT NOT NULL,
  year INT,
  shelf TEXT,
  cover_color TEXT DEFAULT '#1d4ed8'
);

CREATE TABLE IF NOT EXISTS copies (
  id SERIAL PRIMARY KEY,
  book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  tag_epc TEXT UNIQUE NOT NULL,
  accession_no TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','on_loan','in_transit','lost','repair')),
  security_bit BOOLEAN NOT NULL DEFAULT TRUE          -- TRUE = armed (gate alarms)
);

CREATE TABLE IF NOT EXISTS loans (
  id SERIAL PRIMARY KEY,
  copy_id INT NOT NULL REFERENCES copies(id),
  member_id INT NOT NULL REFERENCES members(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date DATE NOT NULL,
  returned_at TIMESTAMPTZ,
  renew_count INT NOT NULL DEFAULT 0,
  issued_via TEXT NOT NULL DEFAULT 'staff' CHECK (issued_via IN ('staff','kiosk')),
  returned_via TEXT CHECK (returned_via IN ('staff','bookdrop'))
);
CREATE INDEX IF NOT EXISTS idx_loans_open ON loans(copy_id) WHERE returned_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_loans_member ON loans(member_id);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  book_id INT NOT NULL REFERENCES books(id),
  member_id INT NOT NULL REFERENCES members(id),
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','fulfilled','cancelled'))
);

CREATE TABLE IF NOT EXISTS fines (
  id SERIAL PRIMARY KEY,
  loan_id INT NOT NULL REFERENCES loans(id),
  member_id INT NOT NULL REFERENCES members(id),
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL DEFAULT 'overdue',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS gate_events (
  id SERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tag_epc TEXT,
  copy_id INT REFERENCES copies(id),
  alarm BOOLEAN NOT NULL,
  direction TEXT NOT NULL DEFAULT 'out' CHECK (direction IN ('in','out'))
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  member_id INT NOT NULL REFERENCES members(id),
  card_epc TEXT NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gate TEXT NOT NULL DEFAULT 'Lane 1'
);

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind TEXT NOT NULL,          -- issue | return | renew | reserve | fine | alarm | entry | admin
  message TEXT NOT NULL
);
