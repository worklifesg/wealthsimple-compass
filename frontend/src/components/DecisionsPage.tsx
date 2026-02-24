'use client'

import { useState } from 'react'
import { FullAnalysisResponse, DecisionItem, DecisionOption, CriticalDecision } from '@/lib/types'

interface Props {
  analysis: FullAnalysisResponse | null
}

export default function DecisionsPage({ analysis }: Props) {
  if (!analysis) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">⚖️</div>
          <h3>No decisions yet</h3>
          <p>Run the AI analysis from the Dashboard first. Compass will identify decisions that need your judgment.</p>
        </div>
      </div>
    )
  }

  const { decisions } = analysis

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Decision Center</h1>
      <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 8 }}>
        AI has identified decisions that require your judgment. These involve personal values, risk preferences, and life trade-offs that only you can weigh.
      </p>

      {/* Human-AI responsibility callout */}
      <div className="card mb-6" style={{ padding: 20, background: 'rgba(108,99,255,0.06)', border: '1px solid var(--accent)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 28, flexShrink: 0 }}>🤝</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Human + AI Partnership</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
              Compass analyzes data, runs simulations, and quantifies trade-offs — but <strong>you make the final call</strong> on decisions
              that reflect your values and life priorities. AI can tell you <em>what happens if</em>, but only you can decide <em>what matters most</em>.
            </div>
          </div>
        </div>
      </div>

      {/* Critical human decision (highlighted) */}
      {decisions.critical_human_decision && (
        <CriticalDecisionCard decision={decisions.critical_human_decision} />
      )}

      {/* Individual decision items */}
      {decisions.decisions && decisions.decisions.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Decisions Requiring Your Input</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {decisions.decisions.map((item, i) => (
              <DecisionCard key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Decision audit trail */}
      <div className="card mt-6" style={{ padding: 20, background: 'var(--surface2)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📋 How This Works</h3>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
          1. <strong>AI identifies</strong> decisions where your input matters most<br />
          2. <strong>AI quantifies</strong> each option with projections and trade-offs<br />
          3. <strong>You choose</strong> based on your values, circumstances, and comfort level<br />
          4. <strong>AI adapts</strong> your plan based on your decisions<br /><br />
          This is the core principle: <strong>AI expands what you can analyze, but never decides what you should value.</strong>
        </div>
      </div>
    </div>
  )
}

function CriticalDecisionCard({ decision }: { decision: CriticalDecision }) {
  return (
    <div className="card decision-card decision-card-critical" style={{ padding: 24, border: '2px solid var(--yellow)', background: 'rgba(245,158,11,0.04)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div style={{ fontSize: 28 }}>⚠️</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Critical Human Decision
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{decision.title}</div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16 }}>
        {decision.reason}
      </div>

      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, padding: 16, background: 'rgba(245,158,11,0.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.15)' }}>
        <strong>Why this must remain human:</strong> {decision.reason}
      </div>
    </div>
  )
}

function DecisionCard({ item, index }: { item: DecisionItem; index: number }) {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="card decision-card" style={{ padding: 20 }}>
      <div className="flex items-center gap-3 mb-3">
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          {index + 1}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</div>
          {item.category && <span className="badge badge-accent" style={{ marginTop: 4 }}>{item.category}</span>}
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 }}>
        {item.description}
      </div>

      {/* Impact bar */}
      {item.impact_score > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Importance Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--surface2)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: 3,
                width: `${item.impact_score}%`,
                background: item.impact_score >= 70 ? 'var(--green)' : item.impact_score >= 40 ? 'var(--yellow)' : 'var(--text3)',
                transition: 'width 0.5s'
              }} />
            </div>
            <span className="badge" style={{ background: item.impact_score >= 70 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: item.impact_score >= 70 ? 'var(--green)' : 'var(--yellow)' }}>{item.impact_score}/100</span>
          </div>
        </div>
      )}

      {/* Options */}
      {item.options && item.options.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>Your Options:</div>
          {item.options.map((opt, oi) => (
            <button
              key={oi}
              className={`card ${selected === oi ? 'decision-option-selected' : ''}`}
              style={{
                padding: 14,
                cursor: 'pointer',
                textAlign: 'left',
                background: selected === oi ? 'rgba(108,99,255,0.08)' : 'var(--surface2)',
                border: selected === oi ? '1px solid var(--accent)' : '1px solid var(--border)',
                transition: 'all 0.2s',
              }}
              onClick={() => setSelected(oi)}
            >
              <div className="flex justify-between items-center">
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {selected === oi ? '✓ ' : ''}{opt.label}
                </div>
              </div>
              {opt.description && (
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>{opt.description}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* AI reasoning */}
      {item.ai_reasoning && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)', padding: 12, background: 'var(--surface2)', borderRadius: 8, lineHeight: 1.6 }}>
          <strong>AI reasoning:</strong> {item.ai_reasoning}
        </div>
      )}
    </div>
  )
}
