from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    llm_base_url: str = "https://api.openai.com/v1"
    llm_api_key: str = ""
    llm_model_name: str = "gpt-4"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
