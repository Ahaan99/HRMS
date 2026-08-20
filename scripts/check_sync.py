"""Verify smart-Attendance -> HRMS sync: retry failed records, then
show sync statuses in both MySQL databases. Read-only except for the
built-in retry endpoint call."""

import time
import requests
import mysql.connector

CFG = dict(host="localhost", user="root", password="Phabindra@2680")

s = requests.Session()

# 1. admin login on smart-Attendance
r = s.post("http://localhost:5050/api/login", json={
    "mobile": "9999999999", "password": "admin123", "role": "admin"},
    timeout=30)
print("login:", r.status_code, r.text[:100])

# 2. trigger retry of failed HRMS syncs
r = s.post("http://localhost:5050/api/hrms-sync/retry", timeout=30)
print("retry:", r.status_code, r.text[:150])

time.sleep(6)

# 3. verify statuses in smart_attendance
c = mysql.connector.connect(database="smart_attendance", **CFG)
cur = c.cursor()
cur.execute("SELECT emp_id, date, hrms_sync, hrms_sync_error FROM attendance")
print("\nsmart_attendance records:")
for row in cur.fetchall():
    print("  ", row)
c.close()

# 4. verify rows in hrms_db.super_admin_attendance
c = mysql.connector.connect(database="hrms_db", **CFG)
cur = c.cursor()
cur.execute("""SELECT employee_id, date, check_in, check_out, status
               FROM super_admin_attendance
               WHERE date >= '2026-08-16' ORDER BY date DESC""")
print("\nhrms_db.super_admin_attendance (>= 2026-08-16):")
for row in cur.fetchall():
    print("  ", row)
c.close()
