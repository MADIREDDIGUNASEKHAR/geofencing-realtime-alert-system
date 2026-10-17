import { useEffect, useState, type FormEvent } from 'react'
import { Hexagon, MapPin } from 'lucide-react'
import MapView from '../components/MapView'
import { ApiError, createGeofence, listGeofences } from '../api/client'
import type { Geofence, GeofenceCategory, LatLng } from '../api/types'
import {
  Button,
  Card,
  CategoryBadge,
  EmptyState,
  ErrorBanner,
  Input,
  Label,
  PageHeader,
  Select,
  Spinner,
  SuccessBanner,
  Textarea,
} from '../components/ui'

const CATEGORIES: GeofenceCategory[] = ['delivery_zone', 'restricted_zone', 'toll_zone', 'customer_area']

export default function Geofences() {
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GeofenceCategory>('delivery_zone')
  const [drawPoints, setDrawPoints] = useState<LatLng[]>([])
  const [pastedCoords, setPastedCoords] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  async function load(category?: string) {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await listGeofences(category)
      setGeofences(res.geofences ?? [])
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load geofences')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(filterCategory || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory])

  function handleMapClick(lat: number, lng: number) {
    setDrawPoints((prev) => [...prev, [lat, lng]])
  }

  function undoLastPoint() {
    setDrawPoints((prev) => prev.slice(0, -1))
  }

  function clearDrawing() {
    setDrawPoints([])
    setPastedCoords('')
  }

  function applyPastedCoords() {
    try {
      const parsed = JSON.parse(pastedCoords)
      if (!Array.isArray(parsed)) throw new Error('not an array')
      const points: LatLng[] = parsed.map((p: unknown) => {
        if (!Array.isArray(p) || p.length !== 2) throw new Error('each entry must be [lat, lng]')
        return [Number(p[0]), Number(p[1])]
      })
      setDrawPoints(points)
      setSubmitError(null)
    } catch {
      setSubmitError('Could not parse coordinates. Expected JSON like [[37.77,-122.42],[37.78,-122.42]]')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)

    if (!name.trim()) {
      setSubmitError('Name is required')
      return
    }
    if (drawPoints.length < 3) {
      setSubmitError('Draw at least 3 points on the map (or paste coordinates) to form a polygon')
      return
    }

    const closed = [...drawPoints, drawPoints[0]]

    setSubmitting(true)
    try {
      const res = await createGeofence({ name, description, category, coordinates: closed })
      setSubmitSuccess(`Geofence "${res.name}" created`)
      setName('')
      setDescription('')
      clearDrawing()
      load(filterCategory || undefined)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Failed to create geofence')
    } finally {
      setSubmitting(false)
    }
  }

  const mapCenter: LatLng | undefined = geofences[0]?.coordinates[0]

  return (
    <div>
      <PageHeader icon={Hexagon} title="Geofences" description="Draw boundaries and manage zone categories" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-5">
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Create geofence</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Downtown Delivery Zone" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional details" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value as GeofenceCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Boundary points ({drawPoints.length})</Label>
              <p className="text-xs text-gray-500 mb-2">Click the map to add points, in order, around the boundary. At least 3 points are required.</p>
              {drawPoints.length > 0 && (
                <ul className="text-xs text-gray-600 mb-2 max-h-24 overflow-auto space-y-0.5">
                  {drawPoints.map((p, i) => (
                    <li key={i}>
                      {i + 1}. {p[0].toFixed(5)}, {p[1].toFixed(5)}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <SecondaryButtonSmall onClick={undoLastPoint} disabled={drawPoints.length === 0} label="Undo point" />
                <SecondaryButtonSmall onClick={clearDrawing} disabled={drawPoints.length === 0} label="Clear" />
              </div>
            </div>

            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer select-none">Or paste coordinates as JSON</summary>
              <div className="mt-2 space-y-2">
                <Textarea
                  value={pastedCoords}
                  onChange={(e) => setPastedCoords(e.target.value)}
                  rows={3}
                  placeholder="[[37.7749,-122.4194],[37.7849,-122.4194],[37.7849,-122.4094]]"
                />
                <SecondaryButtonSmall onClick={applyPastedCoords} disabled={!pastedCoords.trim()} label="Use these coordinates" />
              </div>
            </details>

            {submitError && <ErrorBanner message={submitError} />}
            {submitSuccess && <SuccessBanner message={submitSuccess} />}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Spinner />} Create geofence
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Geofences</h2>
            <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-40 !py-1.5 text-xs">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>
          {loading ? (
            <div className="flex justify-center py-6 text-gray-400">
              <Spinner />
            </div>
          ) : loadError ? (
            <ErrorBanner message={loadError} />
          ) : geofences.length === 0 ? (
            <EmptyState icon={Hexagon} message="No geofences yet. Create one to get started." />
          ) : (
            <ul className="space-y-2 max-h-96 overflow-auto">
              {geofences.map((g) => (
                <li
                  key={g.id}
                  className="flex gap-3 border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors"
                >
                  <span className="flex items-center justify-center h-8 w-8 shrink-0 rounded-lg bg-gray-50 text-gray-400">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-gray-900 truncate">{g.name}</span>
                      <CategoryBadge category={g.category} />
                    </div>
                    {g.description && <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">{g.coordinates.length} points</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

        <div className="lg:col-span-2 h-[640px] rounded-2xl overflow-hidden border border-gray-100 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)]">
          <MapView geofences={geofences} center={mapCenter} drawPoints={drawPoints} onMapClick={handleMapClick} />
        </div>
      </div>
    </div>
  )
}

function SecondaryButtonSmall({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  )
}
