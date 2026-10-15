import { useEffect, useState } from 'react'
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

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 w-80">
      {toasts.map((t) => {
        const isRestricted = t.geofence.category === 'restricted_zone'
        return (
          <div
            key={t._id}
            className={`rounded-lg shadow-lg p-3 text-sm text-white ${
              isRestricted ? 'bg-red-600' : t.event_type === 'entry' ? 'bg-amber-600' : 'bg-slate-700'
            }`}
          >
            <div className="font-semibold">
              {t.vehicle.vehicle_number} {t.event_type === 'entry' ? 'entered' : 'exited'} {t.geofence.geofence_name}
            </div>
            <div className="opacity-90">
              Driver: {t.vehicle.driver_name} &middot; {t.geofence.category.replace(/_/g, ' ')}
            </div>
            <div className="opacity-75 text-xs mt-1">{new Date(t.timestamp).toLocaleString()}</div>
          </div>
        )
      })}
    </div>
  )
}
