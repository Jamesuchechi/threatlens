import logging
from datetime import datetime, timezone
from typing import List, Optional
import httpx
from app.config import settings
from app.schemas.ingestion import RawThreat

logger = logging.getLogger("abuseipdb_client")

class AbuseIPDBClient:
    def __init__(self):
        self.base_url = "https://api.abuseipdb.com/api/v2/blacklist"
        self.headers = {
            "Accept": "application/json",
            "Key": settings.ABUSEIPDB_API_KEY
        }

    async def fetch_blacklist(self, confidence: int = 90, limit: int = 500) -> List[RawThreat]:
        if not settings.ABUSEIPDB_API_KEY or settings.ABUSEIPDB_API_KEY.startswith("your_"):
            logger.warning("AbuseIPDB API key not configured or is placeholder. Skipping IP blacklist fetch.")
            return []

        logger.info(f"Fetching IP blacklist from AbuseIPDB with min confidence {confidence}...")
        try:
            params = {
                "confidenceMinimum": confidence,
                "limit": limit
            }
            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, headers=self.headers, params=params, timeout=30.0)
                response.raise_for_status()
                result = response.json()
                data = result.get("data", [])
                
                raw_threats = []
                for item in data:
                    ip = item.get("ipAddress")
                    score = item.get("abuseConfidenceScore", 0)
                    reports = item.get("totalReports", 0)
                    last_report_str = item.get("lastReportedAt")
                    
                    published_at = datetime.fromisoformat(last_report_str.replace("Z", "+00:00")) if last_report_str else datetime.now(timezone.utc)
                    
                    raw_threats.append(RawThreat(
                        source="abuseipdb",
                        source_id=ip,
                        title=f"Malicious IP: {ip}",
                        description=f"IP address {ip} reported for malicious activity. Abuse confidence score: {score}%. Total reports: {reports}.",
                        published_at=published_at,
                        updated_at=published_at,
                        cvss_score=float(score) / 10.0,
                        cvss_vector=None,
                        cwe_ids=[],
                        affected_products=[],
                        patch_available=False,
                        patch_url=None,
                        is_actively_exploited=True
                    ))
                return raw_threats
        except Exception as e:
            logger.error(f"Error fetching AbuseIPDB blacklist: {e}")
            return []
