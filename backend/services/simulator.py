"""Monte Carlo simulation engine for financial projections."""

from __future__ import annotations
import numpy as np
from dataclasses import dataclass, field
from typing import List
from models import FinancialProfile, RiskTolerance


# Expected returns & volatility by risk profile (annualized)
RETURN_PROFILES = {
    RiskTolerance.conservative: {"mean": 0.05, "std": 0.07},
    RiskTolerance.moderate: {"mean": 0.07, "std": 0.12},
    RiskTolerance.aggressive: {"mean": 0.09, "std": 0.17},
}


@dataclass
class ProjectionResult:
    """Result of a Monte Carlo simulation for one goal or overall portfolio."""
    years: List[int]
    median: List[float]
    p10: List[float]          # pessimistic (10th percentile)
    p25: List[float]
    p75: List[float]
    p90: List[float]          # optimistic (90th percentile)
    success_rate: float       # % of simulations reaching target
    median_final: float
    target: float = 0


@dataclass
class DebtPayoffResult:
    strategy: str             # "avalanche" or "snowball"
    debts: List[dict]         # per-debt timeline
    total_interest: float
    months_to_free: int
    total_paid: float


def run_projection(
    current_balance: float,
    monthly_contribution: float,
    years: int,
    risk: RiskTolerance,
    target: float = 0,
    inflation: float = 0.02,
    n_simulations: int = 5000,
    contribution_growth: float = 0.03,  # annual growth in contributions
) -> ProjectionResult:
    """Run Monte Carlo simulation for investment growth."""
    rp = RETURN_PROFILES[risk]
    monthly_mean = rp["mean"] / 12
    monthly_std = rp["std"] / (12 ** 0.5)
    monthly_inflation = (1 + inflation) ** (1/12) - 1

    n_months = years * 12
    all_paths = np.zeros((n_simulations, n_months + 1))
    all_paths[:, 0] = current_balance

    for m in range(1, n_months + 1):
        returns = np.random.normal(monthly_mean, monthly_std, n_simulations)
        # Grow contributions annually
        year_idx = (m - 1) // 12
        adj_contribution = monthly_contribution * ((1 + contribution_growth) ** year_idx)
        all_paths[:, m] = all_paths[:, m - 1] * (1 + returns) + adj_contribution

    # Convert to real (inflation-adjusted) dollars
    inflation_factors = np.array([(1 + monthly_inflation) ** m for m in range(n_months + 1)])
    real_paths = all_paths / inflation_factors

    # Sample at yearly intervals
    yearly_indices = [i * 12 for i in range(years + 1)]
    yearly_values = real_paths[:, yearly_indices]

    median = np.median(yearly_values, axis=0).tolist()
    p10 = np.percentile(yearly_values, 10, axis=0).tolist()
    p25 = np.percentile(yearly_values, 25, axis=0).tolist()
    p75 = np.percentile(yearly_values, 75, axis=0).tolist()
    p90 = np.percentile(yearly_values, 90, axis=0).tolist()

    final_values = real_paths[:, -1]
    success_rate = (float(np.mean(final_values >= target)) * 100) if target > 0 else 100.0

    return ProjectionResult(
        years=list(range(years + 1)),
        median=[round(v, 2) for v in median],
        p10=[round(v, 2) for v in p10],
        p25=[round(v, 2) for v in p25],
        p75=[round(v, 2) for v in p75],
        p90=[round(v, 2) for v in p90],
        success_rate=round(success_rate, 1),
        median_final=round(float(np.median(final_values)), 2),
        target=target,
    )


def simulate_debt_payoff(
    debts: List[dict],
    extra_monthly: float = 0,
    strategy: str = "avalanche",
) -> DebtPayoffResult:
    """Simulate debt payoff with avalanche (highest rate first) or snowball (lowest balance first)."""
    if not debts:
        return DebtPayoffResult(strategy=strategy, debts=[], total_interest=0, months_to_free=0, total_paid=0)

    # Deep copy
    active = []
    for d in debts:
        active.append({
            "name": d["name"],
            "balance": d["balance"],
            "rate": d["rate"],
            "min_payment": d["min_payment"],
            "interest_paid": 0,
            "months": 0,
            "original_balance": d["balance"],
        })

    total_interest = 0
    total_paid = 0
    months = 0
    max_months = 600  # 50 year cap

    while any(d["balance"] > 0.01 for d in active) and months < max_months:
        months += 1
        remaining_extra = extra_monthly

        # Apply interest
        for d in active:
            if d["balance"] > 0:
                monthly_interest = d["balance"] * (d["rate"] / 100 / 12)
                d["balance"] += monthly_interest
                d["interest_paid"] += monthly_interest
                total_interest += monthly_interest

        # Sort by strategy
        if strategy == "avalanche":
            order = sorted(range(len(active)), key=lambda i: -active[i]["rate"])
        else:  # snowball
            order = sorted(range(len(active)), key=lambda i: active[i]["balance"] if active[i]["balance"] > 0 else float('inf'))

        # Pay minimums first
        for i in range(len(active)):
            d = active[i]
            if d["balance"] > 0:
                payment = min(d["min_payment"], d["balance"])
                d["balance"] -= payment
                total_paid += payment

        # Apply extra to priority debt
        for i in order:
            d = active[i]
            if d["balance"] > 0 and remaining_extra > 0:
                payment = min(remaining_extra, d["balance"])
                d["balance"] -= payment
                remaining_extra -= payment
                total_paid += payment

        for d in active:
            if d["balance"] > 0:
                d["months"] = months

    return DebtPayoffResult(
        strategy=strategy,
        debts=[{
            "name": d["name"],
            "original_balance": round(d["original_balance"], 2),
            "interest_paid": round(d["interest_paid"], 2),
            "months_to_payoff": d["months"],
        } for d in active],
        total_interest=round(total_interest, 2),
        months_to_free=months,
        total_paid=round(total_paid, 2),
    )


def project_profile(profile: FinancialProfile, years: int = 30, n_sims: int = 3000) -> dict:
    """Run full projection suite for a financial profile."""
    total_invested = profile.total_investments
    monthly_contributions = sum(a.monthly_contribution for a in profile.accounts)
    surplus = profile.monthly_income - profile.monthly_expenses
    investable_surplus = max(0, surplus - monthly_contributions) if surplus > monthly_contributions else 0

    # Overall portfolio projection
    portfolio = run_projection(
        current_balance=total_invested,
        monthly_contribution=monthly_contributions + investable_surplus * 0.5,
        years=years,
        risk=profile.risk_tolerance,
        n_simulations=n_sims,
        contribution_growth=min(profile.income_growth_rate / 100, 0.05),
    )

    # Goal-specific projections
    goal_projections = {}
    for goal in profile.goals:
        goal_years = max(1, goal.target_year - 2026)
        proj = run_projection(
            current_balance=goal.current_savings,
            monthly_contribution=monthly_contributions / max(len(profile.goals), 1),
            years=min(goal_years, 40),
            risk=profile.risk_tolerance,
            target=goal.target_amount,
            n_simulations=n_sims,
        )
        goal_projections[goal.name] = {
            "projection": proj.__dict__,
            "target": goal.target_amount,
            "target_year": goal.target_year,
            "success_rate": proj.success_rate,
        }

    # Debt payoff
    debt_data = [
        {"name": d.name, "balance": d.balance, "rate": d.interest_rate, "min_payment": d.minimum_payment}
        for d in profile.debts
    ]
    avalanche = simulate_debt_payoff(debt_data, extra_monthly=max(0, surplus * 0.3), strategy="avalanche")
    snowball = simulate_debt_payoff(debt_data, extra_monthly=max(0, surplus * 0.3), strategy="snowball")

    return {
        "portfolio": portfolio.__dict__,
        "goals": goal_projections,
        "debt_payoff": {
            "avalanche": avalanche.__dict__,
            "snowball": snowball.__dict__,
            "savings_vs_snowball": round(snowball.total_interest - avalanche.total_interest, 2),
        },
    }
