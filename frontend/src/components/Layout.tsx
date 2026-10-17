import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { BellRing, Hexagon, History, LayoutDashboard, MapPinned, Menu, Navigation, Truck, X } from 'lucide-react'
import { useAlerts } from '../context/AlertsContext'

const navItems = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/geofences', label: 'Geofences', icon: Hexagon },
  { to: '/vehicles', label: 'Vehicles', icon: Truck },
  { to: '/tracking', label: 'Tracking', icon: Navigation },
  { to: '/alerts', label: 'Alerts', icon: BellRing },
  { to: '/history', label: 'History', icon: History },
]

function StatusChip({ status }: { status: 'connecting' | 'open' | 'closed' }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 backdrop-blur-xl px-3 py-1.5 text-xs font-medium text-muted-foreground shrink-0">
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
      <span className="hidden sm:inline">{status === 'open' ? 'Live' : status === 'connecting' ? 'Connecting…' : 'Disconnected'}</span>
    </div>
  )
}

function AlertCountChip({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/50 backdrop-blur-xl border border-white/60 px-3 py-1.5 text-xs font-medium text-muted-foreground overflow-hidden shrink-0">
      <BellRing className="h-3.5 w-3.5" />
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="inline-block tabular-nums"
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

export default function Layout() {
  const { status, feed } = useAlerts()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/50 backdrop-blur-xl border-b border-white/60 sticky top-0 z-[900] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 gap-3">
          <div className="flex items-center gap-8 min-w-0">
            <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
              <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30 transition-transform group-hover:scale-105 shrink-0">
                <MapPinned className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <span className="font-bold text-foreground tracking-tight text-[15px] leading-none hidden sm:inline">
                Geofencing
                <span className="block text-[11px] font-medium text-muted-foreground tracking-wide">
                  &amp; Vehicle Tracking
                </span>
              </span>
            </NavLink>

            <nav className="hidden md:flex gap-1 relative">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
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
            <StatusChip status={status} />
            <AlertCountChip count={feed.length} />
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-white/60 hover:text-foreground transition-colors shrink-0"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="md:hidden overflow-hidden border-t border-white/60 bg-white/70 backdrop-blur-xl"
            >
              <div className="px-4 py-2 flex flex-col">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={`flex items-center gap-3 px-2 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 sm:py-7">
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
