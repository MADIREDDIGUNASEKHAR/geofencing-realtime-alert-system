import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Clock, History as HistoryIcon } from 'lucide-react'
import { ApiError, getViolationHistory, listGeofences, listVehicles } from '../api/client'
import type { Geofence, Vehicle, Violation } from '../api/types'
import {
  Card,
  EmptyState,
  ErrorBanner,
  EventTypeBadge,
  Input,
  Label,
  PageHeader,
  SelectField,
  SecondaryButton,
  Spinner,
} from '../components/ui'

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
    <div>
      <PageHeader icon={HistoryIcon} title="History" description="Every recorded geofence entry and exit event" />

      <Card className="!p-0 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-5 border-b border-border/60">
          <div>
            <Label>Vehicle</Label>
            <SelectField
              value={vehicleId}
              onValueChange={setVehicleId}
              placeholder="All vehicles"
              options={[{ value: '', label: 'All vehicles' }, ...vehicles.map((v) => ({ value: v.id, label: v.vehicle_number }))]}
            />
          </div>
          <div>
            <Label>Geofence</Label>
            <SelectField
              value={geofenceId}
              onValueChange={setGeofenceId}
              placeholder="All geofences"
              options={[{ value: '', label: 'All geofences' }, ...geofences.map((g) => ({ value: g.id, label: g.name }))]}
            />
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
          <div className="flex justify-center py-8 text-muted-foreground">
            <Spinner />
          </div>
        ) : error ? (
          <div className="p-5">
            <ErrorBanner message={error} />
          </div>
        ) : violations.length === 0 ? (
          <EmptyState icon={HistoryIcon} message="No violations recorded for the selected filters." />
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wide border-b border-border/60">
                    <th className="py-2.5 px-5">Time</th>
                    <th className="py-2.5 pr-2">Vehicle</th>
                    <th className="py-2.5 pr-2">Geofence</th>
                    <th className="py-2.5 pr-2">Event</th>
                    <th className="py-2.5 pr-5">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v, i) => (
                    <motion.tr
                      key={v.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.025 }}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-3 px-5 whitespace-nowrap text-foreground/80">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                          {new Date(v.timestamp).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 pr-2 font-medium text-foreground">{v.vehicle_number}</td>
                      <td className="py-3 pr-2 text-foreground/80">{v.geofence_name}</td>
                      <td className="py-3 pr-2">
                        <EventTypeBadge eventType={v.event_type} />
                      </td>
                      <td className="py-3 pr-5 text-muted-foreground font-mono text-xs">
                        {v.latitude.toFixed(5)}, {v.longitude.toFixed(5)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-border/60 text-xs text-muted-foreground">
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
    </div>
  )
}
