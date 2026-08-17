"""
attendance_plus.py — Advanced attendance features:
  - Shift settings (admin-configurable) with late / half-day rules
  - Check-out with working-hours + overtime calculation
  - Manual correction workflow (employee request -> admin approve/reject)
  - Attendance approval hierarchy (pending -> approved/rejected)
  - Employee self-history + monthly summary
  - HRMS sync engine (pushes records to the HRMS integration API)
"""

import threading
import urllib.request
import urllib.error
import json
from datetime import datetime

from flask import Blueprint, request, jsonify, session
from bson import ObjectId

from database import (
    attendance_col, users_col, settings_col, db
)

corrections_col = db["corrections"]

bp = Blueprint("attendance_plus", __name__)


# ─────────────────────────────────────────────────────────────
#  Auth helper (session-based, same semantics as app.py)
# ─────────────────────────────────────────────────────────────
def require_login(role=None):
    if "user_id" not in session:
        return None, (jsonify({"ok": False, "error": "Login required"}), 401)
    try:
        user = users_col.find_one({"_id": ObjectId(session["user_id"])}, {"password": 0})
    except Exception:
        return None, (jsonify({"ok": False, "error": "Invalid session"}), 401)
    if not user:
        return None, (jsonify({"ok": False, "error": "User not found"}), 401)
    if role and user.get("role") != role:
        return None, (jsonify({"ok": False, "error": f"{role} access required"}), 403)
    return user, None


# ─────────────────────────────────────────────────────────────
#  Shift settings
# ─────────────────────────────────────────────────────────────
DEFAULT_SHIFT = {
    "start": "09:30", "end": "18:30", "grace_min": 15,
    "half_day_hours": 4.0, "full_day_hours": 8.0, "overtime_after_hours": 8.5
}


def get_shift():
    doc = settings_col.find_one({"_id": "shift"}) or {}
    s = dict(DEFAULT_SHIFT)
    s.update({k: v for k, v in doc.items() if k != "_id"})
    return s


def evaluate_checkin_status(time_str):
    """Given HH:MM:SS check-in time -> 'Present' or 'Late' per shift rules."""
    try:
        shift = get_shift()
        checkin = datetime.strptime(time_str[:5], "%H:%M")
        start = datetime.strptime(shift["start"], "%H:%M")
        grace = int(shift.get("grace_min", 0))
        late_after = start.hour * 60 + start.minute + grace
        actual = checkin.hour * 60 + checkin.minute
        return "Late" if actual > late_after else "Present"
    except Exception:
        return "Present"


def enrich_checkin(record):
    """Called by app.py right before inserting an attendance record.
    Adds shift status, approval state, and triggers HRMS sync."""
    record["status"] = evaluate_checkin_status(record.get("time", ""))
    record["approval"] = "pending"
    record["check_out"] = None
    record["hours"] = 0.0
    record["overtime"] = 0.0
    return record


def after_checkin_insert(record):
    """Fire-and-forget HRMS push after a check-in insert."""
    push_to_hrms_async(record, "check_in")


@bp.route("/api/shift-settings", methods=["GET"])
def shift_settings_get():
    user, err = require_login()
    if err:
        return err
    return jsonify({"ok": True, "shift": get_shift()})


@bp.route("/api/shift-settings", methods=["POST"])
def shift_settings_set():
    user, err = require_login(role="admin")
    if err:
        return err
    data = request.json or {}
    upd = {}
    try:
        for key in ("start", "end"):
            if key in data:
                datetime.strptime(str(data[key]), "%H:%M")
                upd[key] = str(data[key])
        for key in ("grace_min",):
            if key in data:
                v = int(data[key])
                if not (0 <= v <= 240):
                    return jsonify({"ok": False, "error": "grace_min must be 0-240"})
                upd[key] = v
        for key in ("half_day_hours", "full_day_hours", "overtime_after_hours"):
            if key in data:
                v = float(data[key])
                if not (0.5 <= v <= 24):
                    return jsonify({"ok": False, "error": f"{key} must be 0.5-24"})
                upd[key] = v
    except (ValueError, TypeError):
        return jsonify({"ok": False, "error": "Invalid shift values (times HH:MM, numbers for hours)"})
    if not upd:
        return jsonify({"ok": False, "error": "Nothing to update"})
    settings_col.update_one({"_id": "shift"}, {"$set": upd}, upsert=True)
    return jsonify({"ok": True, "shift": get_shift(), "message": "Shift settings saved"})


# ─────────────────────────────────────────────────────────────
#  Check-out + working hours + overtime
# ─────────────────────────────────────────────────────────────
def compute_hours(date_str, time_in, time_out):
    try:
        t1 = datetime.strptime(f"{date_str} {time_in}", "%Y-%m-%d %H:%M:%S")
        t2 = datetime.strptime(f"{date_str} {time_out}", "%Y-%m-%d %H:%M:%S")
        hrs = (t2 - t1).total_seconds() / 3600.0
        return max(0.0, round(hrs, 2))
    except Exception:
        return 0.0


@bp.route("/api/check-out", methods=["POST"])
def check_out():
    user, err = require_login(role="employee")
    if err:
        return err
    emp_id = user.get("emp_id")
    today = datetime.now().strftime("%Y-%m-%d")
    now = datetime.now().strftime("%H:%M:%S")

    rec = attendance_col.find_one({"emp_id": emp_id, "date": today})
    if not rec:
        return jsonify({"ok": False, "error": "No check-in found for today — pehle attendance mark karo"})
    if rec.get("check_out"):
        return jsonify({"ok": False, "error": f"Already checked out at {rec['check_out']}"})

    shift = get_shift()
    hours = compute_hours(today, rec.get("time", now), now)
    overtime = max(0.0, round(hours - float(shift["overtime_after_hours"]), 2))

    status = rec.get("status", "Present")
    if hours < float(shift["half_day_hours"]):
        status = "Half Day"

    attendance_col.update_one(
        {"_id": rec["_id"]},
        {"$set": {"check_out": now, "hours": hours, "overtime": overtime, "status": status}}
    )
    updated = attendance_col.find_one({"_id": rec["_id"]})
    push_to_hrms_async(updated, "check_out")
    return jsonify({
        "ok": True, "check_out": now, "hours": hours,
        "overtime": overtime, "status": status,
        "message": f"Checked out at {now} — {hours}h worked" + (f" (+{overtime}h overtime)" if overtime > 0 else "")
    })


# ─────────────────────────────────────────────────────────────
#  Employee self-history + monthly summary
# ─────────────────────────────────────────────────────────────
@bp.route("/api/my-history")
def my_history():
    user, err = require_login(role="employee")
    if err:
        return err
    month = request.args.get("month", datetime.now().strftime("%Y-%m"))
    if len(month) != 7 or month[4] != "-":
        return jsonify({"ok": False, "error": "month must be YYYY-MM"})
    docs = list(attendance_col.find(
        {"emp_id": user.get("emp_id"), "date": {"$regex": f"^{month}"}},
        {"_id": 0}
    ).sort("date", -1))
    total_hours = round(sum(d.get("hours", 0) or 0 for d in docs), 2)
    total_ot = round(sum(d.get("overtime", 0) or 0 for d in docs), 2)
    late_days = sum(1 for d in docs if d.get("status") == "Late")
    half_days = sum(1 for d in docs if d.get("status") == "Half Day")
    return jsonify({
        "ok": True, "records": docs,
        "summary": {
            "days_present": len(docs), "late_days": late_days, "half_days": half_days,
            "total_hours": total_hours, "total_overtime": total_ot
        }
    })


@bp.route("/api/summary")
def admin_summary():
    user, err = require_login(role="admin")
    if err:
        return err
    month = request.args.get("month", datetime.now().strftime("%Y-%m"))
    if len(month) != 7 or month[4] != "-":
        return jsonify({"ok": False, "error": "month must be YYYY-MM"})
    pipeline = [
        {"$match": {"date": {"$regex": f"^{month}"}}},
        {"$group": {
            "_id": "$emp_id",
            "name": {"$first": "$name"},
            "days_present": {"$sum": 1},
            "late_days": {"$sum": {"$cond": [{"$eq": ["$status", "Late"]}, 1, 0]}},
            "half_days": {"$sum": {"$cond": [{"$eq": ["$status", "Half Day"]}, 1, 0]}},
            "total_hours": {"$sum": {"$ifNull": ["$hours", 0]}},
            "total_overtime": {"$sum": {"$ifNull": ["$overtime", 0]}},
        }},
        {"$sort": {"_id": 1}}
    ]
    rows = list(attendance_col.aggregate(pipeline))
    for r in rows:
        r["emp_id"] = r.pop("_id")
        r["total_hours"] = round(r["total_hours"], 2)
        r["total_overtime"] = round(r["total_overtime"], 2)
    return jsonify({"ok": True, "month": month, "rows": rows})


# ─────────────────────────────────────────────────────────────
#  Manual correction workflow
# ─────────────────────────────────────────────────────────────
@bp.route("/api/corrections", methods=["POST"])
def correction_request():
    user, err = require_login(role="employee")
    if err:
        return err
    data = request.json or {}
    date = str(data.get("date", "")).strip()
    reason = str(data.get("reason", "")).strip()
    req_in = str(data.get("check_in", "")).strip()
    req_out = str(data.get("check_out", "")).strip()
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return jsonify({"ok": False, "error": "date must be YYYY-MM-DD"})
    if not reason or len(reason) < 5:
        return jsonify({"ok": False, "error": "Reason chahiye (min 5 characters)"})
    for t in (req_in, req_out):
        if t:
            try:
                datetime.strptime(t, "%H:%M")
            except ValueError:
                return jsonify({"ok": False, "error": "Times must be HH:MM"})
    if not req_in and not req_out:
        return jsonify({"ok": False, "error": "check_in ya check_out time do"})
    existing = corrections_col.find_one(
        {"emp_id": user.get("emp_id"), "date": date, "state": "pending"})
    if existing:
        return jsonify({"ok": False, "error": "Is date ke liye pehle se pending request hai"})
    corrections_col.insert_one({
        "emp_id": user.get("emp_id"), "name": user.get("name"),
        "date": date, "check_in": req_in or None, "check_out": req_out or None,
        "reason": reason, "state": "pending",
        "requested_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "decided_by": None, "decided_at": None
    })
    return jsonify({"ok": True, "message": "Correction request submit ho gayi — admin approve karega"})


@bp.route("/api/corrections")
def corrections_list():
    user, err = require_login()
    if err:
        return err
    if user.get("role") == "admin":
        state = request.args.get("state", "pending")
        q = {} if state == "all" else {"state": state}
        docs = list(corrections_col.find(q).sort("requested_at", -1).limit(200))
    else:
        docs = list(corrections_col.find(
            {"emp_id": user.get("emp_id")}).sort("requested_at", -1).limit(50))
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return jsonify({"ok": True, "corrections": docs})


@bp.route("/api/corrections/<cid>/decide", methods=["POST"])
def correction_decide(cid):
    user, err = require_login(role="admin")
    if err:
        return err
    data = request.json or {}
    decision = data.get("decision")
    if decision not in ("approve", "reject"):
        return jsonify({"ok": False, "error": "decision must be approve|reject"})
    try:
        cor = corrections_col.find_one({"_id": ObjectId(cid)})
    except Exception:
        return jsonify({"ok": False, "error": "Invalid correction id"})
    if not cor:
        return jsonify({"ok": False, "error": "Correction not found"})
    if cor.get("state") != "pending":
        return jsonify({"ok": False, "error": f"Already {cor.get('state')}"})

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if decision == "reject":
        corrections_col.update_one({"_id": cor["_id"]}, {"$set": {
            "state": "rejected", "decided_by": user.get("name"), "decided_at": now}})
        return jsonify({"ok": True, "message": "Correction rejected"})

    # approve -> apply to attendance record (create if missing), keep audit trail
    rec = attendance_col.find_one({"emp_id": cor["emp_id"], "date": cor["date"]})
    shift = get_shift()
    new_in = (cor.get("check_in") + ":00") if cor.get("check_in") else (rec.get("time") if rec else None)
    new_out = (cor.get("check_out") + ":00") if cor.get("check_out") else (rec.get("check_out") if rec else None)
    hours = compute_hours(cor["date"], new_in, new_out) if (new_in and new_out) else (rec.get("hours", 0) if rec else 0)
    overtime = max(0.0, round(hours - float(shift["overtime_after_hours"]), 2)) if hours else 0.0
    status = evaluate_checkin_status(new_in) if new_in else "Present"
    if new_in and new_out and hours < float(shift["half_day_hours"]):
        status = "Half Day"

    audit = {
        "corrected": True, "corrected_by": user.get("name"), "corrected_at": now,
        "correction_reason": cor["reason"],
        "original": {"time": rec.get("time") if rec else None,
                     "check_out": rec.get("check_out") if rec else None}
    }
    fields = {"status": status, "hours": hours, "overtime": overtime,
              "approval": "approved", **audit}
    if new_in:
        fields["time"] = new_in
    if new_out:
        fields["check_out"] = new_out

    if rec:
        attendance_col.update_one({"_id": rec["_id"]}, {"$set": fields})
    else:
        attendance_col.insert_one({
            "emp_id": cor["emp_id"], "name": cor["name"], "date": cor["date"],
            "time": new_in or "00:00:00", "method": "Correction", **fields})

    corrections_col.update_one({"_id": cor["_id"]}, {"$set": {
        "state": "approved", "decided_by": user.get("name"), "decided_at": now}})
    updated = attendance_col.find_one({"emp_id": cor["emp_id"], "date": cor["date"]})
    push_to_hrms_async(updated, "correction")
    return jsonify({"ok": True, "message": "Correction approved and attendance updated"})


# ─────────────────────────────────────────────────────────────
#  Approval hierarchy
# ─────────────────────────────────────────────────────────────
@bp.route("/api/attendance/pending")
def attendance_pending():
    user, err = require_login(role="admin")
    if err:
        return err
    docs = list(attendance_col.find(
        {"approval": "pending"}).sort([("date", -1), ("time", -1)]).limit(300))
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return jsonify({"ok": True, "records": docs})


@bp.route("/api/attendance/approve", methods=["POST"])
def attendance_approve():
    user, err = require_login(role="admin")
    if err:
        return err
    data = request.json or {}
    ids = data.get("ids") or []
    decision = data.get("decision", "approved")
    if decision not in ("approved", "rejected"):
        return jsonify({"ok": False, "error": "decision must be approved|rejected"})
    if not isinstance(ids, list) or not ids or len(ids) > 500:
        return jsonify({"ok": False, "error": "ids list required (max 500)"})
    oids = []
    for i in ids:
        try:
            oids.append(ObjectId(i))
        except Exception:
            pass
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    r = attendance_col.update_many(
        {"_id": {"$in": oids}, "approval": "pending"},
        {"$set": {"approval": decision, "approved_by": user.get("name"), "approved_at": now}})
    return jsonify({"ok": True, "updated": r.modified_count,
                    "message": f"{r.modified_count} record(s) {decision}"})


# ─────────────────────────────────────────────────────────────
#  HRMS sync engine
# ─────────────────────────────────────────────────────────────
STATUS_MAP = {"Present": "PRESENT", "Late": "LATE", "Half Day": "HALF_DAY"}


def get_hrms_settings():
    doc = settings_col.find_one({"_id": "hrms"}) or {}
    return {
        "enabled": bool(doc.get("enabled", False)),
        "url": doc.get("url", "http://127.0.0.1:5001"),
        "key": doc.get("key", ""),
    }


@bp.route("/api/hrms-settings", methods=["GET"])
def hrms_settings_get():
    user, err = require_login(role="admin")
    if err:
        return err
    s = get_hrms_settings()
    s["key"] = ("*" * 8 + s["key"][-4:]) if len(s.get("key", "")) > 4 else ("set" if s.get("key") else "")
    return jsonify({"ok": True, "hrms": s})


@bp.route("/api/hrms-settings", methods=["POST"])
def hrms_settings_set():
    user, err = require_login(role="admin")
    if err:
        return err
    data = request.json or {}
    upd = {}
    if "enabled" in data:
        upd["enabled"] = bool(data["enabled"])
    if "url" in data:
        url = str(data["url"]).strip().rstrip("/")
        if url and not (url.startswith("http://") or url.startswith("https://")):
            return jsonify({"ok": False, "error": "URL must start with http:// or https://"})
        upd["url"] = url
    if data.get("key"):
        upd["key"] = str(data["key"]).strip()
    if not upd:
        return jsonify({"ok": False, "error": "Nothing to update"})
    settings_col.update_one({"_id": "hrms"}, {"$set": upd}, upsert=True)
    return jsonify({"ok": True, "message": "HRMS sync settings saved"})


def _hrms_payload(record):
    return {
        "employeeCode": record.get("emp_id"),
        "employee_name": record.get("name"),
        "date": record.get("date"),
        "check_in": record.get("time"),
        "check_out": record.get("check_out"),
        "status": STATUS_MAP.get(record.get("status"), "PRESENT"),
        "method": f"SMART_{(record.get('method') or 'FACE').upper()}",
        "lat": record.get("lat"),
        "lng": record.get("lng"),
    }


def _push_worker(record, action):
    s = get_hrms_settings()
    if not s["enabled"] or not s["key"]:
        return
    try:
        body = json.dumps({"action": action, **_hrms_payload(record)}).encode()
        req = urllib.request.Request(
            s["url"] + "/api/integration/smart-attendance",
            data=body, method="POST",
            headers={"Content-Type": "application/json",
                     "x-integration-key": s["key"]})
        with urllib.request.urlopen(req, timeout=10) as resp:
            ok = 200 <= resp.status < 300
        attendance_col.update_one({"_id": record["_id"]}, {"$set": {
            "hrms_sync": "synced" if ok else "failed",
            "hrms_sync_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}})
    except Exception as e:
        try:
            attendance_col.update_one({"_id": record["_id"]}, {"$set": {
                "hrms_sync": "failed", "hrms_sync_error": str(e)[:200],
                "hrms_sync_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}})
        except Exception:
            pass


def push_to_hrms_async(record, action):
    if not record or "_id" not in record:
        return
    threading.Thread(target=_push_worker, args=(record, action), daemon=True).start()


@bp.route("/api/hrms-sync/retry", methods=["POST"])
def hrms_retry():
    user, err = require_login(role="admin")
    if err:
        return err
    failed = list(attendance_col.find({"hrms_sync": "failed"}).limit(100))
    for rec in failed:
        push_to_hrms_async(rec, "retry")
    return jsonify({"ok": True, "message": f"Retrying {len(failed)} failed record(s) in background"})


# ─── Admin advanced page ───
from flask import render_template, redirect


@bp.route("/admin/advanced")
def admin_advanced_page():
    if "user_id" not in session:
        return redirect("/")
    try:
        u = users_col.find_one({"_id": ObjectId(session["user_id"])})
    except Exception:
        return redirect("/")
    if not u or u.get("role") != "admin":
        return redirect("/")
    return render_template("admin_advanced.html")


def insert_attendance(doc):
    # Drop-in replacement for attendance_col.insert_one: adds shift status,
    # approval state, then inserts and pushes to HRMS in the background.
    enrich_checkin(doc)
    res = attendance_col.insert_one(doc)
    doc["_id"] = res.inserted_id
    after_checkin_insert(doc)
    return res
