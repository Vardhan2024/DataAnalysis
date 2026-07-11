import type { Product, ProductForecast, Sale } from '../../types/domain'
import { holtWinters, toWeeklySeries } from './holtWinters'

export function buildDemandByProduct(sales: Sale[], lookbackDays = 90): Map<string, number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - lookbackDays)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const totals = new Map<string, number>()
  for (const s of sales) {
    if (s.saleDate < cutoffStr) continue
    totals.set(s.productId, (totals.get(s.productId) ?? 0) + s.quantitySold)
  }

  const demand = new Map<string, number>()
  for (const [productId, total] of totals) {
    demand.set(productId, total / lookbackDays)
  }
  return demand
}

export function forecastProducts(products: Product[], sales: Sale[]): ProductForecast[] {
  const demand = buildDemandByProduct(sales)

  return products.map((product) => {
    const productSales = sales.filter((s) => s.productId === product.productId)
    const byDate = new Map<string, number>()
    for (const s of productSales) {
      byDate.set(s.saleDate, (byDate.get(s.saleDate) ?? 0) + s.quantitySold)
    }

    const weekly = toWeeklySeries(byDate)
    const hw = holtWinters(weekly.values.length ? weekly.values : [demand.get(product.productId) ?? 1], 4, 4)

    const historyPoints = weekly.labels.map((week, i) => ({
      week,
      actual: weekly.values[i] ?? null,
      forecast: Math.round(hw.fitted[i] ?? weekly.values[i] ?? 0),
    }))

    const futurePoints = hw.forecast.map((f, i) => ({
      week: `F${i + 1}`,
      actual: null as number | null,
      forecast: f,
    }))

    // Keep last 6 actual weeks + 4 forecast weeks for chart
    const series = [...historyPoints.slice(-6), ...futurePoints]

    const avgDaily = demand.get(product.productId) ?? 0.1
    const next30 = Math.round(avgDaily * 30 + hw.forecast.reduce((a, b) => a + b, 0) / Math.max(hw.forecast.length, 1))

    let confidence: 'high' | 'medium' | 'low' = 'low'
    if (productSales.length >= 60) confidence = 'high'
    else if (productSales.length >= 20) confidence = 'medium'

    return {
      productId: product.productId,
      productName: product.productName,
      avgDailyDemand: Number(avgDaily.toFixed(2)),
      next30DayDemand: next30,
      series,
      confidence,
    }
  })
}
