# ThreatLens — Technical Documentation

> Complete reference for architecture, API, data models, services, and deployment.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Data Models](#2-data-models)
3. [API Reference](#3-api-reference)
4. [Service Layer](#4-service-layer)
5. [Data Ingestion Pipeline](#5-data-ingestion-pipeline)
6. [AI Summarization Engine](#6-ai-summarization-engine)
7. [Risk Scoring System](#7-risk-scoring-system)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Authentication & Security](#9-authentication--security)
10. [Database Schema](#10-database-schema)
11. [Environment Configuration](#11-environment-configuration)
12. [Deployment Guide](#12-deployment-guide)
13. [Testing](#13-testing)
14. [Error Handling & Logging](#14-error-handling--logging)

---

## 1. System Architecture

### Overview

ThreatLens follows a standard three-tier architecture: a React single-page application communicates with a FastAPI REST backend, which in turn reads from a PostgreSQL database and calls external APIs. A background scheduler handles periodic data ingestion independently of the request/response cycle.

```
Client (Browser)
     │
     │  HTTPS
     ▼
React SPA (Vercel)
     │
     │  REST / JSON
     ▼
FastAPI Backend (Railway)
     │          │           │
     ▼          ▼           ▼
PostgreSQL    Redis       GROQ API
(Neon)       (Upstash)   (GROQ)
     ▲
     │
Background Scheduler
     │          │           │
     ▼          ▼           ▼
NVD API     CISA KEV    AbuseIPDB
```

### Key Design Decisions

**Why FastAPI over Node.js/Express?**
Python has the richest ecosystem for data processing, async HTTP clients (httpx), and AI/ML integrations. FastAPI gives us automatic OpenAPI docs, request validation via Pydantic, and async-first design — ideal for I/O-heavy ingestion tasks.

**Why PostgreSQL over a NoSQL database?**
Threat data is relational: threats link to CVEs, CVEs link to affected products, users link to industry profiles and alert preferences. PostgreSQL's JSONB columns give us the flexibility of NoSQL for unstructured threat metadata while preserving relational integrity for core entities.

**Why Redis?**
Two purposes: (1) caching expensive AI-generated summaries to avoid re-calling the GROQ API for the same CVE repeatedly, and (2) as a simple job queue for the ingestion scheduler via Redis Lists.

**Why GROQ API over GPT-4?**
GROQ's longer context window and strong instruction-following make it well-suited for ingesting verbose CVE descriptions and producing structured, templated outputs. The system prompt can be long and detailed without degrading performance.

---

## 2. Data Models

### Threat

The core entity. Represents a single cybersecurity threat or vulnerability.

```python
class Threat(Base):
    __tablename__ = "threats"

    id: UUID                      # Primary key
    source: str                   # "nvd" | "cisa" | "abuseipdb"
    source_id: str                # CVE-2024-12345 or equivalent
    title: str                    # Short title
    description: str              # Raw description from source
    published_at: datetime        # When the threat was published
    updated_at: datetime          # Last update from source
    ingested_at: datetime         # When we ingested it
    cvss_score: float | None      # 0.0–10.0 from NVD, nullable
    cvss_vector: str | None       # CVSS vector string
    cwe_ids: list[str]            # ["CWE-79", "CWE-89"]
    affected_products: list[str]  # CPE strings
    patch_available: bool
    patch_url: str | None

    # AI-generated fields
    ai_summary: str | None        # Plain-English summary
    ai_recommendations: list[str] # Actionable steps
    ai_industries: list[str]      # Relevant industries
    ai_risk_score: float | None   # Our composite 1–10 score
    ai_processed_at: datetime | None

    # Indexing
    severity: str                 # "critical"|"high"|"medium"|"low"|"info"
    is_actively_exploited: bool   # From CISA KEV
```

### User

```python
class User(Base):
    __tablename__ = "users"

    id: UUID
    email: str                    # Unique
    hashed_password: str
    name: str
    industry: str                 # "healthcare"|"finance"|"retail"|...
    tech_stack: list[str]         # ["apache", "nginx", "wordpress", ...]
    alert_email_enabled: bool
    alert_webhook_url: str | None
    created_at: datetime
    last_login: datetime | None
```

### Alert

```python
class Alert(Base):
    __tablename__ = "alerts"

    id: UUID
    user_id: UUID                 # FK → users.id
    threat_id: UUID               # FK → threats.id
    triggered_at: datetime
    reason: str                   # Why this alert was triggered
    delivered: bool
    delivered_at: datetime | None
```

---

## 3. API Reference

Base URL: `https://api.threatlens.app/v1`

All endpoints return JSON. Authenticated endpoints require `Authorization: Bearer <token>` header.

---

### Authentication

#### `POST /auth/register`

Register a new user account.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "Jane Smith",
  "industry": "healthcare",
  "tech_stack": ["wordpress", "apache", "mysql"]
}
```

**Response `201`:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Jane Smith",
  "token": "eyJhbGci..."
}
```

---

#### `POST /auth/login`

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response `200`:**

```json
{
  "token": "eyJhbGci...",
  "expires_at": "2026-06-02T12:00:00Z"
}
```

---

### Threats

#### `GET /threats`

List threats with filtering and pagination.

**Query parameters:**

| Parameter   | Type   | Default | Description                         |
| ----------- | ------ | ------- | ----------------------------------- |
| `page`      | int    | 1       | Page number                         |
| `limit`     | int    | 20      | Results per page (max 100)          |
| `severity`  | string | all     | `critical`, `high`, `medium`, `low` |
| `source`    | string | all     | `nvd`, `cisa`, `abuseipdb`          |
| `industry`  | string | —       | Filter by relevant industry         |
| `days`      | int    | 7       | Look back N days                    |
| `exploited` | bool   | —       | Only actively exploited             |
| `search`    | string | —       | Full-text search                    |

**Response `200`:**

```json
{
  "total": 142,
  "page": 1,
  "limit": 20,
  "threats": [
    {
      "id": "uuid",
      "source_id": "CVE-2026-12345",
      "title": "Apache HTTP Server Remote Code Execution",
      "severity": "critical",
      "ai_risk_score": 9.2,
      "ai_summary": "A critical flaw in Apache HTTP Server allows an unauthenticated attacker...",
      "published_at": "2026-05-18T08:00:00Z",
      "patch_available": true,
      "is_actively_exploited": true,
      "ai_industries": ["retail", "healthcare", "finance"]
    }
  ]
}
```

---

#### `GET /threats/{id}`

Get a single threat's full detail including all AI-generated content.

**Response `200`:**

```json
{
  "id": "uuid",
  "source_id": "CVE-2026-12345",
  "title": "Apache HTTP Server Remote Code Execution",
  "description": "A flaw was found in...",
  "severity": "critical",
  "cvss_score": 9.8,
  "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
  "ai_risk_score": 9.2,
  "ai_summary": "A critical vulnerability in Apache HTTP Server (versions 2.4.x through 2.4.62) allows a remote attacker with no authentication to execute arbitrary commands on your server. This means an attacker could take full control of your website, steal customer data, or install ransomware.",
  "ai_recommendations": [
    "Update Apache HTTP Server to version 2.4.63 or later immediately.",
    "If you cannot patch right now, disable mod_rewrite as a temporary mitigation.",
    "Review your server logs for any unusual POST requests to /cgi-bin/ from the past 30 days.",
    "Contact your hosting provider if you do not have direct server access."
  ],
  "ai_industries": ["retail", "healthcare", "finance", "education"],
  "affected_products": ["cpe:2.3:a:apache:http_server:2.4.*"],
  "patch_available": true,
  "patch_url": "https://httpd.apache.org/security/vulnerabilities_24.html",
  "is_actively_exploited": true,
  "published_at": "2026-05-18T08:00:00Z",
  "cwe_ids": ["CWE-78"]
}
```

---

#### `GET /threats/stats`

Aggregate stats for the dashboard header cards.

**Response `200`:**

```json
{
  "total_last_7_days": 247,
  "critical_count": 12,
  "actively_exploited_count": 8,
  "avg_risk_score": 5.4,
  "trend": [
    { "date": "2026-05-13", "count": 31 },
    { "date": "2026-05-14", "count": 28 }
  ]
}
```

---

### Alerts

#### `GET /alerts`

Get alerts for the authenticated user.

**Response `200`:**

```json
{
  "alerts": [
    {
      "id": "uuid",
      "threat": { "id": "uuid", "title": "...", "severity": "critical" },
      "triggered_at": "2026-05-19T06:00:00Z",
      "reason": "Matches your tech stack: apache"
    }
  ]
}
```

---

#### `POST /alerts/preferences`

Update alert delivery preferences.

**Request body:**

```json
{
  "email_enabled": true,
  "webhook_url": "https://hooks.slack.com/...",
  "min_severity": "high"
}
```

---

### Health

#### `GET /health`

**Response `200`:**

```json
{
  "status": "ok",
  "db": "connected",
  "redis": "connected",
  "last_ingestion": "2026-05-19T06:00:00Z"
}
```

---

## 4. Service Layer

### `ai_summarizer.py`

Handles all calls to the GROQ API. The primary function `summarize_threat()` takes a raw threat dict and returns structured AI-generated fields.

**Prompt strategy:**

The system prompt establishes GROQ as a cybersecurity expert writing for a non-technical SMB audience. It instructs GROQ to return a JSON object with exactly four keys: `summary`, `recommendations`, `industries`, and `business_risk_score`.

```python
SYSTEM_PROMPT = """
You are a cybersecurity expert writing threat intelligence summaries for small
business owners with no technical background. Your job is to take raw vulnerability
data and explain it in clear, plain English — as if you were talking to a smart
friend who runs a coffee shop and uses WordPress.

Always respond with a valid JSON object and nothing else. No markdown, no
preamble. The JSON must have exactly these keys:

{
  "summary": "2–4 sentence plain-English explanation of the threat and its impact",
  "recommendations": ["Step 1", "Step 2", "Step 3"],
  "industries": ["retail", "healthcare"],  // only relevant ones from the provided list
  "business_risk_score": 7.5  // float 1.0–10.0 reflecting real-world SMB impact
}

Rules:
- Never use jargon without immediately explaining it
- Recommendations must be concrete and actionable, not vague ("update your software" not "apply patches")
- Risk score should reflect exploitability + impact on SMBs specifically, not just CVSS
- If a patch is available, always include it as recommendation #1
"""
```

**Caching strategy:**

AI summaries are cached in Redis with the key `ai:threat:{source_id}` and a 7-day TTL. This means a CVE that was summarized yesterday will not trigger another GROQ API call today, keeping costs predictable.

---

### `risk_scorer.py`

Computes the unified `ai_risk_score` (1–10) that ThreatLens displays. It is not simply the CVSS score — it weights several signals:

| Signal                       | Weight | Source       |
| ---------------------------- | ------ | ------------ |
| CVSS Base Score              | 35%    | NVD          |
| Active exploitation status   | 25%    | CISA KEV     |
| AI business impact score     | 25%    | GROQ API     |
| Patch availability (inverse) | 15%    | NVD / manual |

```python
def compute_risk_score(
    cvss: float | None,
    is_exploited: bool,
    ai_score: float | None,
    patch_available: bool
) -> float:
    cvss_norm = (cvss or 5.0) / 10.0
    exploit_bonus = 1.0 if is_exploited else 0.0
    ai_norm = (ai_score or 5.0) / 10.0
    patch_reduction = 0.0 if patch_available else 1.0

    raw = (
        cvss_norm * 0.35 +
        exploit_bonus * 0.25 +
        ai_norm * 0.25 +
        patch_reduction * 0.15
    )
    return round(min(raw * 10, 10.0), 1)
```

---

### `feed_ingestion.py`

Orchestrates the ingestion pipeline. Called by the scheduler every 6 hours. Steps:

1. Call each source client (`nvd_client`, `cisa_client`, `abuseipdb_client`)
2. Normalize responses into a common `RawThreat` Pydantic schema
3. Upsert into PostgreSQL (insert new, update changed)
4. Push new threat IDs onto the Redis queue `queue:ai_processing`
5. A background worker drains the queue and calls `ai_summarizer.summarize_threat()` for each

This decouples ingestion from AI processing — ingestion is fast, AI processing is slow and runs asynchronously.

---

### `alert_dispatcher.py`

Runs after AI processing completes for each threat. For each threat:

1. Query all users whose `industry` matches `ai_industries` OR whose `tech_stack` overlaps `affected_products`
2. For each matching user, create an `Alert` record
3. If `alert_email_enabled`, queue an email via SMTP
4. If `alert_webhook_url` is set, POST a JSON payload to the webhook

---

## 5. Data Ingestion Pipeline

### NVD Client

Uses the NIST National Vulnerability Database REST API v2.0.

```
GET https://services.nvd.nist.gov/rest/json/cves/2.0
    ?pubStartDate={iso_date}
    &pubEndDate={iso_date}
    &resultsPerPage=100
```

Rate limit: 50 requests/30 seconds with API key. The client implements exponential backoff with a maximum of 3 retries.

Polling frequency: every 6 hours, fetching CVEs published in the last 12 hours (2x overlap to avoid missing anything due to NVD indexing delay).

### CISA KEV Client

The CISA Known Exploited Vulnerabilities catalog is a static JSON file updated daily.

```
GET https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json
```

The client fetches the full catalog on each run and performs a diff against the `threats` table to detect newly added entries. Any CVE in this catalog sets `is_actively_exploited = True` in our database.

### AbuseIPDB Client

Used for IP reputation data and active attack campaigns rather than CVEs.

```
GET https://api.abuseipdb.com/api/v2/blacklist
    ?confidenceMinimum=90
    &limit=500
```

---

## 6. AI Summarization Engine

### Flow

```
Raw CVE dict
     │
     ▼
Build prompt (system + user message with CVE JSON)
     │
     ▼
Check Redis cache (key: ai:threat:{cve_id})
     │
     ├─ HIT → return cached result
     │
     └─ MISS → call GROQ API
               │
               ▼
          Parse JSON response
               │
               ▼
          Validate with Pydantic
               │
               ▼
          Store in Redis (TTL: 7 days)
               │
               ▼
          Return AISummary object
```

### Cost Estimation

Average CVE description: ~500 tokens input
Average GROQ response: ~300 tokens output
Cost per summary: ~$0.003 (GROQ-sonnet-4)
Expected daily new CVEs: ~100–200
Daily AI cost estimate: ~$0.30–$0.60

Total hackathon demo cost: < $5

---

## 7. Risk Scoring System

### Severity Bucketing

After computing `ai_risk_score` (float 1–10), threats are bucketed into human-readable severity levels:

| Score    | Severity | Color            |
| -------- | -------- | ---------------- |
| 9.0–10.0 | Critical | Red `#DC2626`    |
| 7.0–8.9  | High     | Orange `#EA580C` |
| 4.0–6.9  | Medium   | Amber `#D97706`  |
| 1.0–3.9  | Low      | Green `#16A34A`  |

### Industry Relevance

The AI is prompted to tag each threat with relevant industries from a fixed vocabulary: `healthcare`, `finance`, `retail`, `education`, `manufacturing`, `technology`, `legal`, `hospitality`, `government`, `nonprofit`.

This powers the user's personalized feed — they only see threats relevant to their industry.

---

## 8. Frontend Architecture

### Component Hierarchy

```
App
├── AuthProvider (JWT context)
├── Router
│   ├── / → LandingPage
│   ├── /dashboard → Dashboard
│   │   ├── StatCards (4x summary numbers)
│   │   ├── TrendChart (7-day CVE volume line chart)
│   │   ├── RiskMatrix (scatter: score vs recency)
│   │   └── ThreatTable (filterable, sortable)
│   ├── /threats/:id → ThreatDetail
│   │   ├── SummaryPanel (AI plain-English card)
│   │   ├── RecommendationList
│   │   ├── TechDetails (CVSS, CVE ID, CPE)
│   │   └── RelatedThreats
│   ├── /alerts → AlertFeed
│   └── /settings → UserSettings
```

### State Management

Using Zustand for global state — specifically for the threat list, active filters, and user profile. React Query handles server state (API calls, caching, background refetching).

```javascript
// threatStore.js
const useThreatStore = create((set) => ({
  filters: {
    severity: "all",
    source: "all",
    days: 7,
    search: "",
  },
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
}));
```

### Key UI Decisions

**Risk Badge component** — used everywhere a severity needs to be communicated. Consistent color, shape, and weight across the entire app. Takes a `score` prop and derives color automatically.

**ThreatTable** — virtualized with `react-window` for performance when displaying 200+ threats. Columns: Severity badge, Title, Source, Published date, Risk score, Patch available, Actions.

**TrendChart** — 7-day area chart using Recharts. Shows daily CVE volume colored by severity mix. Gives users an immediate sense of whether the threat landscape is escalating or quiet.

---

## 9. Authentication & Security

### JWT Implementation

Tokens are signed with HS256, contain `user_id` and `exp` claims, and expire after 24 hours. No refresh token mechanism in the MVP — users simply re-authenticate.

```python
def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=24),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
```

### Security Headers

All API responses include:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000`

### Rate Limiting

Public endpoints (`/auth/register`, `/auth/login`): 10 requests/minute per IP.
Authenticated endpoints: 100 requests/minute per user.
Implemented via `slowapi` (FastAPI-compatible rate limiter backed by Redis).

### Password Storage

Passwords hashed with bcrypt, cost factor 12.

---

## 10. Database Schema

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    tech_stack TEXT[] DEFAULT '{}',
    alert_email_enabled BOOLEAN DEFAULT TRUE,
    alert_webhook_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE TABLE threats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    source_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    cvss_score FLOAT,
    cvss_vector TEXT,
    cwe_ids TEXT[] DEFAULT '{}',
    affected_products TEXT[] DEFAULT '{}',
    patch_available BOOLEAN DEFAULT FALSE,
    patch_url TEXT,
    ai_summary TEXT,
    ai_recommendations TEXT[] DEFAULT '{}',
    ai_industries TEXT[] DEFAULT '{}',
    ai_risk_score FLOAT,
    ai_processed_at TIMESTAMPTZ,
    severity TEXT GENERATED ALWAYS AS (
        CASE
            WHEN ai_risk_score >= 9.0 THEN 'critical'
            WHEN ai_risk_score >= 7.0 THEN 'high'
            WHEN ai_risk_score >= 4.0 THEN 'medium'
            ELSE 'low'
        END
    ) STORED,
    is_actively_exploited BOOLEAN DEFAULT FALSE,
    UNIQUE(source, source_id)
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    threat_id UUID NOT NULL REFERENCES threats(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT NOT NULL,
    delivered BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMPTZ
);

-- Indexes for common query patterns
CREATE INDEX idx_threats_severity ON threats(severity);
CREATE INDEX idx_threats_published_at ON threats(published_at DESC);
CREATE INDEX idx_threats_ai_risk_score ON threats(ai_risk_score DESC);
CREATE INDEX idx_threats_is_exploited ON threats(is_actively_exploited) WHERE is_actively_exploited = TRUE;
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
```

---

## 11. Environment Configuration

All configuration is managed via environment variables loaded by Pydantic `BaseSettings`.

```python
class Settings(BaseSettings):
    # Core
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str
    REDIS_URL: str

    # Auth
    JWT_SECRET: str
    JWT_EXPIRY_HOURS: int = 24

    # External APIs
    GROQ_API_KEY: str
    NVD_API_KEY: str = ""  # Optional, higher rate limits
    ABUSEIPDB_API_KEY: str

    # App
    FRONTEND_URL: str = "http://localhost:5173"
    INGESTION_INTERVAL_HOURS: int = 6

    class Config:
        env_file = ".env"
```

---

## 12. Deployment Guide

### Production Stack

| Service     | Provider | Tier  | Est. Monthly Cost |
| ----------- | -------- | ----- | ----------------- |
| Frontend    | Vercel   | Free  | $0                |
| Backend API | Railway  | Hobby | $5                |
| PostgreSQL  | Neon     | Free  | $0                |
| Redis       | Upstash  | Free  | $0                |
| **Total**   |          |       | **$5/month**      |

### Frontend — Vercel

```bash
cd frontend
npm run build
# Push to GitHub, connect repo to Vercel
# Set VITE_API_URL environment variable in Vercel dashboard
```

### Backend — Railway

```bash
# Connect GitHub repo to Railway
# Set all environment variables in Railway dashboard
# Railway auto-detects the Dockerfile and builds
```

### Running Database Migrations

```bash
# From backend directory, with DATABASE_URL set
alembic upgrade head
```

---

## 13. Testing

### Running Tests

```bash
cd backend
pytest tests/ -v --cov=app --cov-report=term-missing
```

### Test Coverage Targets

| Module                      | Target Coverage |
| --------------------------- | --------------- |
| `routers/`                  | 90%             |
| `services/ai_summarizer.py` | 85%             |
| `services/risk_scorer.py`   | 95%             |
| `ingestion/`                | 80%             |

### Key Test Cases

**`test_ai_summarizer.py`**

- Returns valid JSON structure
- Handles malformed GROQ response gracefully
- Cache hit skips API call (mock Redis)
- Scores bounded between 1.0 and 10.0

**`test_threats.py`**

- GET /threats returns paginated results
- Severity filter works correctly
- Unauthenticated requests to protected routes return 401

**`test_ingestion.py`**

- NVD client handles rate limit (429) with retry
- Duplicate CVEs are upserted, not duplicated
- CISA KEV diff correctly identifies new entries

---

## 14. Error Handling & Logging

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "THREAT_NOT_FOUND",
    "message": "No threat found with id: abc-123",
    "status": 404
  }
}
```

### Logging

Structured JSON logging via `structlog`. Every request logs:

- `timestamp`, `method`, `path`, `status_code`, `duration_ms`
- `user_id` (if authenticated)
- `error` (if applicable, with full traceback)

Log levels:

- `INFO`: normal request/response, ingestion runs
- `WARNING`: external API rate limits, slow responses
- `ERROR`: failed AI calls, DB connection issues
- `CRITICAL`: ingestion completely failed, scheduler stopped

### AI Failure Graceful Degradation

If the GROQ API is unavailable or returns an unparseable response, threats are still stored in the database with `ai_summary = None` and `ai_risk_score = None`. The frontend renders these with a "Summary pending" placeholder and falls back to the raw CVSS score for risk display. A retry job re-attempts AI processing for unprocessed threats every hour.
