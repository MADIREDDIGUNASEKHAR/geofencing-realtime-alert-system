import { useEffect, useMemo, useState, type FormEvent } from 'react'
import MapView from '../components/MapView'
import { ApiError, listGeofences, listVehicles, updateVehicleLocation } from '../api/client'
import type { CurrentGeofenceStatus, Geofence, LatLng, Vehicle } from '../api/types'
import { Button, Card, EmptyState, ErrorBanner, Input, Label, Select, Spinner, SuccessBanner } from '../components/ui'

function nowForInput(): string {
  const d = new Date()
  d.setSeconds(0, 0)
  const tzOffsetMs = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16)
}

export default function Tracking() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [vehicleId, setVehicleId] = useState('')
  const [lat, setLat] = useState<string>('')
  const [lng, setLng] = useState<string>('')
  const [timestampLocal, setTimestampLocal] = useState(nowForInput())

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<CurrentGeofenceStatus[] | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [v, g] = await Promise.all([listVehicles(), listGeofences()])
        setVehicles(v.vehicles ?? [])
        setGeofences(g.geofences ?? [])
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const pickedPoint: LatLng | null = useMemo(() => {
    const la = Number(lat)
    const ln = Number(lng)
    if (lat === '' || lng === '' || Number.isNaN(la) || Number.isNaN(ln)) return null
    return [la, ln]
  }, [lat, lng])

  const mapCenter: LatLng | undefined = geofences[0]?.coordinates[0]

  function handleMapClick(clickedLat: number, clickedLng: number) {
    setLat(clickedLat.toFixed(6))
    setLng(clickedLng.toFixed(6))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setResult(null)

    if (!vehicleId) {
      setSubmitError('Select a vehicle')
      return
    }
    if (!pickedPoint) {
      setSubmitError('Click the map or enter a valid latitude/longitude')
      return
    }
    if (!timestampLocal) {
      setSubmitError('Timestamp is required')
      return
    }

    setSubmitting(true)
    try {
      const timestamp = new Date(timestampLocal).toISOString()
      const res = await updateVehicleLocation({
        vehicle_id: vehicleId,
        latitude: pickedPoint[0],
        longitude: pickedPoint[1],
        timestamp,
      })
      setResult(res.current_geofences)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Failed to update location')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10 text-gray-400">
        <Spinner />
      </div>
    )
  }

  if (loadError) return <ErrorBanner message={loadError} />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 space-y-4">
        <h2 className="font-semibold text-gray-900">Update vehicle location</h2>
        {vehicles.length === 0 ? (
          <EmptyState message="Register a vehicle first on the Vehicles page." />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Vehicle</Label>
              <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">Select a vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} — {v.driver_name}
                  </option>
                ))}
              </Select>
            </div>
            <p className="text-xs text-gray-500">Click anywhere on the map to set the location, or type coordinates directly.</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Latitude</Label>
                <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="37.7849" />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-122.4194" />
              </div>
            </div>
            <div>
              <Label>Timestamp</Label>
              <Input type="datetime-local" value={timestampLocal} onChange={(e) => setTimestampLocal(e.target.value)} />
            </div>

            {submitError && <ErrorBanner message={submitError} />}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Spinner />} Update location
            </Button>
          </form>
        )}

        {result && (
          <div className="border-t border-gray-100 pt-3">
            <h3 className="font-medium text-gray-900 text-sm mb-2">Currently inside</h3>
            {result.length === 0 ? (
              <SuccessBanner message="Location updated. Vehicle is not inside any geofence." />
            ) : (
              <ul className="space-y-1">
                {result.map((g) => (
                  <li key={g.geofence_id} className="text-sm bg-green-50 border border-green-200 text-green-700 rounded-md px-3 py-1.5">
                    {g.geofence_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <div className="lg:col-span-2 h-[640px]">
        <MapView geofences={geofences} center={mapCenter} pickedPoint={pickedPoint} onMapClick={handleMapClick} />
      </div>
    </div>
  )
}
