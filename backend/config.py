"""Application configuration — loads from .env or environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    github_token: str = ""
    ai_model: str = "gpt-5"
    ai_base_url: str = "https://models.inference.ai.azure.com"
    app_title: str = "Compass — AI Financial Planner"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://compass.shraman-gupta.com",
        "https://wealthsimple-task.vercel.app",
    ]
    debug: bool = False

    # Simulation defaults
    sim_runs: int = 5_000
    sim_inflation: float = 0.02

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
