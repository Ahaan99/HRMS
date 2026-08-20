import os

# Load .env sitting next to this file (production secrets live there,
# never in code). Falls back silently if python-dotenv isn't installed.
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
except ImportError:
    pass


# ── MySQL connection settings ──────────────────────────────
MYSQL_HOST     = os.environ.get("MYSQL_HOST", "localhost")
MYSQL_PORT     = int(os.environ.get("MYSQL_PORT", "3306"))
MYSQL_USER     = os.environ.get("MYSQL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
MYSQL_DB       = os.environ.get("MYSQL_DB", "smart_attendance")

# MongoDB connection URL (kept only for the one-time data migration script)
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")

# Flask secret key — MUST be set in .env for production
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-insecure-key")

# Office GPS coordinates (used for face attendance geo-check)
OFFICE_LAT      = float(os.environ.get("OFFICE_LAT",    "28.626001"))
OFFICE_LNG      = float(os.environ.get("OFFICE_LNG",    "77.378001"))
OFFICE_RADIUS_M = float(os.environ.get("OFFICE_RADIUS", "32"))

# Office WiFi subnet 
OFFICE_SUBNET = os.environ.get("OFFICE_SUBNET", "192.168.29")
