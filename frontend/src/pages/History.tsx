import { useEffect, useState } from 'react'
import { ApiError, getViolationHistory, listGeofences, listVehicles } from '../api/client'
import type { Geofence, Vehicle, Violation } from '../api/types'
import { Card, EmptyState, ErrorBanner, EventTypeBadge, Input, Label, Select, SecondaryButton, Spinner } from '../components/ui'

const PAGE_SIZE = 25

export default function History() {
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [vehicleId, setVehicleId] = useState('')
  const [geofenceId, setGeofenceId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    async function loadFilters() {
      try {
        const [g, v] = await Promise.all([listGeofences(), listVehicles()])
        setGeofences(g.geofences ?? [])
        setVehicles(v.vehicles ?? [])
      } catch {
        // non-fatal: filters stay empty, history query can still run
      }
    }
    loadFilters()
  }, [])

  async function load(currentLimit: number) {
    setLoading(true)
    setError(null)
    try {
      const res = await getViolationHistory({
        vehicle_id: vehicleId || undefined,
        geofence_id: geofenceId || undefined,
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
        limit: currentLimit,
      })
      setViolations(res.violations ?? [])
      setTotalCount(res.total_count ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load violation history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(limit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, geofenceId, startDate, endDate])

  function applyFilters() {
    setLimit(PAGE_SIZE)
    load(PAGE_SIZE)
  }

  function loadMore() {
    const next = limit + PAGE_SIZE
    setLimit(next)
    load(next)
  }

  return (
    <Card>
      <h2 className="font-semibold text-gray-900 mb-3">Violation history</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div>
          <Label>Vehicle</Label>
          <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">All vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vehicle_number}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Geofence</Label>
          <Select value={geofenceId} onChange={(e) => setGeofenceId(e.target.value)}>
            <option value="">All geofences</option>
            {geofences.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Start date</Label>
          <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label>End date</Label>
          <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <SecondaryButton type="button" onClick={applyFilters} className="w-full">
            Apply filters
          </SecondaryButton>
        </div>
      </div>

      {loading && violations.length === 0 ? (
        <div className="flex justify-center py-6 text-gray-400">
          <Spinner />
        </div>
      ) : error ? (
        <ErrorBanner message={error} />
      ) : violations.length === 0 ? (
        <EmptyState message="No violations recorded for the selected filters." />
      ) : (
        <>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-2">Time</th>
                  <th className="py-2 pr-2">Vehicle</th>
                  <th className="py-2 pr-2">Geofence</th>
                  <th className="py-2 pr-2">Event</th>
                  <th className="py-2 pr-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100">
                    <td className="py-2 pr-2 whitespace-nowrap">{new Date(v.timestamp).toLocaleString()}</td>
                    <td className="py-2 pr-2">{v.vehicle_number}</td>
                    <td className="py-2 pr-2">{v.geofence_name}</td>
                    <td className="py-2 pr-2">
                      <EventTypeBadge eventType={v.event_type} />
                    </td>
                    <td className="py-2 pr-2 text-gray-500">
                      {v.latitude.toFixed(5)}, {v.longitude.toFixed(5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>
              Showing {violations.length} of {totalCount}
            </span>
            {violations.length < totalCount && (
              <SecondaryButton type="button" onClick={loadMore} disabled={loading}>
                {loading && <Spinner />} Load more
              </SecondaryButton>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
