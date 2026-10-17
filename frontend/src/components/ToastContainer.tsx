import { useEffect, useState } from 'react'
import { AlertTriangle, LogIn, LogOut, X } from 'lucide-react'
import { useAlerts } from '../context/AlertsContext'
import type { AlertEvent } from '../api/types'

interface Toast extends AlertEvent {
  _id: string
}

const DISPLAY_MS = 7000

export default function ToastContainer() {
  const { latest } = useAlerts()
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    if (!latest) return
    const toast: Toast = { ...latest, _id: `${latest.event_id}-${Date.now()}` }
    setToasts((prev) => [...prev, toast])
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t._id !== toast._id))
    }, DISPLAY_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest])

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t._id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[1000] flex flex-col gap-2.5 w-[22rem] max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => {
        const isRestricted = t.geofence.category === 'restricted_zone'
        const Icon = isRestricted ? AlertTriangle : t.event_type === 'entry' ? LogIn : LogOut
        return (
          <div
            key={t._id}
            className={`animate-toast-in relative overflow-hidden rounded-2xl border border-white/20 backdrop-blur-xl shadow-lg shadow-black/10 p-4 text-white ${
              isRestricted
                ? 'bg-gradient-to-br from-red-600/95 to-red-700/95'
                : t.event_type === 'entry'
                  ? 'bg-gradient-to-br from-amber-500/95 to-amber-600/95'
                  : 'bg-gradient-to-br from-slate-700/95 to-slate-800/95'
            }`}
          >
            <button
              onClick={() => dismiss(t._id)}
              className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex gap-3 pr-5">
              <span className="flex items-center justify-center h-9 w-9 shrink-0 rounded-xl bg-white/15">
                <Icon className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-sm leading-snug">
                  {t.vehicle.vehicle_number} {t.event_type === 'entry' ? 'entered' : 'exited'} {t.geofence.geofence_name}
                </div>
                <div className="text-xs text-white/80 mt-0.5 truncate">
                  {t.vehicle.driver_name} &middot; {t.geofence.category.replace(/_/g, ' ')}
                </div>
                <div className="text-[11px] text-white/60 mt-1">{new Date(t.timestamp).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
