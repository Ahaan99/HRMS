"""NOVA HR Robot — All Database Queries"""
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func, or_
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import logging
from databases.models import *

logger = logging.getLogger(__name__)

# ── Admin Users ──
def create_admin(db, name, email, hashed_password, role=UserRole.HR_VIEWER):
    u = AdminUser(name=name, email=email, hashed_password=hashed_password, role=role)
    db.add(u); db.commit(); db.refresh(u); return u

def get_admin_by_email(db, email): return db.query(AdminUser).filter(AdminUser.email==email).first()
def get_admin_by_id(db, uid): return db.query(AdminUser).filter(AdminUser.id==uid).first()
def get_all_admins(db): return db.query(AdminUser).filter(AdminUser.is_active==True).all()
def update_last_login(db, uid):
    db.query(AdminUser).filter(AdminUser.id==uid).update({"last_login": datetime.utcnow()}); db.commit()

# ── Candidates ──
def create_candidate(db, data: dict):
    c = Candidate(**data); db.add(c); db.commit(); db.refresh(c); return c

def get_candidate(db, cid): return db.query(Candidate).filter(Candidate.id==cid).first()
def get_candidate_by_email(db, email): return db.query(Candidate).filter(Candidate.email==email).first()

def get_all_candidates(db, skip=0, limit=100, status=None, position_id=None):
    q = db.query(Candidate)
    if status: q = q.filter(Candidate.status==status)
    if position_id: q = q.filter(Candidate.position_id==position_id)
    return q.order_by(desc(Candidate.ai_score)).offset(skip).limit(limit).all()

def get_shortlisted(db, min_score=70.0, limit=50):
    return db.query(Candidate).filter(Candidate.ai_score>=min_score,
        Candidate.status==CandidateStatus.SHORTLISTED).order_by(desc(Candidate.ai_score)).limit(limit).all()

def update_candidate(db, cid, data: dict):
    db.query(Candidate).filter(Candidate.id==cid).update(data); db.commit()
    return get_candidate(db, cid)

def update_candidate_status(db, cid, status):
    db.query(Candidate).filter(Candidate.id==cid).update({"status": status}); db.commit()
    return get_candidate(db, cid)

def search_candidates(db, q):
    s = f"%{q}%"
    return db.query(Candidate).filter(or_(Candidate.name.ilike(s),
        Candidate.email.ilike(s), Candidate.resume_text.ilike(s))).all()

# ── Job Positions ──
def create_position(db, data): p=JobPosition(**data); db.add(p); db.commit(); db.refresh(p); return p
def get_all_positions(db, active_only=True):
    q = db.query(JobPosition)
    if active_only: q = q.filter(JobPosition.is_active==True)
    return q.all()
def get_position(db, pid): return db.query(JobPosition).filter(JobPosition.id==pid).first()

# ── Interview Sessions ──
def create_session(db, data):
    s = InterviewSession(**data); db.add(s); db.commit(); db.refresh(s); return s

def get_session(db, sid): return db.query(InterviewSession).filter(InterviewSession.id==sid).first()

def get_todays_interviews(db):
    today = datetime.utcnow().replace(hour=0, minute=0, second=0)
    return db.query(InterviewSession).filter(
        InterviewSession.scheduled_at >= today,
        InterviewSession.status != InterviewStatus.CANCELLED
    ).order_by(asc(InterviewSession.scheduled_at)).all()

def get_upcoming_interviews(db, days=7):
    now = datetime.utcnow(); future = now + timedelta(days=days)
    return db.query(InterviewSession).filter(
        InterviewSession.scheduled_at.between(now, future),
        InterviewSession.status == InterviewStatus.SCHEDULED
    ).order_by(asc(InterviewSession.scheduled_at)).all()

def start_session(db, sid):
    db.query(InterviewSession).filter(InterviewSession.id==sid).update(
        {"status": InterviewStatus.IN_PROGRESS, "started_at": datetime.utcnow()}); db.commit()
    return get_session(db, sid)

def end_session(db, sid, scores: dict, transcript=None, summary=None):
    now = datetime.utcnow()
    s = get_session(db, sid)
    duration = int((now - s.started_at).total_seconds()/60) if s and s.started_at else 0
    update = {"status": InterviewStatus.COMPLETED, "ended_at": now, "duration_minutes": duration}
    update.update({k: v for k, v in scores.items() if hasattr(InterviewSession, k)})
    if transcript: update["transcript"] = transcript
    if summary: update["ai_summary"] = summary
    db.query(InterviewSession).filter(InterviewSession.id==sid).update(update); db.commit()
    return get_session(db, sid)

def save_chat_message(db, session_id, role, content, question_type=None):
    m = ChatMessage(session_id=session_id, role=role, content=content, question_type=question_type)
    db.add(m); db.commit(); return m

def get_session_chat(db, session_id):
    return db.query(ChatMessage).filter(ChatMessage.session_id==session_id).order_by(asc(ChatMessage.timestamp)).all()

def save_body_language(db, data):
    r = BodyLanguageReport(**data); db.add(r); db.commit(); db.refresh(r); return r



# ── Dashboard Stats ──
def get_dashboard_stats(db) -> dict:
    today = datetime.utcnow().replace(hour=0, minute=0, second=0)
    return {
        "total_candidates": db.query(Candidate).count(),
        "shortlisted": db.query(Candidate).filter(Candidate.status==CandidateStatus.SHORTLISTED).count(),
        "total_interviews": db.query(InterviewSession).count(),
        "interviews_today": db.query(InterviewSession).filter(InterviewSession.scheduled_at>=today).count(),
        "completed_today": db.query(InterviewSession).filter(
            InterviewSession.status==InterviewStatus.COMPLETED,
            InterviewSession.ended_at>=today).count(),
        "selected_candidates": db.query(Candidate).filter(Candidate.status==CandidateStatus.SELECTED).count(),
        "avg_score": round(db.query(func.avg(InterviewSession.overall_score)).scalar() or 0, 1),
        "active_positions": db.query(JobPosition).filter(JobPosition.is_active==True).count(),
    }


# ── Alias ──────────────────────────────────────────────
def create_admin_user(db, name, email, hashed_password, role=UserRole.HR_VIEWER):
    return create_admin(db, name, email, hashed_password, role)

def get_admin_by_email(db, email):
    return db.query(AdminUser).filter(AdminUser.email == email).first()

def update_last_login(db, user_id):
    from datetime import datetime
    db.query(AdminUser).filter(AdminUser.id == user_id).update({"last_login": datetime.utcnow()})
    db.commit()

# ── Compatibility wrappers (functions routes.py calls) ──
def get_candidate_by_id(db, cid):
    return get_candidate(db, cid)

def create_job_position(db, data: dict):
    cols = {c.name for c in JobPosition.__table__.columns}
    return create_position(db, {k: v for k, v in data.items() if k in cols})

def create_interview_session(db, data: dict):
    cols = {c.name for c in InterviewSession.__table__.columns}
    return create_session(db, {k: v for k, v in data.items() if k in cols})

def update_candidate_score(db, cid, data: dict):
    cols = {c.name for c in Candidate.__table__.columns}
    clean = {}
    for k, v in data.items():
        if k not in cols:
            continue
        if isinstance(v, (list, tuple)):
            v = ", ".join(str(x) for x in v)
        clean[k] = v
    if clean:
        db.query(Candidate).filter(Candidate.id == cid).update(clean)
        db.commit()
    return get_candidate(db, cid)

def get_recent_logs(db, limit=30):
    return (db.query(SystemLog)
            .order_by(desc(SystemLog.timestamp))
            .limit(limit).all())
