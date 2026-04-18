import json
import logging
import time
import uuid
from urllib.request import urlopen

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.config import get_settings
from app.services.s3 import upload_bytes

logger = logging.getLogger(__name__)


def _transcribe_client():
    s = get_settings()
    kwargs = {"region_name": s.aws_region}
    if s.aws_access_key_id:
        kwargs["aws_access_key_id"] = s.aws_access_key_id
        kwargs["aws_secret_access_key"] = s.aws_secret_access_key
    return boto3.client("transcribe", **kwargs)


def transcribe_audio(audio_bytes: bytes, media_format: str | None = None) -> str:
    s = get_settings()
    fmt = media_format or s.transcribe_media_format
    job_name = f"mma-{uuid.uuid4().hex}"

    audio_key = upload_bytes(audio_bytes, content_type=f"audio/{fmt}", prefix="transcribe-input", extension=fmt)
    media_uri = f"s3://{s.s3_bucket_name}/{audio_key}"

    client = _transcribe_client()
    try:
        client.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={"MediaFileUri": media_uri},
            MediaFormat=fmt,
            LanguageCode=s.transcribe_language_code,
        )
    except (BotoCoreError, ClientError) as exc:
        raise RuntimeError(f"Failed to start Transcribe job: {exc}") from exc

    # Poll for completion (max 2 minutes)
    for _ in range(int(120 / s.transcribe_job_poll_interval)):
        try:
            result = client.get_transcription_job(TranscriptionJobName=job_name)
        except (BotoCoreError, ClientError) as exc:
            raise RuntimeError(f"Failed to poll Transcribe job: {exc}") from exc

        status = result["TranscriptionJob"]["TranscriptionJobStatus"]
        if status == "COMPLETED":
            transcript_uri = result["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
            break
        if status == "FAILED":
            raise RuntimeError(f"Transcribe job failed: {result['TranscriptionJob'].get('FailureReason')}")
        time.sleep(s.transcribe_job_poll_interval)
    else:
        raise RuntimeError("Transcribe job timed out.")

    with urlopen(transcript_uri) as resp:
        data = json.loads(resp.read())

    transcript = data.get("results", {}).get("transcripts", [{}])[0].get("transcript", "").strip()
    logger.info("Transcribed %d chars (job=%s)", len(transcript), job_name)
    return transcript
