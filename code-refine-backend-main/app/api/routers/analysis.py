from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import JSONResponse
from app.core.settings import settings
from groq import Groq 
from app.services.github_service import GitHubService
import json

router = APIRouter()
github_service = GitHubService()

try:
    client = Groq(
        api_key=settings.groq_api_key,
    )
except Exception as e:
    client = None
    print(f"Groq istemcisi yüklenemedi: {e}")

@router.post("/")
async def analyze_code(payload: dict = Body(...)):
    """
    Accepts a JSON body with 'repo_url'.
    Returns a structured JSON analysis.
    """
    repo_url = payload.get("repo_url")
    if not repo_url:
        raise HTTPException(status_code=400, detail="repo_url is required")

    if not client:
        raise HTTPException(status_code=500, detail="Groq API key not configured.")

    repo_path = None
    try:
        # 1. Clone Repo
        print(f"DEBUG: Cloning repo: {repo_url}")
        repo_path = github_service.clone_repository(repo_url)
        
        # 2. Get Content
        code_content = github_service.get_repository_content(repo_path)
        print(f"DEBUG: Repo: {repo_url}, Content Length: {len(code_content)}")
        
        if not code_content:
            raise HTTPException(status_code=400, detail="No suitable code files found in the repository.")

        # 3. Prepare Prompt for JSON Output
        system_prompt = """
        You are a Lead Code Reviewer and Senior Software Architect.
        Your goal is to analyze the provided codebase and output a structured JSON report.
        
        You must output ONLY valid JSON. Do not include any markdown formatting like ```json ... ```.
        
        The JSON structure must be exactly:
        {
            "executive_summary": {
                "overview": "Brief description of the project",
                "quality_score": 8.5,
                "key_strengths": ["strength 1", "strength 2"],
                "critical_issues": ["issue 1", "issue 2"]
            },
            "code_smells": [
                {
                    "file": "filename.py",
                    "severity": "High",
                    "issue": "Description of the smell",
                    "recommendation": "How to fix it"
                }
            ],
            "technical_debt": [
                {
                    "category": "Architecture",
                    "issue": "Description of the debt",
                    "impact": "High"
                }
            ],
            "refactoring_suggestions": [
                {
                    "title": "Refactoring Title",
                    "description": "Detailed explanation",
                    "code_snippet": "Example code if applicable"
                }
            ]
        }
        """

        user_prompt = f"Analyze this codebase:\n\n{code_content}"

        # 4. Call LLM with JSON Mode
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.5,
            max_tokens=4096,
            top_p=1,
            stream=False,
            response_format={"type": "json_object"}
        )

        # 5. Parse and Return JSON
        result_content = completion.choices[0].message.content
        parsed_result = json.loads(result_content)
        
        return JSONResponse(content=parsed_result)
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse LLM response as JSON.")
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if repo_path:
            github_service.cleanup_repository(repo_path)