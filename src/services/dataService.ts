import {
  clearAllData,
  db,
  getDataCounts,
  getLatestAnalysis,
  getStoredFiles,
  saveAnalysis,
  setStoredFile,
  setStoredFiles,
} from './storage/db'
import {
  mapProducts,
  mapPurchaseOrders,
  mapSales,
  mapVendors,
  parseCsvText,
  readFileAsText,
} from './csv/parseCsv'
import { runAnalysis } from './pipeline/runAnalysis'
import { createSampleDataset } from './seed/sampleData'
import type { AnalysisSnapshot, DatasetKey } from '../types/domain'

export async function loadSampleAndAnalyze(): Promise<AnalysisSnapshot> {
  const sample = createSampleDataset()
  await clearAllData()
  await db.products.bulkPut(sample.products)
  await db.vendors.bulkPut(sample.vendors)
  await db.sales.bulkPut(sample.sales)
  await db.purchaseOrders.bulkPut(sample.purchaseOrders)

  const now = new Date().toISOString()
  await setStoredFiles({
    products: {
      fileName: 'products.csv (sample)',
      rows: sample.products.length,
      updatedAt: now,
      source: 'sample',
    },
    sales: {
      fileName: 'sales.csv (sample)',
      rows: sample.sales.length,
      updatedAt: now,
      source: 'sample',
    },
    purchaseOrders: {
      fileName: 'purchase_orders.csv (sample)',
      rows: sample.purchaseOrders.length,
      updatedAt: now,
      source: 'sample',
    },
    vendors: {
      fileName: 'vendors.csv (sample)',
      rows: sample.vendors.length,
      updatedAt: now,
      source: 'sample',
    },
  })

  return analyzeFromDb()
}

export async function analyzeFromDb(): Promise<AnalysisSnapshot> {
  const [products, sales, purchaseOrders, vendors] = await Promise.all([
    db.products.toArray(),
    db.sales.toArray(),
    db.purchaseOrders.toArray(),
    db.vendors.toArray(),
  ])

  if (!products.length) {
    throw new Error('No products in storage. Upload CSVs or load sample data first.')
  }

  const snapshot = runAnalysis({ products, sales, purchaseOrders, vendors })
  await saveAnalysis(snapshot)
  return snapshot
}

export async function importCsvFile(file: File, dataset: DatasetKey): Promise<number> {
  const text = await readFileAsText(file)
  const rows = parseCsvText(text)
  let count = 0

  if (dataset === 'products') {
    const data = mapProducts(rows)
    await db.products.clear()
    await db.products.bulkPut(data)
    count = data.length
  } else if (dataset === 'sales') {
    const data = mapSales(rows)
    await db.sales.clear()
    await db.sales.bulkPut(data)
    count = data.length
  } else if (dataset === 'purchaseOrders') {
    const data = mapPurchaseOrders(rows)
    await db.purchaseOrders.clear()
    await db.purchaseOrders.bulkPut(data)
    count = data.length
  } else {
    const data = mapVendors(rows)
    await db.vendors.clear()
    await db.vendors.bulkPut(data)
    count = data.length
  }

  await setStoredFile(dataset, {
    fileName: file.name,
    rows: count,
    updatedAt: new Date().toISOString(),
    source: 'upload',
  })

  return count
}

export async function detectDatasetType(file: File): Promise<DatasetKey | null> {
  const text = await readFileAsText(file)
  const firstLine = text.split(/\r?\n/)[0]?.toLowerCase() ?? ''
  if (firstLine.includes('product_name') || firstLine.includes('current_stock')) return 'products'
  if (firstLine.includes('quantity_sold') || firstLine.includes('sale_date')) return 'sales'
  if (firstLine.includes('po_id') || firstLine.includes('expected_delivery')) return 'purchaseOrders'
  if (firstLine.includes('vendor_name') || firstLine.includes('default_lead_time')) return 'vendors'
  return null
}

export { getLatestAnalysis, getDataCounts, getStoredFiles, clearAllData }
