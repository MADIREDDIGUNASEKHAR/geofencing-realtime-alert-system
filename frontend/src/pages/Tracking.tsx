import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CheckCircle2, MapPin, Navigation } from 'lucide-react'
import MapView from '../components/MapView'
import { ApiError, listGeofences, listVehicles, updateVehicleLocation } from '../api/client'
import type { CurrentGeofenceStatus, Geofence, LatLng, Vehicle } from '../api/types'
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, SelectField, Spinner, SuccessBanner } from '../components/ui'

function nowForInput(): string {
  const d = new Date()
  d.setSeconds(0, 0)
  const tzOffsetMs = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16)
}

// Jump-to-city shortcuts so picking a precise point doesn't require manually
// zooming in from a whole-world view first — pick a city, then click to
// refine within it.
const INDIA_CITIES: { name: string; position: LatLng }[] = [
  { name: 'Bengaluru', position: [12.9716, 77.5946] },
  { name: 'Mumbai', position: [19.076, 72.8777] },
  { name: 'Delhi', position: [28.7041, 77.1025] },
  { name: 'Hyderabad', position: [17.385, 78.4867] },
  { name: 'Chennai', position: [13.0827, 80.2707] },
  { name: 'Kolkata', position: [22.5726, 88.3639] },
  { name: 'Pune', position: [18.5204, 73.8567] },
  { name: 'Ahmedabad', position: [23.0225, 72.5714] },
  { name: 'Jaipur', position: [26.9124, 75.7873] },
  { name: 'Surat', position: [21.1702, 72.8311] },
  { name: 'Lucknow', position: [26.8467, 80.9462] },
  { name: 'Kanpur', position: [26.4499, 80.3319] },
  { name: 'Nagpur', position: [21.1458, 79.0882] },
  { name: 'Indore', position: [22.7196, 75.8577] },
  { name: 'Bhopal', position: [23.2599, 77.4126] },
  { name: 'Visakhapatnam', position: [17.6868, 83.2185] },
  { name: 'Patna', position: [25.5941, 85.1376] },
  { name: 'Vadodara', position: [22.3072, 73.1812] },
  { name: 'Agra', position: [27.1767, 78.0081] },
  { name: 'Nashik', position: [19.9975, 73.7898] },
  { name: 'Coimbatore', position: [11.0168, 76.9558] },
  { name: 'Chandigarh', position: [30.7333, 76.7794] },
  { name: 'Kochi', position: [9.9312, 76.2673] },
  { name: 'Guwahati', position: [26.1445, 91.7362] },
  { name: 'Bhubaneswar', position: [20.2961, 85.8245] },
  { name: 'Thiruvananthapuram', position: [8.5241, 76.9366] },
  { name: 'Mysuru', position: [12.2958, 76.6394] },
  { name: 'Noida', position: [28.5355, 77.391] },
  { name: 'Gurugram', position: [28.4595, 77.0266] },
  { name: 'Jodhpur', position: [26.2389, 73.0243] },
  { name: 'Varanasi', position: [25.3176, 82.9739] },
  { name: 'Amritsar', position: [31.634, 74.8723] },
  { name: 'Raipur', position: [21.2514, 81.6296] },
  { name: 'Ranchi', position: [23.3441, 85.3096] },
]
const CITY_OPTIONS = INDIA_CITIES.map((c) => ({ value: c.name, label: c.name }))

export default function Tracking() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [vehicleId, setVehicleId] = useState('')
  const [lat, setLat] = useState<string>('')
  const [lng, setLng] = useState<string>('')
  const [timestampLocal, setTimestampLocal] = useState(nowForInput())
  const [cityName, setCityName] = useState('')
  const [flyTarget, setFlyTarget] = useState<{ position: LatLng; zoom?: number } | null>(null)

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

  function handleMapClick(clickedLat: number, clickedLng: number) {
    setLat(clickedLat.toFixed(6))
    setLng(clickedLng.toFixed(6))
  }

  function handleCitySelect(name: string) {
    setCityName(name)
    const city = INDIA_CITIES.find((c) => c.name === name)
    if (!city) return
    setFlyTarget({ position: city.position })
    setLat(city.position[0].toFixed(6))
    setLng(city.position[1].toFixed(6))
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
      <div className="flex justify-center py-16 text-muted-foreground">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (loadError) return <ErrorBanner message={loadError} />

  return (
    <div>
      <PageHeader icon={Navigation} title="Tracking" description="Push a location update and watch geofence status react live" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="order-2 lg:order-none lg:col-span-1 space-y-4 h-fit">
          <h2 className="font-semibold text-foreground">Update vehicle location</h2>
          {vehicles.length === 0 ? (
            <EmptyState icon={Navigation} message="Register a vehicle first on the Vehicles page." />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <Label>Vehicle</Label>
                <SelectField
                  value={vehicleId}
                  onValueChange={setVehicleId}
                  placeholder="Select a vehicle…"
                  options={vehicles.map((v) => ({ value: v.id, label: `${v.vehicle_number} — ${v.driver_name}` }))}
                />
              </div>
              <div>
                <Label>Jump to a city</Label>
                <SelectField
                  value={cityName}
                  onValueChange={handleCitySelect}
                  placeholder="Select a city…"
                  options={CITY_OPTIONS}
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                Pick a city to jump there, then click the map to set the exact point, or type coordinates directly.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude</Label>
                  <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="12.9716" />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="77.5946" />
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
            <div className="border-t border-border/60 pt-4">
              <h3 className="font-medium text-foreground text-sm mb-2.5">Currently inside</h3>
              {result.length === 0 ? (
                <SuccessBanner message="Location updated. Vehicle is not inside any geofence." />
              ) : (
                <ul className="space-y-1.5">
                  {result.map((g) => (
                    <li
                      key={g.geofence_id}
                      className="flex items-center gap-2 text-sm bg-green-500/10 border border-green-500/20 text-green-700 rounded-xl px-3 py-2"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {g.geofence_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>

        <div className="order-1 lg:order-none lg:col-span-2 h-[300px] sm:h-[420px] lg:h-[640px] rounded-2xl overflow-hidden border border-white/60 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-8px_rgba(16,24,40,0.12)] backdrop-blur-xl">
          <MapView geofences={geofences} pickedPoint={pickedPoint} onMapClick={handleMapClick} flyTo={flyTarget} />
        </div>
      </div>
    </div>
  )
}
