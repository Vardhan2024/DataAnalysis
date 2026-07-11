import Papa from 'papaparse'
import type { Product, PurchaseOrder, Sale, Vendor } from '../../types/domain'

function num(value: unknown, fallback = 0): number {
  const n = Number(String(value ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : fallback
}

function str(value: unknown): string {
  return String(value ?? '').trim()
}

export function parseCsvText<T extends Record<string, unknown>>(text: string): T[] {
  const result = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })
  if (result.errors.length) {
    const msg = result.errors.slice(0, 3).map((e) => e.message).join('; ')
    throw new Error(`CSV parse error: ${msg}`)
  }
  return result.data
}

export async function readFileAsText(file: File): Promise<string> {
  return file.text()
}

export function mapProducts(rows: Record<string, unknown>[]): Product[] {
  return rows.map((r) => ({
    productId: str(r.product_id ?? r.productId),
    productName: str(r.product_name ?? r.productName),
    category: str(r.category) || 'General',
    unitCost: num(r.unit_cost ?? r.unitCost),
    currentStock: num(r.current_stock ?? r.currentStock),
    safetyStock: num(r.safety_stock ?? r.safetyStock),
    reorderPoint: num(r.reorder_point ?? r.reorderPoint),
    moq: num(r.moq, 1),
    preferredVendorId: str(r.preferred_vendor_id ?? r.preferredVendorId) || undefined,
  })).filter((p) => p.productId)
}

export function mapSales(rows: Record<string, unknown>[]): Sale[] {
  return rows.map((r, i) => ({
    saleId: str(r.sale_id ?? r.saleId) || `S-${i + 1}`,
    productId: str(r.product_id ?? r.productId),
    saleDate: str(r.sale_date ?? r.saleDate),
    quantitySold: num(r.quantity_sold ?? r.quantitySold),
  })).filter((s) => s.productId && s.saleDate)
}

export function mapPurchaseOrders(rows: Record<string, unknown>[]): PurchaseOrder[] {
  return rows.map((r, i) => ({
    poId: str(r.po_id ?? r.poId) || `PO-${i + 1}`,
    productId: str(r.product_id ?? r.productId),
    vendorId: str(r.vendor_id ?? r.vendorId),
    orderDate: str(r.order_date ?? r.orderDate),
    expectedDelivery: str(r.expected_delivery ?? r.expectedDelivery),
    actualDelivery: str(r.actual_delivery ?? r.actualDelivery),
    orderQty: num(r.order_qty ?? r.orderQty),
    receivedQty: num(r.received_qty ?? r.receivedQty ?? r.order_qty ?? r.orderQty),
    unitPrice: num(r.unit_price ?? r.unitPrice),
    status: str(r.status) || 'received',
  })).filter((p) => p.productId && p.vendorId)
}

export function mapVendors(rows: Record<string, unknown>[]): Vendor[] {
  return rows.map((r) => ({
    vendorId: str(r.vendor_id ?? r.vendorId),
    vendorName: str(r.vendor_name ?? r.vendorName),
    defaultLeadTimeDays: num(r.default_lead_time_days ?? r.defaultLeadTimeDays, 7),
  })).filter((v) => v.vendorId)
}

export function toCsv(data: Record<string, unknown>[]): string {
  return Papa.unparse(data)
}
