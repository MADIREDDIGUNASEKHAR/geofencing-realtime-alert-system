import { useEffect, useState } from 'react'
import MapView, { type VehicleMarker } from '../components/MapView'
import { useAlerts } from '../context/AlertsContext'
import { ApiError, getVehicleLocation, listGeofences, listVehicles } from '../api/client'
import type { Geofence, LatLng, Vehicle } from '../api/types'
import { Card, EmptyState, ErrorBanner, EventTypeBadge, Spinner } from '../components/ui'

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
                label: `${vehicle.vehicle_number} — ${vehicle.driver_name}`,
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
      <div className="flex justify-center py-10 text-gray-400">
        <Spinner />
      </div>
    )
  }

  if (error) return <ErrorBanner message={error} />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Geofences" value={geofences.length} />
        <StatCard label="Vehicles" value={vehicles.length} />
        <StatCard label="Tracked now" value={vehicleMarkers.length} />
        <StatCard label="Live alerts" value={feed.length} accent={status === 'open'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[560px]">
          <MapView geofences={geofences} vehicles={vehicleMarkers} center={mapCenter} />
        </div>

        <Card className="lg:col-span-1 h-[560px] flex flex-col">
          <h2 className="font-semibold text-gray-900 mb-3">Live alerts feed</h2>
          {feed.length === 0 ? (
            <EmptyState message="No alerts yet. Trigger a geofence entry/exit to see one here." />
          ) : (
            <ul className="space-y-2 overflow-auto flex-1">
              {feed.map((a) => (
                <li key={`${a.event_id}`} className="border border-gray-100 rounded-lg p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{a.vehicle.vehicle_number}</span>
                    <EventTypeBadge eventType={a.event_type} />
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    {a.geofence.geofence_name} &middot; {a.geofence.category.replace(/_/g, ' ')}
                  </div>
                  <div className="text-gray-400 text-[11px] mt-0.5">{new Date(a.timestamp).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${accent ? 'text-green-600' : 'text-gray-900'}`}>{value}</div>
    </Card>
  )
}
