"""Ardhnarishvar HR System — Entry Point"""
import uvicorn
import os

if __name__ == "__main__":
    os.makedirs("uploads/resumes", exist_ok=True)
    os.makedirs("video_storage/video", exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    print("🕉️  Ardhnarishvar HR System v5.0 starting...")
    print("📍  http://localhost:8001")
    print("🔐  Admin: admin@ardhnarishvar.com / Admin@2024")
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8001, reload=True)
