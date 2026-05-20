# 🛡️ ThreatLens — AI-Powered Threat Intelligence Dashboard

> Democratizing enterprise-grade cybersecurity intelligence for small and medium businesses.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://reactjs.org)
[![Built for](https://img.shields.io/badge/Built%20for-Beyond%20Tomorrow%20Hackathon%202026-purple)]()

---

## 📌 Overview

**ThreatLens** is a real-time, AI-powered cybersecurity threat intelligence platform designed for small and medium-sized businesses (SMBs) that lack the resources of a dedicated security team. It ingests live threat data from public feeds — CVEs, breach reports, and vulnerability databases — then uses a large language model to translate complex, technical threat intelligence into plain-English summaries, actionable recommendations, and prioritized risk scores.

Most SMBs are flying blind when it comes to cybersecurity threats. Enterprise tools like Splunk or CrowdStrike cost tens of thousands of dollars annually. ThreatLens bridges that gap: professional-grade intelligence, zero security expertise required.

---

## 🎯 Problem Statement

Every day, hundreds of new CVEs (Common Vulnerabilities and Exposures) are published. Ransomware groups publish victim lists. Data breaches are disclosed. For large enterprises, dedicated SOC (Security Operations Center) teams monitor and triage these threats in real time. For the 99% of businesses that aren't enterprises, this intelligence is effectively invisible.

The consequences are severe:

- 43% of cyberattacks target small businesses (Verizon DBIR)
- The average cost of a data breach for an SMB exceeds $200,000
- 60% of SMBs that suffer a significant breach close within 6 months
- Most SMB owners lack the technical vocabulary to understand even basic threat advisories

**ThreatLens solves this by making threat intelligence accessible, understandable, and actionable — for anyone.**

---

## ✨ Key Features

### Core Features (MVP)

- **Live Threat Feed Ingestion** — Pulls data from NVD (National Vulnerability Database), CISA Known Exploited Vulnerabilities catalog, and AbuseIPDB
- **AI-Powered Plain-English Summaries** — Each threat is translated into a clear, jargon-free explanation of what it means, who is at risk, and what to do
- **Risk Scoring Engine** — Combines CVSS scores with AI-assessed business impact to generate a unified priority score (1–10)
- **Visual Threat Dashboard** — Color-coded risk matrix, trend graphs, and filterable threat table built in React
- **Industry Filter** — Users specify their industry (retail, healthcare, finance, etc.) and receive only relevant threats
- **Alert Digest** — Daily email/webhook summary of top threats relevant to the user's profile

### Stretch Features

- **Domain Monitor** — Enter your domain and detect if associated emails or assets have appeared in known breach data
- **Patch Tracker** — Track which CVEs affect your known tech stack and whether patches are available
- **Natural Language Query** — Ask questions like "Am I affected by the latest Apache vulnerability?" and get direct answers
- **Slack / Teams Integration** — Push critical alerts directly to team channels

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│              React 18 + Tailwind CSS + Recharts              │
│         Dashboard │ Alert Feed │ Threat Detail View          │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API (JSON)
┌─────────────────────▼───────────────────────────────────────┐
│                      BACKEND API                             │
│                  FastAPI (Python 3.11)                       │
│     Auth │ Threat Endpoints │ AI Summarizer │ Scheduler      │
└──────┬──────────────┬────────────────────────┬──────────────┘
       │              │                        │
┌──────▼──────┐ ┌─────▼──────┐        ┌───────▼──────────┐
│  PostgreSQL  │ │   Redis     │        │   GROQ API      │
│  (Threats,  │ │  (Cache +   │        │  (Summarization + │
│   Users,    │ │   Queue)    │        │   Risk Analysis)  │
│   Scores)   │ └────────────┘        └───────────────────┘
└─────────────┘
       │
┌──────▼──────────────────────────────────────────────────────┐
│                    DATA INGESTION LAYER                      │
│   NVD API │ CISA KEV │ AbuseIPDB │ Have I Been Pwned API    │
│              Scheduled via APScheduler (every 6h)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer            | Technology                                    | Purpose                         |
| ---------------- | --------------------------------------------- | ------------------------------- |
| Frontend         | React 18                                      | UI framework                    |
| Styling          | Tailwind CSS                                  | Utility-first CSS               |
| Charts           | Recharts                                      | Data visualization              |
| Backend          | FastAPI (Python)                              | REST API server                 |
| Database         | PostgreSQL                                    | Persistent data storage         |
| Cache            | Redis                                         | API response caching, job queue |
| AI Layer         | GROQ API (`GROQ-sonnet-4-20250514`)           | Threat summarization & scoring  |
| Task Scheduler   | APScheduler                                   | Periodic feed ingestion         |
| Auth             | JWT + bcrypt                                  | User authentication             |
| Containerization | Docker + Docker Compose                       | Local and production deployment |
| Hosting          | Railway / Render (backend), Vercel (frontend) | Deployment                      |

---

## 📁 Project Structure

```
threatlens/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   ├── ThreatTable.jsx
│   │   │   │   ├── RiskMatrix.jsx
│   │   │   │   ├── TrendChart.jsx
│   │   │   │   └── StatCards.jsx
│   │   │   ├── ThreatDetail/
│   │   │   │   ├── SummaryPanel.jsx
│   │   │   │   ├── RecommendationList.jsx
│   │   │   │   └── TechDetails.jsx
│   │   │   ├── AlertFeed/
│   │   │   │   └── AlertItem.jsx
│   │   │   └── common/
│   │   │       ├── RiskBadge.jsx
│   │   │       ├── Navbar.jsx
│   │   │       └── LoadingSpinner.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ThreatDetail.jsx
│   │   │   └── Settings.jsx
│   │   ├── hooks/
│   │   │   ├── useThreats.js
│   │   │   └── useAlerts.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── store/
│   │   │   └── threatStore.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── threat.py
│   │   │   ├── user.py
│   │   │   └── alert.py
│   │   ├── schemas/
│   │   │   ├── threat.py
│   │   │   └── user.py
│   │   ├── routers/
│   │   │   ├── threats.py
│   │   │   ├── auth.py
│   │   │   ├── alerts.py
│   │   │   └── health.py
│   │   ├── services/
│   │   │   ├── ai_summarizer.py
│   │   │   ├── risk_scorer.py
│   │   │   ├── feed_ingestion.py
│   │   │   └── alert_dispatcher.py
│   │   ├── ingestion/
│   │   │   ├── nvd_client.py
│   │   │   ├── cisa_client.py
│   │   │   └── abuseipdb_client.py
│   │   └── scheduler.py
│   ├── tests/
│   │   ├── test_threats.py
│   │   ├── test_ai_summarizer.py
│   │   └── test_ingestion.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
├── README.md
├── DOCUMENTATION.md
└── TODO.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- API Keys: GROQ API, NVD API (free), AbuseIPDB (free tier)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/threatlens.git
cd threatlens
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
# AI
ANTHROPIC_API_KEY=your_GROQ_api_key

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/threatlens
REDIS_URL=redis://localhost:6379

# External APIs
NVD_API_KEY=your_nvd_api_key
ABUSEIPDB_API_KEY=your_abuseipdb_key

# Auth
JWT_SECRET=your_very_long_random_secret
JWT_EXPIRY_HOURS=24

# App
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
```

### 3. Start with Docker Compose

```bash
docker-compose up --build
```

This starts PostgreSQL, Redis, the FastAPI backend, and the React dev server all together.

### 4. Manual setup (without Docker)

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head       # Run database migrations
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### 5. Access the app

| Service            | URL                         |
| ------------------ | --------------------------- |
| Frontend           | http://localhost:5173       |
| Backend API        | http://localhost:8000       |
| API Docs (Swagger) | http://localhost:8000/docs  |
| API Docs (Redoc)   | http://localhost:8000/redoc |

---

## 🔑 API Keys — Where to Get Them

| Key                 | Source                                                                        | Cost        | Notes                       |
| ------------------- | ----------------------------------------------------------------------------- | ----------- | --------------------------- |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com)                        | Pay-per-use | ~$0.003 per threat summary  |
| `NVD_API_KEY`       | [nvd.nist.gov/developers](https://nvd.nist.gov/developers/request-an-api-key) | Free        | Higher rate limits with key |
| `ABUSEIPDB_API_KEY` | [abuseipdb.com](https://www.abuseipdb.com/api)                                | Free tier   | 1,000 checks/day free       |

---

## 📊 Judging Criteria Alignment

| Criterion                 | Weight | How ThreatLens addresses it                                                                              |
| ------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| Innovation & Creativity   | 25%    | First AI-native threat intel tool built specifically for SMBs; plain-English AI layer is genuinely novel |
| Technical Implementation  | 25%    | Full-stack: React + FastAPI + PostgreSQL + Redis + GROQ API + live external feeds; async architecture    |
| Real-World Impact         | 25%    | Addresses a documented $200K+ average breach cost problem affecting millions of SMBs globally            |
| Design, Presentation & UX | 25%    | Visual risk dashboard, color-coded alerts, clean onboarding; designed for non-technical users            |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

Built for the **Beyond Tomorrow Hackathon 2026** — _Code the Future. Shape the World._

---

> "Security intelligence shouldn't be a luxury. ThreatLens makes it a right."
