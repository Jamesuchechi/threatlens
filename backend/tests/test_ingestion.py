import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone
from app.schemas.ingestion import RawThreat
from app.ingestion.nvd_client import NVDClient
from app.ingestion.cisa_client import CISAClient
from app.ingestion.abuseipdb_client import AbuseIPDBClient
from app.services.feed_ingestion import run_ingestion

@pytest.mark.asyncio
async def test_nvd_client_parsing():
    client = NVDClient()
    mock_response = {
        "vulnerabilities": [
            {
                "cve": {
                    "id": "CVE-2026-0001",
                    "descriptions": [{"lang": "en", "value": "Test Description"}],
                    "published": "2026-05-20T00:00:00Z",
                    "lastModified": "2026-05-20T01:00:00Z",
                    "metrics": {
                        "cvssMetricV31": [{
                            "cvssData": {
                                "baseScore": 9.8,
                                "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
                            }
                        }]
                    },
                    "weaknesses": [{
                        "description": [{"value": "CWE-79"}]
                    }],
                    "configurations": [{
                        "nodes": [{
                            "cpeMatch": [{"criteria": "cpe:2.3:a:test:test:1.0:*:*:*:*:*:*:*"}]
                        }]
                    }],
                    "references": [{"url": "http://example.com/patch", "tags": ["Patch"]}]
                }
            }
        ],
        "totalResults": 1
    }

    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.return_value = MagicMock(status_code=200, json=lambda: mock_response)
        res = await client.fetch_recent_cves(hours_back=1)
        assert len(res) == 1
        assert res[0].source_id == "CVE-2026-0001"
        assert res[0].cvss_score == 9.8
        assert res[0].cwe_ids == ["CWE-79"]
        assert res[0].patch_available is True
        assert res[0].patch_url == "http://example.com/patch"

@pytest.mark.asyncio
async def test_cisa_client_fetching():
    client = CISAClient()
    mock_response = {
        "vulnerabilities": [
            {"cveID": "CVE-2026-0001", "vulnerabilityName": "Test KEV"}
        ]
    }
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.return_value = MagicMock(status_code=200, json=lambda: mock_response)
        res = await client.fetch_kev_catalog()
        assert len(res) == 1
        assert res[0]["cveID"] == "CVE-2026-0001"

@pytest.mark.asyncio
async def test_abuseipdb_client_fetching():
    client = AbuseIPDBClient()
    mock_response = {
        "data": [
            {
                "ipAddress": "192.168.1.1",
                "abuseConfidenceScore": 95,
                "totalReports": 10,
                "lastReportedAt": "2026-05-20T00:00:00Z"
            }
        ]
    }
    with patch("app.config.settings.ABUSEIPDB_API_KEY", "dummy_key"):
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_get.return_value = MagicMock(status_code=200, json=lambda: mock_response)
            res = await client.fetch_blacklist(confidence=90, limit=1)
            assert len(res) == 1
            assert res[0].source_id == "192.168.1.1"
            assert res[0].cvss_score == 9.5
            assert res[0].is_actively_exploited is True
