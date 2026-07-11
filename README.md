# AI-Powered Purchase Recommendation & Supplier Intelligence System

Browser-based prototype. Data stays in Chrome IndexedDB. Algorithms run in the browser.

## Stack
- React + Webpack + Babel + Tailwind CSS
- Dexie.js (IndexedDB)
- Papa Parse (CSV)
- Holt-Winters, TOPSIS, Isolation Forest, Reorder engine

## Run
```bash
npm install
npm run start
```

Open http://localhost:3000

## First use
1. Go to **Data Upload**
2. Click **Load sample data** (or upload your CSVs)
3. Review Overview, Reorders, Forecast, Vendors, Anomalies

## Backend modules
| Module | Path | What it does |
|--------|------|--------------|
| IndexedDB | `src/services/storage/db.ts` | Chrome storage via Dexie |
| CSV | `src/services/csv/parseCsv.ts` | Parse/upload CSV files |
| Holt-Winters | `src/services/algorithms/holtWinters.ts` | Demand forecasting |
| Reorder | `src/services/algorithms/reorder.ts` | When/how much to buy |
| TOPSIS | `src/services/algorithms/topsis.ts` | Vendor ranking |
| Isolation Forest | `src/services/algorithms/anomaly.ts` | Anomaly detection |
| Pipeline | `src/services/pipeline/runAnalysis.ts` | Runs full analysis |

## Status
- [x] Step 1: Folder structure
- [x] Step 2: Frontend UI
- [x] Step 3: Backend (storage + algorithms)
