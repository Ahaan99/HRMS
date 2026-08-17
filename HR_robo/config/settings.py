"""Ardhnarishvar HR — Configuration Settings"""
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Ardhnarishvar HR System"
    APP_VERSION: str = "5.0"
    DATABASE_URL: str = "sqlite:///./ardhnarishvar_hr.db"
    JWT_SECRET: str = "ardhnarishvar-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ANTHROPIC_API_KEY: str = ""
    ADMIN_EMAIL: str = "admin@ardhnarishvar.com"
    ADMIN_PASSWORD: str = "Admin@2024"
    ADMIN_NAME: str = "Super Admin"
    UPLOAD_DIR: str = "uploads"
    VIDEO_DIR: str = "video_storage/video"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
