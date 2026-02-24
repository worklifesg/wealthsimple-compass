# Compass — AI Financial Planning Copilot

An AI-native financial planning tool that pairs GPT-4o analysis with Monte Carlo simulations to help Canadians make smarter money decisions. Built as a prototype for [Wealthsimple's AI Builder role](https://jobs.ashbyhq.com/wealthsimple).

![Stack](https://img.shields.io/badge/Next.js_15-black?logo=next.js) ![Stack](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) ![Stack](https://img.shields.io/badge/GPT--4o-412991?logo=openai&logoColor=white) ![Stack](https://img.shields.io/badge/Python_3.11-3776AB?logo=python&logoColor=white)

---

## What It Does

Compass analyzes your complete financial picture — income, debts, investments, goals — and produces:

| Feature | AI | Deterministic |
|---|---|---|
| **Health Score** (0-100) | GPT-4o grades overall financial health | — |
| **Portfolio Projections** | — | 5,000-run Monte Carlo with percentile bands |
| **Goal Tracking** | AI prioritization advice | Per-goal probability of success |
| **Debt Payoff** | Strategy recommendation | Avalanche vs. snowball comparison |
| **What-If Scenarios** | Trade-off analysis & recommendation | Side-by-side Monte Carlo projections |
| **Tax Insights** | Canadian-specific RRSP/TFSA/RESP tips | — |
| **Critical Decisions** | ❌ Explicitly defers to human | Options + impact scores only |
| **Chat** | Conversational financial Q&A | — |

The key insight: **AI recommends, simulations prove, humans decide.**

---

## Architecture

```
┌─────────────────────────────────────┐
│         Next.js 15 Frontend         │  Port 3000
│  React 19 · Tailwind 4 · Recharts  │
│  Framer Motion · App Router        │
└──────────────┬──────────────────────┘
               │  /api/* proxy
┌──────────────▼──────────────────────┐
│         FastAPI Backend             │  Port 8000
│  Pydantic v2 · async routes        │
├──────────────┬──────────────────────┤
│  AI Planner  │  Monte Carlo Engine  │
│  (GPT-4o)    │  (NumPy)             │
└──────────────┴──────────────────────┘
```

- **Frontend** → Next.js 15 with App Router, client-side state in localStorage (no database for prototype)
- **Backend** → FastAPI with two service layers:
  - `ai_planner.py` — OpenAI GPT-4o for analysis, decisions, chat, scenario comparison
  - `simulator.py` — NumPy Monte Carlo engine (5,000 simulations, inflation-adjusted, contribution-growth)
- **API Proxy** — Next.js rewrites `/api/*` → `http://localhost:8000/api/*`

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10 (3.11 recommended)
- **OpenAI API key** with GPT-4o access

### 1. Backend

```bash
cd backend

# Create a virtual environment (or use conda)
python -m venv .venv && source .venv/bin/activate
# OR with conda:
# conda create -y -n compass python=3.11 && conda activate compass

# Install dependencies
pip install -r requirements.txt

# Configure
cp .env .env.local   # optional — edit .env directly is fine
echo "OPENAI_API_KEY=sk-..." >> .env

# Start
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend

npm install
npm run dev          # → http://localhost:3000
```

### 3. Use It

1. Open **http://localhost:3000**
2. Complete the 6-step onboarding (personal → income → debts → investments → goals → risk)
3. Click **"Generate My AI Plan"**
4. Explore: Dashboard · Scenarios · Chat · Decisions

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/health` | Service health check |
| `POST` | `/api/planning/analyze` | Full AI analysis + Monte Carlo + decisions |
| `POST` | `/api/planning/scenarios` | Multi-scenario comparison |
| `POST` | `/api/planning/quick-project` | Monte Carlo only (no AI, faster) |
| `POST` | `/api/chat` | Conversational financial planning chat |

All `POST` endpoints accept a `FinancialProfile` in the request body.

---

## Project Structure

```
wealthsimple-task/
├── backend/
│   ├── main.py              # FastAPI app, CORS, routes
│   ├── config.py            # Pydantic Settings (.env loader)
│   ├── models.py            # All Pydantic models & enums
│   ├── .env                 # API key config
│   ├── requirements.txt
│   ├── services/
│   │   ├── ai_planner.py    # OpenAI GPT-4o integration
│   │   └── simulator.py     # Monte Carlo projection engine
│   └── routers/
│       ├── planning.py      # /api/planning/* routes
│       └── chat.py          # /api/chat route
├── frontend/
│   ├── package.json
│   ├── next.config.mjs      # API proxy config
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx     # Main app shell & routing
│   │   │   └── globals.css  # Full dark theme
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── OnboardingFlow.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ScenariosPage.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   └── DecisionsPage.tsx
│   │   ├── hooks/
│   │   │   └── useProfile.ts
│   │   └── lib/
│   │       ├── api.ts
│   │       ├── format.ts
│   │       └── types.ts
│   └── tsconfig.json
├── README.md
└── SUBMISSION.md
```

---

## Design Decisions

1. **No database** — localStorage keeps the prototype self-contained and demo-ready.
2. **Separated AI from simulation** — Monte Carlo runs deterministically regardless of LLM availability. AI adds interpretation, not data.
3. **Explicit "Human Decision" boundary** — The Decisions page surfaces what AI *can't* decide: major life trade-offs that depend on personal values.
4. **Canadian-first** — RRSP, TFSA, RESP contribution rooms; provincial tax brackets; Canadian-specific advice.
5. **Dark theme** — Matches Wealthsimple's design language.

---

## License

MIT — built for Wealthsimple's AI Builder application.
