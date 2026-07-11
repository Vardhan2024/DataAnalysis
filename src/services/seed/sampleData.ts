import type { Product, PurchaseOrder, Sale, Vendor } from '../../types/domain'

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Deterministic-ish sample dataset for demo / first run */
export function createSampleDataset(): {
  products: Product[]
  vendors: Vendor[]
  sales: Sale[]
  purchaseOrders: PurchaseOrder[]
} {
  const vendors: Vendor[] = [
    { vendorId: 'V01', vendorName: 'Northline Supply', defaultLeadTimeDays: 6 },
    { vendorId: 'V02', vendorName: 'Apex Materials', defaultLeadTimeDays: 8 },
    { vendorId: 'V03', vendorName: 'Harbor Industrial', defaultLeadTimeDays: 10 },
    { vendorId: 'V04', vendorName: 'Summit Packaging', defaultLeadTimeDays: 12 },
    { vendorId: 'V05', vendorName: 'Crestline Co.', defaultLeadTimeDays: 14 },
  ]

  const products: Product[] = [
    { productId: 'P-1042', productName: 'Stretch Wrap 18"', category: 'Packaging', unitCost: 12.5, currentStock: 42, safetyStock: 30, reorderPoint: 70, moq: 50, preferredVendorId: 'V01' },
    { productId: 'P-2088', productName: 'Vapor Barrier Sheet', category: 'Barrier', unitCost: 28.0, currentStock: 110, safetyStock: 40, reorderPoint: 120, moq: 100, preferredVendorId: 'V02' },
    { productId: 'P-3310', productName: 'Sealing Tape 2"', category: 'Tape', unitCost: 4.2, currentStock: 260, safetyStock: 50, reorderPoint: 240, moq: 100, preferredVendorId: 'V03' },
    { productId: 'P-4415', productName: 'Foam Board 4x8', category: 'Board', unitCost: 18.75, currentStock: 55, safetyStock: 25, reorderPoint: 80, moq: 40, preferredVendorId: 'V01' },
    { productId: 'P-5521', productName: 'Corner Guard Kit', category: 'Accessories', unitCost: 9.1, currentStock: 320, safetyStock: 40, reorderPoint: 300, moq: 50, preferredVendorId: 'V04' },
    { productId: 'P-6602', productName: 'Adhesive Primer', category: 'Chemical', unitCost: 22.0, currentStock: 28, safetyStock: 20, reorderPoint: 45, moq: 24, preferredVendorId: 'V05' },
  ]

  const baseDemand: Record<string, number> = {
    'P-1042': 14,
    'P-2088': 9,
    'P-3310': 18,
    'P-4415': 7,
    'P-5521': 6,
    'P-6602': 5,
  }

  const sales: Sale[] = []
  let saleN = 1
  for (let day = 120; day >= 0; day--) {
    const date = isoDaysAgo(day)
    for (const product of products) {
      const base = baseDemand[product.productId]
      const seasonal = 1 + 0.15 * Math.sin((120 - day) / 10)
      let qty = Math.max(0, Math.round(base * seasonal + ((day * product.productId.length) % 5) - 2))
      // Inject anomalies
      if (product.productId === 'P-1042' && day <= 3) qty = Math.round(base * 3.2)
      if (product.productId === 'P-5521' && day <= 10) qty = Math.round(base * 0.45)
      if (qty > 0) {
        sales.push({
          saleId: `S-${saleN++}`,
          productId: product.productId,
          saleDate: date,
          quantitySold: qty,
        })
      }
    }
  }

  const purchaseOrders: PurchaseOrder[] = []
  let poN = 1
  const vendorCycle = ['V01', 'V02', 'V03', 'V04', 'V05']

  for (const product of products) {
    for (let i = 0; i < 8; i++) {
      const vendorId = product.preferredVendorId || vendorCycle[i % vendorCycle.length]
      const lead = vendors.find((v) => v.vendorId === vendorId)!.defaultLeadTimeDays
      const orderDate = isoDaysAgo(100 - i * 12)
      const expected = addDays(orderDate, lead)
      let actual = expected
      // Late deliveries for Crestline
      if (vendorId === 'V05') actual = addDays(expected, 4 + (i % 3))
      if (vendorId === 'V03' && i === 2) actual = addDays(expected, 3)

      let unitPrice = product.unitCost * (0.92 + (i % 4) * 0.03)
      // Price jump on tape
      if (product.productId === 'P-3310' && i === 7) unitPrice = product.unitCost * 1.22

      purchaseOrders.push({
        poId: `PO-${poN++}`,
        productId: product.productId,
        vendorId,
        orderDate,
        expectedDelivery: expected,
        actualDelivery: actual,
        orderQty: 100 + i * 20,
        receivedQty: vendorId === 'V04' && i === 1 ? 80 : 100 + i * 20,
        unitPrice: Number(unitPrice.toFixed(2)),
        status: 'received',
      })
    }
  }

  return { products, vendors, sales, purchaseOrders }
}
