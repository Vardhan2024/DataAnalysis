import { ArrowUpRight, Database, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { KpiCard, SectionHeader, UrgencyBadge } from '../components/ui'
import { useProcurement } from '../hooks/useProcurement'

export function OverviewPage() {
  const { analysis, loading, loadSample, counts } = useProcurement()

  if (!analysis) {
    return (
      <EmptyState
        loading={loading}
        hasRawData={counts.products > 0}
        onLoadSample={loadSample}
      />
    )
  }

  const kpis = [
    {
      label: 'Items to reorder',
      value: String(analysis.kpis.itemsToReorder),
      delta: 'From reorder engine',
      tone: 'amber' as const,
    },
    {
      label: 'Stockout risk',
      value: String(analysis.kpis.stockoutRisk),
      delta: `${analysis.reorders.filter((r) => r.urgency === 'critical').length} critical SKUs`,
      tone: 'rose' as const,
    },
    {
      label: 'Avg vendor score',
      value: String(analysis.kpis.avgVendorScore),
      delta: 'TOPSIS composite',
      tone: 'teal' as const,
    },
    {
      label: 'Open anomalies',
      value: String(analysis.kpis.openAnomalies),
      delta: `${analysis.kpis.highAnomalies} high severity`,
      tone: 'sky' as const,
    },
  ]

  const topReorders = analysis.reorders.slice(0, 4)
  const topVendors = analysis.vendors.slice(0, 3)
  const topSignal = analysis.reorders[0]

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} delayClass={`animate-delay-${i + 1}`} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="glass-panel animate-fade-up animate-delay-2 rounded-[26px] p-6">
          <SectionHeader
            eyebrow="Action queue"
            title="Priority reorders"
            action={
              <Link
                to="/reorders"
                className="inline-flex items-center gap-1.5 rounded-full bg-contrast px-3.5 py-2 text-xs font-semibold text-on-contrast transition hover:opacity-90"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />

          <div className="space-y-3">
            {topReorders.length === 0 && (
              <p className="text-sm text-muted">No reorders needed right now.</p>
            )}
            {topReorders.map((item) => (
              <div
                key={item.productId}
                className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/80 bg-paper/80 px-4 py-3.5 transition duration-300 hover:border-teal/30 hover:bg-paper"
              >
                <div>
                  <p className="font-semibold text-ink">{item.productName}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {item.productId} · Stock {item.currentStock} · Order by {item.orderBy}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-ink">{item.recommendedQty} units</p>
                  <UrgencyBadge urgency={item.urgency} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass-panel animate-fade-up animate-delay-3 overflow-hidden rounded-[26px] p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Intelligence</p>
                <h2 className="font-display text-xl font-700 text-ink">Today&apos;s signal</h2>
              </div>
              <Sparkles className="h-5 w-5 text-teal" />
            </div>
            {topSignal ? (
              <>
                <p className="text-sm leading-relaxed text-muted">
                  Demand pressure on {topSignal.productName}. Reorder {topSignal.recommendedQty} units
                  by {topSignal.orderBy} from {topSignal.vendor} (score {topSignal.vendorScore}).
                </p>
                <div className="mt-5 h-24 panel-inverse rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/50">Projected cover</p>
                  <p className="mt-2 font-display text-3xl font-700">{topSignal.daysOfCover} days</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">Inventory levels look healthy across tracked SKUs.</p>
            )}
          </div>

          <div className="glass-panel animate-fade-up animate-delay-4 rounded-[26px] p-6">
            <SectionHeader eyebrow="Leaderboard" title="Top vendors" />
            <div className="space-y-3">
              {topVendors.map((vendor) => (
                <div key={vendor.vendorId} className="flex items-center justify-between rounded-2xl bg-mist/80 px-3.5 py-3">
                  <div>
                    <p className="font-semibold text-ink">{vendor.name}</p>
                    <p className="text-xs text-muted">Rank #{vendor.rank} · OTIF {vendor.onTime}%</p>
                  </div>
                  <p className="font-display text-xl font-700 text-teal">{vendor.score}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function EmptyState({
  loading,
  hasRawData,
  onLoadSample,
}: {
  loading: boolean
  hasRawData: boolean
  onLoadSample: () => Promise<void>
}) {
  return (
    <div className="glass-panel animate-fade-up rounded-[26px] p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-teal">
        <Database className="h-7 w-7" />
      </div>
      <h2 className="font-display text-2xl font-700 text-ink">No analysis yet</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
        {hasRawData
          ? 'Data is in Chrome storage. Run analysis from the Data Upload page.'
          : 'Load sample procurement data or upload CSVs to generate recommendations, forecasts, vendor scores, and anomaly alerts.'}
      </p>
      <button
        disabled={loading}
        onClick={() => void onLoadSample()}
        className="mt-6 btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        {loading ? 'Working…' : 'Load sample data & analyze'}
      </button>
      <p className="mt-3 text-xs text-muted">
        Or go to <Link className="font-semibold text-teal" to="/data">Data Upload</Link>
      </p>
    </div>
  )
}
