export type GeofenceCategory = 'delivery_zone' | 'restricted_zone' | 'toll_zone' | 'customer_area'
export type EventType = 'entry' | 'exit' | 'both'
export type ViolationEventType = 'entry' | 'exit'

// [latitude, longitude]
export type LatLng = [number, number]

export interface Geofence {
  id: string
  name: string
  description: string
  coordinates: LatLng[]
  category: GeofenceCategory
  created_at: string
}

export interface CreateGeofenceRequest {
  name: string
  description: string
  coordinates: LatLng[]
  category: GeofenceCategory
}

export interface Vehicle {
  id: string
  vehicle_number: string
  driver_name: string
  vehicle_type: string
  phone: string
  status: string
  created_at: string
}

export interface CreateVehicleRequest {
  vehicle_number: string
  driver_name: string
  vehicle_type: string
  phone: string
}

export interface CurrentGeofenceStatus {
  geofence_id: string
  geofence_name: string
  status: 'inside'
}

export interface LocationUpdateRequest {
  vehicle_id: string
  latitude: number
  longitude: number
  timestamp: string
}

export interface LocationUpdateResponse {
  vehicle_id: string
  location_updated: boolean
  current_geofences: CurrentGeofenceStatus[]
  time_ns: string
}

export interface GeofenceStatus {
  geofence_id: string
  geofence_name: string
  category: GeofenceCategory
}

export interface VehicleLocationResponse {
  vehicle_id: string
  vehicle_number: string
  current_location: { latitude: number; longitude: number; timestamp: string } | null
  current_geofences: GeofenceStatus[]
  time_ns: string
}

export interface AlertConfigRequest {
  geofence_id: string
  vehicle_id?: string | null
  event_type: EventType
}

export interface AlertConfig {
  alert_id: string
  geofence_id: string
  geofence_name: string
  vehicle_id?: string
  vehicle_number?: string
  event_type: EventType
  status: string
  created_at: string
}

export interface Violation {
  id: string
  vehicle_id: string
  vehicle_number: string
  geofence_id: string
  geofence_name: string
  event_type: ViolationEventType
  latitude: number
  longitude: number
  timestamp: string
}

export interface ViolationHistoryFilter {
  vehicle_id?: string
  geofence_id?: string
  start_date?: string
  end_date?: string
  limit?: number
}

// Real-time payload delivered over /ws/alerts
export interface AlertEvent {
  event_id: string
  event_type: ViolationEventType
  timestamp: string
  vehicle: {
    vehicle_id: string
    vehicle_number: string
    driver_name: string
  }
  geofence: {
    geofence_id: string
    geofence_name: string
    category: GeofenceCategory
  }
  location: {
    latitude: number
    longitude: number
  }
}
