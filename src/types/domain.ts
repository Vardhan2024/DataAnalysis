export type Urgency = 'critical' | 'high' | 'medium' | 'low'
export type Severity = 'high' | 'medium' | 'low'

export interface Product {
  productId: string
  productName: string
  category: string
  unitCost: number
  currentStock: number
  safetyStock: number
  reorderPoint: number
  moq: number
  preferredVendorId?: string
}

export interface Sale {
  saleId: string
  productId: string
  saleDate: string
  quantitySold: number
}

export interface PurchaseOrder {
  poId: string
  productId: string
  vendorId: string
  orderDate: string
  expectedDelivery: string
  actualDelivery: string
  orderQty: number
  receivedQty: number
  unitPrice: number
  status: string
}

export interface Vendor {
  vendorId: string
  vendorName: string
  defaultLeadTimeDays: number
}

export interface ForecastPoint {
  week: string
  actual: number | null
  forecast: number
}

export interface ProductForecast {
  productId: string
  productName: string
  avgDailyDemand: number
  next30DayDemand: number
  series: ForecastPoint[]
  confidence: 'high' | 'medium' | 'low'
}

export interface ReorderRecommendation {
  productId: string
  productName: string
  currentStock: number
  reorderPoint: number
  recommendedQty: number
  orderBy: string
  urgency: Urgency
  vendorId: string
  vendor: string
  vendorScore: number
  daysOfCover: number
  avgDailyDemand: number
}

export interface VendorScore {
  vendorId: string
  name: string
  score: number
  onTime: number
  fillRate: number
  priceIndex: number
  leadTimeDays: number
  leadTimeConsistency: number
  rank: number
}

export interface AnomalyAlert {
  id: string
  type: string
  entity: string
  severity: Severity
  message: string
  detectedAt: string
  score: number
}

export interface AnalysisSnapshot {
  id: string
  createdAt: string
  kpis: {
    itemsToReorder: number
    stockoutRisk: number
    avgVendorScore: number
    openAnomalies: number
    highAnomalies: number
  }
  reorders: ReorderRecommendation[]
  vendors: VendorScore[]
  anomalies: AnomalyAlert[]
  forecasts: ProductForecast[]
}

export type DatasetKey = 'products' | 'sales' | 'purchaseOrders' | 'vendors'
