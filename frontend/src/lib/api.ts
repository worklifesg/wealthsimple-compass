import {
  FinancialProfile,
  FullAnalysisResponse,
  ScenarioParam,
  ScenarioResponse,
  ChatMessage,
} from './types'

const API_BASE = '/api'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'API error')
  }
  return res.json()
}

export const api = {
  health: () => req<{ status: string; ai_model: string; has_api_key: boolean }>('/health'),

  planning: {
    analyze: (profile: FinancialProfile) =>
      req<FullAnalysisResponse>('/planning/analyze', {
        method: 'POST',
        body: JSON.stringify({ profile }),
      }),

    scenarios: (profile: FinancialProfile, scenarios: ScenarioParam[]) =>
      req<ScenarioResponse>('/planning/scenarios', {
        method: 'POST',
        body: JSON.stringify({ profile, scenarios }),
      }),

    quickProject: (profile: FinancialProfile) =>
      req<{ projections: any; profile_summary: any }>('/planning/quick-project', {
        method: 'POST',
        body: JSON.stringify({ profile }),
      }),
  },

  chat: {
    send: (messages: Array<{ role: string; content: string }>, profile: FinancialProfile) =>
      req<{ reply: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ profile, messages }),
      }),
  },
}
