from typing import Literal
from pydantic import BaseModel, Field


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str | list[dict]


class ChatRequest(BaseModel):
    messages: list[Message] = Field(..., min_length=1)
    voice_response: bool = False


class ChatResponse(BaseModel):
    response: str
    audio_url: str | None = None
    image_url: str | None = None
    tokens_used: int | None = None


class TranscribeResponse(BaseModel):
    transcript: str


class ImageRequest(BaseModel):
    prompt: str = Field(..., min_length=3)


class ImageResponse(BaseModel):
    image_url: str
    prompt: str


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=3000)


class TTSResponse(BaseModel):
    audio_url: str
