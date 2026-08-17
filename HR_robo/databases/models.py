"""NOVA HR Robot — All Database Models"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Enum as SAEnum, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from databases.db import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN="super_admin"; HR_ADMIN="hr_admin"; SYSTEM_ADMIN="system_admin"; HR_VIEWER="hr_viewer"

class CandidateStatus(str, enum.Enum):
    NEW="new"; SCREENING="screening"; SHORTLISTED="shortlisted"
    INTERVIEW_SCHEDULED="interview_scheduled"; INTERVIEW_DONE="interview_done"
    SELECTED="selected"; REJECTED="rejected"; ON_HOLD="on_hold"

class InterviewStatus(str, enum.Enum):
    SCHEDULED="scheduled"; IN_PROGRESS="in_progress"; COMPLETED="completed"
    CANCELLED="cancelled"; RESCHEDULED="rescheduled"

class InterviewRound(str, enum.Enum):
    ROUND_1_HR="round_1_hr"; ROUND_2_TECHNICAL="round_2_technical"
    ROUND_3_MANAGERIAL="round_3_managerial"; ROUND_4_FINAL="round_4_final"
    AI_SCREENING="ai_screening"

class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.HR_VIEWER)
    department = Column(String(100))
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime)
    permissions = Column(JSON, default={})
    created_at = Column(DateTime, default=func.now())
    interview_sessions = relationship("InterviewSession", back_populates="admin")

class JobPosition(Base):
    __tablename__ = "job_positions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    department = Column(String(100))
    description = Column(Text)
    requirements = Column(JSON)
    experience_min = Column(Integer, default=0)
    experience_max = Column(Integer, default=20)
    salary_min = Column(Float); salary_max = Column(Float)
    location = Column(String(200)); is_remote = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True); openings = Column(Integer, default=1)
    created_at = Column(DateTime, default=func.now())
    candidates = relationship("Candidate", back_populates="position")
    interview_sessions = relationship("InterviewSession", back_populates="position")

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(20))
    position_id = Column(Integer, ForeignKey("job_positions.id"))
    resume_path = Column(String(500)); resume_text = Column(Text)
    status = Column(SAEnum(CandidateStatus), default=CandidateStatus.NEW)
    ai_score = Column(Float, default=0.0); skills_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0); education_score = Column(Float, default=0.0)
    skills = Column(JSON, default=[]); experience_years = Column(Float, default=0)
    education = Column(JSON, default=[]); certifications = Column(JSON, default=[])
    linkedin_url = Column(String(300)); portfolio_url = Column(String(300))
    notes = Column(Text); source = Column(String(100))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    position = relationship("JobPosition", back_populates="candidates")
    interview_sessions = relationship("InterviewSession", back_populates="candidate")
    body_language_reports = relationship("BodyLanguageReport", back_populates="candidate")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    position_id = Column(Integer, ForeignKey("job_positions.id"))
    admin_id = Column(Integer, ForeignKey("admin_users.id"))
    round = Column(SAEnum(InterviewRound), default=InterviewRound.AI_SCREENING)
    status = Column(SAEnum(InterviewStatus), default=InterviewStatus.SCHEDULED)
    scheduled_at = Column(DateTime, nullable=False)
    started_at = Column(DateTime); ended_at = Column(DateTime)
    duration_minutes = Column(Integer); meeting_link = Column(String(500))
    location = Column(String(200), default="Robot Interview Room 1")
    overall_score = Column(Float, default=0.0); technical_score = Column(Float, default=0.0)
    communication_score = Column(Float, default=0.0); confidence_score = Column(Float, default=0.0)
    body_language_score = Column(Float, default=0.0)
    transcript = Column(Text); ai_summary = Column(Text)
    questions_asked = Column(JSON, default=[]); answers_given = Column(JSON, default=[])
    video_path = Column(String(500)); video_processed = Column(Boolean, default=False)
    candidate_notified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    candidate = relationship("Candidate", back_populates="interview_sessions")
    position = relationship("JobPosition", back_populates="interview_sessions")
    admin = relationship("AdminUser", back_populates="interview_sessions")
    body_language_reports = relationship("BodyLanguageReport", back_populates="session")
    chat_messages = relationship("ChatMessage", back_populates="session")

class BodyLanguageReport(Base):
    __tablename__ = "body_language_reports"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    overall_score = Column(Float, default=0.0); posture_score = Column(Float, default=0.0)
    eye_contact_score = Column(Float, default=0.0); gesture_score = Column(Float, default=0.0)
    confidence_level = Column(Float, default=0.0); nervousness_level = Column(Float, default=0.0)
    dominant_emotion = Column(String(50)); positive_gestures = Column(JSON, default=[])
    negative_gestures = Column(JSON, default=[]); recommendations = Column(Text)
    full_analysis = Column(JSON, default={}); timestamp = Column(DateTime, default=func.now())
    session = relationship("InterviewSession", back_populates="body_language_reports")
    candidate = relationship("Candidate", back_populates="body_language_reports")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    role = Column(String(20)); content = Column(Text, nullable=False)
    audio_path = Column(String(500)); question_type = Column(String(100))
    timestamp = Column(DateTime, default=func.now())
    session = relationship("InterviewSession", back_populates="chat_messages")



class SystemLog(Base):
    __tablename__ = "system_logs"
    id = Column(BigInteger, primary_key=True, index=True)
    level = Column(String(20)); module = Column(String(100))
    action = Column(String(200)); details = Column(Text)
    user_id = Column(Integer); timestamp = Column(DateTime, default=func.now())
