import { SectionHeader, ScoreBar } from '../components/ui'
import { useProcurement } from '../hooks/useProcurement'

export function VendorsPage() {
  const { analysis, loading, loadSample } = useProcurement()
  const vendors = analysis?.vendors ?? []

  if (!analysis) {
    return (
      <div className="glass-panel rounded-[26px] p-8 text-center">
        <p className="text-muted">No vendor scores yet.</p>
        <button disabled={loading} onClick={() => void loadSample()} className="mt-4 btn-primary rounded-lg px-4 py-2 text-sm font-semibold">
          Load sample & analyze
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="glass-panel animate-fade-up rounded-[26px] p-6">
        <SectionHeader
          eyebrow="TOPSIS ranking"
          title="Vendor intelligence"
          action={
            <div className="rounded-full bg-contrast px-3.5 py-2 text-xs font-semibold text-on-contrast">
              {vendors.length} suppliers scored
            </div>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {vendors.map((vendor) => (
              <div
                key={vendor.vendorId}
                className="rounded-2xl border border-line bg-paper/80 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-teal/30 hover:bg-paper"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Rank #{vendor.rank}
                    </p>
                    <h3 className="font-display text-xl font-700 text-ink">{vendor.name}</h3>
                  </div>
                  <p className="font-display text-3xl font-700 text-teal">{vendor.score}</p>
                </div>
                <ScoreBar score={vendor.score} />
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="On-time" value={`${vendor.onTime}%`} />
                  <Stat label="Fill rate" value={`${vendor.fillRate}%`} />
                  <Stat label="Price idx" value={`${vendor.priceIndex}`} />
                  <Stat label="Lead time" value={`${vendor.leadTimeDays}d`} />
                </div>
              </div>
            ))}
          </div>

          <div className="panel-inverse rounded-[24px] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Scoring model
            </p>
            <h3 className="mt-2 font-display text-2xl font-700">Weighted TOPSIS</h3>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Vendors are ranked across delivery reliability, fill rate, price competitiveness, and
              lead-time consistency using TOPSIS.
            </p>
            <div className="mt-8 space-y-4">
              <WeightRow label="On-time delivery" weight="35%" />
              <WeightRow label="Fill rate" weight="25%" />
              <WeightRow label="Price competitiveness" weight="20%" />
              <WeightRow label="Lead-time factors" weight="20%" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-mist/90 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-ink">{value}</p>
    </div>
  )
}

function WeightRow({ label, weight }: { label: string; weight: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-3 text-sm">
      <span className="text-white/75">{label}</span>
      <span className="font-semibold text-white">{weight}</span>
    </div>
  )
}
