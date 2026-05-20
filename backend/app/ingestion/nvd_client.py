import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
import httpx
from app.config import settings
from app.schemas.ingestion import RawThreat

logger = logging.getLogger("nvd_client")

class NVDClient:
    def __init__(self):
        self.base_url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
        self.headers = {}
        if settings.NVD_API_KEY and not settings.NVD_API_KEY.startswith("your_"):
            self.headers["apiKey"] = settings.NVD_API_KEY

    async def _request_with_retry(self, client: httpx.AsyncClient, params: Dict[str, Any]) -> Dict[str, Any]:
        retries = 3
        delay = 2.0
        for attempt in range(retries + 1):
            try:
                response = await client.get(self.base_url, headers=self.headers, params=params, timeout=30.0)
                if response.status_code == 429:
                    if attempt == retries:
                        response.raise_for_status()
                    logger.warning(f"NVD API rate limited (429). Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                    delay *= 2
                    continue
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, httpx.NetworkError) as e:
                if attempt == retries:
                    raise
                logger.warning(f"NVD API request failed: {e}. Retrying in {delay}s...")
                await asyncio.sleep(delay)
                delay *= 2
        raise Exception("NVD API request failed after retries")

    async def fetch_recent_cves(self, hours_back: int = 12) -> List[RawThreat]:
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(hours=hours_back)

        start_str = start_time.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        end_str = end_time.strftime("%Y-%m-%dT%H:%M:%S.000Z")

        raw_threats: List[RawThreat] = []
        limit = 100
        start_index = 0

        async with httpx.AsyncClient() as client:
            while True:
                params = {
                    "pubStartDate": start_str,
                    "pubEndDate": end_str,
                    "resultsPerPage": limit,
                    "startIndex": start_index
                }
                logger.info(f"Fetching CVEs from NVD starting index {start_index}...")
                try:
                    data = await self._request_with_retry(client, params)
                except Exception as e:
                    logger.error(f"Error fetching CVEs from NVD: {e}")
                    break

                vulnerabilities = data.get("vulnerabilities", [])
                if not vulnerabilities:
                    break

                for vuln in vulnerabilities:
                    cve = vuln.get("cve", {})
                    if not cve:
                        continue
                    
                    parsed = self._parse_cve(cve)
                    if parsed:
                        raw_threats.append(parsed)

                total_results = data.get("totalResults", 0)
                start_index += len(vulnerabilities)
                if start_index >= total_results or len(vulnerabilities) < limit:
                    break

        return raw_threats

    def _parse_cve(self, cve: Dict[str, Any]) -> Optional[RawThreat]:
        try:
            source_id = cve.get("id")
            if not source_id:
                return None

            descriptions = cve.get("descriptions", [])
            desc_val = ""
            for desc in descriptions:
                if desc.get("lang") == "en":
                    desc_val = desc.get("value", "")
                    break
            if not desc_val and descriptions:
                desc_val = descriptions[0].get("value", "")

            published_str = cve.get("published", "")
            updated_str = cve.get("lastModified", "")
            
            published_at = datetime.fromisoformat(published_str.replace("Z", "+00:00")) if published_str else datetime.now(timezone.utc)
            updated_at = datetime.fromisoformat(updated_str.replace("Z", "+00:00")) if updated_str else datetime.now(timezone.utc)

            title = f"Vulnerability in {source_id}"
            
            cvss_score = None
            cvss_vector = None
            metrics = cve.get("metrics", {})
            
            cvss_data = None
            for key in ["cvssMetricV31", "cvssMetricV30"]:
                if key in metrics and metrics[key]:
                    cvss_data = metrics[key][0].get("cvssData", {})
                    break
            if not cvss_data and "cvssMetricV2" in metrics and metrics["cvssMetricV2"]:
                cvss_data = metrics["cvssMetricV2"][0].get("cvssData", {})

            if cvss_data:
                cvss_score = cvss_data.get("baseScore")
                cvss_vector = cvss_data.get("vectorString")

            cwe_ids = []
            weaknesses = cve.get("weaknesses", [])
            for weak in weaknesses:
                desc_list = weak.get("description", [])
                for d in desc_list:
                    val = d.get("value", "")
                    if val and val.startswith("CWE-"):
                        cwe_ids.append(val)

            affected_products = []
            configurations = cve.get("configurations", [])
            for config in configurations:
                nodes = config.get("nodes", [])
                for node in nodes:
                    cpe_matches = node.get("cpeMatch", [])
                    for match in cpe_matches:
                        cpe_uri = match.get("criteria")
                        if cpe_uri:
                            affected_products.append(cpe_uri)

            patch_available = False
            patch_url = None
            references = cve.get("references", [])
            for ref in references:
                tags = ref.get("tags", [])
                url = ref.get("url")
                if url:
                    if "Patch" in tags or "patch" in url.lower():
                        patch_available = True
                        patch_url = url
                        break
            
            if not patch_url and references:
                patch_url = references[0].get("url")

            return RawThreat(
                source="nvd",
                source_id=source_id,
                title=title,
                description=desc_val,
                published_at=published_at,
                updated_at=updated_at,
                cvss_score=cvss_score,
                cvss_vector=cvss_vector,
                cwe_ids=cwe_ids,
                affected_products=affected_products,
                patch_available=patch_available,
                patch_url=patch_url,
                is_actively_exploited=False
            )
        except Exception as e:
            logger.error(f"Error parsing CVE {cve.get('id')}: {e}")
            return None
