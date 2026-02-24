'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import Sidebar from '@/components/Sidebar'
import OnboardingFlow from '@/components/OnboardingFlow'
import DashboardPage from '@/components/DashboardPage'
import ScenariosPage from '@/components/ScenariosPage'
import ChatPage from '@/components/ChatPage'
import DecisionsPage from '@/components/DecisionsPage'

export type Page = 'dashboard' | 'scenarios' | 'chat' | 'decisions'

export default function Home() {
  const { profile, setProfile, updateProfile, analysis, setAnalysis, clearAll, loaded, isProfileComplete } = useProfile()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [showDisclaimer, setShowDisclaimer] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('compass-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('compass-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  useEffect(() => {
    if (loaded && !isProfileComplete) setShowOnboarding(true)
  }, [loaded, isProfileComplete])

  if (!loaded) {
    return (
      <div className="loading-container" style={{ height: '100vh' }}>
        <div className="loading-spinner" />
        <div className="loading-text">Loading Compass...</div>
      </div>
    )
  }

  if (showOnboarding || !isProfileComplete) {
    return (
      <OnboardingFlow
        profile={profile}
        onUpdate={updateProfile}
        onComplete={(p) => {
          setProfile(p)
          setShowOnboarding(false)
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  return (
    <div className="app-layout">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        profile={profile}
        hasAnalysis={!!analysis}
        onEditProfile={() => setShowOnboarding(true)}
        onReset={clearAll}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <div className="main-content">
        {showDisclaimer && (
          <div className="disclaimer-banner">
            <span>⚠️</span>
            <span>This is a <strong>demo prototype</strong> — not real financial advice. All AI analysis is for demonstration purposes only. Always consult a licensed financial advisor.</span>
            <button className="disclaimer-close" onClick={() => setShowDisclaimer(false)} aria-label="Dismiss">×</button>
          </div>
        )}
        {currentPage === 'dashboard' && (
          <DashboardPage profile={profile} analysis={analysis} setAnalysis={setAnalysis} />
        )}
        {currentPage === 'scenarios' && (
          <ScenariosPage profile={profile} />
        )}
        {currentPage === 'chat' && (
          <ChatPage profile={profile} />
        )}
        {currentPage === 'decisions' && (
          <DecisionsPage analysis={analysis} />
        )}
      </div>
    </div>
  )
}
