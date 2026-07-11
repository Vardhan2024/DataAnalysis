import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ProcurementProvider } from './hooks/useProcurement'
import { ThemeProvider } from './hooks/useTheme'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ProcurementProvider>
          <App />
        </ProcurementProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
