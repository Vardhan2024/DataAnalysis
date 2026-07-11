import type { Product, PurchaseOrder, ReorderRecommendation, Urgency, Vendor, VendorScore } from '../../types/domain'

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function urgencyFromDays(daysOfCover: number, leadTime: number): Urgency {
  if (daysOfCover <= leadTime * 0.5) return 'critical'
  if (daysOfCover <= leadTime) return 'high'
  if (daysOfCover <= leadTime * 1.5) return 'medium'
  return 'low'
}

export function computeLeadTimeDays(
  productId: string,
  vendorId: string,
  pos: PurchaseOrder[],
  vendors: Vendor[],
): number {
  const relevant = pos.filter(
    (p) => p.productId === productId && p.vendorId === vendorId && p.actualDelivery && p.orderDate,
  )
  if (relevant.length) {
    const avg =
      relevant.reduce((sum, p) => sum + daysBetween(p.orderDate, p.actualDelivery), 0) / relevant.length
    return Math.max(1, Math.round(avg))
  }
  const vendor = vendors.find((v) => v.vendorId === vendorId)
  return vendor?.defaultLeadTimeDays ?? 7
}

export function buildReorderRecommendations(params: {
  products: Product[]
  demandByProduct: Map<string, number>
  vendors: Vendor[]
  vendorScores: VendorScore[]
  purchaseOrders: PurchaseOrder[]
  today?: Date
}): ReorderRecommendation[] {
  const { products, demandByProduct, vendors, vendorScores, purchaseOrders } = params
  const today = params.today ?? new Date()
  const scoreByVendor = new Map(vendorScores.map((v) => [v.vendorId, v]))

  const results: ReorderRecommendation[] = []

  for (const product of products) {
    const avgDailyDemand = Math.max(0.1, demandByProduct.get(product.productId) ?? 0.1)

    // Prefer highest-scoring vendor that has supplied this product, else preferred, else top vendor
    const productVendors = [
      ...new Set(purchaseOrders.filter((p) => p.productId === product.productId).map((p) => p.vendorId)),
    ]
    let vendorId =
      product.preferredVendorId ||
      productVendors
        .map((id) => scoreByVendor.get(id))
        .filter(Boolean)
        .sort((a, b) => (b!.score - a!.score))[0]?.vendorId ||
      vendorScores[0]?.vendorId ||
      vendors[0]?.vendorId ||
      'UNKNOWN'

    if (productVendors.length && !product.preferredVendorId) {
      const best = productVendors
        .map((id) => scoreByVendor.get(id))
        .filter(Boolean)
        .sort((a, b) => b!.score - a!.score)[0]
      if (best) vendorId = best.vendorId
    }

    const vendor = vendors.find((v) => v.vendorId === vendorId)
    const vendorScore = scoreByVendor.get(vendorId)?.score ?? 0
    const leadTime = computeLeadTimeDays(product.productId, vendorId, purchaseOrders, vendors)

    const reorderPoint =
      product.reorderPoint > 0
        ? product.reorderPoint
        : Math.ceil(avgDailyDemand * leadTime + product.safetyStock)

    const daysOfCover = product.currentStock / avgDailyDemand
    const needsReorder = product.currentStock <= reorderPoint

    if (!needsReorder && daysOfCover > leadTime * 1.75) continue

    const cycleDemand = avgDailyDemand * Math.max(leadTime * 2, 14)
    const recommendedQty = Math.max(
      product.moq || 1,
      Math.ceil(cycleDemand + product.safetyStock - Math.max(0, product.currentStock - reorderPoint)),
    )

    const daysUntilOrder = Math.max(0, Math.floor(daysOfCover - leadTime))
    const orderByDate = new Date(today)
    orderByDate.setDate(orderByDate.getDate() + daysUntilOrder)

    results.push({
      productId: product.productId,
      productName: product.productName,
      currentStock: product.currentStock,
      reorderPoint,
      recommendedQty,
      orderBy: formatShortDate(orderByDate),
      urgency: urgencyFromDays(daysOfCover, leadTime),
      vendorId,
      vendor: vendor?.vendorName ?? vendorId,
      vendorScore: Math.round(vendorScore),
      daysOfCover: Number(daysOfCover.toFixed(1)),
      avgDailyDemand: Number(avgDailyDemand.toFixed(2)),
    })
  }

  const urgencyRank: Record<Urgency, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  return results.sort((a, b) => urgencyRank[a.urgency] - urgencyRank[b.urgency] || a.daysOfCover - b.daysOfCover)
}
