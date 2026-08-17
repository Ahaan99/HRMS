"""HRMS Integration API — connects HR_robo (AI Interview Portal) to the main
Recruweb HRMS dashboards (HR Portal + Superadmin Portal).

Data flow (per requirement §11):  AI Interview Portal → HR Portal → Superadmin Portal

The interview runs in the browser (offline AI engine + proctoring), and after
each interview the portal POSTs a snapshot here. The main HRMS React apps
(HR dashboard, admin/superadmin dashboard) read these endpoints.
"""
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from datetime import datetime
import os, json, threading

integration_router = APIRouter()

_STORE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "integration_store.json")
_LOCK = threading.Lock()


def _load():
    if not os.path.exists(_STORE_PATH):
        return {"reports": [], "proctor_logs": [], "candidates": [], "schedules": [], "config": {}, "synced_at": None}
    try:
        with open(_STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"reports": [], "proctor_logs": [], "candidates": [], "schedules": [], "config": {}, "synced_at": None}


def _save(data):
    with _LOCK:
        with open(_STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)


@integration_router.post("/sync")
async def sync_snapshot(request: Request):
    """Interview portal pushes its latest data snapshot after each interview."""
    body = await request.json()
    store = _load()
    for key in ("reports", "proctor_logs", "candidates", "schedules", "config"):
        if key in body and body[key] is not None:
            store[key] = body[key]
    store["synced_at"] = datetime.utcnow().isoformat() + "Z"
    _save(store)
    return {"ok": True, "synced_at": store["synced_at"],
            "counts": {k: len(store[k]) for k in ("reports", "proctor_logs", "candidates", "schedules")}}


@integration_router.get("/summary")
async def summary():
    """Headline numbers for HRMS dashboard widgets."""
    s = _load()
    reports = s.get("reports", [])
    logs = s.get("proctor_logs", [])
    verdict_counts = {}
    for r in reports:
        v = (r.get("recommendation") or {}).get("verdict") or r.get("verdict") or "PENDING"
        verdict_counts[v] = verdict_counts.get(v, 0) + 1
    return {
        "synced_at": s.get("synced_at"),
        "total_interviews": len(reports),
        "total_candidates": len(s.get("candidates", [])),
        "scheduled": len([x for x in s.get("schedules", []) if x.get("status") == "scheduled"]),
        "terminated": len([l for l in logs if l.get("terminated")]),
        "avg_integrity": round(sum(l.get("integrity", 100) for l in logs) / len(logs), 1) if logs else None,
        "verdicts": verdict_counts,
    }


@integration_router.get("/reports")
async def get_reports():
    """Full interview reports for the HR dashboard (scores, assessment, recommendation)."""
    s = _load()
    return {"synced_at": s.get("synced_at"), "reports": s.get("reports", []),
            "candidates": s.get("candidates", []), "schedules": s.get("schedules", [])}


@integration_router.get("/proctor-logs")
async def get_proctor_logs():
    """Integrity/proctoring audit for the Superadmin dashboard."""
    s = _load()
    return {"synced_at": s.get("synced_at"), "proctor_logs": s.get("proctor_logs", []),
            "config": s.get("config", {}), "candidates": s.get("candidates", [])}


@integration_router.get("/health")
async def integration_health():
    s = _load()
    return {"status": "ok", "module": "hrms-integration", "synced_at": s.get("synced_at")}
