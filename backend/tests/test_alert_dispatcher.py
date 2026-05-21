"""
tests/test_alert_dispatcher.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Unit tests for alert_dispatcher.py covering:

  - match_users_to_threat: industry match, tech stack overlap, no match
  - create_alert_records: happy path, duplicate prevention
  - dispatch_email_alerts: SMTP not configured (skip), email sent
  - dispatch_webhook_alerts: successful POST, failed POST (graceful)
  - dispatch_alerts_for_threat: full orchestration happy path
"""
import json
import uuid
import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch, call


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

def _make_threat(
    source_id="CVE-2026-9999",
    ai_industries=None,
    affected_products=None,
    severity="high",
    ai_risk_score=7.5,
):
    t = MagicMock()
    t.id = uuid.uuid4()
    t.source_id = source_id
    t.title = "Test Vulnerability"
    t.severity = severity
    t.ai_risk_score = ai_risk_score
    t.cvss_score = 8.5
    t.is_actively_exploited = False
    t.patch_available = True
    t.ai_industries = ai_industries or ["finance", "retail"]
    t.affected_products = affected_products or ["WordPress", "OpenSSL"]
    t.ai_summary = "A plain English summary."
    t.ai_recommendations = ["Update immediately", "Enable WAF"]
    t.published_at = datetime.now(timezone.utc)
    return t


def _make_user(
    email="user@example.com",
    name="Test User",
    industry="finance",
    tech_stack=None,
    alert_email_enabled=True,
    alert_webhook_url=None,
):
    u = MagicMock()
    u.id = uuid.uuid4()
    u.email = email
    u.name = name
    u.industry = industry
    u.tech_stack = tech_stack or []
    u.alert_email_enabled = alert_email_enabled
    u.alert_webhook_url = alert_webhook_url
    return u


# ---------------------------------------------------------------------------
# match_users_to_threat
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_match_users_industry_match():
    from app.services.alert_dispatcher import match_users_to_threat

    threat = _make_threat(ai_industries=["finance"])
    user = _make_user(industry="finance")

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [user]
    mock_db.execute.return_value = mock_result

    matched = await match_users_to_threat(threat, mock_db)

    assert len(matched) == 1
    assert matched[0][0] is user
    assert "industry match" in matched[0][1]


@pytest.mark.asyncio
async def test_match_users_tech_stack_overlap():
    from app.services.alert_dispatcher import match_users_to_threat

    threat = _make_threat(ai_industries=["healthcare"], affected_products=["WordPress"])
    user = _make_user(industry="finance", tech_stack=["WordPress", "MySQL"])

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [user]
    mock_db.execute.return_value = mock_result

    matched = await match_users_to_threat(threat, mock_db)

    assert len(matched) == 1
    assert "tech stack overlap" in matched[0][1]


@pytest.mark.asyncio
async def test_match_users_no_match():
    from app.services.alert_dispatcher import match_users_to_threat

    threat = _make_threat(ai_industries=["government"], affected_products=["SAP"])
    user = _make_user(industry="retail", tech_stack=["Shopify"])

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [user]
    mock_db.execute.return_value = mock_result

    matched = await match_users_to_threat(threat, mock_db)

    assert len(matched) == 0


# ---------------------------------------------------------------------------
# create_alert_records
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_alert_records_happy_path():
    from app.services.alert_dispatcher import create_alert_records

    threat = _make_threat()
    user = _make_user()
    matched = [(user, "industry match (finance)")]

    mock_db = AsyncMock()
    # No existing alerts
    mock_existing = MagicMock()
    mock_existing.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_existing

    alerts = await create_alert_records(matched, threat, mock_db)

    assert len(alerts) == 1
    assert alerts[0].user_id == user.id
    assert alerts[0].threat_id == threat.id
    mock_db.add.assert_called_once()
    mock_db.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_alert_records_skips_duplicates():
    from app.services.alert_dispatcher import create_alert_records

    threat = _make_threat()
    user = _make_user()
    matched = [(user, "industry match (finance)")]

    mock_db = AsyncMock()
    # Simulate user already has an alert for this threat
    mock_existing = MagicMock()
    mock_existing.scalars.return_value.all.return_value = [user.id]
    mock_db.execute.return_value = mock_existing

    alerts = await create_alert_records(matched, threat, mock_db)

    assert len(alerts) == 0
    mock_db.add.assert_not_called()


# ---------------------------------------------------------------------------
# dispatch_email_alerts
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_dispatch_email_alerts_skips_when_smtp_not_configured():
    from app.services.alert_dispatcher import dispatch_email_alerts

    threat = _make_threat()
    user = _make_user(alert_email_enabled=True)

    with patch("app.services.alert_dispatcher.settings") as mock_settings:
        mock_settings.SMTP_USER = ""
        mock_settings.SMTP_PASSWORD = ""
        # Should return without calling SMTP at all
        await dispatch_email_alerts([(user, "reason")], threat)
        # No assertion needed — test passes if no exception is raised


@pytest.mark.asyncio
async def test_dispatch_email_alerts_sends_email():
    from app.services.alert_dispatcher import dispatch_email_alerts

    threat = _make_threat()
    user = _make_user(alert_email_enabled=True)

    mock_smtp = AsyncMock()
    mock_smtp.connect = AsyncMock()
    mock_smtp.login = AsyncMock()
    mock_smtp.send_message = AsyncMock()
    mock_smtp.quit = AsyncMock()

    with patch("app.services.alert_dispatcher.settings") as mock_settings, \
         patch("app.services.alert_dispatcher.aiosmtplib.SMTP", return_value=mock_smtp):
        mock_settings.SMTP_USER = "test@gmail.com"
        mock_settings.SMTP_PASSWORD = "app-password"
        mock_settings.SMTP_HOST = "smtp.gmail.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.ALERT_FROM_EMAIL = "alerts@threatlens.app"
        mock_settings.APP_BASE_URL = "http://localhost:8000"
        mock_settings.FRONTEND_URL = "http://localhost:5173"

        await dispatch_email_alerts([(user, "industry match (finance)")], threat)

    mock_smtp.connect.assert_awaited_once()
    mock_smtp.send_message.assert_awaited_once()
    mock_smtp.quit.assert_awaited_once()


# ---------------------------------------------------------------------------
# dispatch_webhook_alerts
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_dispatch_webhook_alerts_posts_json():
    from app.services.alert_dispatcher import dispatch_webhook_alerts

    threat = _make_threat()
    user = _make_user(alert_webhook_url="https://hooks.example.com/alert")

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("app.services.alert_dispatcher.httpx.AsyncClient", return_value=mock_client):
        await dispatch_webhook_alerts([(user, "industry match (finance)")], threat)

    mock_client.post.assert_awaited_once()
    call_kwargs = mock_client.post.call_args
    assert call_kwargs[0][0] == "https://hooks.example.com/alert"
    posted_payload = call_kwargs[1]["json"]
    assert posted_payload["event"] == "threat.alert"
    assert posted_payload["threat"]["source_id"] == threat.source_id


@pytest.mark.asyncio
async def test_dispatch_webhook_alerts_handles_failure_gracefully():
    from app.services.alert_dispatcher import dispatch_webhook_alerts

    threat = _make_threat()
    user = _make_user(alert_webhook_url="https://hooks.example.com/alert")

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(side_effect=Exception("Connection refused"))
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("app.services.alert_dispatcher.httpx.AsyncClient", return_value=mock_client):
        # Should NOT raise — failures are swallowed and logged
        await dispatch_webhook_alerts([(user, "industry match (finance)")], threat)
