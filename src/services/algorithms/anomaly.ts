import type { AnomalyAlert, Product, PurchaseOrder, Sale, Severity } from '../../types/domain'

/** Lightweight Isolation Forest for numeric feature vectors */

function randomInt(max: number) {
  return Math.floor(Math.random() * max)
}

interface IsolationTree {
  size: number
  splitAtt?: number
  splitVal?: number
  left?: IsolationTree
  right?: IsolationTree
}

function buildTree(data: number[][], height: number, maxHeight: number): IsolationTree {
  const n = data.length
  if (height >= maxHeight || n <= 1) return { size: n }

  const att = randomInt(data[0].length)
  let min = Infinity
  let max = -Infinity
  for (const row of data) {
    min = Math.min(min, row[att])
    max = Math.max(max, row[att])
  }
  if (min === max) return { size: n }

  const splitVal = min + Math.random() * (max - min)
  const leftData = data.filter((r) => r[att] < splitVal)
  const rightData = data.filter((r) => r[att] >= splitVal)

  return {
    size: n,
    splitAtt: att,
    splitVal,
    left: buildTree(leftData, height + 1, maxHeight),
    right: buildTree(rightData, height + 1, maxHeight),
  }
}

function pathLength(row: number[], node: IsolationTree, height: number): number {
  if (node.splitAtt === undefined || !node.left || !node.right) {
    // Average path length adjustment for unsuccessful search
    const c = (n: number) => (n <= 1 ? 0 : 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1)) / n)
    return height + c(node.size)
  }
  if (row[node.splitAtt] < (node.splitVal as number)) {
    return pathLength(row, node.left, height + 1)
  }
  return pathLength(row, node.right, height + 1)
}

export function isolationForestScores(data: number[][], trees = 100, sampleSize = 256): number[] {
  if (!data.length) return []
  const maxHeight = Math.ceil(Math.log2(Math.min(sampleSize, data.length)))
  const forest: IsolationTree[] = []

  for (let t = 0; t < trees; t++) {
    const sample: number[][] = []
    const size = Math.min(sampleSize, data.length)
    for (let i = 0; i < size; i++) sample.push(data[randomInt(data.length)])
    forest.push(buildTree(sample, 0, maxHeight))
  }

  const c = (n: number) => (n <= 1 ? 0 : 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1)) / n)
  const cn = c(Math.min(sampleSize, data.length))

  return data.map((row) => {
    const avgPath = forest.reduce((s, tree) => s + pathLength(row, tree, 0), 0) / forest.length
    // anomaly score in (0,1); higher = more anomalous
    return Math.pow(2, -avgPath / (cn || 1))
  })
}

function mean(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

function std(values: number[]) {
  if (values.length < 2) return 0
  const m = mean(values)
  return Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length)
}

function severityFromScore(score: number): Severity {
  if (score >= 0.72) return 'high'
  if (score >= 0.6) return 'medium'
  return 'low'
}

export function detectAnomalies(params: {
  products: Product[]
  sales: Sale[]
  purchaseOrders: PurchaseOrder[]
}): AnomalyAlert[] {
  const { products, sales, purchaseOrders } = params
  const alerts: AnomalyAlert[] = []
  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // --- Demand anomalies per product (Isolation Forest on daily volumes) ---
  for (const product of products) {
    const productSales = sales.filter((s) => s.productId === product.productId)
    if (productSales.length < 8) continue

    const byDate = new Map<string, number>()
    for (const s of productSales) {
      byDate.set(s.saleDate, (byDate.get(s.saleDate) ?? 0) + s.quantitySold)
    }
    const dates = [...byDate.keys()].sort()
    const volumes = dates.map((d) => byDate.get(d)!)
    const features = volumes.map((v, i) => {
      const window = volumes.slice(Math.max(0, i - 6), i + 1)
      return [v, mean(window), std(window)]
    })

    const scores = isolationForestScores(features, 80, Math.min(128, features.length))
    const latestIdx = scores.length - 1
    const score = scores[latestIdx]
    const latestVol = volumes[latestIdx]
    const baseline = mean(volumes.slice(0, -1))

    if (score >= 0.62 && baseline > 0) {
      const ratio = latestVol / baseline
      alerts.push({
        id: `A-DEM-${product.productId}`,
        type: ratio >= 1 ? 'Demand spike' : 'Demand drop',
        entity: `${product.productId} · ${product.productName}`,
        severity: severityFromScore(score),
        message:
          ratio >= 1
            ? `Recent sales ${ratio.toFixed(1)}× above baseline (Isolation Forest score ${score.toFixed(2)}).`
            : `Recent sales down to ${(ratio * 100).toFixed(0)}% of baseline (score ${score.toFixed(2)}).`,
        detectedAt: now,
        score,
      })
    }

    // Stock risk rule
    const avgDaily = mean(volumes)
    const daysCover = avgDaily > 0 ? product.currentStock / avgDaily : 999
    if (daysCover < 5) {
      alerts.push({
        id: `A-STK-${product.productId}`,
        type: 'Stock risk',
        entity: `${product.productId} · ${product.productName}`,
        severity: daysCover < 3 ? 'high' : 'medium',
        message: `Days of cover (${daysCover.toFixed(1)}) is critically low versus recent demand.`,
        detectedAt: now,
        score: 0.8,
      })
    }
  }

  // --- Delivery / price anomalies on POs ---
  const delayFeatures = purchaseOrders
    .filter((p) => p.orderDate && p.actualDelivery && p.expectedDelivery)
    .map((p) => {
      const delay =
        (new Date(p.actualDelivery).getTime() - new Date(p.expectedDelivery).getTime()) / 86400000
      return { po: p, delay, price: p.unitPrice }
    })

  if (delayFeatures.length >= 5) {
    const matrix = delayFeatures.map((d) => [d.delay, d.price])
    const scores = isolationForestScores(matrix, 80, Math.min(128, matrix.length))
    delayFeatures.forEach((d, i) => {
      if (scores[i] >= 0.65 && d.delay > 2) {
        alerts.push({
          id: `A-DEL-${d.po.poId}`,
          type: 'Late delivery',
          entity: `${d.po.vendorId} · ${d.po.poId}`,
          severity: severityFromScore(scores[i]),
          message: `Delivery ${Math.round(d.delay)} days late vs promise (anomaly score ${scores[i].toFixed(2)}).`,
          detectedAt: now,
          score: scores[i],
        })
      }
    })
  }

  // Price jumps vs product history
  for (const product of products) {
    const prices = purchaseOrders
      .filter((p) => p.productId === product.productId && p.unitPrice > 0)
      .sort((a, b) => a.orderDate.localeCompare(b.orderDate))
    if (prices.length < 3) continue
    const latest = prices[prices.length - 1]
    const hist = prices.slice(0, -1).map((p) => p.unitPrice)
    const baseline = mean(hist)
    if (baseline > 0 && latest.unitPrice > baseline * 1.15) {
      const pct = ((latest.unitPrice - baseline) / baseline) * 100
      alerts.push({
        id: `A-PRC-${product.productId}`,
        type: 'Price jump',
        entity: `${product.productId} · ${product.productName}`,
        severity: pct > 25 ? 'high' : 'medium',
        message: `Unit price rose ${pct.toFixed(0)}% vs historical average ($${baseline.toFixed(2)} → $${latest.unitPrice.toFixed(2)}).`,
        detectedAt: now,
        score: Math.min(0.95, 0.55 + pct / 100),
      })
    }
  }

  // Deduplicate by id, keep highest severity
  const byId = new Map<string, AnomalyAlert>()
  for (const a of alerts) {
    const prev = byId.get(a.id)
    if (!prev || a.score > prev.score) byId.set(a.id, a)
  }

  return [...byId.values()].sort((a, b) => b.score - a.score)
}
