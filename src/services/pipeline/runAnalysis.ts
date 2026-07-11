import type { AnalysisSnapshot, Product, PurchaseOrder, Sale, Vendor } from '../../types/domain'
import { detectAnomalies } from '../algorithms/anomaly'
import { forecastProducts, buildDemandByProduct } from '../algorithms/forecast'
import { buildReorderRecommendations } from '../algorithms/reorder'
import { scoreVendorsWithTopsis } from '../algorithms/topsis'

export function runAnalysis(input: {
  products: Product[]
  sales: Sale[]
  purchaseOrders: PurchaseOrder[]
  vendors: Vendor[]
}): AnalysisSnapshot {
  const { products, sales, purchaseOrders, vendors } = input

  const vendorsScored = scoreVendorsWithTopsis(vendors, purchaseOrders)
  const demandByProduct = buildDemandByProduct(sales)
  const forecasts = forecastProducts(products, sales)

  // Prefer Holt-Winters implied daily demand when available
  for (const f of forecasts) {
    if (f.avgDailyDemand > 0) demandByProduct.set(f.productId, f.avgDailyDemand)
  }

  const reorders = buildReorderRecommendations({
    products,
    demandByProduct,
    vendors,
    vendorScores: vendorsScored,
    purchaseOrders,
  })

  const anomalies = detectAnomalies({ products, sales, purchaseOrders })

  const stockoutRisk = reorders.filter((r) => r.urgency === 'critical' || r.urgency === 'high').length
  const avgVendorScore = vendorsScored.length
    ? vendorsScored.reduce((s, v) => s + v.score, 0) / vendorsScored.length
    : 0

  return {
    id: `run-${Date.now()}`,
    createdAt: new Date().toISOString(),
    kpis: {
      itemsToReorder: reorders.length,
      stockoutRisk,
      avgVendorScore: Number(avgVendorScore.toFixed(1)),
      openAnomalies: anomalies.length,
      highAnomalies: anomalies.filter((a) => a.severity === 'high').length,
    },
    reorders,
    vendors: vendorsScored,
    anomalies,
    forecasts,
  }
}
