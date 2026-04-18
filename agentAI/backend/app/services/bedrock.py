import base64
import json
import logging

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.config import get_settings
from app.services.s3 import upload_and_get_url

logger = logging.getLogger(__name__)

IMAGE_TRIGGER_KEYWORDS = [
    "generate image", "generate a image", "create image", "draw image",
    "make image", "show image", "generate picture", "create picture",
    "draw a", "paint a", "illustrate",
]


def is_image_request(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in IMAGE_TRIGGER_KEYWORDS)


def _bedrock_client():
    s = get_settings()
    kwargs = {"region_name": s.aws_region}
    if s.aws_access_key_id:
        kwargs["aws_access_key_id"] = s.aws_access_key_id
        kwargs["aws_secret_access_key"] = s.aws_secret_access_key
    return boto3.client("bedrock-runtime", **kwargs)


def invoke_chat(messages: list[dict], system_prompt: str | None = None) -> tuple[str, int]:
    s = get_settings()
    formatted = []
    for m in messages:
        content_val = m["content"]
        if isinstance(content_val, str):
            content_val = [{"text": content_val}]
        formatted.append({"role": m["role"], "content": content_val})

    try:
        response = _bedrock_client().converse(
            modelId=s.bedrock_chat_model_id,
            messages=formatted,
            system=[{"text": system_prompt or s.app_system_prompt}],
            inferenceConfig={"maxTokens": s.bedrock_max_tokens, "temperature": 0.7, "topP": 0.9},
        )
    except (BotoCoreError, ClientError) as exc:
        logger.error("Bedrock converse failed: %s", exc)
        raise RuntimeError(f"Bedrock converse failed: {exc}") from exc

    text = response["output"]["message"]["content"][0]["text"].strip()
    tokens = response["usage"]["inputTokens"] + response["usage"]["outputTokens"]
    logger.info("Chat: model=%s tokens=%d", s.bedrock_chat_model_id, tokens)
    return text, tokens


def generate_image(prompt: str) -> str:
    s = get_settings()
    payload = {
        "text_prompts": [
            {"text": prompt, "weight": 1.0},
            {"text": "blurry, low quality, distorted, ugly", "weight": -1.0},
        ],
        "cfg_scale": 7,
        "steps": 50,
        "seed": 0,
        "width": 1024,
        "height": 1024,
        "samples": 1,
        "style_preset": "photographic",
    }

    try:
        response = _bedrock_client().invoke_model(
            modelId=s.bedrock_image_model_id,
            body=json.dumps(payload),
            contentType="application/json",
            accept="application/json",
        )
    except (BotoCoreError, ClientError) as exc:
        logger.error("Image generation failed: %s", exc)
        raise RuntimeError(f"Image generation failed: {exc}") from exc

    artifacts = json.loads(response["body"].read()).get("artifacts", [])
    if not artifacts:
        raise RuntimeError("Stable Diffusion returned no artifacts.")

    image_bytes = base64.b64decode(artifacts[0]["base64"])
    logger.info("Image generated: %d bytes", len(image_bytes))
    return upload_and_get_url(image_bytes, content_type="image/png", prefix="images", extension="png")
