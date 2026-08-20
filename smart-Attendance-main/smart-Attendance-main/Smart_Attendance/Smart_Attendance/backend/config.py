import os


# ── MySQL connection settings ──────────────────────────────
MYSQL_HOST     = os.environ.get("MYSQL_HOST", "localhost")
MYSQL_PORT     = int(os.environ.get("MYSQL_PORT", "3306"))
MYSQL_USER     = os.environ.get("MYSQL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "Phabindra@2680")
MYSQL_DB       = os.environ.get("MYSQL_DB", "smart_attendance")

# MongoDB connection URL (kept only for the one-time data migration script)
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")

# Flask secret key
SECRET_KEY = os.environ.get("SECRET_KEY", "smartattendance_secret_2024")

# Office GPS coordinates (used for face attendance geo-check)
OFFICE_LAT      = float(os.environ.get("OFFICE_LAT",    "28.626001"))
OFFICE_LNG      = float(os.environ.get("OFFICE_LNG",    "77.378001"))
OFFICE_RADIUS_M = float(os.environ.get("OFFICE_RADIUS", "32"))

# Office WiFi subnet 
OFFICE_SUBNET = os.environ.get("OFFICE_SUBNET", "192.168.29")
