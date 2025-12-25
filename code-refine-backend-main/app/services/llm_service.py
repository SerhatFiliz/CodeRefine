import os
from groq import Groq
import logging
import json

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    def analyze_code(self, file_content: str, static_analysis: dict, model_id: str) -> str:
        """
        Analyzes code using Groq LLM and returns a Structured JSON string.
        """
        
        # --- ENTERPRISE-GRADE "EXHAUSTIVE" PROMPT ---
        system_prompt = """
        You are a Principal Software Architect and Chief Security Auditor.
        Perform a COMPREHENSIVE and EXHAUSTIVE code review. Do not summarize; list EVERYTHING.

        GOAL: Identify ALL Code Smells, ALL Security Vulnerabilities, and ALL Technical Debt.
        
        INSTRUCTIONS:
        1. **Quantity:** Do not stop at 2-3 items. If there are 10 smells, list 10 smells. Aim for at least 5-7 findings per category if applicable.
        2. **Specificity:** You MUST quote the specific variable names, function names, and file names.
        3. **Code Snippets:** For Refactoring Suggestions, you MUST provide the `code_before` (the bad code) and `code_after` (the fixed code). Do not leave them empty.
        4. **Scoring:** Provide a strict Quality Score between 0 and 100.

        JSON STRUCTURE (Strict):
        {
            "executive_summary": "Detailed technical summary of architecture and health.",
            "key_strengths": ["Strength 1", "Strength 2", "Strength 3", "Strength 4"],
            "critical_issues": ["Critical 1", "Critical 2", "Critical 3"],
            "quality_score": 75, 
            "code_smells": [
                {"file": "filename.py", "severity": "High/Medium/Low", "description": "Detailed explanation of the smell (e.g. Long Method, God Class, Magic Numbers).", "suggestion": "Specific fix."}
            ],
            "technical_debt": [
                {"category": "Architecture/Security/Testing", "impact": "High/Medium", "description": "Long-term risk explanation."}
            ],
            "refactoring_suggestions": [
                {
                    "title": "Refactoring Title",
                    "description": "Explanation.",
                    "code_before": "def bad_function(): ...",
                    "code_after": "def good_function(): ..."
                }
            ],
            "security_analysis": "Deep dive into Bandit findings and logical security flaws."
        }
        """

        user_prompt = f"""
        [STATIC ANALYSIS REPORT (BANDIT/RADON)]
        {json.dumps(static_analysis)}

        [SOURCE CODE TO ANALYZE]
        {file_content}
        
        Perform the exhaustive audit now. Return ONLY Valid JSON.
        """

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=model_id,
                temperature=0.2, # Low temperature to ensure valid JSON structure
                max_tokens=6000, # Increased max_tokens to allow for longer, detailed reports
                response_format={"type": "json_object"}
            )
            
            return chat_completion.choices[0].message.content

        except Exception as e:
            logger.error(f"LLM Analysis failed: {e}")
            return json.dumps({
                "executive_summary": "Analysis failed or timed out.",
                "key_strengths": [], "critical_issues": ["Error"], "quality_score": 0,
                "code_smells": [], "technical_debt": [], "refactoring_suggestions": [],
                "security_analysis": "N/A"
            })
