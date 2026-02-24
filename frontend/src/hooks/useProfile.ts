'use client'

import { useState, useCallback, useEffect } from 'react'
import { FinancialProfile, FullAnalysisResponse } from '@/lib/types'

const STORAGE_KEY = 'compass_profile'
const ANALYSIS_KEY = 'compass_analysis'

const DEFAULT_PROFILE: FinancialProfile = {
  name: '',
  age: 30,
  province: 'ON',
  filing_status: 'single',
  annual_income: 0,
  other_income: 0,
  income_growth_rate: 3,
  monthly_expenses: 0,
  housing_cost: 0,
  debts: [],
  accounts: [],
  emergency_fund: 0,
  goals: [],
  risk_tolerance: 'moderate',
}

export function useProfile() {
  const [profile, setProfileState] = useState<FinancialProfile>(DEFAULT_PROFILE)
  const [analysis, setAnalysisState] = useState<FullAnalysisResponse | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(STORAGE_KEY)
      if (savedProfile) setProfileState(JSON.parse(savedProfile))
      const savedAnalysis = localStorage.getItem(ANALYSIS_KEY)
      if (savedAnalysis) setAnalysisState(JSON.parse(savedAnalysis))
    } catch {}
    setLoaded(true)
  }, [])

  const setProfile = useCallback((p: FinancialProfile) => {
    setProfileState(p)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  }, [])

  const updateProfile = useCallback((partial: Partial<FinancialProfile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...partial }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const setAnalysis = useCallback((a: FullAnalysisResponse | null) => {
    setAnalysisState(a)
    if (a) {
      localStorage.setItem(ANALYSIS_KEY, JSON.stringify(a))
    } else {
      localStorage.removeItem(ANALYSIS_KEY)
    }
  }, [])

  const clearAll = useCallback(() => {
    setProfileState(DEFAULT_PROFILE)
    setAnalysisState(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ANALYSIS_KEY)
  }, [])

  const isProfileComplete = profile.annual_income > 0 && profile.monthly_expenses > 0 && profile.age > 0

  return {
    profile,
    setProfile,
    updateProfile,
    analysis,
    setAnalysis,
    clearAll,
    loaded,
    isProfileComplete,
    DEFAULT_PROFILE,
  }
}
