'use client'

import { useState, useCallback } from 'react'
import { FinancialProfile, Debt, DebtType, InvestmentAccount, AccountType, FinancialGoal, GoalType, RiskTolerance } from '@/lib/types'
import { fmtCurrency } from '@/lib/format'

interface Props {
  profile: FinancialProfile
  onUpdate: (partial: Partial<FinancialProfile>) => void
  onComplete: (profile: FinancialProfile) => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

const STEPS = ['Personal', 'Income & Expenses', 'Debts', 'Investments', 'Goals', 'Risk & Review']
const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']

export default function OnboardingFlow({ profile, onUpdate, onComplete, theme, onToggleTheme }: Props) {
  const [step, setStep] = useState(0)

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const prev = () => setStep((s) => Math.max(s - 1, 0))

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return profile.age >= 18 && profile.name.length > 0
      case 1: return profile.annual_income > 0 && profile.monthly_expenses > 0
      case 2: return true // debts optional
      case 3: return true // accounts optional
      case 4: return true // goals optional
      case 5: return true
      default: return false
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Theme toggle — top right */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
        <button className="theme-toggle" onClick={onToggleTheme}>
          <span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>

      {/* Hero header */}
      {step === 0 && (
        <div className="onboarding-hero">
          <h1>Meet Compass</h1>
          <p>Your AI-powered financial planning copilot. In 2 minutes, get a personalized plan with Monte Carlo projections, tax optimization, and actionable recommendations.</p>
          <div className="onboarding-features">
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon">📊</div>
              <div className="onboarding-feature-text">AI Health Score & Analysis</div>
            </div>
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon">🔮</div>
              <div className="onboarding-feature-text">Monte Carlo Projections</div>
            </div>
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon">💬</div>
              <div className="onboarding-feature-text">Ask Anything About Your Finances</div>
            </div>
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon">⚖️</div>
              <div className="onboarding-feature-text">You Make the Final Decisions</div>
            </div>
          </div>
        </div>
      )}

      <div className="page" style={{ maxWidth: 700 }}>
        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((_, i) => (
            <div key={i} className={`step ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>
        <div className="step-labels">
          {STEPS.map((label, i) => (
            <span key={i} className={`step-label ${i === step ? 'active' : i < step ? 'done' : ''}`}>{label}</span>
          ))}
        </div>

        <div className="card mt-4" style={{ padding: 28 }}>
          {step === 0 && <StepPersonal profile={profile} onUpdate={onUpdate} />}
          {step === 1 && <StepIncome profile={profile} onUpdate={onUpdate} />}
          {step === 2 && <StepDebts profile={profile} onUpdate={onUpdate} />}
          {step === 3 && <StepInvestments profile={profile} onUpdate={onUpdate} />}
          {step === 4 && <StepGoals profile={profile} onUpdate={onUpdate} />}
          {step === 5 && <StepReview profile={profile} onUpdate={onUpdate} />}

          <div className="flex justify-between mt-6" style={{ gap: 12 }}>
            {step > 0 && (
              <button className="btn btn-secondary" onClick={prev}>← Previous</button>
            )}
            <div style={{ marginLeft: 'auto' }}>
              {step < STEPS.length - 1 ? (
                <button className="btn btn-primary" onClick={next} disabled={!canProceed()}>
                  Continue →
                </button>
              ) : (
                <button className="btn btn-primary btn-lg" onClick={() => onComplete(profile)} disabled={!canProceed()}>
                  🚀 Generate My AI Plan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Step 1: Personal ────────────────────────────────── */
function StepPersonal({ profile, onUpdate }: { profile: FinancialProfile; onUpdate: (p: Partial<FinancialProfile>) => void }) {
  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Let's get to know you</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>Basic info helps us tailor Canadian tax and investing strategies.</p>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Your Name</label>
          <input className="form-input" placeholder="Alex" value={profile.name} onChange={(e) => onUpdate({ name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Age</label>
          <input className="form-input" type="number" min={18} max={100} value={profile.age || ''} onChange={(e) => onUpdate({ age: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Province</label>
          <select className="form-select" value={profile.province} onChange={(e) => onUpdate({ province: e.target.value })}>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Filing Status</label>
          <select className="form-select" value={profile.filing_status} onChange={(e) => onUpdate({ filing_status: e.target.value })}>
            <option value="single">Single</option>
            <option value="married">Married / Common-law</option>
          </select>
        </div>
      </div>
    </>
  )
}

/* ── Step 2: Income & Expenses ───────────────────────── */
function StepIncome({ profile, onUpdate }: { profile: FinancialProfile; onUpdate: (p: Partial<FinancialProfile>) => void }) {
  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Income & Expenses</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>Your cash flow is the foundation of every financial plan.</p>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Annual Gross Income (CAD)</label>
          <input className="form-input" type="number" placeholder="85000" value={profile.annual_income || ''} onChange={(e) => onUpdate({ annual_income: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="form-group">
          <label className="form-label">Other Income (annual)</label>
          <input className="form-input" type="number" placeholder="0" value={profile.other_income || ''} onChange={(e) => onUpdate({ other_income: parseFloat(e.target.value) || 0 })} />
          <div className="form-hint">Side hustle, rental income, etc.</div>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Total Monthly Expenses</label>
          <input className="form-input" type="number" placeholder="3500" value={profile.monthly_expenses || ''} onChange={(e) => onUpdate({ monthly_expenses: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="form-group">
          <label className="form-label">Housing Cost (monthly)</label>
          <input className="form-input" type="number" placeholder="1500" value={profile.housing_cost || ''} onChange={(e) => onUpdate({ housing_cost: parseFloat(e.target.value) || 0 })} />
          <div className="form-hint">Rent or mortgage (included in expenses)</div>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Expected Annual Raise (%)</label>
          <input className="form-input" type="number" step="0.5" value={profile.income_growth_rate} onChange={(e) => onUpdate({ income_growth_rate: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>

      {profile.annual_income > 0 && profile.monthly_expenses > 0 && (
        <div className="card mt-4" style={{ background: 'var(--surface2)', padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Monthly Surplus</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: ((profile.annual_income + profile.other_income) / 12 - profile.monthly_expenses) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmtCurrency((profile.annual_income + profile.other_income) / 12 - profile.monthly_expenses)}/mo
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            Savings rate: {(((profile.annual_income + profile.other_income) / 12 - profile.monthly_expenses) / ((profile.annual_income + profile.other_income) / 12) * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </>
  )
}

/* ── Step 3: Debts ───────────────────────────────────── */
function StepDebts({ profile, onUpdate }: { profile: FinancialProfile; onUpdate: (p: Partial<FinancialProfile>) => void }) {
  const addDebt = () => {
    onUpdate({ debts: [...profile.debts, { name: '', type: 'credit_card', balance: 0, interest_rate: 0, minimum_payment: 0 }] })
  }
  const updateDebt = (idx: number, partial: Partial<Debt>) => {
    const debts = [...profile.debts]
    debts[idx] = { ...debts[idx], ...partial }
    onUpdate({ debts })
  }
  const removeDebt = (idx: number) => {
    onUpdate({ debts: profile.debts.filter((_, i) => i !== idx) })
  }

  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Debts</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>Add any debts you carry. This helps us optimize your payoff strategy.</p>

      {profile.debts.map((debt, i) => (
        <div key={i} className="card mb-3" style={{ padding: 16, background: 'var(--surface2)' }}>
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontWeight: 700, fontSize: 13 }}>Debt #{i + 1}</span>
            <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => removeDebt(i)}>Remove</button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" placeholder="Student Loan" value={debt.name} onChange={(e) => updateDebt(i, { name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={debt.type} onChange={(e) => updateDebt(i, { type: e.target.value as DebtType })}>
                <option value="credit_card">Credit Card</option>
                <option value="student_loan">Student Loan</option>
                <option value="mortgage">Mortgage</option>
                <option value="car_loan">Car Loan</option>
                <option value="line_of_credit">Line of Credit</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Balance ($)</label>
              <input className="form-input" type="number" value={debt.balance || ''} onChange={(e) => updateDebt(i, { balance: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label className="form-label">Interest Rate (%)</label>
              <input className="form-input" type="number" step="0.1" value={debt.interest_rate || ''} onChange={(e) => updateDebt(i, { interest_rate: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label className="form-label">Min Payment ($/mo)</label>
              <input className="form-input" type="number" value={debt.minimum_payment || ''} onChange={(e) => updateDebt(i, { minimum_payment: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
        </div>
      ))}

      <button className="btn btn-secondary" onClick={addDebt}>+ Add Debt</button>
      {profile.debts.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 12 }}>No debts? Great! Click Continue to skip.</p>
      )}
    </>
  )
}

/* ── Step 4: Investments ─────────────────────────────── */
function StepInvestments({ profile, onUpdate }: { profile: FinancialProfile; onUpdate: (p: Partial<FinancialProfile>) => void }) {
  const addAccount = () => {
    onUpdate({ accounts: [...profile.accounts, { name: '', type: 'tfsa', balance: 0, monthly_contribution: 0 }] })
  }
  const updateAccount = (idx: number, partial: Partial<InvestmentAccount>) => {
    const accounts = [...profile.accounts]
    accounts[idx] = { ...accounts[idx], ...partial }
    onUpdate({ accounts })
  }
  const removeAccount = (idx: number) => {
    onUpdate({ accounts: profile.accounts.filter((_, i) => i !== idx) })
  }

  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Investments & Savings</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Add your investment accounts. We'll project growth using Monte Carlo simulations.</p>

      <div className="form-group">
        <label className="form-label">Emergency Fund Balance ($)</label>
        <input className="form-input" type="number" placeholder="5000" value={profile.emergency_fund || ''} onChange={(e) => onUpdate({ emergency_fund: parseFloat(e.target.value) || 0 })} />
        <div className="form-hint">Cash savings in a HISA or savings account</div>
      </div>

      {profile.accounts.map((acc, i) => (
        <div key={i} className="card mb-3" style={{ padding: 16, background: 'var(--surface2)' }}>
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontWeight: 700, fontSize: 13 }}>Account #{i + 1}</span>
            <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => removeAccount(i)}>Remove</button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account Name</label>
              <input className="form-input" placeholder="TFSA — Wealthsimple" value={acc.name} onChange={(e) => updateAccount(i, { name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select className="form-select" value={acc.type} onChange={(e) => updateAccount(i, { type: e.target.value as AccountType })}>
                <option value="tfsa">TFSA</option>
                <option value="rrsp">RRSP</option>
                <option value="fhsa">FHSA</option>
                <option value="non_registered">Non-Registered</option>
                <option value="resp">RESP</option>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Current Balance ($)</label>
              <input className="form-input" type="number" value={acc.balance || ''} onChange={(e) => updateAccount(i, { balance: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Contribution ($)</label>
              <input className="form-input" type="number" value={acc.monthly_contribution || ''} onChange={(e) => updateAccount(i, { monthly_contribution: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
        </div>
      ))}

      <button className="btn btn-secondary" onClick={addAccount}>+ Add Account</button>
    </>
  )
}

/* ── Step 5: Goals ───────────────────────────────────── */
function StepGoals({ profile, onUpdate }: { profile: FinancialProfile; onUpdate: (p: Partial<FinancialProfile>) => void }) {
  const addGoal = () => {
    onUpdate({ goals: [...profile.goals, { name: '', type: 'retirement', target_amount: 0, target_year: 2050, priority: 1, current_savings: 0 }] })
  }
  const updateGoal = (idx: number, partial: Partial<FinancialGoal>) => {
    const goals = [...profile.goals]
    goals[idx] = { ...goals[idx], ...partial }
    onUpdate({ goals })
  }
  const removeGoal = (idx: number) => {
    onUpdate({ goals: profile.goals.filter((_, i) => i !== idx) })
  }

  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Financial Goals</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>What are you working toward? We'll project your probability of reaching each goal.</p>

      {profile.goals.map((goal, i) => (
        <div key={i} className="card mb-3" style={{ padding: 16, background: 'var(--surface2)' }}>
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontWeight: 700, fontSize: 13 }}>Goal #{i + 1}</span>
            <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => removeGoal(i)}>Remove</button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Goal Name</label>
              <input className="form-input" placeholder="Retire at 55" value={goal.name} onChange={(e) => updateGoal(i, { name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={goal.type} onChange={(e) => updateGoal(i, { type: e.target.value as GoalType })}>
                <option value="retirement">Retirement</option>
                <option value="house">Home Purchase</option>
                <option value="education">Education</option>
                <option value="emergency">Emergency Fund</option>
                <option value="travel">Travel</option>
                <option value="debt_free">Debt Freedom</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Target Amount ($)</label>
              <input className="form-input" type="number" value={goal.target_amount || ''} onChange={(e) => updateGoal(i, { target_amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label className="form-label">Target Year</label>
              <input className="form-input" type="number" min={2025} max={2080} value={goal.target_year} onChange={(e) => updateGoal(i, { target_year: parseInt(e.target.value) || 2050 })} />
            </div>
            <div className="form-group">
              <label className="form-label">Priority (1=highest)</label>
              <select className="form-select" value={goal.priority} onChange={(e) => updateGoal(i, { priority: parseInt(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}

      <button className="btn btn-secondary" onClick={addGoal}>+ Add Goal</button>
      {profile.goals.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 12 }}>
          No specific goals? We'll still analyze your overall financial health and projections.
        </p>
      )}
    </>
  )
}

/* ── Step 6: Risk & Review ───────────────────────────── */
function StepReview({ profile, onUpdate }: { profile: FinancialProfile; onUpdate: (p: Partial<FinancialProfile>) => void }) {
  const monthlyIncome = (profile.annual_income + profile.other_income) / 12
  const surplus = monthlyIncome - profile.monthly_expenses
  const netWorth = profile.accounts.reduce((s, a) => s + a.balance, 0) + profile.emergency_fund - profile.debts.reduce((s, d) => s + d.balance, 0)

  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Risk Tolerance & Review</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>One last thing — then we'll generate your AI-powered financial plan.</p>

      <div className="form-group">
        <label className="form-label">Investment Risk Tolerance</label>
        <div className="flex gap-3 mt-2">
          {(['conservative', 'moderate', 'aggressive'] as RiskTolerance[]).map((r) => (
            <button
              key={r}
              className={`btn ${profile.risk_tolerance === r ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onUpdate({ risk_tolerance: r })}
              style={{ flex: 1, textTransform: 'capitalize' }}
            >
              {r === 'conservative' ? '🛡️' : r === 'moderate' ? '⚖️' : '🚀'} {r}
            </button>
          ))}
        </div>
        <div className="form-hint mt-2">
          {profile.risk_tolerance === 'conservative' && 'Lower returns, lower volatility. ~5% expected annual return.'}
          {profile.risk_tolerance === 'moderate' && 'Balanced growth. ~7% expected annual return.'}
          {profile.risk_tolerance === 'aggressive' && 'Higher returns, higher volatility. ~9% expected annual return.'}
        </div>
      </div>

      <div className="card mt-6" style={{ background: 'var(--surface2)', padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Profile Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <SummaryItem label="Name" value={profile.name} />
          <SummaryItem label="Age" value={`${profile.age} · ${profile.province}`} />
          <SummaryItem label="Annual Income" value={fmtCurrency(profile.annual_income)} />
          <SummaryItem label="Monthly Expenses" value={fmtCurrency(profile.monthly_expenses)} />
          <SummaryItem label="Monthly Surplus" value={fmtCurrency(surplus)} positive={surplus >= 0} />
          <SummaryItem label="Net Worth" value={fmtCurrency(netWorth)} positive={netWorth >= 0} />
          <SummaryItem label="Debts" value={`${profile.debts.length} debts · ${fmtCurrency(profile.debts.reduce((s, d) => s + d.balance, 0))}`} />
          <SummaryItem label="Investment Accounts" value={`${profile.accounts.length} accounts · ${fmtCurrency(profile.accounts.reduce((s, a) => s + a.balance, 0))}`} />
          <SummaryItem label="Goals" value={`${profile.goals.length} goals`} />
          <SummaryItem label="Risk" value={profile.risk_tolerance} />
        </div>
      </div>

      <div className="card mt-4" style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid var(--accent)', padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🤖 What happens next</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
          Our AI will analyze your complete financial picture using GPT-4, run 5,000 Monte Carlo investment simulations,
          and generate personalized recommendations — all in about 15 seconds. You'll get a health score, tax insights,
          debt payoff strategies, and retirement projections. <strong>You always make the final decisions.</strong>
        </div>
      </div>
    </>
  )
}

function SummaryItem({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: positive !== undefined ? (positive ? 'var(--green)' : 'var(--red)') : 'var(--text)' }}>{value}</div>
    </div>
  )
}
