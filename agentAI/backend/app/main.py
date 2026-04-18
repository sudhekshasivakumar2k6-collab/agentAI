import logging
import sys
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import chat, image, transcribe, tts

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    s = get_settings()
    logger.info("Starting | region=%s bucket=%s model=%s", s.aws_region, s.s3_bucket_name, s.bedrock_chat_model_id)
    yield
    logger.info("Shutting down.")


def create_app() -> FastAPI:
    s = get_settings()

    app = FastAPI(
        title="Multi-Model Assistant API",
        description="AI assistant powered by Amazon Bedrock, Transcribe, Polly, and S3.",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=s.app_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled: %s %s → %s", request.method, request.url, exc)
        return JSONResponse(status_code=500, content={"detail": "Internal server error.", "code": "INTERNAL_ERROR"})

    @app.get("/health", tags=["Health"])
    async def health():
        return {"status": "ok"}

    app.include_router(chat.router)
    app.include_router(transcribe.router)
    app.include_router(image.router)
    app.include_router(tts.router)

    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
