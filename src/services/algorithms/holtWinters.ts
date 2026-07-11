/** Additive Holt-Winters (triple exponential smoothing) */

export interface HoltWintersResult {
  fitted: number[]
  forecast: number[]
  level: number
  trend: number
}

function mean(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function holtWinters(
  series: number[],
  seasonLength = 7,
  horizon = 14,
  alpha = 0.35,
  beta = 0.15,
  gamma = 0.2,
): HoltWintersResult {
  const n = series.length
  if (n === 0) {
    return { fitted: [], forecast: Array(horizon).fill(0), level: 0, trend: 0 }
  }

  if (n < seasonLength * 2) {
    // Fallback: simple trend + moving average for short series
    const avg = mean(series)
    const recent = mean(series.slice(-Math.min(7, n)))
    const trend = (recent - avg) / Math.max(n, 1)
    const fitted = series.map((_, i) => Math.max(0, avg + trend * i))
    const forecast = Array.from({ length: horizon }, (_, i) =>
      Math.max(0, Math.round(recent + trend * (i + 1))),
    )
    return { fitted, forecast, level: recent, trend }
  }

  const seasons = Math.floor(n / seasonLength)
  const seasonals = Array(seasonLength).fill(0)

  for (let s = 0; s < seasonLength; s++) {
    let sum = 0
    let count = 0
    for (let j = 0; j < seasons; j++) {
      const idx = j * seasonLength + s
      if (idx < n) {
        sum += series[idx]
        count++
      }
    }
    seasonals[s] = count ? sum / count - mean(series) : 0
  }

  let level = mean(series.slice(0, seasonLength))
  let trend =
    (mean(series.slice(seasonLength, seasonLength * 2)) - mean(series.slice(0, seasonLength))) /
    seasonLength

  const fitted: number[] = []

  for (let t = 0; t < n; t++) {
    const s = seasonals[t % seasonLength]
    const yhat = level + trend + s
    fitted.push(Math.max(0, yhat))

    const y = series[t]
    const lastLevel = level
    level = alpha * (y - s) + (1 - alpha) * (level + trend)
    trend = beta * (level - lastLevel) + (1 - beta) * trend
    seasonals[t % seasonLength] = gamma * (y - level) + (1 - gamma) * s
  }

  const forecast: number[] = []
  for (let h = 1; h <= horizon; h++) {
    const s = seasonals[(n + h - 1) % seasonLength]
    forecast.push(Math.max(0, Math.round(level + h * trend + s)))
  }

  return { fitted, forecast, level, trend }
}

export function toWeeklySeries(dailyQtyByDate: Map<string, number>): { labels: string[]; values: number[] } {
  const dates = [...dailyQtyByDate.keys()].sort()
  if (!dates.length) return { labels: [], values: [] }

  const start = new Date(dates[0])
  const end = new Date(dates[dates.length - 1])
  const labels: string[] = []
  const values: number[] = []

  let cursor = new Date(start)
  // Align to Monday-ish week buckets
  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7))
  let week = 1

  while (cursor <= end || values.length < 4) {
    let sum = 0
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10)
      sum += dailyQtyByDate.get(key) ?? 0
      cursor.setDate(cursor.getDate() + 1)
    }
    labels.push(`W${week}`)
    values.push(sum)
    week++
    if (week > 52) break
  }

  return { labels, values }
}
