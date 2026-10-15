import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ToastContainer from './components/ToastContainer'
import { AlertsProvider } from './context/AlertsContext'
import Dashboard from './pages/Dashboard'
import Geofences from './pages/Geofences'
import Vehicles from './pages/Vehicles'
import Tracking from './pages/Tracking'
import Alerts from './pages/Alerts'
import History from './pages/History'

export default function App() {
  return (
    <AlertsProvider>
      <ToastContainer />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="geofences" element={<Geofences />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="tracking" element={<Tracking />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="history" element={<History />} />
        </Route>
      </Routes>
    </AlertsProvider>
  )
}
