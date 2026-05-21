import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import SessionLocal
from app.models.threat import Threat

async def seed_threats():
    async with SessionLocal() as db:
        print("Seeding 120 threats to verify pagination and stability...")
        for i in range(120):
            t = Threat(
                source="nvd",
                source_id=f"CVE-2026-10{i:03d}",
                title=f"Sample Vulnerability {i} affecting React and Docker",
                description=f"A test vulnerability description for CVE-2026-10{i:03d}.",
                published_at=datetime.now(timezone.utc) - timedelta(days=i%10),
                updated_at=datetime.now(timezone.utc),
                cvss_score=8.0 + (i % 2),
                cvss_vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                cwe_ids=["CWE-79"],
                affected_products=["React", "Docker", "Node.js"],
                patch_available=(i % 3 == 0),
                patch_url="http://example.com/patch" if (i % 3 == 0) else None,
                is_actively_exploited=(i % 5 == 0),
                # Pre-populated AI analysis to bypass worker delay for E2E
                ai_risk_score=8.5 + (i % 1),
                ai_summary="AI synthesis: This represents a high risk for tech stacks using React and Docker.",
                ai_recommendations=["Update React", "Isolate Docker containers"]
            )
            db.add(t)
        await db.commit()
        print("Done seeding.")

if __name__ == "__main__":
    asyncio.run(seed_threats())
