"""Chat API route — streaming financial planning conversation."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models import ChatRequest
from services.ai_planner import chat_with_context

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("")
async def chat(req: ChatRequest):
    """Send a message in the financial planning chat. Full profile context is included."""
    try:
        messages = [{"role": m.role, "content": m.content} for m in req.messages]
        response = await chat_with_context(req.profile, messages)
        return {"reply": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
