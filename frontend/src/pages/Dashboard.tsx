import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BellRing, Hexagon, LayoutDashboard, LogIn, LogOut, Radio, Truck } from 'lucide-react'
import MapView, { type VehicleMarker } from '../components/MapView'
import { useAlerts } from '../context/AlertsContext'
import { ApiError, getVehicleLocation, listGeofences, listVehicles } from '../api/client'
import type { Geofence, LatLng, Vehicle } from '../api/types'
import { AnimatedNumber, Card, EmptyState, ErrorBanner, EventTypeBadge, PageHeader, Skeleton } from '../components/ui'

const statGridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const statItemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function Dashboard() {
  const { feed, status } = useAlerts()
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleMarkers, setVehicleMarkers] = useState<VehicleMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [g, v] = await Promise.all([listGeofences(), listVehicles()])
        setGeofences(g.geofences ?? [])
        setVehicles(v.vehicles ?? [])

        const locations = await Promise.all(
          (v.vehicles ?? []).map(async (vehicle) => {
            try {
              const loc = await getVehicleLocation(vehicle.id)
              if (!loc.current_location) return null
              const marker: VehicleMarker = {
                id: vehicle.id,
                vehicleNumber: vehicle.vehicle_number,
                driverName: vehicle.driver_name,
                lat: loc.current_location.latitude,
                lng: loc.current_location.longitude,
              }
              return marker
            } catch {
              return null
            }
          }),
        )
        setVehicleMarkers(locations.filter((m): m is VehicleMarker => m !== null))
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const mapCenter: LatLng | undefined =
    geofences[0]?.coordinates[0] ?? (vehicleMarkers[0] ? [vehicleMarkers[0].lat, vehicleMarkers[0].lng] : undefined)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3.5 mb-6">
          <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
          <div className="space-y-2 pt-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3.5 w-56" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-14 mt-3" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[340px] sm:h-[440px] lg:h-[560px] rounded-2xl" />
          <Card className="lg:col-span-1 h-[340px] sm:h-[440px] lg:h-[560px] space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </Card>
        </div>
      </div>
    )
  }

  if (error) return <ErrorBanner message={error} />

  return (
    <div className="space-y-6">
      <PageHeader icon={LayoutDashboard} title="Dashboard" description="Live overview of your fleet and geofences" />

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        variants={statGridVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={statItemVariants}>
          <StatCard icon={Hexagon} iconColor="text-blue-600 bg-blue-500/10" label="Geofences" value={geofences.length} />
        </motion.div>
        <motion.div variants={statItemVariants}>
          <StatCard icon={Truck} iconColor="text-indigo-600 bg-indigo-500/10" label="Vehicles" value={vehicles.length} />
        </motion.div>
        <motion.div variants={statItemVariants}>
          <StatCard icon={Radio} iconColor="text-violet-600 bg-violet-500/10" label="Tracked now" value={vehicleMarkers.length} />
        </motion.div>
        <motion.div variants={statItemVariants}>
          <StatCard
            icon={BellRing}
            iconColor="text-green-600 bg-green-500/10"
            label="Live alerts"
            value={feed.length}
            accent={status === 'open'}
          />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[340px] sm:h-[440px] lg:h-[560px] rounded-2xl overflow-hidden border border-white/60 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-8px_rgba(16,24,40,0.12)] backdrop-blur-xl">
          <MapView geofences={geofences} vehicles={vehicleMarkers} center={mapCenter} />
        </div>

        <Card className="lg:col-span-1 h-[340px] sm:h-[440px] lg:h-[560px] flex flex-col !p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border/60">
            <BellRing className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Live alerts feed</h2>
          </div>
          <div className="flex-1 overflow-auto px-5 py-4">
            {feed.length === 0 ? (
              <EmptyState icon={BellRing} message="No alerts yet. Trigger a geofence entry/exit to see one here." />
            ) : (
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {feed.map((a) => {
                    const Icon = a.event_type === 'entry' ? LogIn : LogOut
                    return (
                      <motion.li
                        key={a.event_id}
                        layout
                        initial={{ opacity: 0, y: -12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="flex gap-3 border border-border/60 rounded-xl p-3 text-sm hover:border-border hover:bg-muted/30 transition-colors"
                      >
                        <span
                          className={`flex items-center justify-center h-8 w-8 shrink-0 rounded-lg ${
                            a.geofence.category === 'restricted_zone' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground truncate">{a.vehicle.vehicle_number}</span>
                            <EventTypeBadge eventType={a.event_type} />
                          </div>
                          <div className="text-muted-foreground text-xs mt-0.5 truncate">
                            {a.geofence.geofence_name} &middot; {a.geofence.category.replace(/_/g, ' ')}
                          </div>
                          <div className="text-muted-foreground/70 text-[11px] mt-1">{new Date(a.timestamp).toLocaleString()}</div>
                        </div>
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  accent = false,
}: {
  icon: typeof Hexagon
  iconColor: string
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <Card hoverable>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={`flex items-center justify-center h-8 w-8 rounded-lg ${iconColor}`}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
      <AnimatedNumber
        value={value}
        className={`block text-3xl font-bold mt-2 tracking-tight ${accent ? 'text-green-600' : 'text-foreground'}`}
      />
    </Card>
  )
}
