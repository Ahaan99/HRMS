"""
NLP Engine — resume parsing & skill extraction for the AI Interview Robot.
Pure-python (regex + dictionary based), no heavy ML deps, deterministic.
"""

import re

# ── canonical skill dictionary: alias -> canonical name ──
_SKILLS = {
    # languages
    "python": "Python", "java": "Java", "javascript": "JavaScript", "js": "JavaScript",
    "typescript": "TypeScript", "ts": "TypeScript", "c++": "C++", "cpp": "C++",
    "c#": "C#", "csharp": "C#", "go": "Go", "golang": "Go", "rust": "Rust",
    "php": "PHP", "ruby": "Ruby", "kotlin": "Kotlin", "swift": "Swift",
    "scala": "Scala", "r": "R", "matlab": "MATLAB", "perl": "Perl", "dart": "Dart",
    # frontend
    "react": "React", "reactjs": "React", "react.js": "React", "next": "Next.js",
    "nextjs": "Next.js", "next.js": "Next.js", "angular": "Angular", "vue": "Vue.js",
    "vuejs": "Vue.js", "vue.js": "Vue.js", "svelte": "Svelte", "jquery": "jQuery",
    "html": "HTML", "html5": "HTML", "css": "CSS", "css3": "CSS", "sass": "Sass",
    "scss": "Sass", "tailwind": "Tailwind CSS", "tailwindcss": "Tailwind CSS",
    "bootstrap": "Bootstrap", "redux": "Redux", "webpack": "Webpack", "vite": "Vite",
    # backend
    "node": "Node.js", "nodejs": "Node.js", "node.js": "Node.js", "express": "Express",
    "expressjs": "Express", "django": "Django", "flask": "Flask", "fastapi": "FastAPI",
    "spring": "Spring Boot", "springboot": "Spring Boot", "laravel": "Laravel",
    "rails": "Ruby on Rails", ".net": ".NET", "dotnet": ".NET", "graphql": "GraphQL",
    "rest": "REST APIs", "restful": "REST APIs", "grpc": "gRPC", "microservices": "Microservices",
    # databases
    "sql": "SQL", "mysql": "MySQL", "postgresql": "PostgreSQL", "postgres": "PostgreSQL",
    "mongodb": "MongoDB", "mongo": "MongoDB", "redis": "Redis", "sqlite": "SQLite",
    "oracle": "Oracle DB", "cassandra": "Cassandra", "elasticsearch": "Elasticsearch",
    "dynamodb": "DynamoDB", "firebase": "Firebase", "supabase": "Supabase",
    # devops / cloud
    "aws": "AWS", "azure": "Azure", "gcp": "GCP", "docker": "Docker",
    "kubernetes": "Kubernetes", "k8s": "Kubernetes", "jenkins": "Jenkins",
    "terraform": "Terraform", "ansible": "Ansible", "ci/cd": "CI/CD", "cicd": "CI/CD",
    "git": "Git", "github": "GitHub", "gitlab": "GitLab", "linux": "Linux",
    "nginx": "Nginx", "bash": "Bash",
    # data / ai
    "machine learning": "Machine Learning", "ml": "Machine Learning",
    "deep learning": "Deep Learning", "dl": "Deep Learning", "nlp": "NLP",
    "computer vision": "Computer Vision", "tensorflow": "TensorFlow",
    "pytorch": "PyTorch", "keras": "Keras", "pandas": "Pandas", "numpy": "NumPy",
    "scikit-learn": "Scikit-learn", "sklearn": "Scikit-learn", "opencv": "OpenCV",
    "spark": "Apache Spark", "hadoop": "Hadoop", "tableau": "Tableau",
    "power bi": "Power BI", "powerbi": "Power BI", "excel": "Excel",
    "data analysis": "Data Analysis", "data science": "Data Science",
    "statistics": "Statistics", "llm": "LLMs", "genai": "Generative AI",
    "generative ai": "Generative AI", "langchain": "LangChain",
    # mobile
    "android": "Android", "ios": "iOS", "flutter": "Flutter",
    "react native": "React Native", "xamarin": "Xamarin",
    # design
    "figma": "Figma", "sketch": "Sketch", "adobe xd": "Adobe XD", "xd": "Adobe XD",
    "photoshop": "Photoshop", "illustrator": "Illustrator", "ui/ux": "UI/UX",
    "ui": "UI Design", "ux": "UX Design", "prototyping": "Prototyping",
    "wireframing": "Wireframing", "design systems": "Design Systems",
    # pm / business
    "agile": "Agile", "scrum": "Scrum", "jira": "Jira", "kanban": "Kanban",
    "product management": "Product Management", "project management": "Project Management",
    "stakeholder management": "Stakeholder Management", "roadmap": "Product Roadmap",
    "market research": "Market Research", "a/b testing": "A/B Testing", "seo": "SEO",
    "digital marketing": "Digital Marketing", "crm": "CRM", "salesforce": "Salesforce",
    # testing
    "selenium": "Selenium", "cypress": "Cypress", "jest": "Jest", "pytest": "Pytest",
    "junit": "JUnit", "testing": "Software Testing", "qa": "QA",
    "automation testing": "Automation Testing", "manual testing": "Manual Testing",
    # soft skills
    "communication": "Communication", "leadership": "Leadership",
    "teamwork": "Teamwork", "problem solving": "Problem Solving",
    "time management": "Time Management", "critical thinking": "Critical Thinking",
}

# multi-word aliases checked first (longest match wins)
_MULTIWORD = sorted([k for k in _SKILLS if " " in k or "/" in k], key=len, reverse=True)
_SINGLE = {k: v for k, v in _SKILLS.items() if " " not in k and "/" not in k}

_EDU_PATTERNS = [
    (r"\bph\.?d\b|\bdoctorate\b", "PhD"),
    (r"\bm\.?tech\b|\bmtech\b|\bm\.?e\.?\b(?!\w)|\bmaster of technology\b", "M.Tech"),
    (r"\bmba\b|\bmaster of business\b", "MBA"),
    (r"\bm\.?sc\b|\bmaster of science\b", "M.Sc"),
    (r"\bmca\b", "MCA"),
    (r"\bb\.?tech\b|\bbtech\b|\bbachelor of technology\b|\bb\.?e\.?\b(?!\w)", "B.Tech"),
    (r"\bbca\b", "BCA"),
    (r"\bb\.?sc\b|\bbachelor of science\b", "B.Sc"),
    (r"\bb\.?com\b", "B.Com"),
    (r"\bbba\b", "BBA"),
    (r"\bdiploma\b", "Diploma"),
    (r"\b12th\b|\bintermediate\b|\bhigher secondary\b", "12th"),
]


class NLPEngine:
    """Deterministic resume information extractor."""

    def extract_resume_info(self, text: str) -> dict:
        if not text:
            return {"skills": [], "experience_years": 0, "education": [],
                    "email": None, "phone": None, "summary": ""}
        low = text.lower()
        return {
            "skills": self.extract_skills(low),
            "experience_years": self.extract_experience_years(low),
            "education": self.extract_education(low),
            "email": self.extract_email(text),
            "phone": self.extract_phone(text),
            "summary": self._summary(text),
        }

    # ── skills ──
    def extract_skills(self, low: str) -> list:
        found, seen = [], set()
        # multi-word first
        for alias in _MULTIWORD:
            if alias in low:
                canon = _SKILLS[alias]
                if canon not in seen:
                    seen.add(canon)
                    found.append(canon)
        # single tokens with word boundaries (avoid 'r' matching everywhere:
        # require it appear as a standalone token next to separators)
        tokens = set(re.findall(r"[a-z0-9#+.]+", low))
        for alias, canon in _SINGLE.items():
            if canon in seen:
                continue
            if alias in ("r",):  # too noisy — require "r programming" or ", r,"
                if re.search(r"\br programming\b|[,(]\s*r\s*[,)]", low):
                    seen.add(canon); found.append(canon)
                continue
            if alias in tokens:
                seen.add(canon); found.append(canon)
        return found[:30]

    # ── experience ──
    def extract_experience_years(self, low: str) -> float:
        yrs = []
        for m in re.finditer(r"(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)", low):
            v = float(m.group(1))
            if 0 < v <= 45:
                yrs.append(v)
        # date-range employment estimate e.g. 2019 - 2023
        spans = re.findall(r"(20\d{2}|19\d{2})\s*[-–to]{1,3}\s*(20\d{2}|present|current)", low)
        span_total = 0.0
        for a, b in spans:
            end = 2026.0 if b in ("present", "current") else float(b)
            d = end - float(a)
            if 0 < d <= 45:
                span_total += d
        best = max(yrs) if yrs else 0.0
        return round(max(best, min(span_total, 45.0)), 1)

    # ── education ──
    def extract_education(self, low: str) -> list:
        out = []
        for pat, name in _EDU_PATTERNS:
            if re.search(pat, low) and name not in out:
                out.append(name)
        return out

    # ── contact ──
    def extract_email(self, text: str):
        m = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
        return m.group(0) if m else None

    def extract_phone(self, text: str):
        m = re.search(r"(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}", text)
        return m.group(0).strip() if m else None

    def _summary(self, text: str) -> str:
        clean = " ".join(text.split())
        return clean[:300]

    # ── answer quality scoring (used by interview scoring) ──
    def score_answer(self, answer: str, keywords: list | None = None) -> int:
        """Heuristic 0-100 quality score for a spoken/typed interview answer."""
        if not answer or not answer.strip():
            return 0
        words = answer.split()
        n = len(words)
        # length component (up to 50)
        if n < 5:
            length_score = 10
        elif n < 15:
            length_score = 25
        elif n < 40:
            length_score = 40
        else:
            length_score = 50
        # keyword component (up to 30)
        kw_score = 0
        if keywords:
            low = answer.lower()
            hits = sum(1 for k in keywords if k.lower() in low)
            kw_score = min(30, hits * 10)
        else:
            kw_score = 15  # neutral when no keywords defined
        # structure component (up to 20): sentences, examples, numbers
        struct = 0
        if re.search(r"[.!?].+[.!?]", answer):
            struct += 7
        if re.search(r"\b(for example|jaise|like when|instance|project|maine|i built|i led|i worked)\b", answer.lower()):
            struct += 7
        if re.search(r"\d", answer):
            struct += 6
        return min(100, length_score + kw_score + struct)


_nlp = None

def get_nlp() -> NLPEngine:
    global _nlp
    if _nlp is None:
        _nlp = NLPEngine()
    return _nlp
