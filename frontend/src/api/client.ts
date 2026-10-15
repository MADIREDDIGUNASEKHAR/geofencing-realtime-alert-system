import type {
  AlertConfig,
  AlertConfigRequest,
  CreateGeofenceRequest,
  CreateVehicleRequest,
  Geofence,
  LocationUpdateRequest,
  LocationUpdateResponse,
  Vehicle,
  VehicleLocationResponse,
  Violation,
  ViolationHistoryFilter,
} from './types'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080'

export const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ?? API_BASE_URL.replace(/^http/, 'ws') + '/ws/alerts'

const apiKey = import.meta.env.VITE_API_KEY as string | undefined

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(apiKey ? { 'X-API-Key': apiKey } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0, 'Could not reach the API. Is the backend running?')
  }

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? `Request failed with status ${res.status}`)
  }
  return body as T
}

function qs(params: object): string {
  const entries = Object.entries(params as Record<string, string | number | undefined>).filter(
    ([, v]) => v !== undefined && v !== '',
  )
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}

// --- Geofences ---

export function createGeofence(req: CreateGeofenceRequest) {
  return request<{ id: string; name: string; status: string }>('/geofences', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export function listGeofences(category?: string) {
  return request<{ geofences: Geofence[] }>(`/geofences${qs({ category })}`)
}

// --- Vehicles ---

export function createVehicle(req: CreateVehicleRequest) {
  return request<{ id: string; vehicle_number: string; status: string }>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export function listVehicles() {
  return request<{ vehicles: Vehicle[] }>('/vehicles')
}

// --- Location ---

export function updateVehicleLocation(req: LocationUpdateRequest) {
  return request<LocationUpdateResponse>('/vehicles/location', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export function getVehicleLocation(vehicleId: string) {
  return request<VehicleLocationResponse>(`/vehicles/location/${encodeURIComponent(vehicleId)}`)
}

// --- Alerts ---

export function configureAlert(req: AlertConfigRequest) {
  return request<AlertConfig>('/alerts/configure', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export function listAlerts(filter: { geofence_id?: string; vehicle_id?: string } = {}) {
  return request<{ alerts: AlertConfig[] }>(`/alerts${qs(filter)}`)
}

// --- Violations ---

export function getViolationHistory(filter: ViolationHistoryFilter = {}) {
  return request<{ violations: Violation[]; total_count: number }>(`/violations/history${qs(filter)}`)
}
