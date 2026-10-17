import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { MapPinCheck, Truck } from 'lucide-react'
import { ApiError, createVehicle, getVehicleLocation, listVehicles } from '../api/client'
import type { Vehicle, VehicleLocationResponse } from '../api/types'
import {
  Button,
  Card,
  CategoryBadge,
  EmptyState,
  ErrorBanner,
  Input,
  Label,
  PageHeader,
  Skeleton,
  Spinner,
  StatusBadge,
  SuccessBanner,
} from '../components/ui'

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [vehicleNumber, setVehicleNumber] = useState('')
  const [driverName, setDriverName] = useState('')
  const [vehicleType, setVehicleType] = useState('truck')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<VehicleLocationResponse | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await listVehicles()
      setVehicles(res.vehicles ?? [])
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)

    if (!vehicleNumber.trim() || !driverName.trim() || !vehicleType.trim() || !phone.trim()) {
      setSubmitError('All fields are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await createVehicle({
        vehicle_number: vehicleNumber,
        driver_name: driverName,
        vehicle_type: vehicleType,
        phone,
      })
      setSubmitSuccess(`Vehicle "${res.vehicle_number}" registered`)
      setVehicleNumber('')
      setDriverName('')
      setPhone('')
      load()
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Failed to register vehicle')
    } finally {
      setSubmitting(false)
    }
  }

  async function viewLocation(vehicleId: string) {
    setSelectedId(vehicleId)
    setSelectedLocation(null)
    setLocationError(null)
    setLocationLoading(true)
    try {
      const res = await getVehicleLocation(vehicleId)
      setSelectedLocation(res)
    } catch (err) {
      setLocationError(err instanceof ApiError ? err.message : 'Failed to load location')
    } finally {
      setLocationLoading(false)
    }
  }

  return (
    <div>
      <PageHeader icon={Truck} title="Vehicles" description="Register vehicles and check their live status" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <h2 className="font-semibold text-foreground mb-4">Register vehicle</h2>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <Label>Vehicle number</Label>
              <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="KA-01-AB-1234" />
            </div>
            <div>
              <Label>Driver name</Label>
              <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Rajesh Kumar" />
            </div>
            <div>
              <Label>Vehicle type</Label>
              <Input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="truck" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919845012345" />
            </div>

            {submitError && <ErrorBanner message={submitError} />}
            {submitSuccess && <SuccessBanner message={submitSuccess} />}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Spinner />} Register vehicle
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <h2 className="font-semibold text-foreground px-5 pt-5 pb-3">Registered vehicles</h2>
          {loading ? (
            <div className="px-5 pb-5 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : loadError ? (
            <div className="px-5 pb-5">
              <ErrorBanner message={loadError} />
            </div>
          ) : vehicles.length === 0 ? (
            <EmptyState icon={Truck} message="No vehicles registered yet." />
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wide border-b border-border/60">
                    <th className="py-2.5 px-5">Vehicle</th>
                    <th className="py-2.5 pr-2">Driver</th>
                    <th className="py-2.5 pr-2">Type</th>
                    <th className="py-2.5 pr-2">Phone</th>
                    <th className="py-2.5 pr-2">Status</th>
                    <th className="py-2.5 pr-5"></th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v, i) => (
                    <motion.tr
                      key={v.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 shrink-0">
                            <Truck className="h-4 w-4" />
                          </span>
                          <span className="font-medium text-foreground">{v.vehicle_number}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-foreground/80">{v.driver_name}</td>
                      <td className="py-3 pr-2 text-foreground/80 capitalize">{v.vehicle_type}</td>
                      <td className="py-3 pr-2 text-muted-foreground">{v.phone}</td>
                      <td className="py-3 pr-2">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="py-3 pr-5 text-right">
                        <button
                          onClick={() => viewLocation(v.id)}
                          className="inline-flex items-center gap-1 text-primary hover:opacity-80 text-xs font-medium"
                        >
                          <MapPinCheck className="h-3.5 w-3.5" /> Location
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedId && (
            <div className="mx-5 mb-5 mt-1 rounded-xl bg-muted/50 border border-border/60 p-4">
              <h3 className="font-medium text-foreground mb-2 text-sm">Current status</h3>
              {locationLoading ? (
                <Spinner />
              ) : locationError ? (
                <ErrorBanner message={locationError} />
              ) : selectedLocation ? (
                <div className="text-sm space-y-1.5">
                  <div>
                    <span className="text-muted-foreground">Vehicle:</span>{' '}
                    <span className="font-medium text-foreground">{selectedLocation.vehicle_number}</span>
                  </div>
                  {selectedLocation.current_location ? (
                    <div>
                      <span className="text-muted-foreground">Location:</span>{' '}
                      {selectedLocation.current_location.latitude.toFixed(5)},{' '}
                      {selectedLocation.current_location.longitude.toFixed(5)} at{' '}
                      {new Date(selectedLocation.current_location.timestamp).toLocaleString()}
                    </div>
                  ) : (
                    <div className="text-muted-foreground/70">No location reported yet.</div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Inside geofences:</span>{' '}
                    {selectedLocation.current_geofences.length === 0 ? (
                      <span className="text-muted-foreground/70">none</span>
                    ) : (
                      <span className="inline-flex flex-wrap gap-1.5 align-middle">
                        {selectedLocation.current_geofences.map((g) => (
                          <span key={g.geofence_id} className="inline-flex items-center gap-1">
                            {g.geofence_name} <CategoryBadge category={g.category} />
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
