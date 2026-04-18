import logging

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.config import get_settings
from app.services.s3 import upload_and_get_url

logger = logging.getLogger(__name__)


def _polly_client():
    s = get_settings()
    kwargs = {"region_name": s.aws_region}
    if s.aws_access_key_id:
        kwargs["aws_access_key_id"] = s.aws_access_key_id
        kwargs["aws_secret_access_key"] = s.aws_secret_access_key
    return boto3.client("polly", **kwargs)


def synthesize_speech(text: str, voice_id: str | None = None, engine: str | None = None) -> str:
    s = get_settings()
    try:
        response = _polly_client().synthesize_speech(
            Text=text,
            VoiceId=voice_id or s.polly_voice_id,
            Engine=engine or s.polly_engine,
            OutputFormat=s.polly_output_format,
            TextType="text",
        )
    except (BotoCoreError, ClientError) as exc:
        logger.error("Polly failed: %s", exc)
        raise RuntimeError(f"Polly failed: {exc}") from exc

    audio_bytes = response["AudioStream"].read()
    if not audio_bytes:
        raise RuntimeError("Polly returned an empty audio stream.")

    logger.info("Polly: %d bytes (voice=%s)", len(audio_bytes), voice_id or s.polly_voice_id)
    return upload_and_get_url(audio_bytes, content_type="audio/mpeg", prefix="tts", extension="mp3")
