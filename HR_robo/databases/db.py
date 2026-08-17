"""NOVA HR Robot — Database Connection"""
from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import logging
from contextlib import contextmanager
from typing import Generator
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.settings import settings

logger = logging.getLogger(__name__)

def create_db_engine():
    if settings.DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool, echo=False)
        @event.listens_for(engine, "connect")
        def set_pragma(dbapi_conn, _):
            c = dbapi_conn.cursor()
            c.execute("PRAGMA journal_mode=WAL")
            c.execute("PRAGMA foreign_keys=ON")
            c.close()
    else:
        engine = create_engine(settings.DATABASE_URL, pool_size=20,
                               max_overflow=10, pool_pre_ping=True, echo=False)
    return engine

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback(); raise
    finally:
        db.close()

@contextmanager
def get_db_context():
    db = SessionLocal()
    try:
        yield db; db.commit()
    except Exception as e:
        db.rollback(); raise
    finally:
        db.close()

def init_db():
    from databases import models
    Base.metadata.create_all(bind=engine)
    logger.info("✅ DB tables created")

def check_db_health():
    try:
        with engine.connect() as c: c.execute(text("SELECT 1"))
        return {"database": "healthy"}
    except Exception as e:
        return {"database": f"error: {e}"}
