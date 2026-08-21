"""Read-only check: super-admin joining endpoint returns joining_forms rows."""
import requests

PX = {"http": None, "https": None}
API = "http://127.0.0.1:5000/api"

r = requests.post(f"{API}/super-admin/auth/login",
                  json={"email": "admin@hrms.com", "password": "admin123"},
                  timeout=20, proxies=PX)
tok = r.json().get("token") or (r.json().get("data") or {}).get("token")
H = {"Authorization": f"Bearer {tok}"}

r = requests.get(f"{API}/super-admin/joining", headers=H, timeout=15, proxies=PX)
body = r.json()
data = body.get("data") if isinstance(body, dict) else body
print("GET /super-admin/joining:", r.status_code, "| rows:", len(data) if isinstance(data, list) else "?")
if isinstance(data, list) and data:
    latest = data[0]
    keys = [k for k in ("id", "candidate_name", "name", "full_name", "email", "created_at") if k in latest]
    print("latest row:", {k: latest[k] for k in keys})
print("DONE")
