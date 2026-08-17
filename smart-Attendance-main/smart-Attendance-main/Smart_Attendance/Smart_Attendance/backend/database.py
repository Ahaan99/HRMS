from pymongo import MongoClient
from datetime import datetime
import hashlib
from config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client["smart_attendance"]

# Collections
employees_col  = db["employees"]   # face encodings + employee info
attendance_col = db["attendance"]  # daily attendance records
users_col      = db["users"]       # login accounts
settings_col   = db["settings"]    # runtime settings (office location, radius)


# ── Indexes ──────────────────────────────────────
employees_col.create_index("emp_id", unique=True)
users_col.create_index("mobile", unique=True)
attendance_col.create_index([("emp_id", 1), ("date", 1)])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


# ── Seed default admin if not exists ─────────────
def seed_admin():
    if not users_col.find_one({"role": "admin"}):
        users_col.insert_one({
            "name":     "Admin",
            "mobile":   "9999999999",
            "password": hash_password("admin123"),
            "role":     "admin",
            "created":  datetime.now().strftime("%Y-%m-%d %H:%M")
        })

seed_admin()
