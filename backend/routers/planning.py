"""Planning API routes — analysis, scenarios, decisions."""

from fastapi import APIRouter, HTTPException
from models import AnalysisRequest, ScenarioRequest, FinancialProfile, ScenarioParam
from services.ai_planner import analyze_profile, generate_decisions, compare_scenarios
from services.simulator import project_profile, run_projection, RETURN_PROFILES

router = APIRouter(prefix="/api/planning", tags=["planning"])


@router.post("/analyze")
async def analyze(req: AnalysisRequest):
    """Run full AI analysis on a financial profile. Returns health score, recommendations, etc."""
    try:
        # Run Monte Carlo simulations
        projections = project_profile(req.profile)

        # Run AI analysis
        analysis = await analyze_profile(req.profile)

        # Generate decision items
        decisions = await generate_decisions(req.profile, analysis)

        return {
            "analysis": analysis,
            "projections": projections,
            "decisions": decisions,
            "profile_summary": {
                "net_worth": req.profile.net_worth,
                "monthly_surplus": req.profile.monthly_income - req.profile.monthly_expenses,
                "savings_rate": req.profile.monthly_savings_rate,
                "total_debt": req.profile.total_debt,
                "total_investments": req.profile.total_investments,
                "debt_to_income": req.profile.total_debt / max(req.profile.annual_income, 1) * 100,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/scenarios")
async def run_scenarios(req: ScenarioRequest):
    """Compare multiple what-if scenarios with Monte Carlo projections + AI analysis."""
    try:
        profile = req.profile
        scenario_results = {}

        for scenario in req.scenarios:
            # Create modified profile for this scenario
            modified = profile.model_copy(deep=True)

            if scenario.retirement_age is not None:
                years = max(1, scenario.retirement_age - profile.age)
            else:
                years = max(1, 65 - profile.age)

            # Adjust parameters
            monthly_contrib = sum(a.monthly_contribution for a in modified.accounts)
            if scenario.monthly_savings is not None:
                monthly_contrib = scenario.monthly_savings

            if scenario.income_change is not None:
                adjusted_income = modified.annual_income * (1 + scenario.income_change / 100)
                monthly_contrib += (adjusted_income - modified.annual_income) / 12 * 0.5

            risk = scenario.risk_tolerance or modified.risk_tolerance

            proj = run_projection(
                current_balance=modified.total_investments,
                monthly_contribution=monthly_contrib,
                years=years,
                risk=risk,
                target=sum(g.target_amount for g in modified.goals) if modified.goals else 1_000_000,
                n_simulations=3000,
            )

            scenario_results[scenario.label] = {
                "portfolio": proj.__dict__,
                "params": scenario.model_dump(),
            }

        # AI comparison
        ai_comparison = await compare_scenarios(
            profile,
            [s.model_dump() for s in req.scenarios],
            scenario_results,
        )

        return {
            "scenarios": scenario_results,
            "ai_comparison": ai_comparison,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario comparison failed: {str(e)}")


@router.post("/quick-project")
async def quick_projection(req: AnalysisRequest):
    """Run just the Monte Carlo projections without AI analysis (faster)."""
    try:
        projections = project_profile(req.profile)
        return {
            "projections": projections,
            "profile_summary": {
                "net_worth": req.profile.net_worth,
                "monthly_surplus": req.profile.monthly_income - req.profile.monthly_expenses,
                "savings_rate": req.profile.monthly_savings_rate,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Projection failed: {str(e)}")
