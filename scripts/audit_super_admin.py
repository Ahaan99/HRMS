"""Read-only audit: hit every major super-admin GET endpoint and report status."""
import requests

PX = {"http": None, "https": None}
API = "http://127.0.0.1:5000/api"

r = requests.post(f"{API}/super-admin/auth/login",
                  json={"email": "admin@hrms.com", "password": "admin123"},
                  timeout=20, proxies=PX)
body = r.json()
tok = body.get("token") or (body.get("data") or {}).get("token")
print("LOGIN:", r.status_code, "| token:", bool(tok))
H = {"Authorization": f"Bearer {tok}"}

ENDPOINTS = [
    # core admin data
    "/super-admin/employees",
    "/super-admin/users",
    "/super-admin/clients",
    "/super-admin/departments",
    "/super-admin/designations",
    "/super-admin/candidates",
    "/super-admin/joining",
    "/super-admin/interviews",
    "/super-admin/job-positions",
    "/super-admin/languages",
    "/super-admin/locations",
    "/super-admin/services",
    "/super-admin/statuses",
    "/super-admin/candidate-statuses",
    "/super-admin/attendance",
    "/super-admin/exit",
    "/super-admin/invoices",
    "/super-admin/performance",
    "/super-admin/policies",
    "/super-admin/targets",
    "/super-admin/leads",
    "/super-admin/sales",
    "/super-admin/client-agreements",
    "/super-admin/client-policies",
    "/super-admin/candidate-policies",
    "/super-admin/login-settings",
    # shared modules used by admin UI
    "/admin/payroll",
    "/leave",
    "/documents",
    "/complaints",
    "/branches",
    "/notifications",
    "/finance",
    "/revenues",
    "/expenses",
    "/analytics",
]

ok, warn, fail = [], [], []
for ep in ENDPOINTS:
    try:
        r = requests.get(f"{API}{ep}", headers=H, timeout=15, proxies=PX)
        n = "?"
        try:
            b = r.json()
            d = b.get("data") if isinstance(b, dict) else b
            if isinstance(d, list):
                n = len(d)
            elif isinstance(b, list):
                n = len(b)
        except Exception:
            pass
        line = f"{r.status_code}  {ep}  rows={n}"
        if r.status_code == 200:
            ok.append(line)
        elif r.status_code in (401, 403, 404):
            warn.append(line)
        else:
            fail.append(line)
    except Exception as e:
        fail.append(f"ERR  {ep}  {type(e).__name__}: {e}")

print(f"\n=== OK ({len(ok)}) ===")
for l in ok: print(" ", l)
print(f"\n=== WARN 401/403/404 ({len(warn)}) ===")
for l in warn: print(" ", l)
print(f"\n=== FAIL 5xx/errors ({len(fail)}) ===")
for l in fail: print(" ", l)
print("\nDONE")
