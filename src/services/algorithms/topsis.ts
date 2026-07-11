import type { PurchaseOrder, Vendor, VendorScore } from '../../types/domain'

function daysBetween(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

interface CriteriaRow {
  vendorId: string
  name: string
  onTime: number
  fillRate: number
  priceIndex: number
  leadTimeDays: number
  leadTimeConsistency: number
}

/**
 * TOPSIS multi-criteria ranking
 * Benefit criteria: onTime, fillRate, priceIndex, leadTimeConsistency
 * Cost criteria: leadTimeDays
 */
export function scoreVendorsWithTopsis(
  vendors: Vendor[],
  purchaseOrders: PurchaseOrder[],
  weights = {
    onTime: 0.35,
    fillRate: 0.25,
    priceIndex: 0.2,
    leadTimeConsistency: 0.1,
    leadTimeDays: 0.1,
  },
): VendorScore[] {
  if (!vendors.length) return []

  const allPrices = purchaseOrders.map((p) => p.unitPrice).filter((p) => p > 0)
  const minPrice = allPrices.length ? Math.min(...allPrices) : 1

  const rows: CriteriaRow[] = vendors.map((vendor) => {
    const pos = purchaseOrders.filter((p) => p.vendorId === vendor.vendorId)
    const leadTimes = pos
      .filter((p) => p.orderDate && p.actualDelivery)
      .map((p) => daysBetween(p.orderDate, p.actualDelivery))

    const onTime =
      pos.length === 0
        ? 70
        : (pos.filter(
            (p) => p.actualDelivery && p.expectedDelivery && p.actualDelivery <= p.expectedDelivery,
          ).length /
            pos.length) *
          100

    const fillRate =
      pos.length === 0
        ? 70
        : (pos.reduce((s, p) => s + (p.orderQty ? Math.min(1, p.receivedQty / p.orderQty) : 1), 0) /
            pos.length) *
          100

    const avgPrice =
      pos.length === 0
        ? minPrice
        : pos.reduce((s, p) => s + p.unitPrice, 0) / pos.length
    const priceIndex = Math.min(100, (minPrice / Math.max(avgPrice, 0.01)) * 100)

    const avgLead = leadTimes.length
      ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
      : vendor.defaultLeadTimeDays

    const consistency = leadTimes.length
      ? Math.max(0, 100 - stdDev(leadTimes) * 8)
      : 70

    return {
      vendorId: vendor.vendorId,
      name: vendor.vendorName,
      onTime,
      fillRate,
      priceIndex,
      leadTimeDays: avgLead,
      leadTimeConsistency: consistency,
    }
  })

  const benefitKeys = ['onTime', 'fillRate', 'priceIndex', 'leadTimeConsistency'] as const
  const costKeys = ['leadTimeDays'] as const

  // Normalize
  const denom: Record<string, number> = {}
  for (const key of [...benefitKeys, ...costKeys]) {
    denom[key] = Math.sqrt(rows.reduce((s, r) => s + (r[key] as number) ** 2, 0)) || 1
  }

  const weighted = rows.map((r) => ({
    ...r,
    onTime: (r.onTime / denom.onTime) * weights.onTime,
    fillRate: (r.fillRate / denom.fillRate) * weights.fillRate,
    priceIndex: (r.priceIndex / denom.priceIndex) * weights.priceIndex,
    leadTimeConsistency: (r.leadTimeConsistency / denom.leadTimeConsistency) * weights.leadTimeConsistency,
    leadTimeDays: (r.leadTimeDays / denom.leadTimeDays) * weights.leadTimeDays,
  }))

  const idealBest = {
    onTime: Math.max(...weighted.map((r) => r.onTime)),
    fillRate: Math.max(...weighted.map((r) => r.fillRate)),
    priceIndex: Math.max(...weighted.map((r) => r.priceIndex)),
    leadTimeConsistency: Math.max(...weighted.map((r) => r.leadTimeConsistency)),
    leadTimeDays: Math.min(...weighted.map((r) => r.leadTimeDays)),
  }

  const idealWorst = {
    onTime: Math.min(...weighted.map((r) => r.onTime)),
    fillRate: Math.min(...weighted.map((r) => r.fillRate)),
    priceIndex: Math.min(...weighted.map((r) => r.priceIndex)),
    leadTimeConsistency: Math.min(...weighted.map((r) => r.leadTimeConsistency)),
    leadTimeDays: Math.max(...weighted.map((r) => r.leadTimeDays)),
  }

  const scored = weighted.map((r, i) => {
    const dBest = Math.sqrt(
      (r.onTime - idealBest.onTime) ** 2 +
        (r.fillRate - idealBest.fillRate) ** 2 +
        (r.priceIndex - idealBest.priceIndex) ** 2 +
        (r.leadTimeConsistency - idealBest.leadTimeConsistency) ** 2 +
        (r.leadTimeDays - idealBest.leadTimeDays) ** 2,
    )
    const dWorst = Math.sqrt(
      (r.onTime - idealWorst.onTime) ** 2 +
        (r.fillRate - idealWorst.fillRate) ** 2 +
        (r.priceIndex - idealWorst.priceIndex) ** 2 +
        (r.leadTimeConsistency - idealWorst.leadTimeConsistency) ** 2 +
        (r.leadTimeDays - idealWorst.leadTimeDays) ** 2,
    )
    const closeness = dBest + dWorst === 0 ? 0.5 : dWorst / (dBest + dWorst)
    const score = Math.round(closeness * 1000) / 10

    return {
      vendorId: rows[i].vendorId,
      name: rows[i].name,
      score,
      onTime: Math.round(rows[i].onTime),
      fillRate: Math.round(rows[i].fillRate),
      priceIndex: Math.round(rows[i].priceIndex),
      leadTimeDays: Math.round(rows[i].leadTimeDays),
      leadTimeConsistency: Math.round(rows[i].leadTimeConsistency),
      rank: 0,
    } satisfies VendorScore
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.map((s, i) => ({ ...s, rank: i + 1 }))
}
