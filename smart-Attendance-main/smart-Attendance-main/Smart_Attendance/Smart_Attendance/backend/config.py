import os



# MongoDB connection URL
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")

# Flask secret key
SECRET_KEY = os.environ.get("SECRET_KEY", "smartattendance_secret_2024")

# Office GPS coordinates (used for face attendance geo-check)
OFFICE_LAT      = float(os.environ.get("OFFICE_LAT",    "28.626001"))
OFFICE_LNG      = float(os.environ.get("OFFICE_LNG",    "77.378001"))
OFFICE_RADIUS_M = float(os.environ.get("OFFICE_RADIUS", "32"))

# Office WiFi subnet 
OFFICE_SUBNET = os.environ.get("OFFICE_SUBNET", "192.168.29")
