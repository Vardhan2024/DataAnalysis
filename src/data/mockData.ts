export type Urgency = 'critical' | 'high' | 'medium' | 'low'

export interface KpiItem {
  label: string
  value: string
  delta: string
  tone: 'teal' | 'amber' | 'rose' | 'sky'
}

export interface ReorderItem {
  productId: string
  productName: string
  currentStock: number
  reorderPoint: number
  recommendedQty: number
  orderBy: string
  urgency: Urgency
  vendor: string
  vendorScore: number
}

export interface VendorItem {
  vendorId: string
  name: string
  score: number
  onTime: number
  fillRate: number
  priceIndex: number
  leadTimeDays: number
  rank: number
}

export interface AnomalyItem {
  id: string
  type: string
  entity: string
  severity: 'high' | 'medium' | 'low'
  message: string
  detectedAt: string
}

export interface ForecastPoint {
  week: string
  actual: number | null
  forecast: number
}

export const kpis: KpiItem[] = [
  { label: 'Items to reorder', value: '18', delta: '+4 vs last week', tone: 'amber' },
  { label: 'Stockout risk', value: '6', delta: '2 critical SKUs', tone: 'rose' },
  { label: 'Avg vendor score', value: '84.2', delta: '+1.8 pts', tone: 'teal' },
  { label: 'Open anomalies', value: '11', delta: '3 high severity', tone: 'sky' },
]

export const reorders: ReorderItem[] = [
  {
    productId: 'P-1042',
    productName: 'Stretch Wrap 18"',
    currentStock: 42,
    reorderPoint: 70,
    recommendedQty: 280,
    orderBy: 'Jul 12',
    urgency: 'critical',
    vendor: 'Northline Supply',
    vendorScore: 91,
  },
  {
    productId: 'P-2088',
    productName: 'Vapor Barrier Sheet',
    currentStock: 110,
    reorderPoint: 120,
    recommendedQty: 400,
    orderBy: 'Jul 14',
    urgency: 'high',
    vendor: 'Apex Materials',
    vendorScore: 86,
  },
  {
    productId: 'P-3310',
    productName: 'Sealing Tape 2"',
    currentStock: 260,
    reorderPoint: 240,
    recommendedQty: 500,
    orderBy: 'Jul 18',
    urgency: 'medium',
    vendor: 'Harbor Industrial',
    vendorScore: 79,
  },
  {
    productId: 'P-4415',
    productName: 'Foam Board 4x8',
    currentStock: 55,
    reorderPoint: 80,
    recommendedQty: 160,
    orderBy: 'Jul 13',
    urgency: 'high',
    vendor: 'Northline Supply',
    vendorScore: 91,
  },
  {
    productId: 'P-5521',
    productName: 'Corner Guard Kit',
    currentStock: 320,
    reorderPoint: 300,
    recommendedQty: 200,
    orderBy: 'Jul 22',
    urgency: 'low',
    vendor: 'Summit Packaging',
    vendorScore: 74,
  },
]

export const vendors: VendorItem[] = [
  { vendorId: 'V01', name: 'Northline Supply', score: 91, onTime: 96, fillRate: 98, priceIndex: 88, leadTimeDays: 6, rank: 1 },
  { vendorId: 'V02', name: 'Apex Materials', score: 86, onTime: 91, fillRate: 94, priceIndex: 84, leadTimeDays: 8, rank: 2 },
  { vendorId: 'V03', name: 'Harbor Industrial', score: 79, onTime: 84, fillRate: 90, priceIndex: 92, leadTimeDays: 10, rank: 3 },
  { vendorId: 'V04', name: 'Summit Packaging', score: 74, onTime: 78, fillRate: 88, priceIndex: 95, leadTimeDays: 12, rank: 4 },
  { vendorId: 'V05', name: 'Crestline Co.', score: 68, onTime: 71, fillRate: 82, priceIndex: 90, leadTimeDays: 14, rank: 5 },
]

export const anomalies: AnomalyItem[] = [
  {
    id: 'A-901',
    type: 'Demand spike',
    entity: 'P-1042 · Stretch Wrap 18"',
    severity: 'high',
    message: 'Sales 3.4× above 30-day average for 4 consecutive days.',
    detectedAt: 'Today · 09:14',
  },
  {
    id: 'A-902',
    type: 'Late delivery',
    entity: 'V05 · Crestline Co.',
    severity: 'high',
    message: 'Lead time exceeded promised date by 6 days on PO-7781.',
    detectedAt: 'Today · 08:02',
  },
  {
    id: 'A-903',
    type: 'Price jump',
    entity: 'P-3310 · Sealing Tape 2"',
    severity: 'medium',
    message: 'Unit price rose 18% vs 6-month trailing average.',
    detectedAt: 'Yesterday · 16:40',
  },
  {
    id: 'A-904',
    type: 'Stock risk',
    entity: 'P-4415 · Foam Board 4x8',
    severity: 'medium',
    message: 'Days of cover (3.2) is below supplier lead time (8).',
    detectedAt: 'Yesterday · 11:20',
  },
  {
    id: 'A-905',
    type: 'Demand drop',
    entity: 'P-5521 · Corner Guard Kit',
    severity: 'low',
    message: 'Weekly demand fell 42% vs prior 8-week baseline.',
    detectedAt: 'Jul 8 · 14:05',
  },
]

export const forecastSeries: ForecastPoint[] = [
  { week: 'W1', actual: 120, forecast: 118 },
  { week: 'W2', actual: 132, forecast: 128 },
  { week: 'W3', actual: 125, forecast: 130 },
  { week: 'W4', actual: 148, forecast: 142 },
  { week: 'W5', actual: 155, forecast: 150 },
  { week: 'W6', actual: 149, forecast: 156 },
  { week: 'W7', actual: null, forecast: 162 },
  { week: 'W8', actual: null, forecast: 168 },
  { week: 'W9', actual: null, forecast: 171 },
  { week: 'W10', actual: null, forecast: 175 },
]

export const recentActivity = [
  { title: 'Reorder generated for Stretch Wrap 18"', time: '12 min ago', tone: 'amber' as const },
  { title: 'Vendor score refreshed · Northline Supply', time: '34 min ago', tone: 'teal' as const },
  { title: 'Anomaly flagged · Crestline late delivery', time: '1 hr ago', tone: 'rose' as const },
  { title: 'Forecast updated for 48 SKUs', time: '2 hr ago', tone: 'sky' as const },
]
