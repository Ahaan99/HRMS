"""Cross-portal data-flow check (read-only).
1. HR login works for HR-dept employee; non-HR employee is now BLOCKED.
2. Data superadmin manages (employees, departments, attendance) is the
   same data the HR portal reads — proving all portals share one DB.
"""

import requests
import mysql.connector

PX = {"http": None, "https": None}
API = "http://127.0.0.1:5000/api"

db = mysql.connector.connect(host="localhost", user="root",
                             password="Phabindra@2680", database="hrms_db")
cur = db.cursor()

# a non-HR active employee for the negative test
cur.execute("""SELECT e.email FROM employees e
               JOIN departments d ON d.id=e.departmentId
               WHERE e.isActive=1 AND d.name<>'HR' AND e.password_hash IS NOT NULL
               LIMIT 1""")
row = cur.fetchone()
non_hr_email = row[0] if row else None

s = requests.Session()

# --- superadmin token ---
r = s.post(f"{API}/super-admin/auth/login",
           json={"email": "admin@hrms.com", "password": "admin123"},
           timeout=20, proxies=PX)
sa_tok = (r.json().get("token") or (r.json().get("data") or {}).get("token"))
print("[1] superadmin login:", r.status_code, "token:", bool(sa_tok))
SA = {"Authorization": f"Bearer {sa_tok}"}

# --- HR login (should PASS: hr@hrms.com is in HR dept) ---
r = s.post(f"{API}/hr/auth/login",
           json={"email": "hr@hrms.com", "password": "Demo@123"},
           timeout=20, proxies=PX)
body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
hr_tok = body.get("token") or (body.get("data") or {}).get("token")
print("[2] HR login (HR dept)     :", r.status_code,
      "OK" if r.status_code == 200 else r.text[:120])
HR = {"Authorization": f"Bearer {hr_tok}"} if hr_tok else None

# --- non-HR employee tries HR portal (should now FAIL) ---
if non_hr_email:
    r = s.post(f"{API}/hr/auth/login",
               json={"email": non_hr_email, "password": "Demo@123"},
               timeout=20, proxies=PX)
    verdict = "BLOCKED (correct)" if r.status_code != 200 else "!! STILL ALLOWED - BUG !!"
    print(f"[3] HR login ({non_hr_email}):", r.status_code, verdict)
else:
    print("[3] no non-HR employee found to test")

# --- cross-portal data comparison ---
cur.execute("SELECT COUNT(*) FROM employees WHERE isActive=1")
db_emp = cur.fetchone()[0]
r = s.get(f"{API}/super-admin/employees", headers=SA, timeout=25, proxies=PX)
d = r.json()
sa_emp = len(d if isinstance(d, list) else d.get("data") or d.get("employees") or [])
print(f"[4] employees  DB={db_emp}  superadmin API={sa_emp}")

cur.execute("SELECT COUNT(*) FROM departments")
db_dep = cur.fetchone()[0]
r = s.get(f"{API}/super-admin/departments", headers=SA, timeout=25, proxies=PX)
d = r.json()
sa_dep = len(d if isinstance(d, list) else d.get("data") or d.get("departments") or [])
if HR:
    r2 = s.get(f"{API}/hr/departments", headers=HR, timeout=25, proxies=PX)
    d2 = r2.json() if r2.status_code == 200 else {}
    hr_dep = len(d2 if isinstance(d2, list) else d2.get("data") or d2.get("departments") or [])
    print(f"[5] departments DB={db_dep}  superadmin={sa_dep}  HR portal={hr_dep} ({r2.status_code})")
else:
    print(f"[5] departments DB={db_dep}  superadmin={sa_dep}  HR portal=skipped (no token)")

# attendance today from both sides
cur.execute("SELECT COUNT(*) FROM super_admin_attendance WHERE date=CURDATE()")
db_att = cur.fetchone()[0]
r = s.get(f"{API}/super-admin/attendance", headers=SA, timeout=25, proxies=PX)
print(f"[6] attendance today DB={db_att}  superadmin API status={r.status_code}")
if HR:
    r2 = s.get(f"{API}/hr/attendance", headers=HR, timeout=25, proxies=PX)
    print(f"    HR portal attendance status={r2.status_code}")

cur.close()
db.close()
print("\nDONE")
