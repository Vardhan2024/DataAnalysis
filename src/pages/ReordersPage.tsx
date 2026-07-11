import { Filter } from 'lucide-react'
import { SectionHeader, ScoreBar, UrgencyBadge } from '../components/ui'
import { useProcurement } from '../hooks/useProcurement'
import { Link } from 'react-router-dom'

export function ReordersPage() {
  const { analysis, loading, loadSample } = useProcurement()
  const reorders = analysis?.reorders ?? []

  if (!analysis) {
    return (
      <div className="glass-panel rounded-[26px] p-8 text-center">
        <p className="text-muted">No reorder results yet.</p>
        <button
          disabled={loading}
          onClick={() => void loadSample()}
          className="mt-4 btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Load sample & analyze
        </button>
      </div>
    )
  }

  const critical = reorders.filter((r) => r.urgency === 'critical').length
  const high = reorders.filter((r) => r.urgency === 'high').length
  const watch = reorders.filter((r) => r.urgency === 'medium' || r.urgency === 'low').length

  return (
    <div className="glass-panel animate-fade-up rounded-[26px] p-6">
      <SectionHeader
        eyebrow="Purchase recommendations"
        title="Reorder hub"
        action={
          <Link to="/data" className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-2 text-xs font-semibold text-ink">
            <Filter className="h-3.5 w-3.5" /> Manage data
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-rose/8 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose">Critical</p>
          <p className="mt-1 font-display text-2xl font-700 text-ink">{critical}</p>
        </div>
        <div className="rounded-2xl bg-amber/8 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber">High</p>
          <p className="mt-1 font-display text-2xl font-700 text-ink">{high}</p>
        </div>
        <div className="rounded-2xl bg-teal/8 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal">Watch</p>
          <p className="mt-1 font-display text-2xl font-700 text-ink">{watch}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.14em] text-muted">
              <th className="px-3 pb-2 font-semibold">Product</th>
              <th className="px-3 pb-2 font-semibold">Stock</th>
              <th className="px-3 pb-2 font-semibold">Recommend</th>
              <th className="px-3 pb-2 font-semibold">Order by</th>
              <th className="px-3 pb-2 font-semibold">Vendor</th>
              <th className="px-3 pb-2 font-semibold">Urgency</th>
            </tr>
          </thead>
          <tbody>
            {reorders.map((item) => (
              <tr key={item.productId} className="bg-paper/80 transition hover:bg-paper">
                <td className="rounded-l-2xl px-3 py-4">
                  <p className="font-semibold text-ink">{item.productName}</p>
                  <p className="text-xs text-muted">{item.productId}</p>
                </td>
                <td className="px-3 py-4 text-sm text-ink">
                  {item.currentStock}
                  <span className="text-muted"> / ROP {item.reorderPoint}</span>
                </td>
                <td className="px-3 py-4 font-semibold text-ink">{item.recommendedQty} units</td>
                <td className="px-3 py-4 text-sm text-ink">{item.orderBy}</td>
                <td className="px-3 py-4">
                  <p className="text-sm font-medium text-ink">{item.vendor}</p>
                  <ScoreBar score={item.vendorScore} />
                </td>
                <td className="rounded-r-2xl px-3 py-4">
                  <UrgencyBadge urgency={item.urgency} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
