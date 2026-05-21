import json
import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import redis.asyncio as aioredis
from groq import AsyncGroq

from app.config import settings

logger = logging.getLogger("ai_summarizer")

# Pydantic model for JSON validation
class AISummarySchema(BaseModel):
    summary: str = Field(..., description="2-4 sentence plain-English explanation")
    recommendations: list[str] = Field(..., description="Concrete, actionable steps")
    industries: list[str] = Field(..., description="Relevant industries from the fixed list")
    business_risk_score: float = Field(..., ge=1.0, le=10.0, description="Real-world SMB impact score")

SYSTEM_PROMPT = """You are a cybersecurity expert writing threat intelligence summaries for small
business owners with no technical background. Your job is to take raw vulnerability
data and explain it in clear, plain English — as if you were talking to a smart
friend who runs a coffee shop and uses WordPress.

Always respond with a valid JSON object and nothing else. No markdown block wrapper, no
preamble, no explanation outside the JSON. The JSON must have exactly these keys:

{
  "summary": "2–4 sentence plain-English explanation of the threat and its impact",
  "recommendations": ["Step 1", "Step 2", "Step 3"],
  "industries": ["retail", "healthcare"],  // only relevant ones from the provided list
  "business_risk_score": 7.5  // float 1.0–10.0 reflecting real-world SMB impact
}

Rules:
- Never use jargon without immediately explaining it.
- Recommendations must be concrete and actionable, not vague ("update your software" not "apply patches").
- Risk score should reflect exploitability + impact on SMBs specifically, not just CVSS.
- If a patch is available, always include it as recommendation #1.
- You must select relevant industries only from this fixed vocabulary: "healthcare", "finance", "retail", "education", "manufacturing", "technology", "legal", "hospitality", "government", "nonprofit".
"""

async def summarize_threat(raw_threat: Dict[str, Any]) -> Optional[AISummarySchema]:
    source_id = raw_threat.get("source_id")
    if not source_id:
        logger.warning("Vulnerability has no source_id, skipping AI summary.")
        return None

    redis_key = f"ai:threat:{source_id}"

    # 1. Check Redis cache
    try:
        r = aioredis.from_url(settings.REDIS_URL, socket_timeout=5)
        cached_data = await r.get(redis_key)
        await r.close()
        
        if cached_data:
            logger.info(f"Redis cache hit for {source_id}")
            data_dict = json.loads(cached_data)
            return AISummarySchema(**data_dict)
    except Exception as e:
        logger.warning(f"Failed to read from Redis cache: {e}")

    # 2. Cache miss -> Call GROQ API
    logger.info(f"Calling GROQ API for threat {source_id}...")
    try:
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        
        title = raw_threat.get("title", "")
        description = raw_threat.get("description", "")
        cvss = raw_threat.get("cvss_score", "N/A")
        patch_available = "Yes" if raw_threat.get("patch_available") else "No"
        affected_products = ", ".join(raw_threat.get("affected_products", [])) or "None specified"

        user_content = f"""Analyze the following vulnerability:
Source ID: {source_id}
Title: {title}
Description: {description}
CVSS Base Score: {cvss}
Patch Available: {patch_available}
Affected Products: {affected_products}
"""

        models = [
            "llama-3.1-8b-instant",
            "llama-3.3-70b-versatile",
            "mixtral-8x7b-32768",
            "gemma2-9b-it"
        ]

        content = None
        for model_name in models:
            try:
                logger.info(f"Attempting GROQ call with model {model_name} for {source_id}...")
                response = await client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_content}
                    ],
                    temperature=0.2,
                    response_format={"type": "json_object"}
                )
                content = response.choices[0].message.content
                if content:
                    logger.info(f"Successfully generated summary using model {model_name}")
                    break
            except Exception as err:
                logger.warning(f"GROQ API call failed using model {model_name} for {source_id}: {err}")
                continue

        if not content:
            logger.warning(f"All GROQ models failed for {source_id}")
            return None

        # 3. Parse JSON response
        data_dict = json.loads(content)

        # 4. Validate with Pydantic
        ai_summary = AISummarySchema(**data_dict)

        # 5. Store in Redis (TTL: 7 days = 604800 seconds)
        try:
            r = aioredis.from_url(settings.REDIS_URL, socket_timeout=5)
            await r.set(redis_key, json.dumps(data_dict), ex=604800)
            await r.close()
            logger.info(f"Successfully cached AI summary for {source_id} in Redis.")
        except Exception as cache_err:
            logger.warning(f"Failed to store summary in Redis cache: {cache_err}")

        return ai_summary

    except json.JSONDecodeError as json_err:
        logger.warning(f"Malformed JSON returned from GROQ for {source_id}: {json_err}. Raw content: {content}")
        return None
    except Exception as err:
        logger.warning(f"GROQ API call execution failed for {source_id}: {err}")
        return None
