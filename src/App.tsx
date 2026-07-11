import { useCallback, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { IntroSplash } from './components/IntroSplash'
import { OverviewPage } from './pages/OverviewPage'
import { ReordersPage } from './pages/ReordersPage'
import { ForecastPage } from './pages/ForecastPage'
import { VendorsPage } from './pages/VendorsPage'
import { AnomaliesPage } from './pages/AnomaliesPage'
import { DataUploadPage } from './pages/DataUploadPage'

export default function App() {
  const [showIntro, setShowIntro] = useState(true)

  const finishIntro = useCallback(() => {
    setShowIntro(false)
  }, [])

  return (
    <>
      {showIntro && <IntroSplash onDone={finishIntro} />}

      <div className={`app-shell ${showIntro ? 'app-shell--intro-locked' : 'app-shell--ready'}`}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/reorders" element={<ReordersPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/anomalies" element={<AnomaliesPage />} />
            <Route path="/data" element={<DataUploadPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </div>
    </>
  )
}
