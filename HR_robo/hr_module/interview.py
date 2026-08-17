"""NOVA HR Robot — Interview Conductor (LLM scoring + resume/JD-aware questions + report)"""
import uuid, logging, random, os, json, re
from datetime import datetime
from typing import Dict, List, Optional
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
logger = logging.getLogger(__name__)

# ── Fallback question pool (used when Groq unavailable) ──
QUESTIONS = {
    "introduction": ["Namaste! Apna naam aur background batayein.", "Tell me about yourself.", "Aap is role mein kyon interested hain?"],
    "background": ["Aapka work experience describe karein.", "Aapki biggest achievement kya rahi?", "Aap job change kyon karna chahte hain?", "Current role mein kya karte hain?"],
    "technical": ["Technically strongest kis area mein hain?", "Ek complex technical problem batayein jo solve ki.", "New technologies kaise seekhte hain?", "Code mein bug aane par approach kya hai?"],
    "behavioral": ["Strict deadline kab meet karni padi?", "Team conflict kaise handle karte hain?", "Ek failure aur usse kya seekha?", "Pressure mein kaise perform karte hain?"],
    "situational": ["Manager galat decision le to kya karenge?", "Unclear requirements mein kya approach hoga?", "Naye team member ko onboard kaise karenge?"],
    "candidate_questions": ["Kya aapke koi sawaal hain?", "Company ya role ke baare mein kuch jaanna chahenge?"],
    "closing": ["Koi final thought share karna chahenge?", "Shukriya! Interview complete hua."]
}

FRESHER_CLOSING_QUESTIONS = [
    "Where do you currently live?",
    "How many members are there in your family?",
    "What is your expected salary?",
    "Are you comfortable working in any shift?",
    "Are you open to relocation if required?",
]

EXPERIENCED_CLOSING_QUESTIONS = [
    "Where are you currently working?",
    "What is your current salary?",
    "What is your expected salary?",
    "Where do you currently live?",
    "How many members are there in your family?",
    "What is your current notice period?",
    "Are you open to relocation if required?",
]

PHASE_ORDER = ["introduction","background","technical","behavioral","situational","closing_questions","closing"]

SCORED_PHASES = {"introduction", "background", "technical", "behavioral", "situational"}

# ── Clarification detection: candidate asks to repeat / didn't understand ──
CLARIFY_PATTERNS = re.compile(
    r"(didn'?t\s+(understand|get|catch|hear)|did\s+not\s+(understand|get|catch|hear)|"
    r"not\s+(understand|clear)|couldn'?t\s+(understand|hear|catch)|"
    r"can\s+you\s+(repeat|rephrase|explain|say\s+(that|it)\s+again)|"
    r"could\s+you\s+(repeat|rephrase|explain)|please\s+(repeat|rephrase|explain)|"
    r"repeat\s+(the\s+)?question|say\s+(that|it)\s+again|once\s+again|one\s+more\s+time|"
    r"pardon|come\s+again|what\s+do\s+you\s+mean|question\s+(samajh|clear)\s+nahi|"
    r"samajh\s+(nahi|nahin|na)\s+(aaya|aayi|aya)|samjha\s+nahi|dobara\s+(bata|bol|pooch)|"
    r"phir\s+se\s+(bata|bol|pooch|repeat)|fir\s+se\s+(bata|bol|pooch)|"
    r"sawal\s+(repeat|dobara)|kya\s+bola|kya\s+kaha|sorry\s*\??\s*$)",
    re.IGNORECASE,
)


def _is_clarification_request(answer: str) -> bool:
    """True when the candidate is asking to repeat/rephrase, not answering."""
    text = (answer or "").strip()
    if not text:
        return False
    # Long answers that merely CONTAIN a phrase like "what do you mean" are real answers
    if len(text.split()) > 25:
        return False
    return bool(CLARIFY_PATTERNS.search(text))


# ══════════════════════════════════════════════════════════
# Groq helpers (sync — conductor is sync)
# ══════════════════════════════════════════════════════════
def _groq_key() -> str:
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
            except Exception:
                pass
    return key


def _groq_chat(system: str, user: str, model: str = "llama-3.1-8b-instant",
               max_tokens: int = 400, temperature: float = 0.4) -> Optional[str]:
    """Single-shot sync Groq call. Returns content or None on any failure."""
    api_key = _groq_key()
    if not api_key:
        return None
    try:
        import httpx
        r = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [{"role": "system", "content": system},
                             {"role": "user", "content": user}],
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
            timeout=25,
        )
        if r.status_code != 200:
            logger.warning(f"Groq {r.status_code}: {r.text[:200]}")
            return None
        return r.json()["choices"][0]["message"]["content"]
    except Exception as e:
        logger.warning(f"Groq call failed: {e}")
        return None


def _extract_json(text: str):
    """Pull the first JSON object/array out of an LLM reply."""
    if not text:
        return None
    for pattern in (r"\{[\s\S]*\}", r"\[[\s\S]*\]"):
        m = re.search(pattern, text)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                continue
    return None


class InterviewConductor:
    def __init__(self):
        self._sessions: Dict[str, Dict] = {}

    # ══════════════════════════════════════════════════════
    # START — with resume/JD-aware question generation
    # ══════════════════════════════════════════════════════
    def start_interview(self, candidate: Dict, position: Dict) -> Dict:
        sid = str(uuid.uuid4())[:8]
        experience_years = candidate.get("experience_years", 0) or 0
        is_fresher = int(experience_years) == 0
        closing_qs = FRESHER_CLOSING_QUESTIONS if is_fresher else EXPERIENCED_CLOSING_QUESTIONS

        # Personalized question plan from resume + JD (fallback: hardcoded pool)
        question_plan = self._generate_question_plan(candidate, position)

        self._sessions[sid] = {
            "session_id": sid, "candidate": candidate, "position": position,
            "phase": "introduction", "turns": 0, "phase_turns": 0,
            "messages": [], "scores": [], "asked_questions": [],
            "qa_log": [],  # [{question, answer, phase, score, note}]
            "question_plan": question_plan,
            "started_at": datetime.utcnow().isoformat(), "active": True,
            "is_fresher": is_fresher,
            "closing_questions": closing_qs.copy(),
            "closing_q_index": 0,
            "report": None,
        }
        greeting = f"Namaste {candidate.get('name','Candidate')} ji! Main NOVA hoon — aapka AI HR Interviewer. Aaj hum {position.get('title','')} role ke liye interview karenge. Kya aap ready hain?"
        self._sessions[sid]["messages"].append({"role":"robot","content":greeting})
        logger.info(f"Interview started: {sid} | Type: {'Fresher' if is_fresher else 'Experienced'} | Personalized: {bool(question_plan)}")
        return {"session_id":sid,"greeting":greeting,"phase":"introduction","status":"started",
                "personalized": bool(question_plan)}

    def _generate_question_plan(self, candidate: Dict, position: Dict) -> Optional[Dict]:
        """Generate resume/JD-aware questions per phase via Groq. None on failure."""
        resume = (candidate.get("resume_text") or "")[:3000]
        skills = candidate.get("skills") or []
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]
        req = position.get("requirements") or {}
        if not resume and not skills:
            return None  # nothing to personalize from

        system = (
            "You are an expert technical HR interviewer. Generate interview questions "
            "personalized to the candidate's resume and the job description. "
            "Questions must be short (max 20 words), spoken-style, and in simple English. "
            "Reply ONLY with a JSON object with keys: background, technical, behavioral, situational. "
            "Each key maps to an array of question strings. "
            "background: 4 questions about their specific work history/projects from the resume. "
            "technical: 5 questions probing their listed skills against the job requirements. "
            "behavioral: 4 questions relevant to the role's challenges. "
            "situational: 3 role-specific hypothetical scenarios."
        )
        user = json.dumps({
            "candidate_name": candidate.get("name", ""),
            "experience_years": candidate.get("experience_years", 0),
            "skills": skills[:15],
            "resume_excerpt": resume,
            "position_title": position.get("title", ""),
            "position_description": (position.get("description") or "")[:800],
            "position_requirements": req,
        }, ensure_ascii=False)

        raw = _groq_chat(system, user, model="llama-3.3-70b-versatile", max_tokens=900, temperature=0.6)
        plan = _extract_json(raw)
        if not isinstance(plan, dict):
            return None
        # Validate shape
        clean = {}
        for phase in ("background", "technical", "behavioral", "situational"):
            qs = plan.get(phase)
            if isinstance(qs, list):
                qs = [str(q).strip() for q in qs if str(q).strip()]
                if qs:
                    clean[phase] = qs
        return clean or None

    # ══════════════════════════════════════════════════════
    # ANSWER PROCESSING
    # ══════════════════════════════════════════════════════
    def process_answer(self, session_id: str, answer: str) -> Dict:
        ctx = self._sessions.get(session_id)
        if not ctx: return {"error":"Session not found"}

        # The question this answer replies to
        last_q = ctx["asked_questions"][-1] if ctx["asked_questions"] else "Introduction"
        current_phase = ctx["phase"]

        # ── CLARIFICATION: candidate didn't understand → repeat/rephrase, no scoring ──
        if _is_clarification_request(answer) and last_q != "Introduction":
            ctx["messages"].append({"role":"candidate","content":answer})
            repeats = ctx.setdefault("clarify_counts", {}).get(last_q, 0)
            ctx["clarify_counts"][last_q] = repeats + 1
            if repeats == 0:
                reply = f"Koi baat nahi! Main question dobara puchti hoon: {last_q}"
            else:
                # Second time — try a simpler rephrasing via LLM, fallback to slow repeat
                rephrased = _groq_chat(
                    "Rephrase this interview question in very simple English (max 20 words), "
                    "as if explaining to someone who did not understand it. Reply with ONLY the question.",
                    last_q, model="llama-3.1-8b-instant", max_tokens=60, temperature=0.3,
                )
                simple_q = (rephrased or "").strip().strip('"')
                reply = (f"Theek hai, main aur simple words mein puchti hoon: {simple_q}"
                         if simple_q else f"Main dheere se repeat karti hoon: {last_q}")
            ctx["messages"].append({"role":"robot","content":reply})
            # NOT counted as a turn, NOT scored, phase unchanged
            return {"response": reply, "phase": current_phase, "action": "repeat_question",
                    "score": None, "session_id": session_id}

        ctx["turns"] += 1; ctx["phase_turns"] += 1
        ctx["messages"].append({"role":"candidate","content":answer})

        # Score answer — LLM first, heuristic fallback (closing phases not scored)
        if current_phase in SCORED_PHASES:
            score, note = self._score_answer_llm(last_q, answer, ctx)
            ctx["scores"].append(score)
            ctx["qa_log"].append({"question": last_q, "answer": answer,
                                  "phase": current_phase, "score": score, "note": note})
        else:
            score = None
            ctx["qa_log"].append({"question": last_q, "answer": answer,
                                  "phase": current_phase, "score": None, "note": ""})

        # STEP 1: closing_questions phase → next hardcoded question
        if ctx["phase"] == "closing_questions":
            idx = ctx["closing_q_index"]
            total = len(ctx["closing_questions"])
            if idx < total:
                next_q = ctx["closing_questions"][idx]
                ctx["closing_q_index"] += 1
                ctx["messages"].append({"role":"robot","content":next_q})
                ctx["asked_questions"].append(next_q)
                return {"response":next_q,"phase":"closing_questions","action":"ask_question","score":score,"session_id":session_id}
            else:
                return self._conclude(session_id, ctx)

        # STEP 2: phase limit check
        phase_limits = {"introduction":2,"background":4,"technical":5,"behavioral":4,"situational":3,"closing":1}
        if ctx["phase_turns"] >= phase_limits.get(ctx["phase"], 3):
            idx = PHASE_ORDER.index(ctx["phase"]) if ctx["phase"] in PHASE_ORDER else 0
            if idx < len(PHASE_ORDER) - 1:
                ctx["phase"] = PHASE_ORDER[idx + 1]
                ctx["phase_turns"] = 0

                if ctx["phase"] == "closing_questions":
                    first_q = ctx["closing_questions"][0]
                    ctx["closing_q_index"] = 1
                    ctx["messages"].append({"role":"robot","content":first_q})
                    ctx["asked_questions"].append(first_q)
                    return {"response":first_q,"phase":"closing_questions","action":"ask_question","score":score,"session_id":session_id}

                if ctx["phase"] == "closing":
                    return self._conclude(session_id, ctx)

        # STEP 3: closing phase → conclude
        if ctx["phase"] == "closing":
            return self._conclude(session_id, ctx)

        # STEP 4: next question — personalized plan first, then pool
        next_q = self._get_question(ctx)
        ctx["messages"].append({"role":"robot","content":next_q})
        ctx["asked_questions"].append(next_q)
        return {"response":next_q,"phase":ctx["phase"],"action":"ask_question","score":score,"session_id":session_id}

    # ══════════════════════════════════════════════════════
    # SCORING — LLM rubric with heuristic fallback
    # ══════════════════════════════════════════════════════
    def _score_answer_llm(self, question: str, answer: str, ctx: Dict) -> tuple:
        """Returns (score 0-100, one-line note). Falls back to heuristic."""
        system = (
            "You are a strict interview answer evaluator. Score the candidate's answer "
            "to the question on a 0-100 scale. Rubric: relevance to the question (40%), "
            "specificity/examples (30%), clarity & structure (20%), depth (10%). "
            "Hinglish (Hindi-English mix) answers are perfectly fine — judge content, not language. "
            "Very short, vague or off-topic answers score below 40. "
            'Reply ONLY with JSON: {"score": <number>, "note": "<max 12 words on the answer quality>"}'
        )
        user = json.dumps({
            "position": ctx["position"].get("title", ""),
            "question": question,
            "answer": answer[:1500],
        }, ensure_ascii=False)

        raw = _groq_chat(system, user, model="llama-3.1-8b-instant", max_tokens=100, temperature=0.1)
        parsed = _extract_json(raw)
        if isinstance(parsed, dict) and isinstance(parsed.get("score"), (int, float)):
            score = max(0.0, min(100.0, float(parsed["score"])))
            return round(score, 1), str(parsed.get("note", ""))[:120]

        # Heuristic fallback (offline mode)
        return self._score_answer_heuristic(answer), "heuristic (LLM unavailable)"

    def _score_answer_heuristic(self, answer: str) -> float:
        words = len(answer.split())
        has_ex = any(w in answer.lower() for w in ["example","jaise","instance","project","kaam","worked"])
        has_num = any(c.isdigit() for c in answer)
        score = min(100, words*0.8 + (20 if has_ex else 0) + (10 if has_num else 0))
        return round(score, 1)

    def _get_question(self, ctx: Dict) -> str:
        phase = ctx["phase"]
        asked = ctx["asked_questions"]

        # 1) personalized plan questions first
        plan = ctx.get("question_plan") or {}
        planned = [q for q in plan.get(phase, []) if q not in asked]
        if planned:
            return planned[0]

        # 2) fallback pool
        questions = QUESTIONS.get(phase, QUESTIONS["background"])
        unused = [q for q in questions if q not in asked]
        return random.choice(unused) if unused else random.choice(questions)

    # ══════════════════════════════════════════════════════
    # CONCLUDE — LLM report + full summary for persistence
    # ══════════════════════════════════════════════════════
    def _conclude(self, sid: str, ctx: Dict) -> Dict:
        name = ctx["candidate"].get("name","")
        closing = f"Bahut dhanyavaad {name} ji! Aapka interview complete hua. Hum jald hi aapko result ke baare mein inform karenge. Bahut accha performance tha! 🙏"
        ctx["active"] = False
        ctx["ended_at"] = datetime.utcnow().isoformat()
        avg = round(sum(ctx["scores"])/len(ctx["scores"]),1) if ctx["scores"] else 70
        decision = "SHORTLIST" if avg >= 75 else ("HOLD" if avg >= 55 else "REJECT")

        report = self._generate_report(ctx, avg, decision)
        ctx["report"] = report

        summary = {
            "avg_score": avg,
            "total_turns": ctx["turns"],
            "decision": decision,
            "report": report,
            "qa_breakdown": [
                {"question": qa["question"], "phase": qa["phase"],
                 "score": qa["score"], "note": qa["note"]}
                for qa in ctx["qa_log"]
            ],
        }
        return {"response":closing,"action":"conclude","session_id":sid,"status":"completed",
                "summary":summary}

    def _generate_report(self, ctx: Dict, avg: float, decision: str) -> Dict:
        """LLM-written strengths/weaknesses/recommendation. Fallback: basic report."""
        qa_text = "\n".join(
            f"Q ({qa['phase']}): {qa['question']}\nA: {qa['answer'][:400]}\nScore: {qa['score']}"
            for qa in ctx["qa_log"] if qa["score"] is not None
        )[:6000]

        system = (
            "You are a senior HR analyst writing a post-interview evaluation report. "
            "Based on the Q&A transcript with per-answer scores, reply ONLY with JSON: "
            '{"strengths": ["3-4 short bullets"], "weaknesses": ["2-3 short bullets"], '
            '"communication": "one line on communication quality", '
            '"technical_depth": "one line on technical depth", '
            '"recommendation": "2-3 sentence hiring recommendation"}'
        )
        user = (
            f"Candidate: {ctx['candidate'].get('name','')} | "
            f"Position: {ctx['position'].get('title','')} | "
            f"Average score: {avg} | System decision: {decision}\n\n{qa_text}"
        )

        raw = _groq_chat(system, user, model="llama-3.3-70b-versatile", max_tokens=500, temperature=0.3)
        parsed = _extract_json(raw)
        if isinstance(parsed, dict) and parsed.get("recommendation"):
            parsed["generated_by"] = "llm"
            return parsed

        # Fallback report
        scored = [qa for qa in ctx["qa_log"] if qa["score"] is not None]
        best = max(scored, key=lambda x: x["score"], default=None)
        worst = min(scored, key=lambda x: x["score"], default=None)
        return {
            "strengths": [f"Best answer ({best['phase']}): scored {best['score']}"] if best else [],
            "weaknesses": [f"Weakest answer ({worst['phase']}): scored {worst['score']}"] if worst else [],
            "communication": "Not analyzed (LLM unavailable).",
            "technical_depth": "Not analyzed (LLM unavailable).",
            "recommendation": f"System decision: {decision} with average score {avg}.",
            "generated_by": "fallback",
        }

    # ══════════════════════════════════════════════════════
    # ACCESSORS
    # ══════════════════════════════════════════════════════
    def get_session_status(self, sid: str) -> Dict:
        ctx = self._sessions.get(sid)
        if not ctx: return {"error":"Session not found"}
        avg = round(sum(ctx["scores"])/len(ctx["scores"]),1) if ctx["scores"] else 0
        return {"session_id":sid,"phase":ctx["phase"],"turns":ctx["turns"],"avg_score":avg,"active":ctx["active"]}

    def get_full_session(self, sid: str) -> Optional[Dict]:
        """Full in-memory context — used by routes for DB persistence."""
        return self._sessions.get(sid)

interview_conductor = InterviewConductor()
def get_interview_conductor(): return interview_conductor
