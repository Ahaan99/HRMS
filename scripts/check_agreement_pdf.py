"""Read-only check: agreement PDF paths resolve on the backend."""
import requests

PX = {"http": None, "https": None}
API = "http://127.0.0.1:5000/api"
BASE = "http://127.0.0.1:5000"

r = requests.post(f"{API}/super-admin/auth/login",
                  json={"email": "admin@hrms.com", "password": "admin123"},
                  timeout=20, proxies=PX)
tok = r.json().get("token") or (r.json().get("data") or {}).get("token")
H = {"Authorization": f"Bearer {tok}"}

r = requests.get(f"{API}/super-admin/client-agreements", headers=H, timeout=15, proxies=PX)
data = r.json().get("data") or r.json()
print("agreements:", r.status_code, "count:", len(data))

for a in data[:3]:
    path = a.get("agreement_pdf")
    if not path:
        print("no pdf path for id", a.get("id"))
        continue
    url = path if str(path).startswith("http") else BASE + (path if str(path).startswith("/") else "/" + str(path))
    pr = requests.get(url, timeout=15, proxies=PX)
    print("path:", path, "| status:", pr.status_code,
          "| type:", pr.headers.get("content-type"), "| bytes:", len(pr.content))

print("DONE")
