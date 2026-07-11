import Dexie, { type Table } from 'dexie'
import type {
  AnalysisSnapshot,
  DatasetKey,
  Product,
  PurchaseOrder,
  Sale,
  Vendor,
} from '../../types/domain'

export interface StoredFileInfo {
  fileName: string
  rows: number
  updatedAt: string
  source: 'upload' | 'sample'
}

export type StoredFilesMap = Partial<Record<DatasetKey, StoredFileInfo>>

export class ProcurementDB extends Dexie {
  products!: Table<Product, string>
  sales!: Table<Sale, string>
  purchaseOrders!: Table<PurchaseOrder, string>
  vendors!: Table<Vendor, string>
  analysis!: Table<AnalysisSnapshot, string>
  meta!: Table<{ key: string; value: string }, string>

  constructor() {
    super('ProcureAI_DB')
    this.version(1).stores({
      products: 'productId, category',
      sales: 'saleId, productId, saleDate',
      purchaseOrders: 'poId, productId, vendorId, orderDate',
      vendors: 'vendorId',
      analysis: 'id, createdAt',
      meta: 'key',
    })
  }
}

export const db = new ProcurementDB()

export async function clearAllData() {
  await Promise.all([
    db.products.clear(),
    db.sales.clear(),
    db.purchaseOrders.clear(),
    db.vendors.clear(),
    db.analysis.clear(),
    db.meta.clear(),
  ])
}

export async function getLatestAnalysis(): Promise<AnalysisSnapshot | undefined> {
  return db.analysis.orderBy('createdAt').reverse().first()
}

export async function saveAnalysis(snapshot: AnalysisSnapshot) {
  await db.analysis.put(snapshot)
  await db.meta.put({ key: 'lastRunAt', value: snapshot.createdAt })
}

export async function getDataCounts() {
  const [products, sales, purchaseOrders, vendors] = await Promise.all([
    db.products.count(),
    db.sales.count(),
    db.purchaseOrders.count(),
    db.vendors.count(),
  ])
  return { products, sales, purchaseOrders, vendors }
}

export async function getStoredFiles(): Promise<StoredFilesMap> {
  const row = await db.meta.get('storedFiles')
  let map: StoredFilesMap = {}
  if (row?.value) {
    try {
      map = JSON.parse(row.value) as StoredFilesMap
    } catch {
      map = {}
    }
  }

  // Backfill labels if data exists from before file tracking was added
  const counts = await getDataCounts()
  const now = new Date().toISOString()
  let changed = false

  const ensure = (key: DatasetKey, rows: number, fallbackName: string) => {
    if (rows > 0 && !map[key]) {
      map[key] = {
        fileName: fallbackName,
        rows,
        updatedAt: now,
        source: 'sample',
      }
      changed = true
    }
  }

  ensure('products', counts.products, 'products (stored)')
  ensure('sales', counts.sales, 'sales (stored)')
  ensure('purchaseOrders', counts.purchaseOrders, 'purchase_orders (stored)')
  ensure('vendors', counts.vendors, 'vendors (stored)')

  if (changed) {
    await setStoredFiles(map)
  }

  return map
}

export async function setStoredFile(
  dataset: DatasetKey,
  info: StoredFileInfo,
): Promise<StoredFilesMap> {
  const current = await getStoredFiles()
  const next = { ...current, [dataset]: info }
  await db.meta.put({ key: 'storedFiles', value: JSON.stringify(next) })
  return next
}

export async function setStoredFiles(map: StoredFilesMap): Promise<void> {
  await db.meta.put({ key: 'storedFiles', value: JSON.stringify(map) })
}
