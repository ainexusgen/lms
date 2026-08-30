-- Settings (all configurable from the UI)
INSERT INTO settings (key,value,type,label,category) VALUES
 ('library_name','Sunrise Institute of Technology - Central Library','str','Library name','Branding'),
 ('library_tagline','Powered by TechNexusGen UHF RFID','str','Tagline','Branding'),
 ('brand_color','#1d4ed8','str','Brand color','Branding'),
 ('currency_symbol','₹','str','Currency symbol','Billing'),
 ('fine_per_day','5','float','Fine per overdue day','Billing'),
 ('max_fine_before_block','100','float','Block borrowing when unpaid fines exceed','Billing'),
 ('default_loan_days','14','int','Default loan period (days)','Circulation'),
 ('max_renewals','2','int','Maximum renewals per loan','Circulation'),
 ('reservation_hold_days','3','int','Days a ready reservation is held','Circulation'),
 ('kiosk_max_books','5','int','Max books per kiosk transaction','Devices'),
 ('gate_alarm_sound','true','bool','Security gate audible alarm','Devices'),
 ('entrance_open_ms','1200','int','Flap barrier open time (ms)','Devices');

-- Staff logins (password: admin123 / lib123 - pbkdf2 hashed by backend on first boot if placeholder)
INSERT INTO users (username,password_hash,full_name,role) VALUES
 ('admin','PLACEHOLDER:admin123','System Administrator','admin'),
 ('librarian','PLACEHOLDER:lib123','Meera Krishnan','librarian');

INSERT INTO member_categories (name,max_books,loan_days) VALUES
 ('Student',3,14), ('Faculty',6,30), ('Research Scholar',5,21), ('Staff',4,14);

INSERT INTO members (member_code,card_epc,full_name,email,phone,category_id,status,joined_on) VALUES
 ('MEM-1001','E2000017221101441890A001','Aarav Sharma','aarav.sharma@example.edu','+91 98450 11001',1,'active','2025-07-01'),
 ('MEM-1002','E2000017221101441890A002','Priya Nair','priya.nair@example.edu','+91 98450 11002',1,'active','2025-07-03'),
 ('MEM-1003','E2000017221101441890A003','Rohan Verma','rohan.verma@example.edu','+91 98450 11003',1,'active','2025-07-10'),
 ('MEM-1004','E2000017221101441890A004','Sneha Iyer','sneha.iyer@example.edu','+91 98450 11004',1,'active','2025-08-01'),
 ('MEM-1005','E2000017221101441890A005','Dr. Kavita Rao','kavita.rao@example.edu','+91 98450 11005',2,'active','2024-06-15'),
 ('MEM-1006','E2000017221101441890A006','Prof. Suresh Menon','suresh.menon@example.edu','+91 98450 11006',2,'active','2023-01-20'),
 ('MEM-1007','E2000017221101441890A007','Ananya Das','ananya.das@example.edu','+91 98450 11007',3,'active','2025-01-05'),
 ('MEM-1008','E2000017221101441890A008','Vikram Singh','vikram.singh@example.edu','+91 98450 11008',3,'active','2025-02-11'),
 ('MEM-1009','E2000017221101441890A009','Lakshmi Pillai','lakshmi.pillai@example.edu','+91 98450 11009',4,'active','2024-09-01'),
 ('MEM-1010','E2000017221101441890A010','Arjun Reddy','arjun.reddy@example.edu','+91 98450 11010',1,'suspended','2025-07-20'),
 ('MEM-1011','E2000017221101441890A011','Fatima Khan','fatima.khan@example.edu','+91 98450 11011',1,'active','2025-08-10'),
 ('MEM-1012','E2000017221101441890A012','Joseph George','joseph.george@example.edu','+91 98450 11012',2,'active','2022-11-30');

INSERT INTO books (isbn,title,author,publisher,category,year,shelf,cover_color) VALUES
 ('9780262046305','Introduction to Algorithms','Cormen, Leiserson, Rivest, Stein','MIT Press','Computer Science',2022,'CS-A1','#1d4ed8'),
 ('9780132350884','Clean Code','Robert C. Martin','Prentice Hall','Computer Science',2008,'CS-A2','#0f766e'),
 ('9781491904244','Designing Data-Intensive Applications','Martin Kleppmann','O''Reilly','Computer Science',2017,'CS-A3','#b45309'),
 ('9780134685991','Effective Java','Joshua Bloch','Addison-Wesley','Computer Science',2018,'CS-A4','#7c3aed'),
 ('9781593279288','Python Crash Course','Eric Matthes','No Starch Press','Computer Science',2019,'CS-B1','#0369a1'),
 ('9780073523323','Database System Concepts','Silberschatz, Korth, Sudarshan','McGraw-Hill','Computer Science',2019,'CS-B2','#be123c'),
 ('9789353163419','Concepts of Physics Vol 1','H. C. Verma','Bharati Bhawan','Physics',2019,'PH-A1','#047857'),
 ('9780471873730','Fundamentals of Physics','Halliday, Resnick, Walker','Wiley','Physics',2021,'PH-A2','#1e40af'),
 ('9781107189638','An Introduction to Quantum Mechanics','Griffiths, Schroeter','Cambridge','Physics',2018,'PH-A3','#5b21b6'),
 ('9780070634466','Engineering Mathematics','B. S. Grewal','Khanna Publishers','Mathematics',2020,'MA-A1','#b91c1c'),
 ('9780321573513','Linear Algebra and Its Applications','David C. Lay','Pearson','Mathematics',2016,'MA-A2','#0e7490'),
 ('9780199540198','The Selfish Gene','Richard Dawkins','Oxford','Biology',2016,'BI-A1','#15803d'),
 ('9780393609394','Molecular Biology of the Cell','Alberts et al.','W. W. Norton','Biology',2022,'BI-A2','#166534'),
 ('9780143333623','Wings of Fire','A. P. J. Abdul Kalam','Universities Press','Biography',1999,'GN-A1','#c2410c'),
 ('9780143424307','The Discovery of India','Jawaharlal Nehru','Penguin','History',2004,'HI-A1','#92400e'),
 ('9789389152268','India After Gandhi','Ramachandra Guha','Picador','History',2019,'HI-A2','#a16207'),
 ('9780062315007','The Alchemist','Paulo Coelho','HarperOne','Fiction',2014,'FI-A1','#9333ea'),
 ('9780143454212','The God of Small Things','Arundhati Roy','Penguin','Fiction',2017,'FI-A2','#be185d'),
 ('9781612680194','Rich Dad Poor Dad','Robert T. Kiyosaki','Plata Publishing','Business',2017,'BU-A1','#4d7c0f'),
 ('9788126568772','Wren & Martin English Grammar','Wren, Martin','S. Chand','Language',2017,'LA-A1','#334155');

-- Copies: 2 copies for first 10 books, 1 for rest => 30 copies
INSERT INTO copies (book_id, tag_epc, accession_no)
SELECT b.id,
       'E28011700000020000' || LPAD((ROW_NUMBER() OVER ())::text, 4, '0'),
       'ACC-' || LPAD((ROW_NUMBER() OVER ())::text, 5, '0')
FROM (
  SELECT id FROM books WHERE id <= 10
  UNION ALL SELECT id FROM books
) b;

-- Active loans (5): copies go on loan, security bit off
WITH l(copy_acc, mem_code, days_ago, due_in) AS (VALUES
 ('ACC-00001','MEM-1001', 5,  9),
 ('ACC-00003','MEM-1002', 3, 11),
 ('ACC-00012','MEM-1005',20, 10),   -- faculty 30d
 ('ACC-00015','MEM-1007', 2, 19),
 ('ACC-00007','MEM-1004', 1, 13)
)
INSERT INTO loans (copy_id, member_id, issued_at, due_date, issued_via)
SELECT c.id, m.id, now() - (l.days_ago||' days')::interval,
       CURRENT_DATE + l.due_in, 'kiosk'
FROM l JOIN copies c ON c.accession_no=l.copy_acc JOIN members m ON m.member_code=l.mem_code;

UPDATE copies SET status='on_loan', security_bit=FALSE
 WHERE accession_no IN ('ACC-00001','ACC-00003','ACC-00012','ACC-00015','ACC-00007');

-- Overdue loans (2)
WITH l(copy_acc, mem_code, days_ago, overdue_by) AS (VALUES
 ('ACC-00005','MEM-1003',25, 11),
 ('ACC-00009','MEM-1011',20,  6)
)
INSERT INTO loans (copy_id, member_id, issued_at, due_date, issued_via)
SELECT c.id, m.id, now() - (l.days_ago||' days')::interval,
       CURRENT_DATE - l.overdue_by, 'staff'
FROM l JOIN copies c ON c.accession_no=l.copy_acc JOIN members m ON m.member_code=l.mem_code;

UPDATE copies SET status='on_loan', security_bit=FALSE
 WHERE accession_no IN ('ACC-00005','ACC-00009');

-- Historical returned loans over last 30 days (for charts)
INSERT INTO loans (copy_id, member_id, issued_at, due_date, returned_at, issued_via, returned_via)
SELECT c.id,
       m.id,
       now() - ((14 + (g*7 % 16))||' days')::interval,
       CURRENT_DATE - (g*7 % 16) + 14,
       now() - ((g*3 % 13)||' days')::interval - interval '2 hours',
       CASE WHEN g % 2 = 0 THEN 'kiosk' ELSE 'staff' END,
       CASE WHEN g % 3 = 0 THEN 'bookdrop' ELSE 'staff' END
FROM generate_series(1,40) g
JOIN copies c ON c.id = ((g*7) % 30) + 1
JOIN members m ON m.id = (g % 12) + 1;

-- Fines: one paid, two unpaid (linked to overdue loans)
INSERT INTO fines (loan_id, member_id, amount, reason, created_at, paid_at)
SELECT l.id, l.member_id, 55.00, 'overdue', now() - interval '2 days', NULL
FROM loans l JOIN copies c ON c.id=l.copy_id WHERE c.accession_no='ACC-00005' AND l.returned_at IS NULL;
INSERT INTO fines (loan_id, member_id, amount, reason, created_at, paid_at)
SELECT l.id, l.member_id, 30.00, 'overdue', now() - interval '1 day', NULL
FROM loans l JOIN copies c ON c.id=l.copy_id WHERE c.accession_no='ACC-00009' AND l.returned_at IS NULL;
INSERT INTO fines (loan_id, member_id, amount, reason, created_at, paid_at)
SELECT l.id, l.member_id, 25.00, 'overdue', now() - interval '9 days', now() - interval '8 days'
FROM loans l WHERE l.returned_at IS NOT NULL LIMIT 1;

-- Reservations
INSERT INTO reservations (book_id, member_id, reserved_at, status)
SELECT b.id, m.id, now() - interval '1 day', 'pending'
FROM books b, members m WHERE b.title='Clean Code' AND m.member_code='MEM-1008';
INSERT INTO reservations (book_id, member_id, reserved_at, status)
SELECT b.id, m.id, now() - interval '3 hours', 'pending'
FROM books b, members m WHERE b.title='The Alchemist' AND m.member_code='MEM-1002';

-- Attendance for last 14 days
INSERT INTO attendance (member_id, card_epc, entered_at, gate)
SELECT m.id, m.card_epc,
       now() - ((g % 14)||' days')::interval - ((8 + g % 9)||' hours')::interval,
       CASE WHEN g % 2 = 0 THEN 'Lane 1' ELSE 'Lane 2' END
FROM generate_series(1,120) g JOIN members m ON m.id = (g % 12) + 1;

-- Gate events: mostly clean exits, one alarm
INSERT INTO gate_events (occurred_at, tag_epc, copy_id, alarm, direction)
SELECT now() - ((g)||' hours')::interval,
       c.tag_epc, c.id, FALSE, 'out'
FROM generate_series(2,20,3) g JOIN copies c ON c.id = g;
INSERT INTO gate_events (occurred_at, tag_epc, copy_id, alarm, direction)
SELECT now() - interval '26 hours', c.tag_epc, c.id, TRUE, 'out'
FROM copies c WHERE c.accession_no='ACC-00020';

INSERT INTO activity_log (at, kind, message) VALUES
 (now() - interval '26 hours','alarm','Security alarm at exit gate — un-issued copy ACC-00020 detected'),
 (now() - interval '5 hours','issue','Kiosk issue: Introduction to Algorithms → Aarav Sharma'),
 (now() - interval '3 hours','entry','Member entry: Priya Nair (Lane 2)'),
 (now() - interval '2 hours','return','Book drop return: Effective Java'),
 (now() - interval '1 hours','reserve','Reservation placed: The Alchemist by Priya Nair');
