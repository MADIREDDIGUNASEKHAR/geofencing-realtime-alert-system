import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
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
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/50 backdrop-blur-xl border-b border-white/60 sticky top-0 z-[900] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30 transition-transform group-hover:scale-105">
                <MapPinned className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <span className="font-bold text-foreground tracking-tight text-[15px] leading-none">
                Geofencing
                <span className="block text-[11px] font-medium text-muted-foreground tracking-wide">
                  &amp; Vehicle Tracking
                </span>
              </span>
            </NavLink>

            <nav className="flex gap-1 relative">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 backdrop-blur-xl px-3 py-1.5 text-xs font-medium text-muted-foreground">
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
            <div className="flex items-center gap-1.5 rounded-full bg-white/50 backdrop-blur-xl border border-white/60 px-3 py-1.5 text-xs font-medium text-muted-foreground overflow-hidden">
              <BellRing className="h-3.5 w-3.5" />
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={feed.length}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="inline-block tabular-nums"
                >
                  {feed.length}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
