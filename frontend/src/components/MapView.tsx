import { MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import type { Geofence, LatLng } from '../api/types'

const CATEGORY_COLORS: Record<string, string> = {
  delivery_zone: '#2563eb',
  restricted_zone: '#dc2626',
  toll_zone: '#d97706',
  customer_area: '#16a34a',
}

export interface VehicleMarker {
  id: string
  label: string
  lat: number
  lng: number
}

interface MapViewProps {
  geofences?: Geofence[]
  vehicles?: VehicleMarker[]
  center?: LatLng
  zoom?: number
  onMapClick?: (lat: number, lng: number) => void
  drawPoints?: LatLng[]
  pickedPoint?: LatLng | null
  highlightGeofenceId?: string | null
}

function ClickCapture({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function MapView({
  geofences = [],
  vehicles = [],
  center = [12.9716, 77.5946], // Bangalore, used only when there's no geofence/vehicle data yet
  zoom = 13,
  onMapClick,
  drawPoints = [],
  pickedPoint = null,
  highlightGeofenceId = null,
}: MapViewProps) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickCapture onClick={onMapClick} />

      {geofences.map((g) => (
        <Polygon
          key={g.id}
          positions={g.coordinates}
          pathOptions={{
            color: CATEGORY_COLORS[g.category] ?? '#6b7280',
            weight: g.id === highlightGeofenceId ? 4 : 2,
            fillOpacity: g.id === highlightGeofenceId ? 0.3 : 0.15,
          }}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{g.name}</div>
              <div className="text-gray-500">{g.category.replace(/_/g, ' ')}</div>
              {g.description && <div className="mt-1">{g.description}</div>}
            </div>
          </Popup>
        </Polygon>
      ))}

      {drawPoints.length > 0 && (
        <Polyline
          positions={drawPoints.length > 2 ? [...drawPoints, drawPoints[0]] : drawPoints}
          pathOptions={{ color: '#111827', dashArray: '6 6', weight: 2 }}
        />
      )}
      {drawPoints.map((p, i) => (
        <Marker key={`draw-${i}`} position={p} />
      ))}

      {vehicles.map((v) => (
        <Marker key={v.id} position={[v.lat, v.lng]}>
          <Popup>{v.label}</Popup>
        </Marker>
      ))}

      {pickedPoint && <Marker position={pickedPoint} />}
    </MapContainer>
  )
}
