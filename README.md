# HRMS â€” Complete Human Resource Management System

A merged, multi-portal HRMS platform. One Node.js backend powers six React portals, plus three independent Python services for Employee Verification, Smart Attendance, and an AI Robo Interview.

---

## Portals & Services

| # | Portal / Service | Folder | Tech | Default Port |
|---|------------------|--------|------|--------------|
| 1 | Backend API (all portals) | `backen/` | Node.js + Express + MySQL + Socket.IO | `5000` |
| 2 | Super Admin / Admin | `admin/` | React + Vite | `5173` |
| 3 | HR Portal | `HR/` | React + Vite | `5174` |
| 4 | Client Portal | `client/` | React + Vite | `5175` |
| 5 | Employee Portal | `employee/` | React + Vite | `5176` |
| 6 | IT Portal | `IT/` | React + Vite | `5177` (pinned) |
| 7 | Sales Portal | `Sales/` | React + Vite | `5178` |
| 8 | Employee Verification â€” Backend | `employee-verification-system/employee-verification-backend/` | Python + FastAPI | `8000` |
| 9 | Employee Verification â€” Frontend | `employee-verification-system/frontend/frontend/` | React + Vite | `5179` |
| 10 | AI Robo Interview | `HR_robo/` | Python + FastAPI + Groq | `8001` |
| 11 | Smart Attendance | `smart-Attendance-main/smart-Attendance-main/Smart_Attendance/Smart_Attendance/` | Python + Flask + MongoDB | `5050` |

> Vite assigns ports in launch order (5173, 5174, â€¦). Use the explicit `--port` flags below so every portal always gets the same port.

---

## 1. Prerequisites

Install these BEFORE anything else:

| Requirement | Version | Needed for |
|-------------|---------|-----------|
| [Node.js](https://nodejs.org) | 18+ (LTS recommended) | Backend + all React portals |
| [Python](https://python.org) | 3.10+ | Verification, Robo Interview, Smart Attendance |
| [MySQL](https://dev.mysql.com/downloads/) | 8+ | Main backend + verification backend |
| [MongoDB](https://www.mongodb.com/try/download/community) | 6+ | Smart Attendance only |
| [Git](https://git-scm.com) | any | Cloning the repo |

Optional:
- **Ollama** (`OLLAMA_URL`) â€” only if you use the local-AI features of the main backend.
- **Twilio account** â€” only for SMS/OTP features.
- **Groq API key** â€” required for the AI Robo Interview.

Verify installs:

```bash
node -v      # v18+
python --version   # 3.10+
mysql --version
git --version
```

---

## 2. Clone / Download

```bash
git clone https://github.com/Ahaan99/HRMS.git
cd HRMS
```

Or download the ZIP from GitHub â†’ **Code â†’ Download ZIP** â†’ extract it â†’ open a terminal inside the extracted folder. Nothing else in the code needs to change â€” you only create the `.env` files below.

---

## 3. Environment Variables (.env setup)

`.env` files are NOT included in the repo (they hold secrets). Create each one exactly as shown.

### 3.1 `backen/.env` (main backend)

```env
PORT=5000

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hrms

# Super Admin seed account (created automatically on first run)
SUPER_ADMIN_EMAIL=admin@hrms.com
SUPER_ADMIN_PASSWORD=StrongPassword123

# JWT
JWT_SECRET=generate_a_long_random_string_here
JWT_EXPIRES_IN=1d

# Sales department id (set after departments exist, can leave 1 initially)
SALES_DEPT_ID=1

# Optional â€” local AI via Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Optional â€” Twilio (SMS / phone OTP)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_API_SECRET=
TWILIO_FROM_NUMBER=

# Shared key used by the Smart Attendance service
SMART_ATTENDANCE_KEY=any_random_shared_secret
```

### 3.2 Frontend portals â€” one file each

Create the SAME two-line file in `admin/.env`, `HR/.env`, `employee/.env`, `IT/.env`, `Sales/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

`client/.env` needs one extra line (real-time socket):

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_SOCKET_URL=http://localhost:5000
```

### 3.3 `employee-verification-system/employee-verification-backend/.env`

```env
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_NAME=employee_verification
```

### 3.4 `HR_robo/.env` (AI Robo Interview)

```env
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=sqlite:///./ardhnarishvar_hr.db
```

Get a free Groq key at https://console.groq.com.

---

## 4. Database Setup

### MySQL (main backend)

```sql
CREATE DATABASE hrms;
CREATE DATABASE employee_verification;
```

The main backend auto-creates its tables and seeds the Super Admin account on first start â€” no manual SQL needed beyond creating the databases.

### MongoDB (Smart Attendance)

Just make sure MongoDB is running (`mongod` service). Collections are created automatically.

---

## 5. Install Dependencies

Run each block from the repo root. **Node portals:**

```bash
cd backen        && npm install && cd ..
cd admin         && npm install && cd ..
cd HR            && npm install && cd ..
cd client        && npm install && cd ..
cd employee      && npm install && cd ..
cd IT            && npm install && cd ..
cd Sales         && npm install && cd ..
cd employee-verification-system/frontend/frontend && npm install && cd ../../..
```

**Python services** â€” create a virtual environment per service (recommended):

```bash
# Employee Verification backend
cd employee-verification-system/employee-verification-backend
python -m venv venv
venv\Scripts\activate          # Windows   (Linux/Mac: source venv/bin/activate)
pip install -r requirements.txt
deactivate
cd ../..

# AI Robo Interview
cd HR_robo
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
deactivate
cd ..

# Smart Attendance
cd smart-Attendance-main/smart-Attendance-main/Smart_Attendance/Smart_Attendance/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
deactivate
cd ../../../../..
```

---

## 6. Run the Project

Open a separate terminal for each service, from the repo root.

### 6.1 Main backend (start this FIRST)

```bash
cd backen
npm run dev          # development (nodemon, auto-restart)
# or: npm start      # production
```

Wait for: `Server running on port 5000`.

### 6.2 React portals (one terminal each)

```bash
cd admin    && npm run dev -- --port 5173     # Super Admin
cd HR       && npm run dev -- --port 5174     # HR portal
cd client   && npm run dev -- --port 5175     # Client portal
cd employee && npm run dev -- --port 5176     # Employee portal
cd IT       && npm run dev                    # IT portal (pinned to 5177)
cd Sales    && npm run dev -- --port 5178     # Sales portal
```

### 6.3 Python services

```bash
# Employee Verification backend (FastAPI, port 8000)
cd employee-verification-system/employee-verification-backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Employee Verification frontend
cd employee-verification-system/frontend/frontend
npm run dev -- --port 5179

# AI Robo Interview (FastAPI, port 8001)
cd HR_robo
venv\Scripts\activate
python run.py

# Smart Attendance (Flask, runs on port 5050)
cd smart-Attendance-main/smart-Attendance-main/Smart_Attendance/Smart_Attendance/backend
venv\Scripts\activate
python app.py
```

### 6.4 Open in the browser

| Portal | URL |
|--------|-----|
| Super Admin | http://localhost:5173 |
| HR | http://localhost:5174 |
| Client | http://localhost:5175 |
| Employee | http://localhost:5176 |
| IT | http://localhost:5177 |
| Sales | http://localhost:5178 |
| Employee Verification | http://localhost:5179 |
| AI Robo Interview | http://localhost:8001 |
| Smart Attendance | http://localhost:5050 |

Log into the Admin portal with the `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` you set in `backen/.env`.

---

## 7. First-Run Checklist

1. MySQL running, `hrms` + `employee_verification` databases created
2. MongoDB running (only for Smart Attendance)
3. All `.env` files created (Section 3)
4. `npm install` done in every Node folder (Section 5)
5. `pip install -r requirements.txt` done in every Python service (Section 5)
6. Backend started FIRST, then the portals
7. Login as Super Admin â†’ create Departments, Designations â†’ add Employees â†’ their credentials work on the other portals

---

## 8. Roles & Access

| Role | Portal | Notes |
|------|--------|-------|
| SUPER_ADMIN | Admin | Full read/write everywhere |
| MANAGER | Admin | Read access to directory data; manages employees |
| TL (Team Leader) | Admin | Read-only directory access |
| hr | HR / Admin | Employee management |
| Employee | Employee | Attendance, tasks, EOD, payslips |
| Client | Client | Project/requirement tracking |
| Sales | Sales | Leads and targets |
| IT | IT | Assets and tickets |

---

## 9. Troubleshooting

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED 3306` | MySQL not running or wrong `DB_*` values in `backen/.env` |
| `Access Denied` / `Forbidden` toast | Role lacks route access â€” check `protect([...])` in `backen/modules/**/*.routes.js` |
| Blank portal page | Backend not running, or `VITE_API_BASE_URL` missing/wrong in that portal's `.env` |
| Port already in use | Another service took it â€” pass a different `--port`, or free the port |
| `pip install` fails on a package | Upgrade pip: `python -m pip install --upgrade pip`, retry inside the venv |
| Robo Interview 401/500 | Missing/invalid `GROQ_API_KEY` in `HR_robo/.env` |
| Smart Attendance DB errors | MongoDB service not started |
| OTP SMS not sending | Twilio vars empty â€” feature is optional; email OTP still works |

---

## 10. Project Structure

```
HRMS/
â”œâ”€â”€ backen/                        # Node.js Express API (MySQL, JWT, Socket.IO)
â”œâ”€â”€ admin/                         # Super Admin portal (React + Vite)
â”œâ”€â”€ HR/                            # HR portal
â”œâ”€â”€ client/                        # Client portal
â”œâ”€â”€ employee/                      # Employee portal
â”œâ”€â”€ IT/                            # IT portal
â”œâ”€â”€ Sales/                         # Sales portal
â”œâ”€â”€ employee-verification-system/
â”‚   â”œâ”€â”€ employee-verification-backend/   # FastAPI + MySQL
â”‚   â””â”€â”€ frontend/frontend/               # React + Vite
â”œâ”€â”€ HR_robo/                       # AI Robo Interview (FastAPI + Groq)
â”œâ”€â”€ smart-Attendance-main/         # Smart Attendance (Flask + MongoDB + face engine)
â””â”€â”€ scripts/                       # Utility scripts
```
