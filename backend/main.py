"""Compass — AI Financial Planning Copilot (Backend)"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from routers import planning, chat

settings = get_settings()

app = FastAPI(
    title=settings.app_title,
    version="1.0.0",
    description="AI-native financial planning engine with Monte Carlo simulations and GPT-4 analysis",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(planning.router)
app.include_router(chat.router)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "compass-backend",
        "ai_model": settings.ai_model,
        "has_api_key": bool(settings.github_token),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
