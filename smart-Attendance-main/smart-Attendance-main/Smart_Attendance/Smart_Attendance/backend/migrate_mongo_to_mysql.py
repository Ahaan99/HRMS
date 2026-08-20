"""
One-time migration: copies all data from MongoDB (smart_attendance)
into MySQL (smart_attendance). Safe to re-run — it skips rows that
already exist (matched by natural keys).

Run:  python migrate_mongo_to_mysql.py
"""

import json
from pymongo import MongoClient

from config import MONGO_URI
import database as mdb  # the new MySQL layer

mongo = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
mongo_db = mongo["smart_attendance"]

stats = {}


def migrate_users():
    inserted = skipped = 0
    for doc in mongo_db["users"].find():
        mobile = doc.get("mobile")
        if mobile and mdb.users_col.find_one({"mobile": mobile}):
            # keep MySQL row but make sure password/role match Mongo source
            mdb.users_col.update_one({"mobile": mobile}, {"$set": {
                "name": doc.get("name"),
                "password": doc.get("password"),
                "role": doc.get("role"),
                "emp_id": doc.get("emp_id"),
                "created": doc.get("created"),
            }})
            skipped += 1
            continue
        mdb.users_col.insert_one({
            "name": doc.get("name"),
            "mobile": mobile,
            "password": doc.get("password"),
            "role": doc.get("role"),
            "emp_id": doc.get("emp_id"),
            "created": doc.get("created"),
        })
        inserted += 1
    stats["users"] = (inserted, skipped)


def migrate_employees():
    inserted = skipped = 0
    for doc in mongo_db["employees"].find():
        emp_id = doc.get("emp_id")
        enc = doc.get("encoding")
        if isinstance(enc, (list, tuple)):
            enc = list(enc)
        if emp_id and mdb.employees_col.find_one({"emp_id": emp_id}):
            mdb.employees_col.update_one({"emp_id": emp_id}, {"$set": {
                "name": doc.get("name"),
                "encoding": enc,
                "registered_at": doc.get("registered_at"),
            }})
            skipped += 1
            continue
        mdb.employees_col.insert_one({
            "emp_id": emp_id,
            "name": doc.get("name"),
            "encoding": enc,
            "registered_at": doc.get("registered_at"),
        })
        inserted += 1
    stats["employees"] = (inserted, skipped)


ATT_FIELDS = [
    "emp_id", "name", "date", "time", "status", "method", "ip", "approval",
    "check_out", "hours", "overtime", "lat", "lng",
    "hrms_sync", "hrms_sync_error", "hrms_sync_at",
    "corrected", "corrected_by", "corrected_at", "correction_reason",
    "original", "approved_by", "approved_at",
]


def migrate_attendance():
    inserted = skipped = 0
    for doc in mongo_db["attendance"].find():
        emp_id, date = doc.get("emp_id"), doc.get("date")
        if emp_id and date and mdb.attendance_col.find_one(
                {"emp_id": emp_id, "date": date, "time": doc.get("time")}):
            skipped += 1
            continue
        row = {}
        for f in ATT_FIELDS:
            if f in doc and doc[f] is not None:
                row[f] = doc[f]
        if "corrected" in row:
            row["corrected"] = 1 if row["corrected"] else 0
        mdb.attendance_col.insert_one(row)
        inserted += 1
    stats["attendance"] = (inserted, skipped)


COR_FIELDS = ["emp_id", "name", "date", "check_in", "check_out", "reason",
              "state", "requested_at", "decided_by", "decided_at"]


def migrate_corrections():
    inserted = skipped = 0
    cor_col = mdb.db["corrections"]
    for doc in mongo_db["corrections"].find():
        if doc.get("emp_id") and doc.get("date") and cor_col.find_one(
                {"emp_id": doc["emp_id"], "date": doc["date"],
                 "requested_at": doc.get("requested_at")}):
            skipped += 1
            continue
        row = {f: doc[f] for f in COR_FIELDS if f in doc and doc[f] is not None}
        cor_col.insert_one(row)
        inserted += 1
    stats["corrections"] = (inserted, skipped)


def migrate_settings():
    inserted = 0
    for doc in mongo_db["settings"].find():
        key = doc.get("_id")
        data = {k: v for k, v in doc.items() if k != "_id"}
        mdb.settings_col.replace_one({"_id": key}, {"_id": key, **data}, upsert=True)
        inserted += 1
    stats["settings"] = (inserted, 0)


if __name__ == "__main__":
    try:
        mongo.admin.command("ping")
    except Exception as e:
        print("ERROR: cannot reach MongoDB:", e)
        raise SystemExit(1)

    migrate_users()
    migrate_employees()
    migrate_attendance()
    migrate_corrections()
    migrate_settings()

    print("Migration complete:")
    for table, (ins, skip) in stats.items():
        print(f"  {table:12s} inserted={ins}  updated/skipped={skip}")
