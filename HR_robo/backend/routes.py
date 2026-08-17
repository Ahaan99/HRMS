"""NOVA HR Robot — API Routes (routes.py)"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import os, sys, json, io
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.auth import get_current_user, require_admin, hash_password, verify_password, create_access_token
from databases.db import get_db
from databases import queries, models
from sqlalchemy.orm import Session

router = APIRouter()

# ── Pydantic schemas ──
class LoginRequest(BaseModel):
    email: str
    password: str

class CandidateCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    position_id: Optional[int] = None

class InterviewSchedule(BaseModel):
    candidate_id: int
    position_id: Optional[int] = None
    scheduled_at: str
    round: str = "ai_screening"
    location: str = "Robot Interview Room 1"

class InterviewMessage(BaseModel):
    session_id: str
    message: str

class JobPositionCreate(BaseModel):
    title: str
    department: str
    description: Optional[str] = ""
    requirements: Optional[dict] = {}
    experience_min: int = 0
    experience_max: int = 20

# ── AUTH ──
@router.post("/auth/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = queries.get_admin_by_email(db, req.email)
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    queries.update_last_login(db, user.id)
    token = create_access_token({"sub": user.email, "role": user.role, "id": user.id, "name": user.name})
    return {"access_token": token, "token_type": "bearer", "user": {"name": user.name, "role": user.role, "email": user.email}}

@router.post("/auth/register")
async def register(name: str = Form(...), email: str = Form(...), password: str = Form(...), role: str = Form("hr_viewer"), db: Session = Depends(get_db)):
    if queries.get_admin_by_email(db, email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = queries.create_admin_user(db, name, email, hash_password(password), role)
    return {"success": True, "message": f"User {name} created successfully"}

@router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return user

# ── DASHBOARD ──
@router.get("/dashboard/stats")
async def dashboard_stats(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return queries.get_dashboard_stats(db)

@router.get("/dashboard/logs")
async def recent_logs(db: Session = Depends(get_db), user=Depends(get_current_user)):
    logs = queries.get_recent_logs(db, 30)
    return [{"id":l.id,"level":l.level,"module":l.module,"action":l.action,"timestamp":l.timestamp.isoformat() if l.timestamp else ""} for l in logs]

# ── CANDIDATES ──
@router.get("/candidates")
async def list_candidates(skip: int=0, limit: int=50, status: str=None, db: Session=Depends(get_db), user=Depends(get_current_user)):
    status_enum = models.CandidateStatus(status) if status else None
    candidates = queries.get_all_candidates(db, skip, limit, status_enum)
    return [{"id":c.id,"name":c.name,"email":c.email,"phone":c.phone,"status":c.status,"ai_score":c.ai_score,"skills":c.skills,"experience_years":c.experience_years,"created_at":c.created_at.isoformat() if c.created_at else ""} for c in candidates]

@router.post("/candidates")
async def create_candidate(data: CandidateCreate, db: Session=Depends(get_db), user=Depends(get_current_user)):
    if queries.get_candidate_by_email(db, data.email):
        raise HTTPException(400, "Candidate already exists")
    c = queries.create_candidate(db, data.model_dump())
    return {"success":True,"id":c.id,"name":c.name}

@router.get("/candidates/{candidate_id}")
async def get_candidate(candidate_id: int, db: Session=Depends(get_db), user=Depends(get_current_user)):
    c = queries.get_candidate_by_id(db, candidate_id)
    if not c: raise HTTPException(404,"Candidate not found")
    return c

@router.delete("/candidates/{candidate_id}")
async def delete_candidate(candidate_id: int, db: Session=Depends(get_db), user=Depends(require_admin)):
    c = queries.get_candidate_by_id(db, candidate_id)
    if not c: raise HTTPException(404, "Candidate not found")
    from databases.models import InterviewSession
    db.query(InterviewSession).filter(InterviewSession.candidate_id == candidate_id).delete()
    db.delete(c)
    db.commit()
    return {"success": True, "message": f"Candidate #{candidate_id} delete kar diya gaya"}

@router.post("/candidates/upload-resume")
async def upload_resume(candidate_id: int=Form(...), file: UploadFile=File(...), db: Session=Depends(get_db), user=Depends(get_current_user)):
    content = await file.read()
    upload_path = f"uploads/resumes/{candidate_id}_{file.filename}"
    os.makedirs("uploads/resumes", exist_ok=True)
    with open(upload_path,"wb") as f: f.write(content)
    resume_text = ""
    try:
        if file.filename.endswith(".pdf"):
            import pdfplumber
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                resume_text = "\n".join([p.extract_text() or "" for p in pdf.pages])
        elif file.filename.endswith(".docx"):
            from docx import Document
            doc = Document(io.BytesIO(content))
            resume_text = "\n".join([p.text for p in doc.paragraphs])
    except: pass
    from brain.nlp_engine import get_nlp
    from brain.decision_engine import get_decision_engine
    parsed = get_nlp().extract_resume_info(resume_text) if resume_text else {}
    position = queries.get_candidate_by_id(db, candidate_id)
    pos_req = {"skills":["python","javascript","react"],"experience_min":2}
    score = get_decision_engine().calculate_resume_score(parsed, pos_req)
    queries.update_candidate_score(db, candidate_id, {"ai_score":score["overall"],"skills_score":score["skills_score"],"experience_score":score["experience_score"],"skills":parsed.get("skills",[]),"experience_years":parsed.get("experience_years",0),"resume_text":resume_text,"resume_path":upload_path})
    if score["overall"] >= 65:
        queries.update_candidate_status(db, candidate_id, models.CandidateStatus.SHORTLISTED)
    return {"success":True,"score":score,"parsed":parsed,"status":"shortlisted" if score["overall"]>=65 else "reviewed"}

# ── INTERVIEWS ──
@router.get("/interviews")
async def list_interviews(db: Session=Depends(get_db), user=Depends(get_current_user)):
    sessions = queries.get_upcoming_interviews(db, days=30)
    return [{"id":s.id,"candidate_id":s.candidate_id,"status":s.status,"scheduled_at":s.scheduled_at.isoformat() if s.scheduled_at else "","round":s.round,"overall_score":s.overall_score} for s in sessions]

@router.post("/interviews/schedule")
async def schedule_interview(data: InterviewSchedule, db: Session=Depends(get_db), user=Depends(get_current_user)):
    scheduled_dt = datetime.fromisoformat(data.scheduled_at)
    session_data = {"candidate_id":data.candidate_id,"position_id":data.position_id,"scheduled_at":scheduled_dt,"round":data.round,"location":data.location,"admin_id":user.get("id")}
    session = queries.create_interview_session(db, session_data)
    queries.update_candidate_status(db, data.candidate_id, models.CandidateStatus.INTERVIEW_SCHEDULED)
    return {"success":True,"session_id":session.id,"scheduled_at":scheduled_dt.isoformat(),"message":"Interview scheduled! Candidate ko notification bheja jayega."}

@router.post("/interviews/start")
async def start_interview_ai(data: dict, db: Session=Depends(get_db), user=Depends(get_current_user)):
    candidate = queries.get_candidate_by_id(db, data.get("candidate_id",0))
    if not candidate: raise HTTPException(404,"Candidate not found")
    from hr_module.interview import get_interview_conductor
    conductor = get_interview_conductor()

    # Full position context (JD-aware questions) — from DB if linked, else title only
    position = {"title": data.get("position_title","Software Engineer")}
    db_position = candidate.position if candidate.position_id else None
    if db_position:
        position = {
            "id": db_position.id,
            "title": db_position.title,
            "description": db_position.description or "",
            "requirements": db_position.requirements or {},
        }

    # Full candidate context (resume-aware questions)
    result = conductor.start_interview({
        "name": candidate.name, "email": candidate.email, "id": candidate.id,
        "experience_years": candidate.experience_years or 0,
        "resume_text": candidate.resume_text or "",
        "skills": candidate.skills or [],
    }, position)

    # Persist: create a DB interview session row immediately (IN_PROGRESS)
    try:
        db_session = models.InterviewSession(
            candidate_id=candidate.id,
            position_id=candidate.position_id,
            admin_id=user.get("id"),
            round=models.InterviewRound.AI_SCREENING,
            status=models.InterviewStatus.IN_PROGRESS,
            scheduled_at=datetime.utcnow(),
            started_at=datetime.utcnow(),
        )
        db.add(db_session); db.commit(); db.refresh(db_session)
        ctx = conductor.get_full_session(result["session_id"])
        if ctx is not None:
            ctx["db_session_id"] = db_session.id
        result["db_session_id"] = db_session.id
    except Exception as e:
        db.rollback()
        import logging; logging.getLogger(__name__).error(f"DB session create failed: {e}")

    return result

@router.post("/interviews/respond")
async def interview_respond(data: InterviewMessage, db: Session=Depends(get_db), user=Depends(get_current_user)):
    from hr_module.interview import get_interview_conductor
    conductor = get_interview_conductor()
    result = conductor.process_answer(data.session_id, data.message)

    # Persist results when the interview concludes
    if result.get("action") == "conclude" and result.get("summary"):
        try:
            import json as _json
            ctx = conductor.get_full_session(data.session_id) or {}
            summary = result["summary"]
            db_sid = ctx.get("db_session_id")

            transcript = "\n".join(
                f"{m['role'].upper()}: {m['content']}" for m in ctx.get("messages", [])
            )
            report = summary.get("report") or {}
            ai_summary = _json.dumps({
                "avg_score": summary.get("avg_score"),
                "decision": summary.get("decision"),
                "report": report,
                "qa_breakdown": summary.get("qa_breakdown", []),
            }, ensure_ascii=False)

            if db_sid:
                db_session = db.query(models.InterviewSession).filter(models.InterviewSession.id == db_sid).first()
                if db_session:
                    db_session.status = models.InterviewStatus.COMPLETED
                    db_session.ended_at = datetime.utcnow()
                    db_session.overall_score = summary.get("avg_score") or 0.0
                    db_session.transcript = transcript
                    db_session.ai_summary = ai_summary
                    db_session.questions_asked = ctx.get("asked_questions", [])
                    db_session.answers_given = [qa.get("answer","") for qa in ctx.get("qa_log", [])]
                    if db_session.started_at:
                        db_session.duration_minutes = max(1, int((datetime.utcnow() - db_session.started_at).total_seconds() // 60))

            # Update the candidate record with the AI result
            cand_id = (ctx.get("candidate") or {}).get("id")
            if cand_id:
                candidate = queries.get_candidate_by_id(db, cand_id)
                if candidate:
                    candidate.ai_score = summary.get("avg_score") or 0.0
                    decision = summary.get("decision")
                    if decision == "SHORTLIST":
                        candidate.status = models.CandidateStatus.SHORTLISTED
                    elif decision == "HOLD":
                        candidate.status = models.CandidateStatus.ON_HOLD
                    else:
                        candidate.status = models.CandidateStatus.INTERVIEW_DONE
            db.commit()
        except Exception as e:
            db.rollback()
            import logging; logging.getLogger(__name__).error(f"Interview persistence failed: {e}")

    return result

@router.get("/interviews/{session_id}/report")
async def interview_report(session_id: str, db: Session=Depends(get_db), user=Depends(get_current_user)):
    """Full post-interview report: live session first, then DB fallback."""
    from hr_module.interview import get_interview_conductor
    ctx = get_interview_conductor().get_full_session(session_id)
    if ctx and ctx.get("report"):
        avg = round(sum(ctx["scores"])/len(ctx["scores"]),1) if ctx["scores"] else 0
        return {
            "source": "live",
            "candidate": {"id": ctx["candidate"].get("id"), "name": ctx["candidate"].get("name")},
            "position": ctx["position"].get("title",""),
            "avg_score": avg,
            "report": ctx["report"],
            "qa_breakdown": [
                {"question": qa["question"], "phase": qa["phase"], "score": qa["score"], "note": qa["note"]}
                for qa in ctx.get("qa_log", [])
            ],
            "started_at": ctx.get("started_at"), "ended_at": ctx.get("ended_at"),
        }
    # DB fallback (works after server restart) — session_id may be the numeric DB id
    if session_id.isdigit():
        import json as _json
        db_session = db.query(models.InterviewSession).filter(models.InterviewSession.id == int(session_id)).first()
        if db_session and db_session.ai_summary:
            try: parsed = _json.loads(db_session.ai_summary)
            except Exception: parsed = {"raw": db_session.ai_summary}
            return {"source": "db", "db_session_id": db_session.id,
                    "candidate_id": db_session.candidate_id,
                    "overall_score": db_session.overall_score,
                    "transcript": db_session.transcript, **parsed}
    raise HTTPException(404, "Report not found")

@router.get("/interviews/{session_id}/status")
async def interview_status(session_id: str, user=Depends(get_current_user)):
    from hr_module.interview import get_interview_conductor
    return get_interview_conductor().get_session_status(session_id)

@router.get("/interviews/today")
async def todays_interviews(db: Session=Depends(get_db), user=Depends(get_current_user)):
    sessions = queries.get_todays_interviews(db)
    return sessions

# ── POSITIONS ──
@router.get("/positions")
async def list_positions(db: Session=Depends(get_db), user=Depends(get_current_user)):
    return queries.get_all_positions(db)

@router.post("/positions")
async def create_position(data: JobPositionCreate, db: Session=Depends(get_db), user=Depends(require_admin)):
    pos = queries.create_job_position(db, data.model_dump())
    return {"success":True,"id":pos.id,"title":pos.title}


# ── AI INTERVIEW CHAT (Groq — Free, Fast, LLaMA 3) ──
def get_groq_key():
    import os
    key = os.environ.get("GROQ_API_KEY", "").strip()
    if not key:
        for fname in [".env", "../.env", "nova_hr_robot/.env"]:
            try:
                with open(fname) as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("GROQ_API_KEY") and "=" in line:
                            k = line.split("=", 1)[1].strip().strip('"').strip("'")
                            if k and "your-" not in k:
                                return k
            except: pass
    return key

@router.post("/interviews/chat")
async def interview_chat(data: dict):
    import httpx, traceback

    api_key = get_groq_key()
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY missing in .env file. Get free key from https://console.groq.com")

    system_prompt = data.get("system", "You are an AI interview robot.")
    messages = data.get("messages", [])
    if not messages:
        raise HTTPException(status_code=400, detail="messages required")

    # Clean messages: ensure strict user/assistant alternation for Groq
    def clean_messages(msgs):
        cleaned = []
        last_role = None
        for m in msgs:
            role = m.get("role", "")
            content = str(m.get("content", "")).strip()
            if not content:
                continue
            if role not in ("user", "assistant"):
                continue
            # Skip consecutive same roles
            if role == last_role:
                continue
            cleaned.append({"role": role, "content": content})
            last_role = role
            # Groq requires first message to be 'user'
        if cleaned and cleaned[0]["role"] != "user":
            cleaned = cleaned[1:]
        return cleaned

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "system", "content": system_prompt}] + clean_messages(messages),
        "max_tokens": 800,
        "temperature": 0.8
        }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload
            )
            body = r.text
            print(f"[Groq] status={r.status_code} body={body[:300]}")
            if r.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Groq {r.status_code}: {body[:300]}")
            result = r.json()
            reply = result["choices"][0]["message"]["content"]
            return {"reply": reply, "success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Groq] Exception: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Groq error: {str(e)}")

# ── PREMIUM STT (Groq Whisper — exact answer transcription) ──
@router.post("/stt")
async def premium_stt(audio: UploadFile = File(...), lang: str = Form("en")):
    """Transcribe candidate answer audio with Groq whisper-large-v3-turbo.
    Returns the EXACT spoken answer (handles Indian accents + Hinglish).
    Frontend falls back to the browser transcript on any failure."""
    import httpx

    api_key = get_groq_key()
    if not api_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY missing — using browser transcript")

    audio_bytes = await audio.read()
    if not audio_bytes or len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="audio too short")
    if len(audio_bytes) > 24 * 1024 * 1024:  # Groq free-tier file limit 25MB
        raise HTTPException(status_code=413, detail="audio too large")

    files = {"file": (audio.filename or "answer.webm", audio_bytes, audio.content_type or "audio/webm")}
    form = {
        "model": "whisper-large-v3",  # highest-accuracy Whisper — listens carefully, exact transcription
        "response_format": "json",
        "temperature": "0",
        # Bias for Indian-English/Hinglish interview answers
        "prompt": "Job interview answer by an Indian candidate. May mix English and Hindi (Hinglish).",
    }
    if lang and lang.startswith("hi"):
        form["language"] = "hi"
    else:
        # Pin to English so Whisper doesn't mis-detect Hinglish as pure Hindi
        # (keeps mixed answers in Roman script, exact word-for-word)
        form["language"] = "en"

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {api_key}"},
                data=form, files=files,
            )
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"whisper error {r.status_code}: {r.text[:120]}")
        text = (r.json().get("text") or "").strip()
        if not text:
            raise HTTPException(status_code=502, detail="empty transcript")
        return {"text": text, "engine": "whisper-large-v3-turbo"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"stt unavailable: {str(e)[:120]}")

# ── PREMIUM TTS (edge-tts — Free Microsoft Neural Voices) ──
_TTS_CACHE: dict = {}          # text-hash → mp3 bytes (session cache)
_TTS_CACHE_MAX = 60            # keep the last 60 utterances

@router.post("/tts")
async def premium_tts(data: dict):
    """Neural robot voice. lang: 'en' → en-IN-Neerja, 'hi'/'hinglish' → hi-IN-Swara."""
    import edge_tts, io, hashlib
    from fastapi.responses import Response

    text = str(data.get("text", "")).strip()
    if not text:
        raise HTTPException(status_code=400, detail="text required")
    text = text[:1200]  # sane limit per utterance

    lang = str(data.get("lang", "en")).lower()
    voice = "hi-IN-SwaraNeural" if lang.startswith("hi") else "en-IN-NeerjaNeural"

    cache_key = hashlib.sha256(f"{voice}|{text}".encode()).hexdigest()
    if cache_key in _TTS_CACHE:
        return Response(content=_TTS_CACHE[cache_key], media_type="audio/mpeg")

    try:
        communicate = edge_tts.Communicate(text, voice, rate="-6%", pitch="-2Hz")
        buf = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buf.write(chunk["data"])
        audio = buf.getvalue()
        if not audio:
            raise RuntimeError("empty audio from edge-tts")
        if len(_TTS_CACHE) >= _TTS_CACHE_MAX:
            _TTS_CACHE.pop(next(iter(_TTS_CACHE)))
        _TTS_CACHE[cache_key] = audio
        return Response(content=audio, media_type="audio/mpeg")
    except Exception as e:
        # Frontend falls back to browser speechSynthesis on any failure
        raise HTTPException(status_code=503, detail=f"tts unavailable: {str(e)[:150]}")

@router.get("/interviews/test-groq")
async def test_groq():
    import httpx
    api_key = get_groq_key()
    if not api_key:
        return {"status": "❌ GROQ_API_KEY not found in .env"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"Say: Groq working!"}],"max_tokens":20}
            )
            if r.status_code == 200:
                reply = r.json()["choices"][0]["message"]["content"]
                return {"status": "✅ Groq working!", "reply": reply}
            return {"status": f"❌ Error {r.status_code}", "detail": r.text[:300]}
    except Exception as e:
        return {"status": f"❌ {str(e)}"}





# ── ADMIN ──
@router.get("/admin/users")
async def list_admin_users(db: Session=Depends(get_db), user=Depends(require_admin)):
    return [{"id":u.id,"name":u.name,"email":u.email,"role":u.role,"is_active":u.is_active} for u in queries.get_all_admins(db)]

@router.get("/admin/health")
async def health_check():
    from databases.db import check_db_health
    db_health = check_db_health()
    return {"status":"healthy","database":db_health,"timestamp":datetime.utcnow().isoformat()}
