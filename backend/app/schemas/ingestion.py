from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class RawThreat(BaseModel):
    source: str                   # "nvd" | "cisa" | "abuseipdb"
    source_id: str                # CVE-2024-12345 or equivalent
    title: str
    description: str
    published_at: datetime
    updated_at: datetime
    cvss_score: Optional[float] = None
    cvss_vector: Optional[str] = None
    cwe_ids: List[str] = []
    affected_products: List[str] = []
    patch_available: bool = False
    patch_url: Optional[str] = None
    is_actively_exploited: bool = False
