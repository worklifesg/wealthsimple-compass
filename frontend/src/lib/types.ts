/* ── Financial Profile types ───────────────────────────── */

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive'
export type GoalType = 'retirement' | 'house' | 'education' | 'emergency' | 'travel' | 'debt_free' | 'custom'
export type DebtType = 'mortgage' | 'student_loan' | 'credit_card' | 'car_loan' | 'line_of_credit' | 'other'
export type AccountType = 'tfsa' | 'rrsp' | 'fhsa' | 'non_registered' | 'resp' | 'checking' | 'savings'

export interface Debt {
  name: string
  type: DebtType
  balance: number
  interest_rate: number
  minimum_payment: number
}

export interface InvestmentAccount {
  name: string
  type: AccountType
  balance: number
  monthly_contribution: number
}

export interface FinancialGoal {
  name: string
  type: GoalType
  target_amount: number
  target_year: number
  priority: number
  current_savings: number
}

export interface FinancialProfile {
  name: string
  age: number
  province: string
  filing_status: string
  annual_income: number
  other_income: number
  income_growth_rate: number
  monthly_expenses: number
  housing_cost: number
  debts: Debt[]
  accounts: InvestmentAccount[]
  emergency_fund: number
  goals: FinancialGoal[]
  risk_tolerance: RiskTolerance
}

/* ── Projection Data (flat — from Monte Carlo simulator) ── */

export interface ProjectionData {
  years: number[]
  median: number[]
  p10: number[]
  p25: number[]
  p75: number[]
  p90: number[]
  success_rate: number
  median_final: number
  target: number
}

/* ── Analysis Result (from GPT-4) ─────────────────────── */

export interface Recommendation {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: string
  action: string
  monthly_impact: number
}

export interface TaxInsight {
  title: string
  description: string
  estimated_savings: number
}

export interface AnalysisResult {
  health_score: number
  health_grade: string
  health_summary: string
  strengths: string[]
  warnings: string[]
  recommendations: Recommendation[]
  tax_insights: TaxInsight[]
  emergency_fund_months: number
  emergency_fund_target: number
  ideal_savings_rate: number
  debt_freedom_priority: string
  retirement_readiness: string
  key_risk: string
}

/* ── Goal Projection ──────────────────────────────────── */

export interface GoalProjection {
  projection: ProjectionData
  target: number
  target_year: number
  success_rate: number
}

/* ── Debt Payoff ──────────────────────────────────────── */

export interface DebtPayoffDetail {
  name: string
  original_balance: number
  interest_paid: number
  months_to_payoff: number
}

export interface DebtPayoff {
  strategy: string
  debts: DebtPayoffDetail[]
  total_interest: number
  months_to_free: number
  total_paid: number
}

/* ── Projections bundle ───────────────────────────────── */

export interface Projections {
  portfolio: ProjectionData
  goals: Record<string, GoalProjection>
  debt_payoff: {
    avalanche: DebtPayoff
    snowball: DebtPayoff
    savings_vs_snowball: number
  }
}

/* ── Decisions ────────────────────────────────────────── */

export interface DecisionOption {
  label: string
  description: string
}

export interface DecisionItem {
  id: string
  title: string
  description: string
  ai_recommendation: string
  ai_reasoning: string
  impact_score: number
  requires_human: boolean
  category: string
  options: DecisionOption[]
}

export interface CriticalDecision {
  title: string
  reason: string
}

export interface DecisionsResponse {
  decisions: DecisionItem[]
  critical_human_decision: CriticalDecision
}

/* ── Profile Summary ──────────────────────────────────── */

export interface ProfileSummary {
  net_worth: number
  monthly_surplus: number
  savings_rate: number
  total_debt: number
  total_investments: number
  debt_to_income: number
}

/* ── Full Analysis Response (/api/planning/analyze) ───── */

export interface FullAnalysisResponse {
  analysis: AnalysisResult
  projections: Projections
  decisions: DecisionsResponse
  profile_summary: ProfileSummary
}

/* ── Scenarios ────────────────────────────────────────── */

export interface ScenarioParam {
  label: string
  monthly_savings?: number | null
  extra_debt_payment?: number | null
  retirement_age?: number | null
  risk_tolerance?: RiskTolerance | null
  income_change?: number | null
}

export interface ScenarioResult {
  portfolio: ProjectionData
  params: ScenarioParam
}

export interface ScenarioTradeOff {
  scenario: string
  pros: string[]
  cons: string[]
  projected_outcome: string
}

export interface ScenarioComparison {
  comparison_summary: string
  recommended_scenario: string
  reasoning: string
  trade_offs: ScenarioTradeOff[]
  human_note: string
}

export interface ScenarioResponse {
  scenarios: Record<string, ScenarioResult>
  ai_comparison: ScenarioComparison
}

/* ── Chat ─────────────────────────────────────────────── */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}
