import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.ai_summarizer import summarize_threat, AISummarySchema

@pytest.mark.asyncio
async def test_summarize_threat_success():
    raw_threat = {
        "source_id": "CVE-2026-9999",
        "title": "SQL Injection in User Login",
        "description": "An input validation flaw allows users to bypass auth.",
        "cvss_score": 8.8,
        "patch_available": True,
        "affected_products": ["Wordpress User plugin"]
    }

    # Mock Redis cache miss (get returns None) and mock set/close
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None
    mock_redis.set.return_value = True
    mock_redis.close.return_value = None

    # Mock GROQ Chat Completion response
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps({
        "summary": "This is a plain English summary explaining the SQL injection.",
        "recommendations": ["Update the Wordpress plugin immediately", "Enable WAF rules"],
        "industries": ["retail", "technology"],
        "business_risk_score": 8.0
    })
    
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    
    mock_completions = AsyncMock()
    mock_completions.create.return_value = mock_response

    mock_client_instance = MagicMock()
    mock_client_instance.chat = MagicMock(completions=mock_completions)

    with patch("app.services.ai_summarizer.aioredis.from_url", return_value=mock_redis), \
         patch("app.services.ai_summarizer.AsyncGroq", return_value=mock_client_instance):
        
        result = await summarize_threat(raw_threat)

        # Assertions
        assert result is not None
        assert isinstance(result, AISummarySchema)
        assert result.summary == "This is a plain English summary explaining the SQL injection."
        assert result.recommendations == ["Update the Wordpress plugin immediately", "Enable WAF rules"]
        assert result.industries == ["retail", "technology"]
        assert result.business_risk_score == 8.0

        # Verify Redis caching was called
        mock_redis.get.assert_called_once_with("ai:threat:CVE-2026-9999")
        mock_redis.set.assert_called_once()
        # The key cached must be exact
        args, kwargs = mock_redis.set.call_args
        assert args[0] == "ai:threat:CVE-2026-9999"
        assert kwargs.get("ex") == 604800

@pytest.mark.asyncio
async def test_summarize_threat_cache_hit():
    raw_threat = {
        "source_id": "CVE-2026-9999",
        "title": "SQL Injection in User Login"
    }

    # Mock Redis cache hit
    mock_redis = AsyncMock()
    mock_redis.get.return_value = json.dumps({
        "summary": "Cached plain English summary.",
        "recommendations": ["Apply the cached patch"],
        "industries": ["finance"],
        "business_risk_score": 5.0
    })
    mock_redis.close.return_value = None

    with patch("app.services.ai_summarizer.aioredis.from_url", return_value=mock_redis), \
         patch("app.services.ai_summarizer.AsyncGroq") as mock_groq_class:
        
        result = await summarize_threat(raw_threat)

        # Assertions
        assert result is not None
        assert isinstance(result, AISummarySchema)
        assert result.summary == "Cached plain English summary."
        assert result.industries == ["finance"]
        assert result.business_risk_score == 5.0

        # Groq client should NOT have been initialized on cache hit
        mock_groq_class.assert_not_called()
        mock_redis.get.assert_called_once_with("ai:threat:CVE-2026-9999")

@pytest.mark.asyncio
async def test_summarize_threat_malformed_json_degradation():
    raw_threat = {
        "source_id": "CVE-2026-9999",
        "title": "SQL Injection in User Login"
    }

    mock_redis = AsyncMock()
    mock_redis.get.return_value = None
    mock_redis.close.return_value = None

    # Return invalid JSON
    mock_choice = MagicMock()
    mock_choice.message.content = "Invalid JSON structure from model"
    
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    
    mock_completions = AsyncMock()
    mock_completions.create.return_value = mock_response

    mock_client_instance = MagicMock()
    mock_client_instance.chat = MagicMock(completions=mock_completions)

    with patch("app.services.ai_summarizer.aioredis.from_url", return_value=mock_redis), \
         patch("app.services.ai_summarizer.AsyncGroq", return_value=mock_client_instance):
        
        result = await summarize_threat(raw_threat)

        # Should degrade gracefully by returning None instead of raising JSONDecodeError
        assert result is None

@pytest.mark.asyncio
async def test_summarize_threat_fallback_success():
    raw_threat = {
        "source_id": "CVE-2026-9999",
        "title": "SQL Injection in User Login"
    }

    mock_redis = AsyncMock()
    mock_redis.get.return_value = None
    mock_redis.set.return_value = True
    mock_redis.close.return_value = None

    # We mock completions.create so that the first call raises an exception,
    # and the second call returns a valid response.
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps({
        "summary": "This is a fallback summary.",
        "recommendations": ["Do this"],
        "industries": ["finance"],
        "business_risk_score": 7.0
    })
    
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    
    mock_completions = AsyncMock()
    # side_effect to raise an error first time, and return response the second time
    mock_completions.create.side_effect = [
        Exception("Rate limit hit on first model"),
        mock_response
    ]

    mock_client_instance = MagicMock()
    mock_client_instance.chat = MagicMock(completions=mock_completions)

    with patch("app.services.ai_summarizer.aioredis.from_url", return_value=mock_redis), \
         patch("app.services.ai_summarizer.AsyncGroq", return_value=mock_client_instance):
        
        result = await summarize_threat(raw_threat)

        assert result is not None
        assert isinstance(result, AISummarySchema)
        assert result.summary == "This is a fallback summary."
        assert result.business_risk_score == 7.0

        # completions.create should have been called twice (1st failed, 2nd succeeded)
        assert mock_completions.create.call_count == 2
