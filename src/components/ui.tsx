import type { ReactNode } from 'react'

const toneMap = {
  teal: 'from-teal/20 to-teal/5 text-teal ring-teal/15',
  amber: 'from-amber/20 to-amber/5 text-amber ring-amber/15',
  rose: 'from-rose/20 to-rose/5 text-rose ring-rose/15',
  sky: 'from-sky/20 to-sky/5 text-sky ring-sky/15',
} as const

interface KpiCardProps {
  label: string
  value: string
  delta: string
  tone: keyof typeof toneMap
  delayClass?: string
}

export function KpiCard({ label, value, delta, tone, delayClass = '' }: KpiCardProps) {
  return (
    <article
      className={`glass-panel animate-fade-up ${delayClass} group rounded-[22px] p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl`}
    >
      <div
        className={`mb-4 inline-flex rounded-xl bg-gradient-to-br px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ${toneMap[tone]}`}
      >
        {label}
      </div>
      <p className="font-display text-3xl font-700 tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-sm text-muted">{delta}</p>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full w-2/3 rounded-full bg-gradient-to-r opacity-80 transition-all duration-500 group-hover:w-full ${
            tone === 'teal'
              ? 'from-teal to-teal-bright'
              : tone === 'amber'
                ? 'from-amber to-amber/70'
                : tone === 'rose'
                  ? 'from-rose to-rose/70'
                  : 'from-sky to-sky/70'
          }`}
        />
      </div>
    </article>
  )
}

interface SectionHeaderProps {
  eyebrow: string
  title: string
  action?: ReactNode
}

export function SectionHeader({ eyebrow, title, action }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
        <h2 className="font-display text-2xl font-700 tracking-tight text-ink">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-rose/12 text-rose ring-rose/25',
    high: 'bg-amber/12 text-amber ring-amber/25',
    medium: 'bg-sky/12 text-sky ring-sky/25',
    low: 'bg-teal/12 text-teal ring-teal/25',
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${styles[urgency] ?? styles.low}`}
    >
      {urgency}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    high: 'bg-rose/12 text-rose ring-1 ring-rose/20',
    medium: 'bg-amber/12 text-amber ring-1 ring-amber/20',
    low: 'bg-teal/12 text-teal ring-1 ring-teal/20',
  }

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${styles[severity] ?? styles.low}`}>
      {severity}
    </span>
  )
}

export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal to-teal-bright transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-ink">{score}</span>
    </div>
  )
}
