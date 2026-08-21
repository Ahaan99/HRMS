"""Super Admin portal audit — logs in, then hits every safe GET endpoint
and reports status. Read-only: no POST/PUT/DELETE mutations."""

import requests

BASE = "http://127.0.0.1:5000/api/super-admin"
PX = {"http": None, "https": None}

s = requests.Session()

r = s.post(f"{BASE}/auth/login",
           json={"email": "admin@hrms.com", "password": "admin123"},
           timeout=20, proxies=PX)
print("LOGIN:", r.status_code, r.text[:150])
tok = r.json().get("token") or (r.json().get("data") or {}).get("token")
if not tok:
    print("NO TOKEN — response:", r.text[:400])
    raise SystemExit(1)
H = {"Authorization": f"Bearer {tok}"}

ENDPOINTS = [
    # module, path
    ("attendance",        "/attendance"),
    ("attendance-emps",   "/attendance/employees"),
    ("2fa",               "/auth/2fa"),
    ("otp-settings",      "/auth/otp-settings"),
    ("sessions",          "/auth/sessions"),
    ("candidate-policies","/candidate-policies"),
    ("candidates",        "/candidates"),
    ("candidate-statuses","/candidate-statuses"),
    ("client-agreements", "/client-agreements"),
    ("client-policies",   "/client-policies"),
    ("clients",           "/clients"),
    ("clients-features",  "/clients/features/matrix"),
    ("departments",       "/departments"),
    ("designations",      "/designations"),
    ("email-templates",   "/email/templates"),
    ("email-logs",        "/email/logs"),
    ("email-stats",       "/email/stats"),
    ("employees",         "/employees"),
    ("exit",              "/exit"),
    ("exit-stats",        "/exit/stats"),

    ("interviews",        "/interviews"),
    ("interviews-hr",     "/interviews/hr-list"),
    ("interviews-sched",  "/interviews/scheduled"),
    ("invoices",          "/invoices"),
    ("invoices-due",      "/invoices/alerts/due"),
    ("invoices-notes",    "/invoices/notes/all"),
    ("job-positions",     "/job-positions"),
    ("joining",           "/joining"),
    ("languages",         "/languages"),
    ("leads",             "/leads"),
    ("lead-batches",      "/leads/batches"),
    ("locations",         "/locations"),
    ("login-settings",    "/login-settings"),
    ("login-today",       "/login-settings/today"),
    ("login-history",     "/login-settings/history"),
    ("offer-letters",     "/offer-letter"),
    ("offer-templates",   "/offer-letter/templates"),
    ("performance",       "/performance"),
    ("performance-stats", "/performance/stats"),
    ("performance-emps",  "/performance/employees"),
    ("policies",          "/policies"),
    ("policies-logs",     "/policies/logs"),
    ("sales",             "/sales"),
    ("services",          "/services"),
    ("statuses",          "/statuses"),
    ("targets",           "/targets"),
    ("work-assignments",  "/work-assignments"),
    ("work-stats",        "/work-assignments/stats"),
    ("eod-reports",       "/eod-reports"),
    ("eod-stats",         "/eod-reports/stats"),
    ("eod-pending",       "/eod-reports/pending"),
    ("work-departments",  "/departments"),
    ("work-employees",    "/employees"),
]

# Modules mounted OUTSIDE the /api/super-admin prefix (verified in app.js)
API = "http://127.0.0.1:5000/api"
EXTRA = [
    ("payroll",          API + "/admin/payroll"),
    ("finance-revenue",  API + "/finance/revenue"),
    ("finance-expenses", API + "/finance/expenses"),
    ("finance-invoices", API + "/finance/invoices"),
    ("finance-emp-exp",  API + "/finance/employees-expense"),
    ("rt-revenue",       API + "/revenues"),
    ("rt-revenue-cats",  API + "/revenues/categories"),
    ("rt-adv-summary",   API + "/revenues/advanced/summary"),
    ("rt-adv-targets",   API + "/revenues/advanced/targets"),
    ("rt-expense",       API + "/expenses"),
    ("rt-expense-cats",  API + "/expenses/categories"),
    ("profit-summary",   API + "/profit/summary"),
    ("cashflow",         API + "/cashflow"),
]

ALL = [(n, BASE + p) for n, p in ENDPOINTS] + EXTRA

ok, fail = [], []
for name, url in ALL:
    try:
        r = s.get(url, headers=H, timeout=25, proxies=PX)
        if r.status_code == 200:
            ok.append(name)
        else:
            fail.append((name, url, r.status_code, r.text[:180]))
    except Exception as e:
        fail.append((name, url, "EXC", str(e)[:150]))

print(f"\nPASS: {len(ok)}/{len(ALL)}")
print("\nFAILED:")
for name, path, code, body in fail:
    print(f"  [{code}] {name}  {path}\n        {body}")
if not fail:
    print("  (none)")
