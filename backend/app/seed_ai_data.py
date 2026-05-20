import asyncio
import sys
from pathlib import Path
import random

# Add parent dir to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.models.threat import Threat
from app.services.risk_scorer import compute_risk_score
from sqlalchemy import select

INDUSTRIES = [
    "healthcare", "finance", "retail", "education", "manufacturing",
    "technology", "legal", "hospitality", "government", "nonprofit"
]

def generate_mock_ai_data(threat: Threat):
    # Determine some keywords from title or description
    title = threat.title.lower() if threat.title else ""
    desc = threat.description.lower() if threat.description else ""
    
    # Select realistic industries
    industry_pool = []
    if "apache" in desc or "nginx" in desc or "http" in desc or "web" in desc:
        industry_pool.extend(["technology", "retail", "finance", "hospitality"])
    if "medical" in desc or "health" in desc or "patient" in desc:
        industry_pool.extend(["healthcare", "technology"])
    if "school" in desc or "student" in desc or "education" in desc:
        industry_pool.extend(["education", "nonprofit"])
    if "bank" in desc or "crypto" in desc or "ledger" in desc or "payment" in desc:
        industry_pool.extend(["finance", "retail"])
    if "industrial" in desc or "factory" in desc or "controller" in desc or "iot" in desc:
        industry_pool.extend(["manufacturing", "technology"])
        
    if not industry_pool:
        # Fallback to random industries
        industry_pool = random.sample(INDUSTRIES, k=random.randint(1, 3))
    else:
        # Keep unique
        industry_pool = list(set(industry_pool))
        if len(industry_pool) > 3:
            industry_pool = random.sample(industry_pool, k=3)
            
    # Mock AI summary
    cve_id = threat.source_id or "this CVE"
    cve_title = threat.title or "Vulnerability"
    summary_templates = [
        f"A security issue in {cve_title} ({cve_id}) has been identified where attackers can exploit weaknesses in the input validation handlers. If left unpatched, this could lead to unauthorized system access, data disclosure, or system instability.",
        f"A critical security flaw related to {cve_id} allows remote authenticated attackers to trigger a buffer overflow. This vulnerability poses an immediate threat to the confidentiality and integrity of your server files.",
        f"A weakness in {cve_title} ({cve_id}) could permit remote attackers to bypass security restrictions and access administrative panels. It is highly recommended to restrict external access to these administrative entry points.",
        f"An input validation vulnerability in {cve_id} allows remote attackers to inject malicious code via crafted web requests. This could allow attackers to execute commands on the underlying host operating system."
    ]
    ai_summary = random.choice(summary_templates)
    
    # Mock recommendations
    recs = []
    if threat.patch_available and threat.patch_url:
        recs.append(f"Update immediately. Refer to the official security advisory for the patch link: {threat.patch_url}")
    else:
        recs.append("Apply official vendor patches or upgrade to the latest stable version immediately.")
        
    recs.extend([
        "Configure network firewalls and security groups to block external traffic on the affected service ports.",
        "Enable multi-factor authentication (MFA) across all administrative accounts to mitigate credential attacks.",
        "Implement rate limiting on api endpoints and monitor authentication logs for brute force patterns."
    ])
    
    # Risk calculation
    cvss = threat.cvss_score
    is_exploited = threat.is_actively_exploited
    # Mock AI score: base it roughly on CVSS or default to 5.0
    ai_score = cvss if cvss is not None else (7.5 if is_exploited else 3.5)
    
    ai_risk = compute_risk_score(
        cvss=cvss,
        is_exploited=is_exploited,
        ai_score=ai_score,
        patch_available=threat.patch_available
    )
    
    return ai_risk, ai_summary, recs, industry_pool

async def main():
    print("Starting AI threat backfill process...")
    async with SessionLocal() as db:
        result = await db.execute(select(Threat))
        threats = result.scalars().all()
        print(f"Loaded {len(threats)} threats.")
        
        count = 0
        for threat in threats:
            if threat.ai_risk_score is None:
                ai_risk, ai_summary, recs, industries = generate_mock_ai_data(threat)
                threat.ai_risk_score = ai_risk
                threat.ai_summary = ai_summary
                threat.ai_recommendations = recs
                threat.ai_industries = industries
                count += 1
                
                # Commit in batches of 100
                if count % 100 == 0:
                    await db.commit()
                    print(f"Processed and committed {count} threats...")
                    
        await db.commit()
        print(f"Completed! Total threats updated with AI data: {count}")

if __name__ == "__main__":
    asyncio.run(main())
