'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { FinancialProfile, ScenarioParam, ScenarioResponse } from '@/lib/types'
import { api } from '@/lib/api'
import { fmtCurrency, fmtCompact, fmtPct } from '@/lib/format'

interface Props {
  profile: FinancialProfile
}

/* Presets use backend field names: label, monthly_savings, extra_debt_payment, income_change, risk_tolerance */
function makePresets(profile: FinancialProfile): { label: string; emoji: string; scenarios: ScenarioParam[] }[] {
  return [
    {
      label: 'Save More vs Status Quo',
      emoji: '💰',
      scenarios: [
        { label: 'Current Plan' },
        { label: '+$500/mo Savings', monthly_savings: (profile.accounts.reduce((s, a) => s + a.monthly_contribution, 0)) + 500 },
      ],
    },
    {
      label: 'Aggressive Debt Payoff',
      emoji: '🏦',
      scenarios: [
        { label: 'Minimum Payments' },
        { label: '+$300/mo to Debt', extra_debt_payment: 300 },
      ],
    },
    {
      label: 'Conservative vs Aggressive',
      emoji: '⚖️',
      scenarios: [
        { label: 'Conservative', risk_tolerance: 'conservative' },
        { label: 'Aggressive', risk_tolerance: 'aggressive' },
      ],
    },
    {
      label: 'Big Raise Impact',
      emoji: '📈',
      scenarios: [
        { label: 'Current Trajectory' },
        { label: '+20% Income', income_change: 20 },
      ],
    },
  ]
}

const SCENARIO_COLORS = ['#6c63ff', '#22c55e', '#f59e0b', '#ef4444']

export default function ScenariosPage({ profile }: Props) {
  const [response, setResponse] = useState<ScenarioResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  // Custom scenario state
  const [customScenarios, setCustomScenarios] = useState<ScenarioParam[]>([
    { label: 'Scenario A' },
    { label: 'Scenario B', monthly_savings: (profile.accounts.reduce((s, a) => s + a.monthly_contribution, 0)) + 500 },
  ])
  const [showCustom, setShowCustom] = useState(false)

  const presets = makePresets(profile)

  const runScenarios = async (scenarios: ScenarioParam[], presetLabel?: string) => {
    setLoading(true)
    setError(null)
    setActivePreset(presetLabel || 'custom')
    try {
      const res = await api.planning.scenarios(profile, scenarios)
      setResponse(res)
    } catch (err: any) {
      setError(err.message || 'Scenario analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const updateCustom = (idx: number, partial: Partial<ScenarioParam>) => {
    const updated = [...customScenarios]
    updated[idx] = { ...updated[idx], ...partial }
    setCustomScenarios(updated)
  }

  // Convert scenarios response to a flat array for rendering
  const scenarioEntries = response ? Object.entries(response.scenarios) : []

  return (
    <div className="page">
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>What-If Scenarios</h1>
      <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 24 }}>Compare different financial strategies side-by-side with Monte Carlo projections.</p>

      {/* Preset scenarios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        {presets.map((preset) => (
          <button
            key={preset.label}
            className={`card ${activePreset === preset.label ? 'scenario-card-active' : ''}`}
            style={{ padding: 16, cursor: 'pointer', textAlign: 'left', border: activePreset === preset.label ? '1px solid var(--accent)' : '1px solid var(--border)', transition: 'all 0.2s' }}
            onClick={() => runScenarios(preset.scenarios, preset.label)}
            disabled={loading}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>{preset.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{preset.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{preset.scenarios.length} scenarios</div>
          </button>
        ))}
      </div>

      {/* Custom scenario builder */}
      <div className="card mb-4" style={{ padding: 20 }}>
        <div className="flex justify-between items-center" style={{ cursor: 'pointer' }} onClick={() => setShowCustom(!showCustom)}>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>🛠️ Custom Scenario Builder</h3>
          <span style={{ fontSize: 18, color: 'var(--text3)' }}>{showCustom ? '▼' : '▶'}</span>
        </div>

        {showCustom && (
          <div style={{ marginTop: 16 }}>
            {customScenarios.map((sc, i) => (
              <div key={i} className="card mb-3" style={{ padding: 16, background: 'var(--surface2)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: SCENARIO_COLORS[i % SCENARIO_COLORS.length] }} />
                  <input
                    className="form-input"
                    style={{ flex: 1, fontWeight: 700 }}
                    value={sc.label}
                    onChange={(e) => updateCustom(i, { label: e.target.value })}
                  />
                  {customScenarios.length > 2 && (
                    <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => setCustomScenarios(customScenarios.filter((_, j) => j !== i))}>✕</button>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Monthly Savings ($)</label>
                    <input className="form-input" type="number" placeholder="Leave blank for current" value={sc.monthly_savings ?? ''} onChange={(e) => updateCustom(i, { monthly_savings: e.target.value ? parseFloat(e.target.value) : null })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Extra Debt Payment ($/mo)</label>
                    <input className="form-input" type="number" value={sc.extra_debt_payment ?? ''} onChange={(e) => updateCustom(i, { extra_debt_payment: e.target.value ? parseFloat(e.target.value) : null })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Income Change (%)</label>
                    <input className="form-input" type="number" value={sc.income_change ?? ''} onChange={(e) => updateCustom(i, { income_change: e.target.value ? parseFloat(e.target.value) : null })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Retirement Age</label>
                    <input className="form-input" type="number" min={40} max={80} placeholder="65" value={sc.retirement_age ?? ''} onChange={(e) => updateCustom(i, { retirement_age: e.target.value ? parseInt(e.target.value) : null })} />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              {customScenarios.length < 4 && (
                <button className="btn btn-secondary btn-sm" onClick={() => setCustomScenarios([...customScenarios, { label: `Scenario ${String.fromCharCode(65 + customScenarios.length)}` }])}>
                  + Add Scenario
                </button>
              )}
              <button className="btn btn-primary btn-sm" onClick={() => runScenarios(customScenarios)} disabled={loading}>
                🔮 Compare Scenarios
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="card mb-4" style={{ padding: 40, textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }} />
          <p style={{ marginTop: 12, color: 'var(--text2)', fontSize: 13 }}>Running Monte Carlo simulations for each scenario…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card mb-4" style={{ padding: 20, borderColor: 'var(--red)' }}>
          <p style={{ color: 'var(--red)' }}>⚠️ {error}</p>
        </div>
      )}

      {/* Results */}
      {response && !loading && (
        <>
          {/* Overlay projection chart */}
          <div className="card mb-4" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 Median Projection Overlay</h3>
            <OverlayChart entries={scenarioEntries} />
          </div>

          {/* Comparison cards */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${scenarioEntries.length}, 1fr)`, gap: 12, marginBottom: 16 }}>
            {scenarioEntries.map(([name, r], i) => {
              const p = r.portfolio
              const medianFinal = p.median[p.median.length - 1]
              return (
                <div key={name} className="card scenario-card" style={{ padding: 20, borderTop: `3px solid ${SCENARIO_COLORS[i % SCENARIO_COLORS.length]}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{name}</div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Median Outcome</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: SCENARIO_COLORS[i % SCENARIO_COLORS.length] }}>{fmtCurrency(medianFinal)}</div>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Success Rate</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: p.success_rate >= 70 ? 'var(--green)' : 'var(--red)' }}>
                          {p.success_rate}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Best Case (90th)</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>
                          {fmtCompact(p.p90[p.p90.length - 1])}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Worst Case (10th)</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>
                        {fmtCompact(p.p10[p.p10.length - 1])}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* AI analysis */}
          {response.ai_comparison && (
            <div className="card mb-4" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🤖 AI Analysis</h3>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>
                Recommended: {response.ai_comparison.recommended_scenario}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 12 }}>
                {response.ai_comparison.comparison_summary}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 12 }}>
                {response.ai_comparison.reasoning}
              </div>
              {response.ai_comparison.human_note && (
                <div style={{ padding: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, fontSize: 13, color: 'var(--text2)' }}>
                  <strong>⚠️ Human consideration:</strong> {response.ai_comparison.human_note}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!response && !loading && (
        <div className="empty-state">
          <div className="empty-icon">🔮</div>
          <h3>Choose a scenario to compare</h3>
          <p>Select a preset above or build your own custom scenarios to see how different strategies affect your financial future.</p>
        </div>
      )}
    </div>
  )
}

/* Overlay chart — merges all scenario medians onto one chart */
function OverlayChart({ entries }: { entries: [string, any][] }) {
  // Build unified chart data by year
  if (!entries.length) return null
  const maxYears = Math.max(...entries.map(([_, r]) => r.portfolio.years.length))
  const chartData = Array.from({ length: maxYears }, (_, i) => {
    const point: any = { year: i }
    entries.forEach(([name, r]) => {
      if (i < r.portfolio.median.length) {
        point[name] = r.portfolio.median[i]
      }
    })
    return point
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 11 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v: number) => fmtCompact(v)} />
        <Tooltip content={<ScenarioTooltip />} />
        <Legend />
        {entries.map(([name, _], i) => (
          <Area
            key={name}
            type="monotone"
            dataKey={name}
            stroke={SCENARIO_COLORS[i % SCENARIO_COLORS.length]}
            strokeWidth={2}
            fill={SCENARIO_COLORS[i % SCENARIO_COLORS.length]}
            fillOpacity={0.08}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

function ScenarioTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Year {label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: p.color }}>{p.dataKey}</span>
          <span style={{ fontWeight: 600 }}>{fmtCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}
