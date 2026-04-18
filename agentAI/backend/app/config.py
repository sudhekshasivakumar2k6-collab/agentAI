from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    s3_bucket_name: str = "multi-modal-assistant-bucket"
    s3_presigned_url_expiry: int = 3600

    bedrock_chat_model_id: str = "amazon.nova-lite-v1:0"
    bedrock_image_model_id: str = "stability.stable-diffusion-xl-v1"
    bedrock_max_tokens: int = 2048

    polly_voice_id: str = "Joanna"
    polly_engine: str = "neural"
    polly_output_format: str = "mp3"

    transcribe_language_code: str = "en-US"
    transcribe_media_format: str = "webm"
    transcribe_job_poll_interval: float = 2.0

    app_cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    app_log_level: str = "INFO"
    app_system_prompt: str = (
        "You are a helpful, friendly, and knowledgeable AI assistant. "
        "Keep responses concise unless asked for detail. "
        "If the user asks you to generate an image, acknowledge that the image is being generated."
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
