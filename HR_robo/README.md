# Ardhnarishvar HR — AI Interview Robot System v6

## 🚀 Features

### Admin Panel
- 📊 Dashboard with candidate & interview stats
- 📄 Resume shortlisting (shortlist/reject candidates)
- 📅 Interview scheduling
- 🎥 Live Interview Monitor with **video download**
- 📊 Results entry
- ⚙️ Admin Settings — **edit admin accounts** (name, email, password, role)
- 📧 **Real Gmail Email Notifications** via EmailJS

### AI Robot Interview (Candidate)
- 🤖 **Ardhnarishvar AI Interview Robot** — structured robot interview
- Phases: Greeting → Introduction → Experience → Skill Questions → Resume Questions → Behavioral → Closing
- Auto-detects candidate skills from profile and asks targeted questions
- **Video recorded** automatically during interview
- Live emotion analysis (Confidence, Nervousness, Engagement)
- English + Hinglish adaptive language

### Email Notifications
- Candidate registers → **Admin gets email notification**
- Admin schedules interview → **Candidate gets email with date/time**
- Uses **EmailJS** (free, no backend needed)

---

## ⚙️ Setup

### 1. Install & Run
```bash
pip install -r requirements.txt
python run.py
```
Open: http://localhost:8000

### 2. Admin Login
- Email: admin@ardhnarishvar.com
- Password: Admin@2024

### 3. Email Setup (Gmail Notifications)
1. Go to https://www.emailjs.com — create free account
2. Add Gmail service → get **Service ID**
3. Create email template with variables:
   - `{{to_email}}`, `{{to_name}}`, `{{subject}}`, `{{message}}`
   - Get **Template ID**
4. Go to Account → **Public Key**
5. In Admin Settings → Email Notification Settings:
   - Enter Service ID, Public Key, Template IDs, Admin Gmail
   - Click Save → Test

### 4. Candidate Flow
1. Candidate goes to login screen → Register tab
2. Fills form, uploads resume → gets Candidate ID
3. Admin shortlists → schedules interview (candidate gets email)
4. Candidate logs in → My Schedule → Join Interview
5. Robot interview starts automatically
6. Admin views recording in Live Monitor → Download Video

---

## 📁 Project Structure
```
nova_hr_robot/
├── backend/          # FastAPI routes, auth
├── brain/            # AI reasoning, context
├── databases/        # SQLAlchemy models, queries
├── hr_module/        # Interview conductor, FAQ
├── templates/        # index.html (main app)
├── config/           # Settings
└── run.py            # Entry point
```

---

## 🔑 Environment Variables (.env)
```
ANTHROPIC_API_KEY=your-key-here
ADMIN_EMAIL=admin@ardhnarishvar.com
ADMIN_PASSWORD=Admin@2024
```
