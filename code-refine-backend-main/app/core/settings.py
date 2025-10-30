from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    database_url: str
    
    # Groq API anahtarını .env dosyasından okumak için bu satırı ekledik
    groq_api_key: str 

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

settings = Settings()