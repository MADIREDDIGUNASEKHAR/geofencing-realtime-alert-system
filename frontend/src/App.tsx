import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AmbientBackground from './components/AmbientBackground'
import Layout from './components/Layout'

// Three.js/R3F is a heavy dependency for a purely decorative background —
// lazy-load it so it streams in after the interactive app has painted,
// instead of blocking the initial bundle.
const Scene3D = lazy(() => import('./components/Scene3D'))
import ToastContainer from './components/ToastContainer'
import { AlertsProvider } from './context/AlertsContext'
import Dashboard from './pages/Dashboard'
import Geofences from './pages/Geofences'
import Vehicles from './pages/Vehicles'
import Tracking from './pages/Tracking'
import Alerts from './pages/Alerts'
import History from './pages/History'
import About from './pages/About'

export default function App() {
  return (
    <AlertsProvider>
      <AmbientBackground />
      <Suspense fallback={null}>
        <Scene3D />
      </Suspense>
      <ToastContainer />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="geofences" element={<Geofences />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="tracking" element={<Tracking />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="history" element={<History />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </AlertsProvider>
  )
}
