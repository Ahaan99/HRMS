from flask import Flask, request, jsonify, render_template, session, redirect, url_for, Response
from flask_cors import CORS
from datetime import datetime
from database import ObjectId
import socket, os, csv, io, random, math

from config import SECRET_KEY, OFFICE_LAT, OFFICE_LNG, OFFICE_RADIUS_M
from database import (
    db, employees_col, attendance_col, users_col, settings_col,
    hash_password, verify_password, needs_rehash, seed_admin
)
from face_engine import encode_face_from_b64, recognize_face_from_b64
from wifi_attendance import is_office_ip, get_client_real_ip
from attendance_plus import bp as attendance_plus_bp, insert_attendance


app = Flask(
    __name__,
    template_folder="../frontend/templates",
    static_folder="../frontend/static"
)
app.secret_key = SECRET_KEY
app.register_blueprint(attendance_plus_bp)
CORS(app)


# In-memory OTP store: {emp_id: {"otp": "123456", "expires": timestamp, "mobile": "..."}}
otp_store = {}


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  HELPERS
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None


def haversine_distance(lat1, lng1, lat2, lng2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def get_office_settings():
    """Office location: DB settings first (admin-configurable), config fallback."""
    doc = settings_col.find_one({"_id": "office"}) or {}
    return (
        float(doc.get("lat", OFFICE_LAT)),
        float(doc.get("lng", OFFICE_LNG)),
        float(doc.get("radius", OFFICE_RADIUS_M)),
    )


def is_in_office(lat, lng):
    try:
        lat = float(lat)
        lng = float(lng)
    except (TypeError, ValueError):
        return False, 0.0
    o_lat, o_lng, o_radius = get_office_settings()
    dist = haversine_distance(lat, lng, o_lat, o_lng)
    return dist <= o_radius, round(dist, 1)


def client_ip():
    return (request.headers.get("X-Forwarded-For", request.remote_addr) or "").split(",")[0].strip()


def require_login(role=None):
    if "user_id" not in session:
        return None, (jsonify({"ok": False, "error": "Login required"}), 401)
    try:
        user = users_col.find_one({"_id": ObjectId(session["user_id"])}, {"password": 0})
    except Exception:
        return None, (jsonify({"ok": False, "error": "Session invalid"}), 401)
    if not user:
        return None, (jsonify({"ok": False, "error": "Session invalid"}), 401)
    if role and user.get("role") != role:
        return None, (jsonify({"ok": False, "error": "Access denied"}), 403)
    return user, None


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  PAGE ROUTES
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@app.route("/")
def index():
    if "user_id" in session:
        try:
            user = users_col.find_one({"_id": ObjectId(session["user_id"])}, {"password": 0})
            if user:
                if user.get("role") == "admin":
                    return redirect(url_for("admin_dashboard"))
                else:
                    return redirect(url_for("employee_dashboard"))
        except Exception:
            session.clear()
    return render_template("login.html")


@app.route("/admin")
def admin_dashboard():
    if "user_id" not in session:
        return redirect(url_for("index"))
    try:
        user = users_col.find_one({"_id": ObjectId(session["user_id"])}, {"password": 0})
    except Exception:
        session.clear()
        return redirect(url_for("index"))
    if not user or user.get("role") != "admin":
        return redirect(url_for("index"))
    return render_template("admin.html")


@app.route("/employee")
def employee_dashboard():
    if "user_id" not in session:
        return redirect(url_for("index"))
    try:
        user = users_col.find_one({"_id": ObjectId(session["user_id"])}, {"password": 0})
    except Exception:
        session.clear()
        return redirect(url_for("index"))
    if not user or user.get("role") != "employee":
        return redirect(url_for("index"))
    return render_template("employee.html")


@app.route("/employee/face")
def face_attendance():
    if "user_id" not in session:
        return redirect(url_for("index"))
    try:
        user = users_col.find_one({"_id": ObjectId(session["user_id"])}, {"password": 0})
    except Exception:
        session.clear()
        return redirect(url_for("index"))
    if not user or user.get("role") != "employee":
        return redirect(url_for("index"))
    return render_template("face_attendance.html")


@app.route("/employee/wifi")
def wifi_attendance_page():
    if "user_id" not in session:
        return redirect(url_for("index"))
    try:
        user = users_col.find_one({"_id": ObjectId(session["user_id"])}, {"password": 0})
    except Exception:
        session.clear()
        return redirect(url_for("index"))
    if not user or user.get("role") != "employee":
        return redirect(url_for("index"))
    return render_template("wifi_attendance.html")


@app.route("/employee/otp")
def otp_attendance_page():
    if "user_id" not in session:
        return redirect(url_for("index"))
    try:
        user = users_col.find_one({"_id": ObjectId(session["user_id"])}, {"password": 0})
    except Exception:
        session.clear()
        return redirect(url_for("index"))
    if not user or user.get("role") != "employee":
        return redirect(url_for("index"))
    return render_template("otp_attendance.html")


@app.route("/register-account")
def register_page():
    return render_template("register.html")


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  AUTH ROUTES
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@app.route("/api/login", methods=["POST"])
def login():
    data     = request.json or {}
    mobile   = data.get("mobile", "").strip()
    password = data.get("password", "").strip()
    role     = data.get("role", "").strip()

    if not mobile or not password or not role:
        return jsonify({"ok": False, "error": "All fields are required"})

    user = users_col.find_one({"mobile": mobile, "role": role})
    if not user or not verify_password(password, user.get("password", "")):
        return jsonify({"ok": False, "error": "Incorrect password or mobile number"})

    # transparently upgrade legacy SHA-256 hashes to bcrypt on login
    if needs_rehash(user["password"]):
        users_col.update_one({"_id": user["_id"]},
                             {"$set": {"password": hash_password(password)}})

    session["user_id"] = str(user["_id"])

    return jsonify({
        "ok":     True,
        "role":   user["role"],
        "name":   user.get("name", ""),
        "emp_id": user.get("emp_id", ""),
        "mobile": user.get("mobile", "")
    })


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/register-account", methods=["POST"])
def register_account():
    data     = request.json or {}
    role     = data.get("role", "employee")
    name     = data.get("name", "").strip()
    mobile   = data.get("mobile", "").strip()
    password = data.get("password", "").strip()
    emp_id   = data.get("emp_id", "").strip()

    if not name or not mobile or not password:
        return jsonify({"ok": False, "error": "Please fill all fields"})
    if len(mobile) != 10 or not mobile.isdigit():
        return jsonify({"ok": False, "error": "Enter a valid 10-digit mobile number"})
    if len(password) < 6:
        return jsonify({"ok": False, "error": "Password must be at least 6 characters"})
    if role == "employee" and not emp_id:
        return jsonify({"ok": False, "error": "Employee ID is required"})

    if users_col.find_one({"mobile": mobile}):
        return jsonify({"ok": False, "error": "This mobile number is already registered"})
    if role == "employee" and users_col.find_one({"emp_id": emp_id}):
        return jsonify({"ok": False, "error": f"Employee ID '{emp_id}' already exists"})

    if role == "admin":
        existing = users_col.find_one({"role": "admin"})
        if existing and existing.get("mobile") != "9999999999":
            return jsonify({"ok": False, "error": "An admin account already exists"})

    doc = {
        "name":     name,
        "mobile":   mobile,
        "password": hash_password(password),
        "role":     role,
        "created":  datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    if role == "employee":
        doc["emp_id"] = emp_id

    if role == "admin":
        users_col.replace_one({"mobile": "9999999999"}, doc, upsert=True)
    else:
        users_col.insert_one(doc)

    return jsonify({"ok": True, "message": f"Account created for {name}"})


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  NETWORK / LOCATION
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@app.route("/api/location-status", methods=["POST"])
def location_status():
    data = request.json or {}
    lat  = data.get("lat")
    lng  = data.get("lng")
    in_office, distance = is_in_office(lat, lng)
    _, _, radius = get_office_settings()
    return jsonify({
        "in_office": in_office,
        "distance":  distance,
        "radius":    radius
    })


@app.route("/api/office-location")
def office_location():
    o_lat, o_lng, o_radius = get_office_settings()
    configured = settings_col.find_one({"_id": "office"}) is not None
    return jsonify({
        "lat":        o_lat,
        "lng":        o_lng,
        "radius":     o_radius,
        "configured": configured
    })


@app.route("/api/office-location", methods=["POST"])
def set_office_location():
    """Admin sets the office GPS location and radius (fixes hardcoded coords)."""
    user, err = require_login(role="admin")
    if err:
        return err
    data = request.json or {}
    try:
        lat    = float(data.get("lat"))
        lng    = float(data.get("lng"))
        radius = float(data.get("radius", 100))
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "lat, lng, and radius must be valid numbers"})
    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        return jsonify({"ok": False, "error": "Invalid coordinates"})
    if not (5 <= radius <= 10000):
        return jsonify({"ok": False, "error": "Radius must be between 5 and 10000 meters"})
    settings_col.replace_one(
        {"_id": "office"},
        {"_id": "office", "lat": lat, "lng": lng, "radius": radius,
         "updated": datetime.now().strftime("%Y-%m-%d %H:%M")},
        upsert=True
    )
    return jsonify({"ok": True, "message": f"Office location saved ({lat:.6f}, {lng:.6f}, {int(radius)}m radius)"})


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  WIFI CHECK API
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@app.route("/api/wifi-check", methods=["GET"])
def wifi_check():
    """Check whether the employee is connected to the office WiFi."""
    ip = get_client_real_ip(request)
    on_office, reason = is_office_ip(ip)
    server_ip = get_local_ip()
    return jsonify({
        "on_office_wifi": on_office,
        "client_ip":      ip,
        "server_ip":      server_ip,
        "reason":         reason
    })


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  WIFI MARK ATTENDANCE
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@app.route("/api/wifi-attendance", methods=["POST"])
def wifi_attendance():
    """Mark attendance using the office WiFi connection."""
    user, err = require_login(role="employee")
    if err:
        return err

    ip = get_client_real_ip(request)
    on_office, reason = is_office_ip(ip)

    if not on_office:
        return jsonify({
            "ok":    False,
            "error": f"You are not connected to the office WiFi â€” {reason}"
        })

    emp_id = user.get("emp_id")
    name   = user.get("name")
    today  = datetime.now().strftime("%Y-%m-%d")
    now    = datetime.now().strftime("%H:%M:%S")

    existing = attendance_col.find_one({"emp_id": emp_id, "date": today})
    if existing:
        return jsonify({
            "ok":     True,
            "status": "already_marked",
            "time":   existing.get("time", ""),
            "message": f"Attendance already marked for today. Time: {existing.get('time','')}"
        })

    insert_attendance({
        "emp_id": emp_id,
        "name":   name,
        "date":   today,
        "time":   now,
        "status": "Present",
        "method": "WiFi",
        "ip":     ip
    })

    return jsonify({
        "ok":     True,
        "status": "marked",
        "time":   now,
        "message": f"âœ“ WiFi attendance marked! Time: {now}"
    })


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  OTP ATTENDANCE
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@app.route("/api/otp/send", methods=["POST"])
def send_otp():
    """Generate an OTP and display it in the console (for development)."""
    user, err = require_login(role="employee")
    if err:
        return err

    emp_id = user.get("emp_id")
    mobile = user.get("mobile", "")
    name   = user.get("name", "")

    otp_code = str(random.randint(100000, 999999))
    expires  = datetime.now().timestamp() + 300  # 5 minutes

    otp_store[emp_id] = {
        "otp":     otp_code,
        "expires": expires,
        "mobile":  mobile
    }

    # â”€â”€ SMS integration placeholder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # Replace this block with your SMS provider (Twilio, MSG91, Fast2SMS, etc.)
    print(f"\n{'='*40}")
    print(f"OTP for {name} ({emp_id})")
    print(f"Mobile: {mobile}")
    print(f"OTP: {otp_code}")
    print(f"Expires in 5 minutes")
    print(f"{'='*40}\n")
    # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    masked_mobile = mobile[:2] + "****" + mobile[-2:]
    return jsonify({
        "ok":      True,
        "message": f"OTP sent to {masked_mobile}",
        "otp_dev": otp_code  # DEVELOPMENT ONLY â€” remove in production
    })


@app.route("/api/otp/verify", methods=["POST"])
def verify_otp():
    """Verify the OTP and mark attendance."""
    user, err = require_login(role="employee")
    if err:
        return err

    data    = request.json or {}
    entered = data.get("otp", "").strip()
    emp_id  = user.get("emp_id")
    name    = user.get("name")

    if not entered:
        return jsonify({"ok": False, "error": "Please enter the OTP"})

    stored = otp_store.get(emp_id)
    if not stored:
        return jsonify({"ok": False, "error": "No OTP found. Please request a new one"})

    if datetime.now().timestamp() > stored["expires"]:
        del otp_store[emp_id]
        return jsonify({"ok": False, "error": "OTP has expired. Please request a new one"})

    if entered != stored["otp"]:
        return jsonify({"ok": False, "error": "Incorrect OTP"})

    # Server-side location enforcement (client-side check can be bypassed)
    in_office, distance = is_in_office(data.get("lat"), data.get("lng"))
    if not in_office:
        _, _, radius_now = get_office_settings()
        return jsonify({
            "ok": False,
            "error": f"You are outside the office boundary ({distance}m away). Maximum allowed: {int(radius_now)}m"
        })

    # OTP is valid â€” mark attendance
    del otp_store[emp_id]
    today = datetime.now().strftime("%Y-%m-%d")
    now   = datetime.now().strftime("%H:%M:%S")
    ip    = client_ip()

    existing = attendance_col.find_one({"emp_id": emp_id, "date": today})
    if existing:
        return jsonify({
            "ok":     True,
            "status": "already_marked",
            "time":   existing.get("time", ""),
            "message": f"Attendance already marked for today. Time: {existing.get('time','')}"
        })

    insert_attendance({
        "emp_id": emp_id,
        "name":   name,
        "date":   today,
        "time":   now,
        "status": "Present",
        "method": "OTP",
        "ip":     ip
    })

    return jsonify({
        "ok":     True,
        "status": "marked",
        "time":   now,
        "message": f"OTP attendance marked! Time: {now}"
    })


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  FACE REGISTER
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@app.route("/api/register-face", methods=["POST"])
def register_face():
    user, err = require_login(role="admin")
    if err:
        return err

    data   = request.json or {}
    emp_id = data.get("emp_id", "").strip()
    name   = data.get("name", "").strip()
    image  = data.get("image", "")

    if not emp_id or not name or not image:
        return jsonify({"ok": False, "error": "emp_id, name, and image are all required"})

    encoding, error = encode_face_from_b64(image)
    if error:
        return jsonify({"ok": False, "error": error})

    employees_col.update_one(
        {"emp_id": emp_id},
        {"$set": {
            "emp_id":        emp_id,
            "name":          name,
            "encoding":      encoding,
            "registered_at": datetime.now().strftime("%Y-%m-%d %H:%M")
        }},
        upsert=True
    )
    return jsonify({"ok": True, "message": f"{emp_id} | {name} registered successfully!"})


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  FACE MARK ATTENDANCE
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@app.route("/api/mark-attendance", methods=["POST"])
def mark_attendance():
    user, err = require_login()  # any logged-in user (employee self-mark or admin kiosk)
    if err:
        return err
    data  = request.json or {}
    image = data.get("image", "")
    try:
        tol = float(data.get("tolerance", 0.5))
    except (TypeError, ValueError):
        tol = 0.5
    tol = min(max(tol, 0.3), 0.7)  # clamp to a safe range

    lat = data.get("lat")
    lng = data.get("lng")
    in_office, distance = is_in_office(lat, lng)
    if not in_office:
        _, _, radius_now = get_office_settings()
        return jsonify({
            "ok":    False,
            "error": f"You are outside the office boundary ({distance}m away). Maximum allowed distance: {int(radius_now)}m"
        })

    ip = client_ip()

    if not image:
        return jsonify({"ok": False, "error": "No image received"})

    results, error = recognize_face_from_b64(image, tolerance=tol)
    if error:
        return jsonify({"ok": False, "error": error})
    if not results:
        return jsonify({"ok": False, "error": "No face detected in image"})

    today    = datetime.now().strftime("%Y-%m-%d")
    now_time = datetime.now().strftime("%H:%M:%S")
    marked   = []

    for r in results:
        if r["emp_id"] == "Unknown":
            continue
        existing = attendance_col.find_one({"emp_id": r["emp_id"], "date": today})
        if existing:
            marked.append({
                "emp_id": r["emp_id"],
                "name":   r["name"],
                "status": "already_marked",
                "time":   existing.get("time", "")
            })
            continue

        insert_attendance({
            "emp_id": r["emp_id"],
            "name":   r["name"],
            "date":   today,
            "time":   now_time,
            "status": "Present",
            "method": "Face",
            "ip":     ip
        })
        marked.append({
            "emp_id": r["emp_id"],
            "name":   r["name"],
            "status": "marked",
            "time":   now_time
        })

    unknown_count = sum(1 for r in results if r["emp_id"] == "Unknown")
    return jsonify({
        "ok":          True,
        "marked":      marked,
        "unknown":     unknown_count,
        "total_faces": len(results)
    })


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  STATS & REPORTS
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@app.route("/api/stats")
def stats():
    user, err = require_login()
    if err:
        return err
    today      = datetime.now().strftime("%Y-%m-%d")
    present    = attendance_col.count_documents({"date": today})
    registered = employees_col.count_documents({})
    absent     = max(0, registered - present)
    return jsonify({
        "present":    present,
        "absent":     absent,
        "registered": registered,
        "date":       today
    })


@app.route("/api/today-log")
def today_log():
    user, err = require_login(role="admin")
    if err:
        return err
    today = datetime.now().strftime("%Y-%m-%d")
    rows  = list(attendance_col.find({"date": today}, {"_id": 0}).sort("time", 1))
    return jsonify({"ok": True, "rows": rows})


@app.route("/api/report")
def report():
    user, err = require_login(role="admin")
    if err:
        return err
    date = request.args.get("date", datetime.now().strftime("%Y-%m-%d"))
    rows_raw = list(attendance_col.find({"date": date}).sort("time", 1))

    # Convert ObjectId to string for JSON serialization
    rows = []
    for r in rows_raw:
        r["_id"] = str(r["_id"])
        rows.append(r)

    return jsonify({"ok": True, "rows": rows, "date": date})


@app.route("/api/download-csv")
def download_csv():
    user, err = require_login(role="admin")
    if err:
        return err
    period = request.args.get("period", "today")
    today  = datetime.now()
    query  = {}

    if period == "today":
        query["date"] = today.strftime("%Y-%m-%d")
        fname = f"attendance_today_{today.strftime('%Y-%m-%d')}.csv"
    elif period == "month":
        month_str = today.strftime("%Y-%m")
        query["date"] = {"$regex": f"^{month_str}"}
        fname = f"attendance_month_{month_str}.csv"
    elif period == "year":
        year_str = today.strftime("%Y")
        query["date"] = {"$regex": f"^{year_str}"}
        fname = f"attendance_year_{year_str}.csv"
    elif period == "custom":
        custom_date = request.args.get("date", today.strftime("%Y-%m-%d"))
        query["date"] = custom_date
        fname = f"attendance_{custom_date}.csv"
    else:
        fname = "attendance_all_time.csv"

    rows = list(attendance_col.find(query, {"_id": 0}).sort([("date", 1), ("time", 1)]))
    if not rows:
        return jsonify({"ok": False, "error": "No records found for the selected period"}), 404

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["emp_id", "name", "date", "time", "status", "method", "ip"])
    writer.writeheader()
    writer.writerows(rows)

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={fname}"}
    )


@app.route("/api/registered-employees")
def registered_employees():
    user, err = require_login(role="admin")
    if err:
        return err
    docs = list(employees_col.find({}, {"_id": 0, "encoding": 0}))
    return jsonify({"ok": True, "employees": docs})


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  EMPLOYEE MANAGEMENT (Admin)
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@app.route("/api/delete-employee", methods=["POST"])
def delete_employee():
    user, err = require_login(role="admin")
    if err:
        return err
    query = request.json.get("query", "").strip()
    res   = employees_col.delete_one({"$or": [{"emp_id": query}, {"name": query}]})
    if res.deleted_count == 0:
        return jsonify({"ok": False, "error": "Employee not found"})
    return jsonify({"ok": True, "message": "Employee deleted successfully"})


@app.route("/api/accounts/list")
def accounts_list():
    user, err = require_login(role="admin")
    if err:
        return err
    docs = list(users_col.find({"role": "employee"}, {"_id": 0, "password": 0}))
    return jsonify({"ok": True, "accounts": docs})


@app.route("/api/accounts/create", methods=["POST"])
def create_account():
    user, err = require_login(role="admin")
    if err:
        return err
    data     = request.json or {}
    name     = data.get("name", "").strip()
    emp_id   = data.get("emp_id", "").strip()
    mobile   = data.get("mobile", "").strip()
    password = data.get("password", "").strip()

    if not all([name, emp_id, mobile, password]):
        return jsonify({"ok": False, "error": "All fields are required"})
    if len(mobile) != 10 or not mobile.isdigit():
        return jsonify({"ok": False, "error": "Enter a valid 10-digit mobile number"})

    if users_col.find_one({"mobile": mobile}):
        return jsonify({"ok": False, "error": "This mobile number is already registered"})
    if users_col.find_one({"emp_id": emp_id}):
        return jsonify({"ok": False, "error": f"Employee ID '{emp_id}' is already in use"})

    users_col.insert_one({
        "name":     name,
        "emp_id":   emp_id,
        "mobile":   mobile,
        "password": hash_password(password),
        "role":     "employee",
        "created":  datetime.now().strftime("%Y-%m-%d %H:%M")
    })
    return jsonify({"ok": True, "message": f"Account created for {name} ({emp_id})"})


@app.route("/api/accounts/delete", methods=["POST"])
def delete_account():
    user, err = require_login(role="admin")
    if err:
        return err
    query = request.json.get("query", "").strip()
    res   = users_col.delete_one({"role": "employee",
                                   "$or": [{"mobile": query}, {"emp_id": query}]})
    if res.deleted_count == 0:
        return jsonify({"ok": False, "error": "Account not found"})
    return jsonify({"ok": True})


@app.route("/api/accounts/update-admin", methods=["POST"])
def update_admin():
    user, err = require_login(role="admin")
    if err:
        return err
    data     = request.json or {}
    new_mob  = data.get("mobile", "").strip()
    new_pass = data.get("password", "").strip()
    update   = {}

    if new_mob:
        if len(new_mob) != 10 or not new_mob.isdigit():
            return jsonify({"ok": False, "error": "Enter a valid 10-digit mobile number"})
        update["mobile"] = new_mob
    if new_pass:
        if len(new_pass) < 6:
            return jsonify({"ok": False, "error": "Password must be at least 6 characters"})
        update["password"] = hash_password(new_pass)
    if not update:
        return jsonify({"ok": False, "error": "No changes provided"})

    users_col.update_one({"role": "admin"}, {"$set": update})
    return jsonify({"ok": True, "message": "Admin details updated successfully!"})


@app.route("/api/my-status")
def my_status():
    user, err = require_login(role="employee")
    if err:
        return err
    today  = datetime.now().strftime("%Y-%m-%d")
    record = attendance_col.find_one(
        {"emp_id": user.get("emp_id"), "date": today},
        {"_id": 0}
    )
    return jsonify({
        "ok":     True,
        "marked": bool(record),
        "record": record,
        "name":   user.get("name"),
        "emp_id": user.get("emp_id")
    })


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  ATTENDANCE DELETE ROUTES
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

@app.route("/api/attendance/delete/<emp_id>", methods=["DELETE"])
def delete_attendance_record(emp_id):
    """Delete a single attendance record for one employee on a specific date."""
    user, err = require_login(role="admin")
    if err:
        return err
    date = request.args.get("date")
    if not date:
        return jsonify({"ok": False, "error": "Date parameter is required"})
    res = attendance_col.delete_one({"emp_id": emp_id, "date": date})
    if res.deleted_count == 0:
        return jsonify({"ok": False, "error": "Record not found"})
    return jsonify({"ok": True, "deleted": res.deleted_count})


@app.route("/api/attendance/delete-by-date/<date>", methods=["DELETE"])
def delete_attendance_by_date(date):
    """Delete all attendance records for a specific date."""
    user, err = require_login(role="admin")
    if err:
        return err
    res = attendance_col.delete_many({"date": date})
    return jsonify({"ok": True, "deleted": res.deleted_count})


@app.route("/api/attendance/bulk-delete", methods=["DELETE"])
def bulk_delete_attendance():
    """Delete multiple selected records by MongoDB _id."""
    user, err = require_login(role="admin")
    if err:
        return err
    data = request.json or {}
    ids  = data.get("record_ids", [])
    if not ids:
        return jsonify({"ok": False, "error": "record_ids list is required"})
    try:
        obj_ids = [ObjectId(i) for i in ids if i]
    except Exception:
        return jsonify({"ok": False, "error": "Invalid ID format"})
    res = attendance_col.delete_many({"_id": {"$in": obj_ids}})
    return jsonify({"ok": True, "deleted": res.deleted_count})


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  RUN
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

if __name__ == "__main__":
    seed_admin()
    # use_reloader=False: the auto-reloader watches site-packages and can
    # wedge the server mid-restart (requests hang). threaded=True so face
    # captures don't block logins and dashboard calls.
    app.run(host="0.0.0.0", port=5050, debug=True, use_reloader=False, threaded=True)
