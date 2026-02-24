"""Core data models for the financial planning engine."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


# ── Enums ──────────────────────────────────────────────
class RiskTolerance(str, Enum):
    conservative = "conservative"
    moderate = "moderate"
    aggressive = "aggressive"


class GoalType(str, Enum):
    retirement = "retirement"
    house = "house"
    education = "education"
    emergency = "emergency"
    travel = "travel"
    debt_free = "debt_free"
    custom = "custom"


class DebtType(str, Enum):
    mortgage = "mortgage"
    student_loan = "student_loan"
    credit_card = "credit_card"
    car_loan = "car_loan"
    line_of_credit = "line_of_credit"
    other = "other"


class AccountType(str, Enum):
    tfsa = "tfsa"
    rrsp = "rrsp"
    fhsa = "fhsa"
    non_registered = "non_registered"
    resp = "resp"
    checking = "checking"
    savings = "savings"


# ── Sub-models ─────────────────────────────────────────
class Debt(BaseModel):
    name: str = Field(..., examples=["Student Loan"])
    type: DebtType
    balance: float = Field(..., ge=0)
    interest_rate: float = Field(..., ge=0, le=100, description="Annual % rate")
    minimum_payment: float = Field(..., ge=0, description="Monthly minimum")


class InvestmentAccount(BaseModel):
    name: str = Field(..., examples=["TFSA — Wealthsimple"])
    type: AccountType
    balance: float = Field(..., ge=0)
    monthly_contribution: float = Field(0, ge=0)


class FinancialGoal(BaseModel):
    name: str = Field(..., examples=["Retire at 55"])
    type: GoalType
    target_amount: float = Field(..., ge=0)
    target_year: int = Field(..., ge=2025, le=2080)
    priority: int = Field(1, ge=1, le=5, description="1=highest priority")
    current_savings: float = Field(0, ge=0)


# ── Main Profile ──────────────────────────────────────
class FinancialProfile(BaseModel):
    """Everything we need to build a comprehensive financial plan."""

    # Personal
    name: str = Field("", examples=["Alex"])
    age: int = Field(..., ge=18, le=100)
    province: str = Field("ON", examples=["ON", "BC", "AB", "QC"])
    filing_status: str = Field("single", examples=["single", "married", "common_law"])

    # Income
    annual_income: float = Field(..., ge=0)
    other_income: float = Field(0, ge=0, description="Side hustle, rental, etc.")
    income_growth_rate: float = Field(3.0, ge=0, le=30, description="Expected annual raise %")

    # Expenses
    monthly_expenses: float = Field(..., ge=0, description="Total monthly spend")
    housing_cost: float = Field(0, ge=0, description="Rent or mortgage payment (included in expenses)")

    # Debts
    debts: List[Debt] = Field(default_factory=list)

    # Investments & Savings
    accounts: List[InvestmentAccount] = Field(default_factory=list)
    emergency_fund: float = Field(0, ge=0)

    # Goals
    goals: List[FinancialGoal] = Field(default_factory=list)

    # Risk
    risk_tolerance: RiskTolerance = RiskTolerance.moderate

    # Computed helpers
    @property
    def total_debt(self) -> float:
        return sum(d.balance for d in self.debts)

    @property
    def total_investments(self) -> float:
        return sum(a.balance for a in self.accounts)

    @property
    def net_worth(self) -> float:
        return self.total_investments + self.emergency_fund - self.total_debt

    @property
    def monthly_income(self) -> float:
        return (self.annual_income + self.other_income) / 12

    @property
    def monthly_savings_rate(self) -> float:
        if self.monthly_income <= 0:
            return 0
        return max(0, (self.monthly_income - self.monthly_expenses) / self.monthly_income * 100)

    @property
    def monthly_debt_payments(self) -> float:
        return sum(d.minimum_payment for d in self.debts)


# ── Request / Response models ──────────────────────────
class AnalysisRequest(BaseModel):
    profile: FinancialProfile


class ScenarioParam(BaseModel):
    """A single parameter override for a what-if scenario."""
    label: str
    monthly_savings: Optional[float] = None
    extra_debt_payment: Optional[float] = None
    retirement_age: Optional[int] = None
    risk_tolerance: Optional[RiskTolerance] = None
    income_change: Optional[float] = None  # % change


class ScenarioRequest(BaseModel):
    profile: FinancialProfile
    scenarios: List[ScenarioParam] = Field(..., min_length=1, max_length=4)


class ChatMessage(BaseModel):
    role: str = Field(..., examples=["user", "assistant"])
    content: str


class ChatRequest(BaseModel):
    profile: FinancialProfile
    messages: List[ChatMessage]


class DecisionItem(BaseModel):
    id: str
    title: str
    description: str
    ai_recommendation: str
    ai_reasoning: str
    impact_score: float = Field(..., ge=0, le=100)
    requires_human: bool = True
    category: str = "financial"
    human_decision: Optional[str] = None
