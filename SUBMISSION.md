# Compass — Submission for Wealthsimple AI Builder

## What does your prototype do? (500 words)

Compass is an AI financial planning copilot that pairs GPT-4o's reasoning with Monte Carlo simulations to help Canadians navigate complex money decisions — the kind that Wealthsimple clients face every day but currently tackle alone or with expensive advisors.

### The Problem

Financial planning is intimidating. Most people know they *should* optimize their RRSP contributions, pay down debt strategically, and project their retirement readiness — but the math is hard, the tax rules are arcane, and the stakes feel too high to guess. Traditional robo-advisors automate *investing* but leave *planning* entirely to the user. There's a gap between "here's your portfolio" and "here's what to actually do with your money."

### What a Human Can Now Do

With Compass, a user completes a six-step onboarding (income, debts, accounts, goals, risk tolerance) and receives within seconds:

- A **financial health score** (0-100) with strengths, warnings, and prioritized recommendations
- **Monte Carlo projections** showing their retirement outlook across five probability bands (p10 through p90) — not a single number, but an honest range
- **Per-goal tracking** with success probabilities: "Your house down payment has a 73% chance of hitting $120K by 2029"
- **Debt payoff comparison**: avalanche vs. snowball strategies with exact interest savings and timeline differences
- **What-if scenarios**: "What if I increase savings by $300/month? Switch to aggressive investing? Retire at 60 instead of 65?" — with side-by-side projections and AI trade-off analysis
- **Tax-aware insights**: RRSP vs. TFSA optimization, RESP grants, provincial bracket considerations

This is meaningfully more than what you could do with a spreadsheet or a generic chatbot. The Monte Carlo engine runs 5,000 simulations per query, giving statistically grounded projections. The AI layer interprets those projections in context — connecting the numbers to the person's actual goals, Canadian tax rules, and life stage.

### Where AI Must Stop

Compass has an explicit "Decisions" page that surfaces choices the AI *cannot* make: Should you prioritize paying off your mortgage or maximizing TFSA contributions? Should you take a lower-paying job with better work-life balance? These are value-laden, life-shaping questions where AI provides options and impact scores but the final call belongs to the human. This boundary is not a limitation — it's a design principle. A financial copilot that pretends to know what matters most to you is dangerous.

### What Breaks at Scale

At production scale, several things need attention: LLM latency (currently ~3-5 seconds per analysis) would require streaming responses and caching common profile archetypes. The Monte Carlo engine is CPU-bound and would need worker pools or precomputation. Financial advice carries regulatory weight — at scale, Compass would need compliance review pipelines, audit trails, and the ability for human advisors to override or annotate AI recommendations. The prototype uses localStorage; production needs encrypted persistence, multi-device sync, and data retention policies compliant with Canadian privacy law.

### Why This Matters for Wealthsimple

Wealthsimple already owns the investment infrastructure. Compass shows how AI can close the gap between "managing money" and "planning a financial life" — turning a product people check quarterly into one they consult weekly.

---

## Years of experience working with AI/LLMs

3

## Salary expectation (CAD)

$170,000 – $200,000

## Links

- **Demo video**: [to be recorded]
- **Repository**: [this repo]
