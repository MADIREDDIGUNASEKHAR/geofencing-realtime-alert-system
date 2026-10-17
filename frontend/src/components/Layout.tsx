import { NavLink, Outlet } from 'react-router-dom'
import { BellRing, Hexagon, History, LayoutDashboard, MapPinned, Navigation, Truck } from 'lucide-react'
import { useAlerts } from '../context/AlertsContext'

const navItems = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/geofences', label: 'Geofences', icon: Hexagon },
  { to: '/vehicles', label: 'Vehicles', icon: Truck },
  { to: '/tracking', label: 'Tracking', icon: Navigation },
  { to: '/alerts', label: 'Alerts', icon: BellRing },
  { to: '/history', label: 'History', icon: History },
]

export default function Layout() {
  const { status, feed } = useAlerts()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-[900] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30 transition-transform group-hover:scale-105">
                <MapPinned className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <span className="font-bold text-gray-900 tracking-tight text-[15px] leading-none">
                Geofencing
                <span className="block text-[11px] font-medium text-gray-400 tracking-wide">
                  &amp; Vehicle Tracking
                </span>
              </span>
            </NavLink>

            <nav className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600">
              <span className="relative flex h-2 w-2">
                {status === 'open' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    status === 'open' ? 'bg-green-500' : status === 'connecting' ? 'bg-amber-400' : 'bg-red-500'
                  }`}
                />
              </span>
              {status === 'open' ? 'Live' : status === 'connecting' ? 'Connecting…' : 'Disconnected'}
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
              <BellRing className="h-3.5 w-3.5" />
              {feed.length}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-7">
        <Outlet />
      </main>
    </div>
  )
}
