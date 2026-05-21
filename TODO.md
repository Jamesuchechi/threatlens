# ThreatLens — Build Plan & TODO

> 13-day sprint to a winning hackathon submission.
> Deadline: June 1, 2026 @ 5:45am GMT+2

---

## ⚡ Strategic Overview

The 13 days are split into three phases designed around the judging criteria:

| Phase                            | Days  | Focus                                      | Judging criteria served        |
| -------------------------------- | ----- | ------------------------------------------ | ------------------------------ |
| **Phase 1 — Foundation**         | 1–4   | Project setup, data pipeline, database     | Technical Implementation       |
| **Phase 2 — Intelligence Layer** | 5–9   | AI engine, dashboard UI, full integration  | Innovation + Real-World Impact |
| **Phase 3 — Ship & Win**         | 10–13 | Polish, demo video, pitch deck, submission | Design + Presentation          |

---

## 🗓️ Phase 1 — Foundation (Days 1–4)

_Goal: A working backend that ingests real threat data and stores it. No AI yet. No UI yet. Just solid infrastructure._

---

### Day 1 — Project Setup & Scaffolding

**Morning**

- [x] Create GitHub repository (`threatlens`)
- [x] Set up monorepo structure: `frontend/`, `backend/`, `docker-compose.yml`
- [x] Initialize FastAPI project with standard folder structure (`app/`, `models/`, `routers/`, `services/`)
- [x] Initialize React project with Vite: `npm create vite@latest frontend -- --template react`
- [x] Install and configure Tailwind CSS in frontend
- [x] Create `.env.example` with all required keys documented
- [x] Add `.gitignore` (node_modules, .env, **pycache**, venv)

**Afternoon**

- [x] Write `docker-compose.yml` with services: `postgres`, `redis`, `backend`, `frontend`
- [x] Configure PostgreSQL container with init script
- [x] Configure Redis container
- [x] Set up Alembic for database migrations: `alembic init migrations`
- [x] Write initial migration for `users`, `threats`, `alerts` tables (see schema in DOCUMENTATION.md)
- [x] Run migrations successfully: `alembic upgrade head`
- [x] Confirm `docker-compose up` starts all 4 services without errors

**End of Day 1 checkpoint:** `docker-compose up` starts cleanly. Tables exist in the database.

---

### Day 2 — Backend API Skeleton + Auth

**Morning**

- [x] Install Python dependencies: `fastapi`, `uvicorn`, `sqlalchemy`, `asyncpg`, `alembic`, `pydantic`, `python-jose`, `bcrypt`, `httpx`, `structlog`, `slowapi`
- [x] Write `config.py` with Pydantic `BaseSettings` loading all env vars
- [x] Write `database.py` with async SQLAlchemy engine and session factory
- [x] Write SQLAlchemy ORM models for `User`, `Threat`, `Alert`
- [x] Write Pydantic schemas for request/response validation

**Afternoon**

- [x] Implement `POST /auth/register` endpoint
- [x] Implement `POST /auth/login` endpoint
- [x] Write JWT token creation and validation utilities
- [x] Write `get_current_user` FastAPI dependency
- [x] Implement `GET /health` endpoint
- [x] Test auth flow manually with curl or Postman
- [x] Confirm Swagger UI at `localhost:8000/docs` shows all routes

**End of Day 2 checkpoint:** Can register a user, log in, and receive a valid JWT. `/health` returns 200.

---

### Day 3 — Data Ingestion: NVD + CISA

**Morning**

- [x] Sign up for NVD API key at nvd.nist.gov
- [x] Write `nvd_client.py`:
  - [x] `fetch_recent_cves(hours_back=12)` — async httpx call with pagination
  - [x] Response parsing → `RawThreat` Pydantic schema
  - [x] Exponential backoff on 429 responses (max 3 retries, 2/4/8 second delays)
  - [x] Unit test with mocked responses
- [x] Write `cisa_client.py`:
  - [x] `fetch_kev_catalog()` — fetch full JSON catalog
  - [x] `get_new_entries(known_ids: set)` — diff against existing
  - [x] Unit test

**Afternoon**

- [x] Write `feed_ingestion.py` orchestrator:
  - [x] Calls both clients
  - [x] Normalizes to common schema
  - [x] Upserts to database (INSERT ... ON CONFLICT DO UPDATE)
  - [x] Pushes new threat IDs to Redis queue `queue:ai_processing`
- [x] Write `scheduler.py` with APScheduler running ingestion every 6 hours
- [x] Run ingestion manually and confirm threats appear in database
- [x] Implement `GET /threats` endpoint (no AI fields yet, just raw data)
- [x] Implement `GET /threats/{id}` endpoint
- [x] Implement `GET /threats/stats` endpoint

**End of Day 3 checkpoint:** Running ingestion manually populates 50–200 real CVEs in the database. `GET /threats` returns them via API.

---

### Day 4 — AbuseIPDB + Polish + Frontend Bootstrap

**Morning**

- [x] Sign up for AbuseIPDB free API key
- [x] Write `abuseipdb_client.py`:
  - [x] `fetch_blacklist(confidence=90, limit=500)`
  - [x] Normalize IP threats to `RawThreat` schema
- [x] Add AbuseIPDB to ingestion orchestrator
- [x] Test full ingestion pipeline end-to-end
- [x] Add structured logging to all ingestion steps
- [x] Write `tests/test_ingestion.py` covering the main happy paths and error cases

**Afternoon**

- [x] Set up React Router in frontend: install `react-router-dom`
- [x] Create page shell components: `Dashboard.jsx`, `ThreatDetail.jsx`, `Settings.jsx`
- [x] Set up Axios/fetch API service layer (`services/api.js`) pointed at backend
- [x] Set up Zustand store (`store/threatStore.js`) with filter state
- [x] Set up React Query for data fetching
- [x] Confirm frontend can call `GET /threats` and log results to console
- [x] Set up CORS in FastAPI to allow frontend origin

**End of Day 4 checkpoint:** Full ingestion pipeline works. Frontend shell exists and successfully fetches real threat data from the backend.

---

## 🧠 Phase 2 — Intelligence Layer (Days 5–9)

_Goal: The AI engine is live. The dashboard is built and beautiful. Users can see real, AI-explained threats._

---

### Day 5 — AI Summarization Engine

**Morning**

- [x] Sign up for GROQ API, get `GROQ_API_KEY`
- [x] Install `GROQ` Python SDK
- [x] Write `ai_summarizer.py`:
  - [x] Design and finalize the system prompt (see DOCUMENTATION.md section 6)
  - [x] `summarize_threat(raw_threat: dict) -> AISummary` function
  - [x] Prompt construction: inject CVE description, CVSS, affected products
  - [x] Parse and validate JSON response with Pydantic
  - [x] Graceful degradation if response is malformed (log warning, return None)

**Afternoon**

- [x] Add Redis caching to `summarize_threat()`:
  - [x] Cache key: `ai:threat:{source_id}`
  - [x] TTL: 7 days
  - [x] Check cache before calling API
  - [x] Store result in cache after API call
- [x] Write background worker that drains `queue:ai_processing` Redis queue
- [x] Test: manually enqueue 5 CVE IDs, confirm they get summarized and updated in DB
- [x] Write `tests/test_ai_summarizer.py` with mocked GROQ API responses

**End of Day 5 checkpoint:** 10+ threats in the database have AI summaries, recommendations, industry tags, and risk scores populated.

---

### Day 6 — Risk Scorer + Alert Engine

**Morning**

- [x] Write `risk_scorer.py` with the composite scoring formula (see DOCUMENTATION.md section 7)
- [x] Integrate risk scorer into AI processing pipeline: score is computed after AI returns
- [x] Update `GET /threats` to sort by `ai_risk_score DESC` by default
- [x] Confirm severity bucketing logic works (critical/high/medium/low)

**Afternoon**

- [x] Write `alert_dispatcher.py`:
  - [x] `match_users_to_threat(threat_id)` — query users by industry + tech stack overlap
  - [x] `create_alert_records(user_ids, threat_id, reason)` — bulk insert
  - [x] `dispatch_email_alerts(alerts)` — SMTP via `aiosmtplib` (use Gmail SMTP for demo)
  - [x] `dispatch_webhook_alerts(alerts)` — POST JSON to webhook URLs
- [x] Integrate alert dispatch into AI processing pipeline (runs after scoring)
- [x] Implement `GET /alerts` endpoint (authenticated)
- [x] Implement `POST /alerts/preferences` endpoint

**End of Day 6 checkpoint:** After ingestion + AI processing, users with matching industry/tech stack receive alerts. Can verify via database `alerts` table.

---

### Day 7 — Dashboard UI

**Morning**

- [x] Build `StatCards.jsx` component — 4 cards: Total Threats (7d), Critical Count, Actively Exploited, Avg Risk Score
- [x] Build `TrendChart.jsx` — 7-day area chart with Recharts, colored by severity
- [x] Connect both to real API data via React Query
- [x] Build `RiskBadge.jsx` — reusable severity badge component with correct colors

**Afternoon**

- [x] Build `ThreatTable.jsx`:
  - [x] Columns: Severity, Title, Source, Published, Risk Score, Patch Available, Detail link
  - [x] Sortable columns (click header)
  - [x] Row click → navigate to `/threats/{id}`
  - [x] Loading skeleton state
  - [x] Empty state illustration
- [x] Build filter bar above table: Severity dropdown, Source dropdown, Days range, Search input
- [x] Wire filters to Zustand store → refetch query on filter change
- [x] Make the full dashboard page responsive (mobile-friendly)

**End of Day 7 checkpoint:** Dashboard shows real, live data. Can filter and sort the threat table. Trend chart renders correctly.

---

### Day 8 — Threat Detail Page + Alert Feed

**Morning**

- [x] Build `SummaryPanel.jsx` — the hero card showing AI plain-English summary; prominent, visually distinct
- [x] Build `RecommendationList.jsx` — numbered checklist of AI recommendations; each item has a checkbox for visual interaction
- [x] Build `TechDetails.jsx` — collapsible section with CVSS score, vector string, CVE ID, CWE IDs, affected products
- [x] Connect all to `GET /threats/{id}` API endpoint
- [x] Add "Copy CVE ID" button, "View patch" external link

**Afternoon**

- [x] Build `AlertFeed.jsx` page — list of user's personal alerts, sorted by recency
- [x] Build `AlertItem.jsx` — shows threat title, severity, triggered time, reason string
- [x] Build `UserSettings.jsx` — form to update industry, tech stack, alert preferences
- [x] Wire settings form to `POST /alerts/preferences` endpoint
- [x] Add navbar with links to Dashboard, Alerts, Settings, and logout

**End of Day 8 checkpoint:** Can click any threat in the table to see its full detail page with AI summary and recommendations. Alert feed shows personal alerts.

---

### Day 9 — Auth UI + Integration Testing + Bug Fixes

**Morning**

- [x] Build `LoginPage.jsx` and `RegisterPage.jsx`
- [x] Wire to `/auth/login` and `/auth/register` endpoints
- [x] Store JWT in `localStorage`, attach to all API requests via Axios interceptor
- [x] Implement protected route wrapper — redirect to login if no valid token
- [x] Handle token expiry gracefully (catch 401, clear token, redirect to login)

**Afternoon**

- [x] End-to-end integration test: register → log in → view dashboard → click threat → check detail page → check alerts
- [x] Fix any bugs found in integration testing
- [x] Verify the app works correctly with 100+ threats in the database
- [x] Add error boundaries in React for graceful frontend error handling
- [x] Confirm the full pipeline works: scheduler → ingestion → AI processing → alerts dispatched

**End of Day 9 checkpoint:** The full application works end-to-end. A new user can register, see live threats with AI summaries, and receive alerts matching their profile.

---

## 🏆 Phase 3 — Ship & Win (Days 10–13)

_Goal: Everything that turns a working project into a winning submission._

---

### Day 10 — UI Polish & UX Refinement

- [ ] Audit the entire UI for visual consistency (spacing, font sizes, colors)
- [ ] Add loading states to every data-fetching component (skeleton screens, not spinners)
- [ ] Add empty states with helpful CTAs (e.g. "No critical threats this week 🎉")
- [ ] Add toast notifications for key actions (settings saved, alert preferences updated)
- [ ] Implement dark mode support (Tailwind `dark:` classes)
- [ ] Make sure RiskBadge colors are accessible (test with color blindness simulator)
- [ ] Add a simple landing page (`/`) that explains the product before login
- [ ] Improve mobile layout — test on 375px viewport
- [ ] Add `<title>` tags and meta descriptions to each page
- [ ] Remove all `console.log` statements from production code

---

### Day 11 — Deployment + Performance

**Morning**

- [ ] Create Neon PostgreSQL account, get production `DATABASE_URL`
- [ ] Create Upstash Redis account, get production `REDIS_URL`
- [ ] Deploy backend to Railway:
  - [ ] Connect GitHub repo
  - [ ] Set all production environment variables
  - [ ] Run `alembic upgrade head` via Railway CLI
  - [ ] Confirm API is live at Railway URL
- [ ] Deploy frontend to Vercel:
  - [ ] Set `VITE_API_URL` to Railway backend URL
  - [ ] Confirm frontend is live at Vercel URL

**Afternoon**

- [ ] Run production ingestion manually — confirm 100+ real threats load into production DB
- [ ] Test the full registration → dashboard flow on the live production URL
- [ ] Add response caching headers to `GET /threats` (Cache-Control: max-age=300)
- [ ] Test on mobile (real device or BrowserStack)
- [ ] Fix any production-specific bugs

**End of Day 11 checkpoint:** The app is live on the public internet. Anyone can visit the Vercel URL, register, and use the product.

---

### Day 12 — Demo Video

The demo video is one of the most important judging inputs. It needs to be compelling, clear, and under 5 minutes.

**Script outline:**

1. **Hook (0:00–0:20)** — Open with the problem stat: "60% of small businesses that suffer a data breach close within 6 months. Most of them never saw it coming."
2. **Problem (0:20–0:45)** — Briefly show a raw CVE from NVD. Technical jargon everywhere. Overwhelming. No actionable guidance.
3. **Solution intro (0:45–1:00)** — "This is ThreatLens."
4. **Live demo (1:00–3:30)**:
   - Dashboard overview — the stats, the trend chart, the threat table
   - Click into a Critical threat — show the AI summary panel ("Here's what a business owner actually sees")
   - Show the recommendations list
   - Show the industry filter narrowing results
   - Show the alerts feed — "These arrived because this user runs Apache and is in healthcare"
5. **Architecture (3:30–4:15)** — Quick screen share of the codebase structure, 30 seconds on the AI prompt design
6. **Impact & close (4:15–5:00)** — "ThreatLens is live at [URL]. Any small business owner can sign up today."

**Production checklist:**

- [ ] Write full script
- [ ] Record screen using OBS or Loom (1080p, 60fps)
- [ ] Record voiceover (clear audio, no background noise)
- [ ] Edit in DaVinci Resolve or CapCut — add captions, zoom into key UI elements
- [ ] Export as MP4, verify under Devpost's file size limit
- [ ] Upload to YouTube (unlisted) for the Devpost demo link

---

### Day 13 — Pitch Deck + Final Submission

**Pitch Deck (10–12 slides):**

- [ ] **Slide 1 — Title** — ThreatLens logo, tagline: "Enterprise threat intelligence for every business."
- [ ] **Slide 2 — The Problem** — 3 stats about SMB cyberattacks. One screenshot of a raw, incomprehensible CVE.
- [ ] **Slide 3 — The Solution** — One sentence. One screenshot of the AI summary card.
- [ ] **Slide 4 — How It Works** — Simple 4-step flow diagram: Ingest → Score → Summarize → Alert
- [ ] **Slide 5 — Architecture** — High-level tech diagram (from DOCUMENTATION.md)
- [ ] **Slide 6 — AI Layer** — Show the prompt strategy and one before/after (raw CVE → plain English)
- [ ] **Slide 7 — Live Dashboard** — 2–3 screenshots of the actual product
- [ ] **Slide 8 — Real-World Impact** — Who uses this? Estimated addressable market. Why now?
- [ ] **Slide 9 — Tech Stack** — Clean icon grid of all technologies used
- [ ] **Slide 10 — Future Roadmap** — 3 features for v2 (domain monitoring, patch tracker, Slack integration)
- [ ] **Slide 11 — Team** — Solo builder. Photo, name, brief background.
- [ ] **Slide 12 — Links** — Live URL, GitHub repo, contact

**Final Devpost Submission Checklist:**

- [ ] Project title: "ThreatLens — AI Threat Intelligence for SMBs"
- [ ] Project description written (problem, solution, features, impact) — 300–500 words
- [ ] Demo video link (YouTube unlisted) added
- [ ] GitHub repository link added (make it public)
- [ ] Pitch deck PDF uploaded
- [ ] 4–6 screenshots uploaded (dashboard, threat detail, alerts, mobile view)
- [ ] Technology stack listed: React, FastAPI, PostgreSQL, Redis, GROQ API, NVD API, Docker, Vercel, Railway
- [ ] Submission submitted ✅ before June 1, 2026 @ 5:45am GMT+2

---

## 📋 Running Task Backlog (add as discovered)

- [ ] Add favicon and Open Graph meta tags
- [ ] Write `CONTRIBUTING.md` for the GitHub repo
- [ ] Add a `demo` account with pre-populated data so judges can log in without registering
- [ ] Seed script: `python seed.py` — populates 50 realistic threats for demo purposes
- [ ] Add a "last updated" timestamp to the dashboard header
- [ ] Rate limit the registration endpoint more aggressively in production
- [ ] Write a one-paragraph blog post / LinkedIn post to share after submission

---

## ⏰ Daily Standup Template

Use this each morning to stay on track:

```
Date: ___________
Yesterday I completed:
Today I will complete:
Blockers:
On track for phase checkpoint? YES / NO / BEHIND
```

---

## 🚨 Risk Register

| Risk                                | Likelihood | Impact | Mitigation                                                            |
| ----------------------------------- | ---------- | ------ | --------------------------------------------------------------------- |
| GROQ API rate limits during demo    | Low        | High   | Cache all summaries; use seeded demo data as fallback                 |
| NVD API downtime                    | Medium     | Medium | Store 7 days of data locally; ingest run morning of demo              |
| Demo video audio quality poor       | Medium     | High   | Record in a quiet room; do 2–3 takes                                  |
| Backend deployment fails on Railway | Low        | High   | Have a local Docker backup ready to screen-share                      |
| Running out of time on Phase 3      | Medium     | High   | Phase 3 tasks are ordered by judging weight — do slides before polish |

---

> Built for Beyond Tomorrow Hackathon 2026. Deadline: June 1 @ 05:45 GMT+2.
> Let's win this. 🛡️
