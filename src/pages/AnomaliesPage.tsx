import { SectionHeader, SeverityBadge } from '../components/ui'
import { useProcurement } from '../hooks/useProcurement'

export function AnomaliesPage() {
  const { analysis, loading, loadSample } = useProcurement()
  const anomalies = analysis?.anomalies ?? []

  if (!analysis) {
    return (
      <div className="glass-panel rounded-[26px] p-8 text-center">
        <p className="text-muted">No anomaly results yet.</p>
        <button disabled={loading} onClick={() => void loadSample()} className="mt-4 btn-primary rounded-lg px-4 py-2 text-sm font-semibold">
          Load sample & analyze
        </button>
      </div>
    )
  }

  const high = anomalies.filter((a) => a.severity === 'high').length
  const medium = anomalies.filter((a) => a.severity === 'medium').length

  return (
    <div className="glass-panel animate-fade-up rounded-[26px] p-6">
      <SectionHeader
        eyebrow="Isolation Forest"
        title="Anomaly detection"
        action={
          <div className="flex gap-2">
            <span className="rounded-full bg-rose/10 px-3 py-1.5 text-xs font-semibold text-rose">
              {high} high
            </span>
            <span className="rounded-full bg-amber/10 px-3 py-1.5 text-xs font-semibold text-amber">
              {medium} medium
            </span>
          </div>
        }
      />

      <div className="space-y-3">
        {anomalies.length === 0 && (
          <p className="text-sm text-muted">No anomalies detected in the current dataset.</p>
        )}
        {anomalies.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-line bg-paper/80 p-4 transition duration-300 hover:border-rose/25 hover:bg-paper"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={item.severity} />
                  <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-muted">
                    {item.type}
                  </span>
                </div>
                <h3 className="font-semibold text-ink">{item.entity}</h3>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">{item.message}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{item.id}</p>
                <p className="mt-1 text-sm text-ink">{item.detectedAt}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
