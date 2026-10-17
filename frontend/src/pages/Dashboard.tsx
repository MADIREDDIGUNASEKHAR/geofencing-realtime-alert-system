import { useEffect, useState } from 'react'
import { BellRing, Hexagon, LayoutDashboard, LogIn, LogOut, Radio, Truck } from 'lucide-react'
import MapView, { type VehicleMarker } from '../components/MapView'
import { useAlerts } from '../context/AlertsContext'
import { ApiError, getVehicleLocation, listGeofences, listVehicles } from '../api/client'
import type { Geofence, LatLng, Vehicle } from '../api/types'
import { Card, EmptyState, ErrorBanner, EventTypeBadge, PageHeader, Spinner } from '../components/ui'

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
      <div className="flex justify-center py-16 text-gray-400">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (error) return <ErrorBanner message={error} />

  return (
    <div className="space-y-6">
      <PageHeader icon={LayoutDashboard} title="Dashboard" description="Live overview of your fleet and geofences" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Hexagon} iconColor="text-blue-600 bg-blue-50" label="Geofences" value={geofences.length} />
        <StatCard icon={Truck} iconColor="text-indigo-600 bg-indigo-50" label="Vehicles" value={vehicles.length} />
        <StatCard icon={Radio} iconColor="text-violet-600 bg-violet-50" label="Tracked now" value={vehicleMarkers.length} />
        <StatCard
          icon={BellRing}
          iconColor="text-green-600 bg-green-50"
          label="Live alerts"
          value={feed.length}
          accent={status === 'open'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[560px] rounded-2xl overflow-hidden border border-gray-100 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)]">
          <MapView geofences={geofences} vehicles={vehicleMarkers} center={mapCenter} />
        </div>

        <Card className="lg:col-span-1 h-[560px] flex flex-col !p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <BellRing className="h-4 w-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">Live alerts feed</h2>
          </div>
          <div className="flex-1 overflow-auto px-5 py-4">
            {feed.length === 0 ? (
              <EmptyState icon={BellRing} message="No alerts yet. Trigger a geofence entry/exit to see one here." />
            ) : (
              <ul className="space-y-2">
                {feed.map((a) => {
                  const Icon = a.event_type === 'entry' ? LogIn : LogOut
                  return (
                    <li
                      key={`${a.event_id}`}
                      className="animate-fade-in-up flex gap-3 border border-gray-100 rounded-xl p-3 text-sm hover:border-gray-200 transition-colors"
                    >
                      <span
                        className={`flex items-center justify-center h-8 w-8 shrink-0 rounded-lg ${
                          a.geofence.category === 'restricted_zone' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 truncate">{a.vehicle.vehicle_number}</span>
                          <EventTypeBadge eventType={a.event_type} />
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5 truncate">
                          {a.geofence.geofence_name} &middot; {a.geofence.category.replace(/_/g, ' ')}
                        </div>
                        <div className="text-gray-400 text-[11px] mt-1">{new Date(a.timestamp).toLocaleString()}</div>
                      </div>
                    </li>
                  )
                })}
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
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className={`flex items-center justify-center h-8 w-8 rounded-lg ${iconColor}`}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
      <div className={`text-3xl font-bold mt-2 tracking-tight ${accent ? 'text-green-600' : 'text-gray-900'}`}>{value}</div>
    </Card>
  )
}
