"""Ardhnarishvar HR System — FastAPI Backend"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi import Request
import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from databases.db import init_db
from backend.routes import router
from backend.integration import integration_router
from backend.auth import create_initial_admin
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Ardhnarishvar HR System", version="5.0")

# CORS: allow the main HRMS React dashboards (HR, admin/superadmin) to read the
# integration API from their own dev/prod ports.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
os.makedirs("static/css", exist_ok=True)
os.makedirs("static/js", exist_ok=True)
os.makedirs("uploads/resumes", exist_ok=True)
os.makedirs("video_storage/video", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

@app.on_event("startup")
async def startup():
    init_db()
    create_initial_admin()

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse(request, "index.html")

app.include_router(router, prefix="/api/v1")
app.include_router(integration_router, prefix="/api/integration")

@app.get("/health")
async def health():
    return {"status": "ok", "system": "Ardhnarishvar HR "}
