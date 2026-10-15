import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, createVehicle, getVehicleLocation, listVehicles } from '../api/client'
import type { Vehicle, VehicleLocationResponse } from '../api/types'
import { Button, Card, CategoryBadge, EmptyState, ErrorBanner, Input, Label, Spinner, SuccessBanner } from '../components/ui'

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <h2 className="font-semibold text-gray-900 mb-3">Register vehicle</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Vehicle number</Label>
            <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="KA-01-AB-1234" />
          </div>
          <div>
            <Label>Driver name</Label>
            <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="John Doe" />
          </div>
          <div>
            <Label>Vehicle type</Label>
            <Input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="truck" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" />
          </div>

          {submitError && <ErrorBanner message={submitError} />}
          {submitSuccess && <SuccessBanner message={submitSuccess} />}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Spinner />} Register vehicle
          </Button>
        </form>
      </Card>

      <Card className="lg:col-span-2">
        <h2 className="font-semibold text-gray-900 mb-3">Registered vehicles</h2>
        {loading ? (
          <div className="flex justify-center py-6 text-gray-400">
            <Spinner />
          </div>
        ) : loadError ? (
          <ErrorBanner message={loadError} />
        ) : vehicles.length === 0 ? (
          <EmptyState message="No vehicles registered yet." />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-2">Vehicle #</th>
                  <th className="py-2 pr-2">Driver</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2">Phone</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-2 font-medium text-gray-900">{v.vehicle_number}</td>
                    <td className="py-2 pr-2">{v.driver_name}</td>
                    <td className="py-2 pr-2">{v.vehicle_type}</td>
                    <td className="py-2 pr-2">{v.phone}</td>
                    <td className="py-2 pr-2">
                      <span className="inline-block rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">{v.status}</span>
                    </td>
                    <td className="py-2">
                      <button onClick={() => viewLocation(v.id)} className="text-blue-600 hover:underline text-xs">
                        View location
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedId && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h3 className="font-medium text-gray-900 mb-2">Current status</h3>
            {locationLoading ? (
              <Spinner />
            ) : locationError ? (
              <ErrorBanner message={locationError} />
            ) : selectedLocation ? (
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-gray-500">Vehicle:</span> {selectedLocation.vehicle_number}
                </div>
                {selectedLocation.current_location ? (
                  <div>
                    <span className="text-gray-500">Location:</span> {selectedLocation.current_location.latitude.toFixed(5)},{' '}
                    {selectedLocation.current_location.longitude.toFixed(5)} at{' '}
                    {new Date(selectedLocation.current_location.timestamp).toLocaleString()}
                  </div>
                ) : (
                  <div className="text-gray-400">No location reported yet.</div>
                )}
                <div>
                  <span className="text-gray-500">Inside geofences:</span>{' '}
                  {selectedLocation.current_geofences.length === 0 ? (
                    <span className="text-gray-400">none</span>
                  ) : (
                    <span className="inline-flex flex-wrap gap-1 align-middle">
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
  )
}
