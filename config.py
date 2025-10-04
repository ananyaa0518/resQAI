from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str = "sqlite:///./disaster.db"
    secret_key: str = "your-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    recaptcha_secret: str = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"
    
    # Optional MongoDB fields (won't cause errors)
    mongodb_uri: str = "mongodb://localhost:27017/resQAI"
    jwt_secret: str = "some_secret"
    port: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = False

def get_settings():
    return Settings()