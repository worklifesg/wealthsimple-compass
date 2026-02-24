'use client'

import { FinancialProfile } from '@/lib/types'
import { fmtCurrency } from '@/lib/format'
import type { Page } from '@/app/page'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  profile: FinancialProfile
  hasAnalysis: boolean
  onEditProfile: () => void
  onReset: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

const NAV_ITEMS: { key: Page; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'AI Dashboard', icon: '📊' },
  { key: 'scenarios', label: 'What-If Scenarios', icon: '🔮' },
  { key: 'chat', label: 'Ask Compass', icon: '💬' },
  { key: 'decisions', label: 'Decision Center', icon: '⚖️' },
]

export default function Sidebar({ currentPage, onNavigate, profile, hasAnalysis, onEditProfile, onReset, theme, onToggleTheme }: SidebarProps) {
  const netWorth = (
    profile.accounts.reduce((s, a) => s + a.balance, 0) +
    profile.emergency_fund -
    profile.debts.reduce((s, d) => s + d.balance, 0)
  )

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">C</div>
        <div>
          <div className="sidebar-logo-text">Compass</div>
          <div className="sidebar-logo-sub">AI Financial Planner</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">Navigate</div>
        {NAV_ITEMS.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`nav-link${currentPage === key ? ' active' : ''}`}
            onClick={() => onNavigate(key)}
          >
            <span style={{ fontSize: '16px' }}>{icon}</span>
            {label}
            {key === 'decisions' && hasAnalysis && (
              <span className="nav-link-badge">!</span>
            )}
          </button>
        ))}

        <div className="sidebar-section" style={{ marginTop: 24 }}>Your Profile</div>
        <div style={{ padding: '8px 14px', fontSize: '13px' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{profile.name || 'Your Plan'}</div>
          <div style={{ color: 'var(--text2)', fontSize: '12px' }}>
            Age {profile.age} · {profile.province}
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '12px', marginTop: 4 }}>
            Net Worth: <span style={{ color: netWorth >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
              {fmtCurrency(netWorth)}
            </span>
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '12px' }}>
            Income: {fmtCurrency(profile.annual_income)}/yr
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className="theme-toggle" onClick={onToggleTheme} style={{ marginBottom: 4, width: '100%', justifyContent: 'center' }}>
            <span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className="nav-link" onClick={onEditProfile}>
            <span style={{ fontSize: '14px' }}>✏️</span> Edit Profile
          </button>
          <button className="nav-link" onClick={onReset} style={{ color: 'var(--red)' }}>
            <span style={{ fontSize: '14px' }}>🗑️</span> Reset All
          </button>
        </div>
      </nav>
    </div>
  )
}
