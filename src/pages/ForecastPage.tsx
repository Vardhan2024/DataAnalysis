import { useMemo, useState } from 'react'
import { SectionHeader } from '../components/ui'
import { useProcurement } from '../hooks/useProcurement'

export function ForecastPage() {
  const { analysis, loading, loadSample } = useProcurement()
  const forecasts = analysis?.forecasts ?? []
  const [selectedId, setSelectedId] = useState<string>('')

  const selected = useMemo(() => {
    if (!forecasts.length) return null
    return forecasts.find((f) => f.productId === (selectedId || forecasts[0].productId)) ?? forecasts[0]
  }, [forecasts, selectedId])

  if (!analysis || !selected) {
    return (
      <div className="glass-panel rounded-[26px] p-8 text-center">
        <p className="text-muted">No forecast results yet.</p>
        <button disabled={loading} onClick={() => void loadSample()} className="mt-4 btn-primary rounded-lg px-4 py-2 text-sm font-semibold">
          Load sample & analyze
        </button>
      </div>
    )
  }

  const series = selected.series
  const maxY = Math.max(...series.map((p) => Math.max(p.forecast, p.actual ?? 0)), 1)
  const chartH = 220

  return (
    <div className="space-y-5">
      <div className="glass-panel animate-fade-up rounded-[26px] p-6">
        <SectionHeader
          eyebrow="Holt-Winters"
          title="Demand forecast"
          action={
            <select
              className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink"
              value={selected.productId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {forecasts.map((f) => (
                <option key={f.productId} value={f.productId}>
                  {f.productName}
                </option>
              ))}
            </select>
          }
        />

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Next 30 days" value={`${selected.next30DayDemand} units`} />
          <Metric label="Avg daily demand" value={`${selected.avgDailyDemand}`} />
          <Metric label="Model confidence" value={selected.confidence} />
        </div>

        <div className="rounded-[22px] border border-line bg-gradient-to-b from-paper to-paper-soft p-5">
          <div className="mb-4 flex items-center gap-4 text-xs font-semibold">
              <span className="inline-flex items-center gap-2 text-muted">
                <span className="h-2 w-6 rounded-full bg-[#f59e0b]" /> Actual
              </span>
              <span className="inline-flex items-center gap-2 text-muted">
                <span className="h-2 w-6 rounded-full bg-[#14b8a6]" /> Forecast
              </span>
            </div>

          <div className="relative h-[240px] w-full">
            <svg viewBox={`0 0 640 ${chartH + 20}`} className="h-full w-full" preserveAspectRatio="none">
              {[0.25, 0.5, 0.75].map((g) => (
                <line key={g} x1="0" x2="640" y1={chartH * g} y2={chartH * g} stroke="#d5e5e1" strokeDasharray="4 6" />
              ))}
              <polyline
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="8 5"
                points={series
                  .map((p, i) => {
                    const x = (i / Math.max(series.length - 1, 1)) * 640
                    const y = chartH - (p.forecast / maxY) * chartH
                    return `${x},${y}`
                  })
                  .join(' ')}
              />
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={series
                  .filter((p) => p.actual !== null)
                  .map((p) => {
                    const i = series.indexOf(p)
                    const x = (i / Math.max(series.length - 1, 1)) * 640
                    const y = chartH - ((p.actual as number) / maxY) * chartH
                    return `${x},${y}`
                  })
                  .join(' ')}
              />
            </svg>
          </div>

          <div className="mt-2 grid gap-1 text-center text-[10px] font-semibold text-muted" style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}>
            {series.map((p) => (
              <span key={p.week}>{p.week}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-700 capitalize text-ink">{value}</p>
    </div>
  )
}
