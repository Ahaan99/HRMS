"""NOVA HR Robot — FAQ Module (faq.py)"""
import logging
from typing import Dict, List, Optional
logger = logging.getLogger(__name__)

class FAQModule:
    def __init__(self):
        from memory.rag import get_rag
        self._rag = get_rag()

    def answer_question(self, question: str) -> Dict:
        results = self._rag.search(question, top_k=2)
        if results:
            answer = results[0]["doc"]["content"]
            confidence = min(1.0, results[0]["score"])
            return {"found":True,"question":question,"answer":answer,"confidence":round(confidence,2),"source":results[0]["doc"]["title"]}
        return {"found":False,"question":question,"answer":"Is sawaal ka jawab mere database mein nahi hai. Please HR@company.com par email karein.","confidence":0.0}

    def get_categories(self) -> List[str]:
        return ["Leave Policy","Salary & Benefits","Interview Process","Code of Conduct","Work from Home","IT Support","Performance Review","Exit Process"]

    def add_faq(self, category: str, question: str, answer: str):
        doc_id = f"faq_{len(question)}"
        self._rag.add_document(doc_id, f"{category}: {question}", answer)
        logger.info(f"FAQ added: {question[:50]}")
        return {"success":True}

faq_module = FAQModule()
def get_faq_module(): return faq_module
