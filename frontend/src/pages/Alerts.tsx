import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, configureAlert, getAlertHistory, listAlerts, listGeofences, listVehicles } from '../api/client'
import type { AlertConfig, AlertLogEntry, EventType, Geofence, Vehicle } from '../api/types'
import {
  Button,
  Card,
  CategoryBadge,
  EmptyState,
  ErrorBanner,
  EventTypeBadge,
  Label,
  Select,
  Spinner,
  SuccessBanner,
} from '../components/ui'

export default function Alerts() {
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [alerts, setAlerts] = useState<AlertConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [geofenceId, setGeofenceId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [eventType, setEventType] = useState<EventType>('entry')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const [filterGeofence, setFilterGeofence] = useState('')
  const [filterVehicle, setFilterVehicle] = useState('')

  const [alertLog, setAlertLog] = useState<AlertLogEntry[]>([])
  const [logTotalCount, setLogTotalCount] = useState(0)
  const [logLoading, setLogLoading] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)

  async function loadAlerts() {
    try {
      const res = await listAlerts({ geofence_id: filterGeofence || undefined, vehicle_id: filterVehicle || undefined })
      setAlerts(res.alerts ?? [])
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load alerts')
    }
  }

  async function loadAlertLog() {
    setLogLoading(true)
    setLogError(null)
    try {
      const res = await getAlertHistory({ geofence_id: filterGeofence || undefined, vehicle_id: filterVehicle || undefined })
      setAlertLog(res.alerts ?? [])
      setLogTotalCount(res.total_count ?? 0)
    } catch (err) {
      setLogError(err instanceof ApiError ? err.message : 'Failed to load dispatched alerts')
    } finally {
      setLogLoading(false)
    }
  }

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      setLoadError(null)
      try {
        const [g, v] = await Promise.all([listGeofences(), listVehicles()])
        setGeofences(g.geofences ?? [])
        setVehicles(v.vehicles ?? [])
        await loadAlerts()
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
    loadAlertLog()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadAlerts()
    loadAlertLog()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterGeofence, filterVehicle])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)

    if (!geofenceId) {
      setSubmitError('Select a geofence')
      return
    }

    setSubmitting(true)
    try {
      await configureAlert({ geofence_id: geofenceId, vehicle_id: vehicleId || null, event_type: eventType })
      setSubmitSuccess('Alert rule configured')
      setVehicleId('')
      loadAlerts()
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Failed to configure alert')
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <h2 className="font-semibold text-gray-900 mb-3">Configure alert rule</h2>
        {geofences.length === 0 ? (
          <EmptyState message="Create a geofence first on the Geofences page." />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Geofence</Label>
              <Select value={geofenceId} onChange={(e) => setGeofenceId(e.target.value)}>
                <option value="">Select a geofence…</option>
                {geofences.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.category.replace(/_/g, ' ')})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Vehicle (optional — leave blank for all vehicles)</Label>
              <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">All vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} — {v.driver_name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Event type</Label>
              <Select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
                <option value="entry">Entry</option>
                <option value="exit">Exit</option>
                <option value="both">Both</option>
              </Select>
            </div>

            {submitError && <ErrorBanner message={submitError} />}
            {submitSuccess && <SuccessBanner message={submitSuccess} />}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Spinner />} Configure alert
            </Button>
          </form>
        )}
      </Card>

      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="font-semibold text-gray-900">Configured alerts</h2>
          <div className="flex gap-2">
            <Select value={filterGeofence} onChange={(e) => setFilterGeofence(e.target.value)} className="w-44">
              <option value="">All geofences</option>
              {geofences.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
            <Select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)} className="w-44">
              <option value="">All vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {loadError ? (
          <ErrorBanner message={loadError} />
        ) : alerts.length === 0 ? (
          <EmptyState message="No alert rules configured yet." />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-2">Geofence</th>
                  <th className="py-2 pr-2">Vehicle</th>
                  <th className="py-2 pr-2">Event</th>
                  <th className="py-2 pr-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.alert_id} className="border-b border-gray-100">
                    <td className="py-2 pr-2">
                      {a.geofence_name} <CategoryBadge category={geofences.find((g) => g.id === a.geofence_id)?.category ?? ''} />
                    </td>
                    <td className="py-2 pr-2">{a.vehicle_number ?? <span className="text-gray-400">all vehicles</span>}</td>
                    <td className="py-2 pr-2">
                      <EventTypeBadge eventType={a.event_type} />
                    </td>
                    <td className="py-2 pr-2">
                      <span className="inline-block rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="lg:col-span-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900">Alert log</h2>
          {logLoading && <Spinner className="text-gray-400" />}
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Every alert actually dispatched over the real-time channel, so you can catch up on anything missed while
          disconnected. Uses the same filters as above.
        </p>

        {logError ? (
          <ErrorBanner message={logError} />
        ) : alertLog.length === 0 ? (
          <EmptyState message="No alerts have been dispatched yet." />
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-2">Delivered</th>
                    <th className="py-2 pr-2">Vehicle</th>
                    <th className="py-2 pr-2">Geofence</th>
                    <th className="py-2 pr-2">Event</th>
                    <th className="py-2 pr-2">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {alertLog.map((a) => (
                    <tr key={a.id} className="border-b border-gray-100">
                      <td className="py-2 pr-2 whitespace-nowrap">{new Date(a.delivered_at).toLocaleString()}</td>
                      <td className="py-2 pr-2">
                        {a.vehicle.vehicle_number} <span className="text-gray-400">({a.vehicle.driver_name})</span>
                      </td>
                      <td className="py-2 pr-2">
                        {a.geofence.geofence_name} <CategoryBadge category={a.geofence.category} />
                      </td>
                      <td className="py-2 pr-2">
                        <EventTypeBadge eventType={a.event_type} />
                      </td>
                      <td className="py-2 pr-2 text-gray-500">
                        {a.location.latitude.toFixed(5)}, {a.location.longitude.toFixed(5)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Showing {alertLog.length} of {logTotalCount}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
