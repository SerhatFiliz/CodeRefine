from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from app.services.github_service import GitHubService
from app.services.llm_service import LLMService
from app.services.static_analysis import StaticAnalysisService
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class AnalysisRequest(BaseModel):
    repo_url: str
    model_id: str = "llama-3.3-70b-versatile"

@router.post("/")
async def analyze_code(request: AnalysisRequest):
    try:
        logger.info(f"Received analysis request for: {request.repo_url} using model: {request.model_id}")
        
        # 1. Clone and Prepare Code Context with SMART LIMITS
        github_service = GitHubService()
        
        # --- SMART TOKEN LIMITING STRATEGY ---
        # Groq Free Tier has strict TPM (Tokens Per Minute) limits.
        # We must limit the context window passed to the LLM to ensure we don't hit 413 (Payload Too Large).
        
        if "llama-3.1-8b" in request.model_id:
            # Very strict limit for the 8B model (approx 6k TPM limit)
            max_context_tokens = 5000 
        elif "qwen" in request.model_id:
             # Strict limit for Qwen (approx 6k TPM limit on Groq)
            max_context_tokens = 5000
        elif "llama-3.3" in request.model_id:
            # Llama 3.3 has a slightly higher limit (~12k TPM), but we play safe.
            max_context_tokens = 10000 
        else:
            # Default safe fallback
            max_context_tokens = 5000
            
        logger.debug(f"Applied Smart Context Limit: {max_context_tokens} tokens for model: {request.model_id}")

        # Pass the limit to the cloning service. 
        # The service will prioritize critical files and truncate less important ones to fit this budget.
        repo_path, code_content = github_service.clone_and_prepare(
            request.repo_url, 
            max_tokens=max_context_tokens
        )

        if not code_content:
            raise HTTPException(status_code=400, detail="Could not extract valid code content from repository.")

        # 2. Run Static Analysis (Radon/Bandit)
        static_service = StaticAnalysisService()
        static_results = static_service.analyze_repository(repo_path)
        
        # 3. AI Analysis
        llm_service = LLMService()
        analysis_report = llm_service.analyze_code(
            code_content, 
            static_results,
            model_id=request.model_id
        )
        
        # 4. Cleanup
        github_service.cleanup(repo_path)
        
        return {
            "repo_name": request.repo_url.split("/")[-1],
            "report": analysis_report,
            "static_analysis": static_results
        }

    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        # Raise HTTP exception so Frontend can catch 429/413 codes correctly
        raise HTTPException(status_code=500, detail=str(e))
