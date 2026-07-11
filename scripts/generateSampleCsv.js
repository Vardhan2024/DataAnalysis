const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '..', 'public', 'samples')
fs.mkdirSync(dir, { recursive: true })

function isoDaysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function addDays(iso, days) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const vendors = [
  ['V01', 'Northline Supply', 6],
  ['V02', 'Apex Materials', 8],
  ['V03', 'Harbor Industrial', 10],
  ['V04', 'Summit Packaging', 12],
  ['V05', 'Crestline Co.', 14],
]

const products = [
  ['P-1042', 'Stretch Wrap 18in', 'Packaging', 12.5, 42, 30, 70, 50, 'V01'],
  ['P-2088', 'Vapor Barrier Sheet', 'Barrier', 28.0, 110, 40, 120, 100, 'V02'],
  ['P-3310', 'Sealing Tape 2in', 'Tape', 4.2, 260, 50, 240, 100, 'V03'],
  ['P-4415', 'Foam Board 4x8', 'Board', 18.75, 55, 25, 80, 40, 'V01'],
  ['P-5521', 'Corner Guard Kit', 'Accessories', 9.1, 320, 40, 300, 50, 'V04'],
  ['P-6602', 'Adhesive Primer', 'Chemical', 22.0, 28, 20, 45, 24, 'V05'],
  ['P-7710', 'Membrane Roll 40in', 'Barrier', 35.5, 75, 30, 90, 20, 'V02'],
  ['P-8820', 'Flashing Tape', 'Tape', 6.8, 140, 35, 100, 60, 'V03'],
]

const baseDemand = {
  'P-1042': 14,
  'P-2088': 9,
  'P-3310': 18,
  'P-4415': 7,
  'P-5521': 6,
  'P-6602': 5,
  'P-7710': 8,
  'P-8820': 11,
}

const unitCost = Object.fromEntries(products.map((p) => [p[0], p[3]]))
const preferred = Object.fromEntries(products.map((p) => [p[0], p[8]]))
const lead = Object.fromEntries(vendors.map((v) => [v[0], v[2]]))

let productsCsv =
  'product_id,product_name,category,unit_cost,current_stock,safety_stock,reorder_point,moq,preferred_vendor_id\n'
for (const p of products) productsCsv += p.join(',') + '\n'

let vendorsCsv = 'vendor_id,vendor_name,default_lead_time_days\n'
for (const v of vendors) vendorsCsv += v.join(',') + '\n'

let salesCsv = 'sale_id,product_id,sale_date,quantity_sold\n'
let saleN = 1
for (let day = 120; day >= 0; day--) {
  const date = isoDaysAgo(day)
  for (const p of products) {
    const id = p[0]
    const base = baseDemand[id]
    const seasonal = 1 + 0.15 * Math.sin((120 - day) / 10)
    let qty = Math.max(0, Math.round(base * seasonal + ((day * id.length) % 5) - 2))
    if (id === 'P-1042' && day <= 3) qty = Math.round(base * 3.2)
    if (id === 'P-5521' && day <= 10) qty = Math.round(base * 0.45)
    if (qty > 0) {
      salesCsv += `S-${saleN++},${id},${date},${qty}\n`
    }
  }
}

let poCsv =
  'po_id,product_id,vendor_id,order_date,expected_delivery,actual_delivery,order_qty,received_qty,unit_price,status\n'
let poN = 1
const cycle = ['V01', 'V02', 'V03', 'V04', 'V05']

for (const p of products) {
  const productId = p[0]
  for (let i = 0; i < 8; i++) {
    const vendorId = preferred[productId] || cycle[i % cycle.length]
    const lt = lead[vendorId]
    const orderDate = isoDaysAgo(100 - i * 12)
    const expected = addDays(orderDate, lt)
    let actual = expected
    if (vendorId === 'V05') actual = addDays(expected, 4 + (i % 3))
    if (vendorId === 'V03' && i === 2) actual = addDays(expected, 3)

    let unitPrice = unitCost[productId] * (0.92 + (i % 4) * 0.03)
    if (productId === 'P-3310' && i === 7) unitPrice = unitCost[productId] * 1.22

    const orderQty = 100 + i * 20
    const receivedQty = vendorId === 'V04' && i === 1 ? 80 : orderQty

    poCsv += [
      `PO-${poN++}`,
      productId,
      vendorId,
      orderDate,
      expected,
      actual,
      orderQty,
      receivedQty,
      unitPrice.toFixed(2),
      'received',
    ].join(',') + '\n'
  }
}

fs.writeFileSync(path.join(dir, 'products.csv'), productsCsv)
fs.writeFileSync(path.join(dir, 'vendors.csv'), vendorsCsv)
fs.writeFileSync(path.join(dir, 'sales.csv'), salesCsv)
fs.writeFileSync(path.join(dir, 'purchase_orders.csv'), poCsv)

console.log('Wrote files to', dir)
console.log('products:', products.length)
console.log('vendors:', vendors.length)
console.log('sales:', saleN - 1)
console.log('purchase_orders:', poN - 1)
