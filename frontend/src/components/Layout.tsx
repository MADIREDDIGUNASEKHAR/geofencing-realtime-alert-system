import { NavLink, Outlet } from 'react-router-dom'
import { useAlerts } from '../context/AlertsContext'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/geofences', label: 'Geofences' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/tracking', label: 'Tracking' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/history', label: 'History' },
]

export default function Layout() {
  const { status, feed } = useAlerts()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-[900]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900">Geofencing & Tracking</span>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-md text-sm font-medium ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span
              className={`h-2 w-2 rounded-full ${
                status === 'open' ? 'bg-green-500' : status === 'connecting' ? 'bg-amber-400' : 'bg-red-500'
              }`}
            />
            {status === 'open' ? 'Live alerts connected' : status === 'connecting' ? 'Connecting…' : 'Alerts disconnected'}
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5">{feed.length} received</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
