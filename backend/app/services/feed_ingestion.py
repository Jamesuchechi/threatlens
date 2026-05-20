import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert
import redis.asyncio as aioredis

from app.database import SessionLocal
from app.config import settings
from app.models.threat import Threat
from app.ingestion.nvd_client import NVDClient
from app.ingestion.cisa_client import CISAClient
from app.ingestion.abuseipdb_client import AbuseIPDBClient

logger = logging.getLogger("feed_ingestion")

async def run_ingestion_job():
    async with SessionLocal() as db:
        try:
            await run_ingestion(db)
        except Exception as e:
            logger.error(f"Error running ingestion job: {e}")

async def run_ingestion(db: AsyncSession):
    logger.info("Starting feed ingestion pipeline...")
    
    nvd_client = NVDClient()
    cisa_client = CISAClient()
    abuseipdb_client = AbuseIPDBClient()

    # 1. Fetch NVD CVEs
    logger.info("Fetching NVD CVEs...")
    nvd_threats = []
    try:
        nvd_threats = await nvd_client.fetch_recent_cves(hours_back=12)
        logger.info(f"Fetched {len(nvd_threats)} CVEs from NVD.")
    except Exception as e:
        logger.error(f"Failed to fetch NVD CVEs: {e}")

    # 2. Fetch CISA KEV catalog
    logger.info("Fetching CISA KEV...")
    kev_vulns = []
    kev_cve_ids = set()
    try:
        kev_vulns = await cisa_client.fetch_kev_catalog()
        kev_cve_ids = {v.get("cveID") for v in kev_vulns if v.get("cveID")}
        logger.info(f"Fetched {len(kev_vulns)} KEV entries from CISA.")
    except Exception as e:
        logger.error(f"Failed to fetch CISA KEV: {e}")

    # Enrich NVD CVEs with KEV status
    for t in nvd_threats:
        if t.source_id in kev_cve_ids:
            t.is_actively_exploited = True

    # 3. Fetch AbuseIPDB IP reputation threat blacklist
    logger.info("Fetching AbuseIPDB blacklist...")
    ip_threats = []
    try:
        ip_threats = await abuseipdb_client.fetch_blacklist()
        logger.info(f"Fetched {len(ip_threats)} IP threats from AbuseIPDB.")
    except Exception as e:
        logger.error(f"Failed to fetch AbuseIPDB blacklist: {e}")

    all_raw_threats = nvd_threats + ip_threats

    if not all_raw_threats:
        logger.info("No threats to ingest.")
        return

    # Get existing (source, source_id) from DB to identify new inserts
    result = await db.execute(select(Threat.id, Threat.source, Threat.source_id))
    existing_records = {(row[1], row[2]): row[0] for row in result.all()}

    new_threat_ids = []

    # Insert or update threats
    for raw in all_raw_threats:
        key = (raw.source, raw.source_id)
        
        # Build insert statement
        stmt = insert(Threat).values(
            source=raw.source,
            source_id=raw.source_id,
            title=raw.title,
            description=raw.description,
            published_at=raw.published_at,
            updated_at=raw.updated_at,
            cvss_score=raw.cvss_score,
            cvss_vector=raw.cvss_vector,
            cwe_ids=raw.cwe_ids,
            affected_products=raw.affected_products,
            patch_available=raw.patch_available,
            patch_url=raw.patch_url,
            is_actively_exploited=raw.is_actively_exploited
        )
        
        # On conflict do update
        stmt = stmt.on_conflict_do_update(
            index_elements=["source", "source_id"],
            set_={
                "title": stmt.excluded.title,
                "description": stmt.excluded.description,
                "updated_at": stmt.excluded.updated_at,
                "cvss_score": stmt.excluded.cvss_score,
                "cvss_vector": stmt.excluded.cvss_vector,
                "cwe_ids": stmt.excluded.cwe_ids,
                "affected_products": stmt.excluded.affected_products,
                "patch_available": stmt.excluded.patch_available,
                "patch_url": stmt.excluded.patch_url,
                "is_actively_exploited": stmt.excluded.is_actively_exploited
            }
        ).returning(Threat.id, Threat.ai_processed_at)

        res = await db.execute(stmt)
        row = res.first()
        if row:
            threat_uuid, ai_processed_at = row[0], row[1]
            
            # If it's a completely new threat or is not yet AI processed, queue it
            if key not in existing_records or ai_processed_at is None:
                new_threat_ids.append(threat_uuid)

    await db.commit()
    logger.info(f"Ingested {len(all_raw_threats)} threats. {len(new_threat_ids)} queued for AI processing.")

    # 4. Push new threat IDs to Redis queue
    if new_threat_ids:
        try:
            r = aioredis.from_url(settings.REDIS_URL, socket_timeout=5)
            # Push all to Redis queue:ai_processing
            await r.lpush("queue:ai_processing", *[str(tid) for tid in new_threat_ids])
            await r.close()
            logger.info("Successfully pushed threat IDs to Redis queue:ai_processing.")
        except Exception as e:
            logger.error(f"Failed to push threat IDs to Redis: {e}")

    # Update last ingestion run in Redis
    try:
        r = aioredis.from_url(settings.REDIS_URL, socket_timeout=5)
        await r.set("ingestion:last_run", datetime.now(timezone.utc).isoformat())
        await r.close()
    except Exception as e:
        logger.error(f"Failed to save last ingestion run time to Redis: {e}")
