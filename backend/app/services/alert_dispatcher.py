"""
alert_dispatcher.py
~~~~~~~~~~~~~~~~~~~~
Runs after AI processing completes for each threat. Pipeline:

  1. match_users_to_threat()    — find users relevant to this threat
  2. create_alert_records()     — bulk-insert Alert rows into Postgres
  3. dispatch_email_alerts()    — send SMTP email per user (if enabled)
  4. dispatch_webhook_alerts()  — POST JSON to user webhook URL (if set)

The top-level function `dispatch_alerts_for_threat()` orchestrates all four
steps and is called from the AI background worker after scoring.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import aiosmtplib
import httpx
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import SessionLocal
from app.models.alert import Alert
from app.models.threat import Threat
from app.models.user import User

logger = logging.getLogger("alert_dispatcher")


# ---------------------------------------------------------------------------
# 1. Match users
# ---------------------------------------------------------------------------

async def match_users_to_threat(
    threat: Threat,
    db: AsyncSession
) -> list[tuple[User, str]]:
    """
    Return a list of (User, reason) tuples for users that are relevant to
    the given threat. Relevance criteria (either condition qualifies):

      • User's industry is in threat's ai_industries list.
      • At least one item from user's tech_stack appears in threat's
        affected_products list.
    """
    ai_industries: list[str] = threat.ai_industries or []
    affected_products: list[str] = [p.lower() for p in (threat.affected_products or [])]

    result = await db.execute(select(User))
    all_users: list[User] = result.scalars().all()

    matched: list[tuple[User, str]] = []
    for user in all_users:
        reasons: list[str] = []

        # Industry match
        if user.industry and user.industry.lower() in [i.lower() for i in ai_industries]:
            reasons.append(f"industry match ({user.industry})")

        # Tech stack overlap
        if user.tech_stack:
            overlapping = [
                t for t in user.tech_stack
                if any(t.lower() in prod or prod in t.lower() for prod in affected_products)
            ]
            if overlapping:
                reasons.append(f"tech stack overlap ({', '.join(overlapping)})")

        if reasons:
            matched.append((user, "; ".join(reasons)))

    logger.info(
        f"Matched {len(matched)} users for threat {threat.source_id} "
        f"(industries={ai_industries}, products={threat.affected_products})"
    )
    return matched


# ---------------------------------------------------------------------------
# 2. Create alert records
# ---------------------------------------------------------------------------

async def create_alert_records(
    matched_users: list[tuple[User, str]],
    threat: Threat,
    db: AsyncSession,
) -> list[Alert]:
    """
    Bulk-insert Alert rows for each matched (User, reason) pair.
    Skips users that already have an alert for this threat to avoid duplicates.
    Returns the list of newly created Alert objects.
    """
    if not matched_users:
        return []

    # Fetch existing alert user_ids for this threat in one query
    existing_result = await db.execute(
        select(Alert.user_id).where(Alert.threat_id == threat.id)
    )
    already_alerted: set[UUID] = {row for row in existing_result.scalars().all()}

    new_alerts: list[Alert] = []
    for user, reason in matched_users:
        if user.id in already_alerted:
            logger.debug(f"User {user.email} already has an alert for {threat.source_id}, skipping.")
            continue

        alert = Alert(
            user_id=user.id,
            threat_id=threat.id,
            reason=reason,
            triggered_at=datetime.now(timezone.utc),
            delivered=False,
        )
        db.add(alert)
        new_alerts.append(alert)

    await db.flush()  # assign PKs without committing the outer transaction
    logger.info(f"Created {len(new_alerts)} new alert records for threat {threat.source_id}.")
    return new_alerts


# ---------------------------------------------------------------------------
# 3. Dispatch email alerts
# ---------------------------------------------------------------------------

def _build_email_html(user: User, threat: Threat, reason: str) -> str:
    severity = (threat.severity or "unknown").upper()
    score = threat.ai_risk_score or 0.0
    summary = threat.ai_summary or "No AI summary available yet."
    recs = threat.ai_recommendations or []
    rec_items = "".join(f"<li>{r}</li>" for r in recs)
    threat_url = f"{settings.APP_BASE_URL}/threats/{threat.id}"

    return f"""
    <html><body style="font-family:sans-serif;color:#1e293b;max-width:600px;margin:auto;">
      <div style="background:#0f172a;padding:24px;border-radius:8px 8px 0 0;">
        <h1 style="color:#f8fafc;margin:0;font-size:20px;">⚠️ ThreatLens Alert</h1>
      </div>
      <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
        <p>Hi {user.name},</p>
        <p>A new threat relevant to your profile has been detected:</p>

        <div style="background:#f1f5f9;border-left:4px solid #dc2626;padding:16px;border-radius:4px;margin:16px 0;">
          <strong style="font-size:16px;">{threat.title}</strong><br/>
          <span style="color:#64748b;font-size:13px;">{threat.source_id} &bull; Severity: <strong>{severity}</strong> &bull; Risk Score: <strong>{score}/10</strong></span>
        </div>

        <p><strong>Why you're receiving this:</strong> {reason}</p>

        <p><strong>What this means:</strong><br/>{summary}</p>

        {"<p><strong>Recommended actions:</strong></p><ul>" + rec_items + "</ul>" if recs else ""}

        <a href="{threat_url}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;
                  border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px;">
          View Full Threat Details →
        </a>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
        <p style="font-size:12px;color:#94a3b8;">
          You're receiving this because you signed up for ThreatLens alerts.<br/>
          Manage your preferences at {settings.FRONTEND_URL}/settings
        </p>
      </div>
    </body></html>
    """


async def dispatch_email_alerts(
    matched_users: list[tuple[User, str]],
    threat: Threat,
) -> None:
    """
    Send an HTML alert email to every matched user who has
    alert_email_enabled=True. Skips silently if SMTP is not configured.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP not configured (SMTP_USER/SMTP_PASSWORD empty). Skipping email dispatch.")
        return

    email_recipients = [(u, r) for u, r in matched_users if u.alert_email_enabled]
    if not email_recipients:
        return

    try:
        smtp = aiosmtplib.SMTP(
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            start_tls=True,
        )
        await smtp.connect()
        await smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

        for user, reason in email_recipients:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = f"[ThreatLens] {(threat.severity or 'new').upper()} threat: {threat.source_id}"
                msg["From"] = f"ThreatLens Alerts <{settings.ALERT_FROM_EMAIL}>"
                msg["To"] = user.email

                html_body = _build_email_html(user, threat, reason)
                msg.attach(MIMEText(html_body, "html"))

                await smtp.send_message(msg)
                logger.info(f"Email sent to {user.email} for threat {threat.source_id}.")
            except Exception as email_err:
                logger.warning(f"Failed to send email to {user.email}: {email_err}")

        await smtp.quit()

    except Exception as smtp_err:
        logger.error(f"SMTP connection failed for threat {threat.source_id}: {smtp_err}")


# ---------------------------------------------------------------------------
# 4. Dispatch webhook alerts
# ---------------------------------------------------------------------------

def _build_webhook_payload(user: User, threat: Threat, reason: str) -> dict:
    return {
        "event": "threat.alert",
        "threat": {
            "id": str(threat.id),
            "source_id": threat.source_id,
            "title": threat.title,
            "severity": threat.severity,
            "ai_risk_score": threat.ai_risk_score,
            "cvss_score": threat.cvss_score,
            "is_actively_exploited": threat.is_actively_exploited,
            "patch_available": threat.patch_available,
            "ai_summary": threat.ai_summary,
            "ai_recommendations": threat.ai_recommendations or [],
            "published_at": threat.published_at.isoformat() if threat.published_at else None,
        },
        "alert": {
            "reason": reason,
            "triggered_for_industry": user.industry,
            "triggered_at": datetime.now(timezone.utc).isoformat(),
        },
    }


async def dispatch_webhook_alerts(
    matched_users: list[tuple[User, str]],
    threat: Threat,
) -> None:
    """
    POST a JSON payload to every matched user that has a webhook URL configured.
    Times out after 10 s per request; failures are logged and skipped.
    """
    webhook_recipients = [(u, r) for u, r in matched_users if u.alert_webhook_url]
    if not webhook_recipients:
        return

    async with httpx.AsyncClient(timeout=10.0) as client:
        for user, reason in webhook_recipients:
            try:
                payload = _build_webhook_payload(user, threat, reason)
                response = await client.post(
                    user.alert_webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()
                logger.info(
                    f"Webhook delivered to {user.alert_webhook_url} "
                    f"for user {user.email} (threat {threat.source_id}). "
                    f"HTTP {response.status_code}"
                )
            except Exception as wh_err:
                logger.warning(
                    f"Webhook delivery failed for user {user.email} "
                    f"({user.alert_webhook_url}): {wh_err}"
                )


# ---------------------------------------------------------------------------
# Orchestrator — called from worker.py
# ---------------------------------------------------------------------------

async def dispatch_alerts_for_threat(threat_id: str) -> None:
    """
    Full alert pipeline for a single threat (called after AI scoring):

      1. Open a DB session
      2. Load the threat
      3. Match users
      4. Create alert records in DB
      5. Fire emails + webhooks concurrently (outside the DB transaction)
    """
    import asyncio

    async with SessionLocal() as db:
        try:
            from sqlalchemy import select as sa_select
            result = await db.execute(sa_select(Threat).where(Threat.id == threat_id))
            threat = result.scalar_one_or_none()

            if not threat:
                logger.warning(f"dispatch_alerts_for_threat: threat {threat_id} not found.")
                return

            matched = await match_users_to_threat(threat, db)

            if not matched:
                logger.info(f"No users matched for threat {threat.source_id}. No alerts created.")
                return

            await create_alert_records(matched, threat, db)
            await db.commit()

            # Fire delivery concurrently — failures don't roll back DB
            await asyncio.gather(
                dispatch_email_alerts(matched, threat),
                dispatch_webhook_alerts(matched, threat),
                return_exceptions=True,
            )

        except Exception as e:
            logger.error(f"dispatch_alerts_for_threat failed for {threat_id}: {e}")
            await db.rollback()
