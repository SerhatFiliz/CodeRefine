from fastapi import APIRouter, Depends, HTTPException, Body
# StreamingResponse'u import etmemiz gerekiyor
from fastapi.responses import StreamingResponse
from app.core.settings import settings
from groq import Groq 

router = APIRouter()

try:
    client = Groq(
        api_key=settings.groq_api_key,
    )
except Exception as e:
    client = None
    print(f"Groq istemcisi yüklenemedi: {e}")

async def stream_analysis(code: str):
    """
    Bu bir "generator" fonksiyondur. Groq'tan gelen her
    bir "chunk"ı (parçacığı) anında 'yield' (verim) ile frontend'e yollar.
    """
    if not client:
        yield "Hata: Groq API anahtarı yapılandırılamadı."
        return

    try:
        prompt = f"""
        Analyze the following code. Your goal is to identify technical debt
        and code smells. 
        Provide a simple, bulleted-list summary of potential errors and 
        suggestions for refactoring.
        
        Code:
        ```
        {code}
        ```
        """

        # stream=True ve yeni model adını kullan
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[
                {"role": "system", "content": "You are a senior software engineer specialized in code refactoring and technical debt analysis."},
                {"role": "user", "content": prompt}
            ],
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=True, # Akışı etkinleştir
            stop=None
        )

        # Groq'tan gelen her parçacığı (chunk) yakala ve anında yolla
        for chunk in completion:
            content = chunk.choices[0].delta.content or ""
            yield content
    
    except Exception as e:
        print(f"LLM analizi sırasında hata: {str(e)}")
        yield f"Hata: LLM analizi sırasında bir sorun oluştu. {str(e)}"


@router.post("/")
async def analyze_code(code: str = Body(..., embed=True)):
    """
    Bu endpoint artık bir JSON döndürmüyor,
    bunun yerine stream_analysis generator'ını bir akış olarak başlatıyor.
    """
    return StreamingResponse(stream_analysis(code), media_type="text/plain")