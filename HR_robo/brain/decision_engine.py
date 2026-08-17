"""NOVA HR Robot — Decision Engine"""
import logging
from typing import Dict, List
logger = logging.getLogger(__name__)


class DecisionEngine:
    
    def calculate_resume_score(self, parsed: Dict, requirements: Dict) -> Dict:
        req_skills = [s.lower() for s in requirements.get("skills",[])]
        cand_skills = [s.lower() for s in parsed.get("skills",[])]
        matched = list(set(req_skills) & set(cand_skills))
        skill_score = round(min(100, (len(matched)/max(len(req_skills),1))*100), 1)
        exp_req = requirements.get("experience_min",0)
        exp_cand = parsed.get("experience_years",0)
        exp_score = round(min(100, (exp_cand/max(exp_req,1))*100) if exp_req else 80, 1)
        overall = round(skill_score*0.6 + exp_score*0.4, 1)
        return {"overall":overall,"skills_score":skill_score,"experience_score":exp_score,"matched_skills":matched}

decision_engine = DecisionEngine()
def get_decision_engine(): return decision_engine
