"""AI Planner — uses GitHub Models API (GPT-4o) to generate financial analysis, health scores, and recommendations."""

from __future__ import annotations
import json, re
from openai import AsyncOpenAI
from models import FinancialProfile, DecisionItem
from config import get_settings


def _get_client() -> AsyncOpenAI:
    """Create an OpenAI-compatible client pointing at GitHub Models API."""
    settings = get_settings()
    return AsyncOpenAI(
        base_url=settings.ai_base_url,
        api_key=settings.github_token,
    )


def _parse_json(text: str) -> dict:
    """Parse JSON from LLM output, stripping markdown code fences if present."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Strip ```json ... ``` fences
    m = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    # Last resort: find first { ... last }
    start = text.index('{')
    end = text.rindex('}') + 1
    return json.loads(text[start:end])


def _build_profile_summary(p: FinancialProfile) -> str:
    """Create a structured plain-text summary of the financial profile for the AI."""
    debts_text = "\n".join(
        f"  - {d.name} ({d.type.value}): ${d.balance:,.0f} at {d.interest_rate}% APR, min ${d.minimum_payment:,.0f}/mo"
        for d in p.debts
    ) or "  None"

    accounts_text = "\n".join(
        f"  - {a.name} ({a.type.value}): ${a.balance:,.0f}, contributing ${a.monthly_contribution:,.0f}/mo"
        for a in p.accounts
    ) or "  None"

    goals_text = "\n".join(
        f"  - {g.name} ({g.type.value}): ${g.target_amount:,.0f} by {g.target_year} [priority {g.priority}], ${g.current_savings:,.0f} saved"
        for g in p.goals
    ) or "  None"

    return f"""FINANCIAL PROFILE — {p.name or 'Client'}
Age: {p.age} | Province: {p.province} | Status: {p.filing_status}

INCOME
  Gross annual: ${p.annual_income:,.0f} (${p.monthly_income:,.0f}/mo)
  Other income: ${p.other_income:,.0f}/yr
  Expected growth: {p.income_growth_rate}%/yr

EXPENSES
  Monthly total: ${p.monthly_expenses:,.0f}
  Housing: ${p.housing_cost:,.0f}/mo

DEBTS (total ${p.total_debt:,.0f})
{debts_text}

INVESTMENTS & SAVINGS (total ${p.total_investments:,.0f})
  Emergency fund: ${p.emergency_fund:,.0f}
{accounts_text}

GOALS
{goals_text}

KEY METRICS
  Net worth: ${p.net_worth:,.0f}
  Monthly surplus: ${p.monthly_income - p.monthly_expenses:,.0f}
  Savings rate: {p.monthly_savings_rate:.1f}%
  Debt-to-income: {(p.total_debt / max(p.annual_income, 1) * 100):.1f}%
  Risk tolerance: {p.risk_tolerance.value}
"""


SYSTEM_PROMPT_ANALYSIS = """You are Compass, an expert AI financial planner built for Canadian investors. You analyze financial profiles and produce actionable, personalized plans.

IMPORTANT RULES:
- All monetary values in CAD unless stated otherwise
- Consider Canadian tax rules: TFSA, RRSP, FHSA, RESP, capital gains inclusion rate
- Be specific with numbers — never vague
- Acknowledge trade-offs honestly
- Flag decisions that MUST remain human (goal prioritization, risk tolerance changes, major life decisions)
- Use a warm but professional tone

OUTPUT FORMAT: Return valid JSON matching the exact schema requested. No markdown, no code fences."""


async def analyze_profile(profile: FinancialProfile) -> dict:
    """Generate comprehensive AI analysis of a financial profile."""
    settings = get_settings()
    client = _get_client()

    summary = _build_profile_summary(profile)

    response = await client.chat.completions.create(
        model=settings.ai_model,
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_ANALYSIS},
            {"role": "user", "content": f"""{summary}

Analyze this profile and return JSON with this exact structure:
{{
  "health_score": <0-100 integer>,
  "health_grade": "<A+/A/B+/B/C+/C/D/F>",
  "health_summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "warnings": ["<warning 1>", ...],
  "recommendations": [
    {{
      "id": "<unique-id>",
      "title": "<short title>",
      "description": "<1-2 sentence explanation>",
      "impact": "<high/medium/low>",
      "category": "<savings/debt/investment/tax/insurance/emergency>",
      "action": "<specific next step>",
      "monthly_impact": <estimated monthly $ impact or 0>
    }}
  ],
  "tax_insights": [
    {{
      "title": "<insight>",
      "description": "<explanation>",
      "estimated_savings": <annual $ estimate or 0>
    }}
  ],
  "emergency_fund_months": <number of months covered>,
  "emergency_fund_target": <recommended target in $>,
  "ideal_savings_rate": <recommended % of income>,
  "debt_freedom_priority": "<high/medium/low>",
  "retirement_readiness": "<on_track/behind/ahead/critical>",
  "key_risk": "<biggest financial risk in 1 sentence>"
}}

Generate 5-8 recommendations sorted by impact. Be specific to this person's situation.

IMPORTANT: Return ONLY valid JSON — no markdown, no code fences, no extra text."""},
        ],
    )

    return _parse_json(response.choices[0].message.content)


async def generate_decisions(profile: FinancialProfile, analysis: dict) -> list[dict]:
    """Generate decision items that require human judgment."""
    settings = get_settings()
    client = _get_client()

    summary = _build_profile_summary(profile)

    response = await client.chat.completions.create(
        model=settings.ai_model,
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_ANALYSIS},
            {"role": "user", "content": f"""{summary}

ANALYSIS CONTEXT:
Health Score: {analysis.get('health_score', 'N/A')}
Key Risk: {analysis.get('key_risk', 'N/A')}
Recommendations: {json.dumps(analysis.get('recommendations', [])[:3])}

Based on this profile and analysis, generate 3-5 DECISION ITEMS that require human judgment. These are trade-offs where AI can quantify the options but the human must choose based on their values and life priorities.

Return JSON:
{{
  "decisions": [
    {{
      "id": "<unique-id>",
      "title": "<clear decision title>",
      "description": "<what needs to be decided and why>",
      "ai_recommendation": "<what AI would suggest>",
      "ai_reasoning": "<why, with specific numbers>",
      "impact_score": <0-100 importance>,
      "requires_human": true,
      "category": "<goal_priority/risk/lifestyle/tax/career>",
      "options": [
        {{"label": "<option A>", "description": "<what happens>"}},
        {{"label": "<option B>", "description": "<what happens>"}}
      ]
    }}
  ],
  "critical_human_decision": {{
    "title": "<the ONE most critical decision that must remain human>",
    "reason": "<why AI cannot and should not make this decision — 2-3 sentences>"
  }}
}}

IMPORTANT: Return ONLY valid JSON — no markdown, no code fences, no extra text."""
            },
        ],
    )

    return _parse_json(response.choices[0].message.content)


async def chat_with_context(profile: FinancialProfile, messages: list[dict]) -> str:
    """Financial planning chat with full profile context."""
    settings = get_settings()
    client = _get_client()

    summary = _build_profile_summary(profile)

    system_msg = f"""{SYSTEM_PROMPT_ANALYSIS}

You are having a conversation with a client about their finances. Here is their full profile:

{summary}

CONVERSATION RULES:
- Answer specifically based on their financial data
- When they ask "what if" questions, give concrete numbers
- If they ask about something that requires human judgment (goal trade-offs, risk changes), acknowledge it clearly
- Keep responses concise but informative (2-4 paragraphs max)
- Use Canadian financial context (TFSA, RRSP, etc.)
- If you reference a calculation, show the math briefly
- Always suggest next steps"""

    api_messages = [{"role": "system", "content": system_msg}]
    for m in messages:
        api_messages.append({"role": m["role"], "content": m["content"]})

    response = await client.chat.completions.create(
        model=settings.ai_model,
        temperature=0.5,
        max_tokens=1000,
        messages=api_messages,
    )

    return response.choices[0].message.content


async def compare_scenarios(profile: FinancialProfile, scenarios: list[dict], projections: dict) -> dict:
    """AI analysis comparing multiple financial scenarios."""
    settings = get_settings()
    client = _get_client()

    summary = _build_profile_summary(profile)

    response = await client.chat.completions.create(
        model=settings.ai_model,
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_ANALYSIS},
            {"role": "user", "content": f"""{summary}

SCENARIO COMPARISON REQUEST:
The user wants to compare these scenarios:
{json.dumps(scenarios, indent=2)}

Monte Carlo projection summaries for each:
{json.dumps({k: {
    "median_final": v.get("portfolio", {}).get("median_final", 0) if isinstance(v, dict) else 0,
    "success_rate": v.get("portfolio", {}).get("success_rate", 0) if isinstance(v, dict) else 0,
} for k, v in projections.items()}, indent=2)}

Return JSON:
{{
  "comparison_summary": "<2-3 sentence overall comparison>",
  "recommended_scenario": "<label of recommended scenario>",
  "reasoning": "<why this scenario is recommended — specific to this person>",
  "trade_offs": [
    {{
      "scenario": "<label>",
      "pros": ["<pro1>", "<pro2>"],
      "cons": ["<con1>", "<con2>"],
      "projected_outcome": "<1 sentence>"
    }}
  ],
  "human_note": "<what the human should consider that the AI can't fully evaluate>"
}}

IMPORTANT: Return ONLY valid JSON — no markdown, no code fences, no extra text."""
            },
        ],
    )

    return _parse_json(response.choices[0].message.content)
