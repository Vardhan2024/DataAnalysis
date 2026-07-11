import { useRef } from 'react'
import { FileSpreadsheet, Play, Trash2, UploadCloud } from 'lucide-react'
import { SectionHeader } from '../components/ui'
import { useProcurement } from '../hooks/useProcurement'
import type { DatasetKey } from '../types/domain'

const datasets = [
  { name: 'products.csv', desc: 'SKU master, stock, safety stock, MOQ', sample: '/samples/products.csv' },
  { name: 'sales.csv', desc: 'Historical demand by product and date', sample: '/samples/sales.csv' },
  { name: 'purchase_orders.csv', desc: 'PO history for lead time & vendor scoring', sample: '/samples/purchase_orders.csv' },
  { name: 'vendors.csv', desc: 'Supplier master and default lead times', sample: '/samples/vendors.csv' },
]

const datasetLabels: Record<DatasetKey, string> = {
  products: 'Products',
  sales: 'Sales',
  purchaseOrders: 'Purchase orders',
  vendors: 'Vendors',
}

export function DataUploadPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    counts,
    storedFiles,
    loading,
    error,
    status,
    uploadFiles,
    loadSample,
    runAnalysis,
    resetData,
  } = useProcurement()

  const storedEntries = (Object.keys(datasetLabels) as DatasetKey[])
    .map((key) => ({ key, info: storedFiles[key] }))
    .filter((item) => item.info)

  return (
    <div className="space-y-5">
      <div className="glass-panel animate-fade-up overflow-hidden rounded-[26px]">
        <div className="panel-inverse px-6 py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Chrome IndexedDB
          </p>
          <h2 className="mt-2 font-display text-3xl font-700 tracking-tight">Data upload center</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
            Upload CSV files. They are stored locally in your browser, then analyzed with Holt-Winters,
            TOPSIS, Isolation Forest, and the reorder engine.
          </p>
        </div>

        <div className="p-6">
          <div className="mb-5 grid gap-3 sm:grid-cols-4">
            <CountCard label="Products" value={counts.products} />
            <CountCard label="Sales" value={counts.sales} />
            <CountCard label="Purchase orders" value={counts.purchaseOrders} />
            <CountCard label="Vendors" value={counts.vendors} />
          </div>

          <div className="mb-5 rounded-[22px] border border-line bg-paper-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Stored files in Chrome
            </p>
            {storedEntries.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No files stored yet. Upload CSVs or load sample data.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {storedEntries.map(({ key, info }) => (
                  <div
                    key={key}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-paper px-3.5 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
                        <FileSpreadsheet className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{info!.fileName}</p>
                        <p className="text-xs text-muted">
                          {datasetLabels[key]} · {info!.rows.toLocaleString()} rows ·{' '}
                          {info!.source === 'sample' ? 'Sample' : 'Uploaded'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted">
                      {new Date(info!.updatedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="rounded-[22px] border border-dashed border-teal/40 bg-teal/5 px-6 py-12 text-center transition hover:bg-teal/8"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files)
            }}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/15 text-teal">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="font-display text-xl font-700 text-ink">Drop CSV files here</p>
            <p className="mt-2 text-sm text-muted">Headers are auto-detected (products, sales, POs, vendors)</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void uploadFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <button
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="mt-5 btn-primary rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? 'Working…' : 'Choose files'}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              disabled={loading}
              onClick={() => void loadSample()}
              className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              <DatabaseIcon /> Load sample data
            </button>
            <button
              disabled={loading || counts.products === 0}
              onClick={() => void runAnalysis()}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
            >
              <Play className="h-4 w-4" /> Re-run analysis
            </button>
            <button
              disabled={loading}
              onClick={() => void resetData()}
              className="inline-flex items-center gap-2 rounded-lg border border-rose/30 bg-rose/5 px-4 py-2.5 text-sm font-semibold text-rose disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" /> Clear storage
            </button>
          </div>

          {status && <p className="mt-4 text-sm font-medium text-teal">{status}</p>}
          {error && <p className="mt-2 text-sm font-medium text-rose">{error}</p>}
        </div>
      </div>

      <div className="glass-panel animate-fade-up animate-delay-1 rounded-[26px] p-6">
        <SectionHeader eyebrow="Expected datasets" title="CSV templates" />
        <div className="grid gap-3 md:grid-cols-2">
          {datasets.map((file) => (
            <div key={file.name} className="flex items-start gap-3 rounded-2xl border border-line bg-paper/80 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist text-teal">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink">{file.name}</p>
                <p className="mt-1 text-sm text-muted">{file.desc}</p>
                <a className="mt-2 inline-block text-xs font-semibold uppercase tracking-wider text-teal" href={file.sample} download>
                  Download sample
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-paper px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-700 text-ink">{value}</p>
    </div>
  )
}

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  )
}
