import logging
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ChatRequest, ChatResponse
from app.services import bedrock, polly

router = APIRouter(prefix="/api/chat", tags=["Chat"])
logger = logging.getLogger(__name__)


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    messages = [m.model_dump() for m in request.messages]
    last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")

    try:
        response_text, tokens = bedrock.invoke_chat(messages)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    image_url = None
    if bedrock.is_image_request(last_user):
        try:
            image_url = bedrock.generate_image(last_user)
        except RuntimeError as exc:
            logger.error("Image generation skipped: %s", exc)

    audio_url = None
    if request.voice_response:
        try:
            audio_url = polly.synthesize_speech(response_text)
        except RuntimeError as exc:
            logger.error("TTS skipped: %s", exc)

    return ChatResponse(response=response_text, audio_url=audio_url, image_url=image_url, tokens_used=tokens)
