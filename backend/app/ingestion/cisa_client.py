import logging
from typing import List, Dict, Any, Set
import httpx

logger = logging.getLogger("cisa_client")

class CISAClient:
    def __init__(self):
        self.catalog_url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

    async def fetch_kev_catalog(self) -> List[Dict[str, Any]]:
        logger.info("Fetching CISA KEV catalog...")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.catalog_url, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                return data.get("vulnerabilities", [])
        except Exception as e:
            logger.error(f"Error fetching CISA KEV catalog: {e}")
            return []

    def get_new_entries(self, vulnerabilities: List[Dict[str, Any]], known_ids: Set[str]) -> List[Dict[str, Any]]:
        new_entries = []
        for vuln in vulnerabilities:
            cve_id = vuln.get("cveID")
            if cve_id and cve_id not in known_ids:
                new_entries.append(vuln)
        return new_entries
