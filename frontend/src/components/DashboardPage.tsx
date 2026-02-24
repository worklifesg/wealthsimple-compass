'use client'

import { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { FinancialProfile, FullAnalysisResponse } from '@/lib/types'
import { api } from '@/lib/api'
import { fmtCurrency, fmtCurrencyFull, fmtPct, fmtCompact, scoreColor, impactColor } from '@/lib/format'

interface Props {
  profile: FinancialProfile
  analysis: FullAnalysisResponse | null
  setAnalysis: (a: FullAnalysisResponse) => void
}

export default function DashboardPage({ profile, analysis, setAnalysis }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!analysis) {
      runAnalysis()
    }
  }, [])

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.planning.analyze(profile)
      setAnalysis(res)
    } catch (err: any) {
      setError(err.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={runAnalysis} />
  if (!analysis) return null

    const { analysis: ai, projections, decisions } = analysis
  const monthlyIncome = (profile.annual_income + (profile.other_income || 0)) / 12
  const surplus = monthlyIncome - profile.monthly_expenses
  const totalDebt = profile.debts.reduce((s, d) => s + d.balance, 0)
  const totalInv = profile.accounts.reduce((s, a) => s + a.balance, 0)
  const netWorth = totalInv + profile.emergency_fund - totalDebt

  return (
    <div className="page">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>Financial Dashboard</h1>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 2 }}>AI-generated analysis for {profile.name} · Last updated just now</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={runAnalysis} disabled={loading}>
          🔄 Re-analyze
        </button>
      </div>

      {/* ── Health score + key metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, marginBottom: 16 }}>
        <HealthScoreCard score={ai.health_score} grade={ai.health_grade} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <MetricCard label="Net Worth" value={fmtCurrency(netWorth)} sub={netWorth >= 0 ? 'positive' : 'needs attention'} color={netWorth >= 0 ? 'var(--green)' : 'var(--red)'} />
          <MetricCard label="Monthly Surplus" value={fmtCurrency(surplus)} sub={`${fmtPct(surplus / monthlyIncome)} savings rate`} color={surplus >= 0 ? 'var(--green)' : 'var(--red)'} />
          <MetricCard label="Total Debt" value={fmtCurrency(totalDebt)} sub={`${profile.debts.length} account${profile.debts.length !== 1 ? 's' : ''}`} color={totalDebt > 0 ? 'var(--yellow)' : 'var(--green)'} />
          <MetricCard label="Emergency Fund" value={fmtCurrency(profile.emergency_fund)} sub={`${(profile.emergency_fund / profile.monthly_expenses).toFixed(1)} months coverage`} color={profile.emergency_fund >= profile.monthly_expenses * 3 ? 'var(--green)' : 'var(--red)'} />
        </div>
      </div>

      {/* ── Strengths & warnings ── */}
      {(ai.strengths.length > 0 || ai.warnings.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {ai.strengths.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--green)' }}>✅ Strengths</h3>
              {ai.strengths.map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--text2)', padding: '6px 0', borderBottom: i < ai.strengths.length - 1 ? '1px solid var(--border)' : 'none' }}>{s}</div>
              ))}
            </div>
          )}
          {ai.warnings.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--yellow)' }}>⚠️ Warnings</h3>
              {ai.warnings.map((w, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--text2)', padding: '6px 0', borderBottom: i < ai.warnings.length - 1 ? '1px solid var(--border)' : 'none' }}>{w}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Portfolio projection chart ── */}
      {projections.portfolio && (
        <div className="card mb-4" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📈 Portfolio Projection — Monte Carlo (5,000 simulations)</h3>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
            {profile.risk_tolerance} risk · {projections.portfolio.years.length - 1} years · Success rate: <strong style={{ color: projections.portfolio.success_rate >= 70 ? 'var(--green)' : 'var(--red)' }}>{projections.portfolio.success_rate}%</strong>
          </p>
          <ProjectionChart data={projections.portfolio} />
          <div style={{ display: 'flex', gap: 24, marginTop: 12, justifyContent: 'center' }}>
            <ChartLegend color="rgba(34,197,94,0.15)" label={`90th: ${fmtCompact(projections.portfolio.p90[projections.portfolio.p90.length - 1])}`} />
            <ChartLegend color="rgba(34,197,94,0.35)" label={`Median: ${fmtCompact(projections.portfolio.median[projections.portfolio.median.length - 1])}`} />
            <ChartLegend color="rgba(239,68,68,0.25)" label={`10th: ${fmtCompact(projections.portfolio.p10[projections.portfolio.p10.length - 1])}`} />
          </div>
        </div>
      )}

      {/* ── Goal projections ── */}
      {projections.goals && Object.keys(projections.goals).length > 0 && (
        <div className="card mb-4" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🎯 Goal Projections</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {Object.entries(projections.goals).map(([goalName, goal], i) => {
              const pct = Math.min(goal.success_rate, 100)
              return (
                <div key={i} className="card" style={{ padding: 16, background: 'var(--surface2)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{goalName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>Target: {fmtCurrency(goal.target)} by {goal.target_year}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)' }}>{pct.toFixed(0)}%</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>success probability</div>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--surface)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)', transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8 }}>
                    Median outcome: <strong>{fmtCurrency(goal.projection.median_final)}</strong> · Shortfall risk: {fmtCurrency(goal.target - goal.projection.median_final)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recommendations ── */}
      <div className="card mb-4" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>💡 AI Recommendations</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {ai.recommendations.map((rec, i) => (
            <div key={i} className="recommendation-card">
              <div className="recommendation-number">{i + 1}</div>
              <div className="recommendation-content">
                <div className="recommendation-title">{rec.title}</div>
                <div className="recommendation-description">{rec.description}</div>
                {rec.action && (
                  <div className="recommendation-action">
                    <strong>Action:</strong> {rec.action}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {rec.impact && <span className={`badge badge-${impactColor(rec.impact)}`}>{rec.impact} impact</span>}
                  {rec.category && <span className="badge badge-purple">{rec.category}</span>}
                  {rec.monthly_impact !== undefined && rec.monthly_impact !== 0 && (
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{rec.monthly_impact > 0 ? '+' : ''}{fmtCurrency(rec.monthly_impact)}/mo</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tax insights ── */}
      {ai.tax_insights && ai.tax_insights.length > 0 && (
        <div className="card mb-4" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🏛️ Canadian Tax Insights</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {ai.tax_insights.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < ai.tax_insights.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>💰</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{tip.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{tip.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Debt payoff comparison ── */}
      {projections.debt_payoff && profile.debts.length > 0 && (
        <div className="card mb-4" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🏦 Debt Payoff Strategies</h3>
          {projections.debt_payoff.savings_vs_snowball > 0 && (
            <p style={{ fontSize: 12, color: 'var(--green)', marginBottom: 12 }}>💡 Avalanche saves you {fmtCurrency(projections.debt_payoff.savings_vs_snowball)} vs snowball</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {[projections.debt_payoff.avalanche, projections.debt_payoff.snowball].map((strat, i) => (
              <div key={i} className="card" style={{ padding: 16, background: 'var(--surface2)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize', marginBottom: 8 }}>{strat.strategy} Method</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Time to Free</div><div style={{ fontWeight: 700, fontSize: 16 }}>{strat.months_to_free} months</div></div>
                  <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Total Interest</div><div style={{ fontWeight: 700, fontSize: 16, color: 'var(--red)' }}>{fmtCurrency(strat.total_interest)}</div></div>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
                  Debts: {strat.debts.map(d => d.name).join(' → ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Connect with Financial Advisor ── */}
      <div className="advisor-cta">
        <div className="advisor-cta-title">📋 Take These Recommendations to a Professional</div>
        <div className="advisor-cta-desc">
          Compass has analyzed your finances and generated personalized recommendations.
          Share this plan with a licensed financial advisor to validate the strategy and take action.
        </div>
        <div className="advisor-cta-features">
          <div className="advisor-cta-feature">✅ AI-generated plan ready</div>
          <div className="advisor-cta-feature">📊 Monte Carlo projections included</div>
          <div className="advisor-cta-feature">🔒 Your data stays private</div>
        </div>
        <button className="advisor-cta-btn" onClick={() => {
          const subject = encodeURIComponent('Financial Plan Review — Compass AI Analysis')
          const body = encodeURIComponent(
            `Hi,\n\nI've used an AI financial planning tool (Compass) to analyze my financial situation. Here's a summary:\n\n` +
            `• Health Score: ${ai.health_score}/100 (${ai.health_grade})\n` +
            `• Net Worth: $${Math.round(profile.accounts.reduce((s, a) => s + a.balance, 0) + profile.emergency_fund - profile.debts.reduce((s, d) => s + d.balance, 0)).toLocaleString()}\n` +
            `• Annual Income: $${profile.annual_income.toLocaleString()}\n` +
            `• Savings Rate: ${ai.ideal_savings_rate || 'N/A'}% recommended\n` +
            `• # of Recommendations: ${ai.recommendations?.length || 0}\n` +
            `• Key Risk: ${ai.key_risk || 'N/A'}\n\n` +
            `I'd like to review these AI-generated recommendations with a professional advisor.\n\nBest regards,\n${profile.name}`
          )
          window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
        }}>
          📨 Email Plan to Your Advisor
        </button>
        <div className="advisor-cta-note">
          This opens your email client with a summary. No data is shared with third parties.
          <br/>⚠️ This is a demo prototype — not real financial advice.
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────── */

function HealthScoreCard({ score, grade }: { score: number; grade: string }) {
  const color = scoreColor(score)
  const circumference = 2 * Math.PI * 52
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="card health-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="score-ring" style={{ position: 'relative', width: 120, height: 120 }}>
        <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={60} cy={60} r={52} fill="none" stroke="var(--surface2)" strokeWidth={8} />
          <circle cx={60} cy={60} r={52} fill="none" stroke={color} strokeWidth={8} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginTop: 2 }}>/100</div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color }}>Grade: {grade}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Financial Health Score</div>
    </div>
  )
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function ProjectionChart({ data }: { data: any }) {
  const chartData = useMemo(() => {
    const len = data.median.length
    return Array.from({ length: len }, (_, i) => ({
      year: data.years ? data.years[i] : i,
      p10: data.p10[i],
      p25: data.p25[i],
      median: data.median[i],
      p75: data.p75[i],
      p90: data.p90[i],
    }))
  }, [data])

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="gradOuter" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradInner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#6b7280' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v: number) => fmtCompact(v)} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="p90" stroke="none" fill="url(#gradOuter)" />
        <Area type="monotone" dataKey="p75" stroke="none" fill="url(#gradInner)" />
        <Area type="monotone" dataKey="median" stroke="#22c55e" strokeWidth={2} fill="none" dot={false} />
        <Area type="monotone" dataKey="p25" stroke="none" fill="url(#gradInner)" />
        <Area type="monotone" dataKey="p10" stroke="none" fill="url(#gradOuter)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Year {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, opacity: p.dataKey === 'median' ? 1 : 0.7 }}>
          <span>{p.dataKey}</span>
          <span style={{ fontWeight: 600 }}>{fmtCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function ChartLegend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
      <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
      {label}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="page">
      <div className="loading-container">
        <div className="loading-spinner" />
        <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>Analyzing your finances…</h2>
        <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 6, textAlign: 'center', maxWidth: 400 }}>
          GPT-4 is reviewing your profile, running 5,000 Monte Carlo simulations,
          and generating personalized recommendations. This takes about 15 seconds.
        </p>
        <div style={{ marginTop: 20, display: 'grid', gap: 8, fontSize: 12, color: 'var(--text2)' }}>
          <div>⏳ Analyzing income, expenses, and cash flow…</div>
          <div>⏳ Running Monte Carlo investment projections…</div>
          <div>⏳ Evaluating Canadian tax optimization…</div>
          <div>⏳ Generating actionable recommendations…</div>
        </div>
      </div>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="page">
      <div className="loading-container">
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>Analysis Failed</h2>
        <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 6, textAlign: 'center', maxWidth: 400 }}>{error}</p>
        <button className="btn btn-primary mt-4" onClick={onRetry}>Try Again</button>
      </div>
    </div>
  )
}
