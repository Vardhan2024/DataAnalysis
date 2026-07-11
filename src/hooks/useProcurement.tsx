import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AnalysisSnapshot, DatasetKey } from '../types/domain'
import type { StoredFilesMap } from '../services/storage/db'
import {
  analyzeFromDb,
  clearAllData,
  detectDatasetType,
  getDataCounts,
  getLatestAnalysis,
  getStoredFiles,
  importCsvFile,
  loadSampleAndAnalyze,
} from '../services/dataService'

interface ProcurementContextValue {
  analysis: AnalysisSnapshot | null
  counts: { products: number; sales: number; purchaseOrders: number; vendors: number }
  storedFiles: StoredFilesMap
  loading: boolean
  error: string | null
  status: string | null
  refresh: () => Promise<void>
  loadSample: () => Promise<void>
  runAnalysis: () => Promise<void>
  uploadFiles: (files: FileList | File[]) => Promise<void>
  resetData: () => Promise<void>
}

const ProcurementContext = createContext<ProcurementContextValue | null>(null)

const emptyCounts = { products: 0, sales: 0, purchaseOrders: 0, vendors: 0 }

export function ProcurementProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysis] = useState<AnalysisSnapshot | null>(null)
  const [counts, setCounts] = useState(emptyCounts)
  const [storedFiles, setStoredFilesState] = useState<StoredFilesMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [latest, nextCounts, files] = await Promise.all([
        getLatestAnalysis(),
        getDataCounts(),
        getStoredFiles(),
      ])
      setAnalysis(latest ?? null)
      setCounts(nextCounts)
      setStoredFilesState(files)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const loadSample = useCallback(async () => {
    setLoading(true)
    setError(null)
    setStatus('Loading sample data and running analysis…')
    try {
      const snapshot = await loadSampleAndAnalyze()
      setAnalysis(snapshot)
      setCounts(await getDataCounts())
      setStoredFilesState(await getStoredFiles())
      setStatus('Sample data loaded. Analysis complete.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sample load failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    setStatus('Running Holt-Winters, TOPSIS, Isolation Forest…')
    try {
      const snapshot = await analyzeFromDb()
      setAnalysis(snapshot)
      setCounts(await getDataCounts())
      setStoredFilesState(await getStoredFiles())
      setStatus('Analysis complete.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    setLoading(true)
    setError(null)
    setStatus('Importing CSV into Chrome IndexedDB…')
    try {
      const list = [...files]
      const imported: string[] = []
      for (const file of list) {
        const type = await detectDatasetType(file)
        if (!type) {
          throw new Error(`Could not detect dataset type for ${file.name}. Check column headers.`)
        }
        const n = await importCsvFile(file, type as DatasetKey)
        imported.push(`${file.name} → ${type} (${n} rows)`)
      }
      const snapshot = await analyzeFromDb()
      setAnalysis(snapshot)
      setCounts(await getDataCounts())
      setStoredFilesState(await getStoredFiles())
      setStatus(`Imported: ${imported.join(' · ')}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const resetData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await clearAllData()
      setAnalysis(null)
      setCounts(emptyCounts)
      setStoredFilesState({})
      setStatus('All Chrome storage data cleared.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      analysis,
      counts,
      storedFiles,
      loading,
      error,
      status,
      refresh,
      loadSample,
      runAnalysis,
      uploadFiles,
      resetData,
    }),
    [
      analysis,
      counts,
      storedFiles,
      loading,
      error,
      status,
      refresh,
      loadSample,
      runAnalysis,
      uploadFiles,
      resetData,
    ],
  )

  return <ProcurementContext.Provider value={value}>{children}</ProcurementContext.Provider>
}

export function useProcurement() {
  const ctx = useContext(ProcurementContext)
  if (!ctx) throw new Error('useProcurement must be used within ProcurementProvider')
  return ctx
}
