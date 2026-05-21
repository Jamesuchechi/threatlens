import asyncio
import logging
from datetime import datetime, timezone
import redis.asyncio as aioredis
from sqlalchemy import select

from app.database import SessionLocal
from app.config import settings
from app.models.threat import Threat
from app.services.ai_summarizer import summarize_threat
from app.services.risk_scorer import compute_risk_score
from app.services.alert_dispatcher import dispatch_alerts_for_threat

logger = logging.getLogger("ai_worker")

async def start_ai_worker():
    print("AI WORKER: Starting background task...", flush=True)
    logger.info("Starting AI processing background worker...")
    
    try:
        print(f"AI WORKER: Connecting to Redis URL: {settings.REDIS_URL}", flush=True)
        r = aioredis.from_url(settings.REDIS_URL, socket_timeout=5)
        print("AI WORKER: Redis connection initialized, entering pop loop...", flush=True)
    except Exception as init_err:
        print(f"AI WORKER CRITICAL: Failed to initialize Redis connection: {init_err}", flush=True)
        logger.error(f"Failed to initialize Redis connection in worker: {init_err}")
        return

    try:
        while True:
            try:
                # Retrieve threat ID from Redis queue (blocking pop)
                print("AI WORKER: Polling Redis queue queue:ai_processing...", flush=True)
                result = await r.brpop("queue:ai_processing", timeout=5)
                if not result:
                    print("AI WORKER: No items popped (timeout).", flush=True)
                    continue
                
                _, threat_id_str = result
                threat_id = threat_id_str.decode("utf-8") if isinstance(threat_id_str, bytes) else threat_id_str
                
                print(f"AI WORKER: Popped threat ID {threat_id} from queue.", flush=True)
                logger.info(f"AI Worker popped threat {threat_id} from queue.")
                
                # Process the threat
                await process_queued_threat(threat_id)
                
            except asyncio.CancelledError:
                print("AI WORKER: Task cancelled by lifespan manager.", flush=True)
                logger.info("AI Worker task cancelled.")
                break
            except Exception as e:
                print(f"AI WORKER ERROR: Exception in worker loop iteration: {e}", flush=True)
                logger.error(f"Error in AI worker loop iteration: {e}")
                # Prevent tight loops on error
                await asyncio.sleep(2)
    finally:
        print("AI WORKER: Closing Redis connection and exiting.", flush=True)
        await r.close()
        logger.info("AI Worker stopped.")

async def process_queued_threat(threat_id: str):
    print(f"AI WORKER: Processing threat ID {threat_id}...", flush=True)
    async with SessionLocal() as db:
        try:
            # Query the threat
            stmt = select(Threat).where(Threat.id == threat_id)
            res = await db.execute(stmt)
            threat = res.scalar_one_or_none()
            
            if not threat:
                print(f"AI WORKER WARNING: Threat {threat_id} not found in database.", flush=True)
                logger.warning(f"Threat {threat_id} not found in database.")
                return
            
            # Prepare payload for AI summarizer
            raw_threat_payload = {
                "source_id": threat.source_id,
                "title": threat.title,
                "description": threat.description,
                "cvss_score": threat.cvss_score,
                "patch_available": threat.patch_available,
                "affected_products": threat.affected_products or []
            }
            
            # Call AI Summarizer
            print(f"AI WORKER: Calling AI summarizer for {threat.source_id}...", flush=True)
            ai_data = await summarize_threat(raw_threat_payload)
            
            if ai_data:
                # Calculate composite risk score
                computed_risk = compute_risk_score(
                    cvss=threat.cvss_score,
                    is_exploited=threat.is_actively_exploited,
                    ai_score=ai_data.business_risk_score,
                    patch_available=threat.patch_available
                )
                
                # Update threat details
                threat.ai_summary = ai_data.summary
                threat.ai_recommendations = ai_data.recommendations
                threat.ai_industries = ai_data.industries
                threat.ai_risk_score = computed_risk
                threat.ai_processed_at = datetime.now(timezone.utc)
                
                await db.commit()
                print(f"AI WORKER SUCCESS: Updated threat {threat.source_id} (ID: {threat_id}) in DB. Risk score: {computed_risk}", flush=True)
                logger.info(f"Successfully processed and updated AI summary for threat {threat.source_id} (ID: {threat_id}). Risk score: {computed_risk}")

                # Dispatch alerts to matched users (non-blocking — failures are caught internally)
                try:
                    await dispatch_alerts_for_threat(str(threat_id))
                except Exception as dispatch_err:
                    logger.error(f"Alert dispatch failed for threat {threat_id}: {dispatch_err}")
            else:
                print(f"AI WORKER WARNING: AI summarization returned None for threat {threat.source_id} (ID: {threat_id}). Marking as processed anyway.", flush=True)
                logger.warning(f"AI summarization returned None for threat {threat.source_id} (ID: {threat_id}). Marking as attempted.")
                threat.ai_processed_at = datetime.now(timezone.utc)
                await db.commit()
                
        except Exception as e:
            print(f"AI WORKER ERROR: Exception processing threat {threat_id} in db transaction: {e}", flush=True)
            logger.error(f"Error processing threat {threat_id} in worker: {e}")
            await db.rollback()
