import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.feed_ingestion import run_ingestion_job
from app.config import settings

logger = logging.getLogger("scheduler")

scheduler = AsyncIOScheduler()

def start_scheduler():
    logger.info("Initializing APScheduler...")
    
    # Schedule ingestion job to run every N hours
    scheduler.add_job(
        run_ingestion_job,
        "interval",
        hours=settings.INGESTION_INTERVAL_HOURS,
        id="feed_ingestion_job",
        replace_existing=True
    )
    
    # Also trigger once immediately on startup
    scheduler.add_job(
        run_ingestion_job,
        id="feed_ingestion_startup_job"
    )
    
    scheduler.start()
    logger.info("Scheduler started successfully.")

def shutdown_scheduler():
    logger.info("Shutting down scheduler...")
    try:
        scheduler.shutdown()
        logger.info("Scheduler shut down successfully.")
    except Exception as e:
        logger.error(f"Error shutting down scheduler: {e}")
