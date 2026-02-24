export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function fmtCurrencyFull(n: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function fmtPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

export function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return fmtCurrency(n)
}

export function fmtMonths(months: number): string {
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m} months`
  if (m === 0) return `${y} years`
  return `${y}y ${m}m`
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#14b8a6'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

export function impactColor(impact: string): string {
  switch (impact) {
    case 'high': return '#ef4444'
    case 'medium': return '#f59e0b'
    case 'low': return '#3b82f6'
    default: return '#8888a0'
  }
}
