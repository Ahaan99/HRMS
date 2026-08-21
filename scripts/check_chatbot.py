"""Read-only + roundtrip verification of AI Chat Hub endpoints."""
import requests

PX = {"http": None, "https": None}
API = "http://127.0.0.1:5000/api"

r = requests.post(f"{API}/super-admin/auth/login",
                  json={"email": "admin@hrms.com", "password": "admin123"},
                  timeout=20, proxies=PX)
tok = r.json().get("token") or (r.json().get("data") or {}).get("token")
H = {"Authorization": f"Bearer {tok}"}
print("[1] login:", r.status_code)

r = requests.get(f"{API}/automation/chatbot/settings", headers=H, timeout=15, proxies=PX)
print("[2] GET settings:", r.status_code, r.json().get("data"))

r = requests.put(f"{API}/automation/chatbot/settings", headers=H,
                 json={"autoRespond": False, "responseTime": 5, "workingHours": "10 AM - 7 PM"},
                 timeout=15, proxies=PX)
print("[3] PUT settings:", r.status_code)

r = requests.get(f"{API}/automation/chatbot/settings", headers=H, timeout=15, proxies=PX)
d = r.json()["data"]
ok = d.get("autoRespond") is False and d.get("responseTime") == 5 and d.get("workingHours") == "10 AM - 7 PM"
print("[4] settings persisted?", ok)

requests.put(f"{API}/automation/chatbot/settings", headers=H,
             json={"autoRespond": True, "responseTime": 3, "workingHours": "9 AM - 6 PM"},
             timeout=15, proxies=PX)

r = requests.get(f"{API}/automation/chatbot/templates", headers=H, timeout=15, proxies=PX)
tpls = r.json()["data"]
print("[5] GET templates:", r.status_code, "count:", len(tpls))

r = requests.post(f"{API}/automation/chatbot/templates", headers=H,
                  json={"category": "client", "keyword": "refund",
                        "response": "Refunds are processed within 5-7 business days.",
                        "intent": "refund_request"},
                  timeout=15, proxies=PX)
print("[6] POST template:", r.status_code)
nid = r.json()["data"]["id"]

r = requests.put(f"{API}/automation/chatbot/templates/{nid}", headers=H,
                 json={"category": "client", "keyword": "refund",
                       "response": "Refunds are processed within 3 business days.",
                       "intent": "refund_request"},
                 timeout=15, proxies=PX)
print("[7] PUT template:", r.status_code)

r = requests.delete(f"{API}/automation/chatbot/templates/{nid}", headers=H, timeout=15, proxies=PX)
print("[8] DELETE template:", r.status_code)

r = requests.post(f"{API}/automation/chatbot/templates", headers=H,
                  json={"category": "client"}, timeout=15, proxies=PX)
print("[9] validation (missing fields):", r.status_code, "(expect 400)")

r = requests.get(f"{API}/automation/chatbot/conversations?category=client", headers=H,
                 timeout=15, proxies=PX)
print("[10] GET conversations:", r.status_code)

r = requests.get(f"{API}/automation/chatbot/settings", timeout=15, proxies=PX)
print("[11] no-auth blocked:", r.status_code, "(expect 401)")

print("DONE")
