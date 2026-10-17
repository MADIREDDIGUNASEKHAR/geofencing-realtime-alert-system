import L from 'leaflet'
import { MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import type { Geofence, LatLng } from '../api/types'

const CATEGORY_COLORS: Record<string, string> = {
  delivery_zone: '#2563eb',
  restricted_zone: '#dc2626',
  toll_zone: '#d97706',
  customer_area: '#16a34a',
}

// A small custom pin (instead of Leaflet's default marker) so vehicles read
// clearly against colored geofence polygons on the map. The pulsing ring
// behind it reads as "live tracking" rather than a static placemark.
const vehicleIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:30px;height:30px;">
    <span class="marker-pulse-ring" style="background:#4338ca;"></span>
    <div style="
      position:relative;width:30px;height:30px;border-radius:9999px;
      background:linear-gradient(135deg,#6366f1,#4338ca);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 10px rgba(67,56,202,0.5);border:2.5px solid white;
      font-size:14px;line-height:1;
    ">🚚</div>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
})

const pickedPointIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:22px;height:22px;border-radius:9999px;
    background:#111827;border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export interface VehicleMarker {
  id: string
  vehicleNumber: string
  driverName: string
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
        attribution="&copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
        maxNativeZoom={16}
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
        maxNativeZoom={16}
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
          eventHandlers={{
            // Leaflet stops a vector layer's click from reaching the map's
            // own click handler, so forward it manually — otherwise picking
            // a location or drawing a boundary point on top of an existing
            // geofence silently does nothing but open its popup.
            click: (e) => onMapClick?.(e.latlng.lat, e.latlng.lng),
          }}
        >
          <Popup>
            <div className="text-sm min-w-[170px] -m-1">
              <div
                className="h-1 -mt-1 -mx-1 mb-2 rounded-t"
                style={{ background: CATEGORY_COLORS[g.category] ?? '#6b7280' }}
              />
              <div className="font-semibold text-gray-900">{g.name}</div>
              <div className="text-gray-400 text-xs capitalize mt-0.5">{g.category.replace(/_/g, ' ')}</div>
              {g.description && <div className="mt-1.5 text-gray-600">{g.description}</div>}
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
        <Marker key={`draw-${i}`} position={p} icon={pickedPointIcon} />
      ))}

      {vehicles.map((v) => (
        <Marker key={v.id} position={[v.lat, v.lng]} icon={vehicleIcon}>
          <Popup>
            <div className="text-sm min-w-[140px]">
              <div className="font-semibold text-gray-900">{v.vehicleNumber}</div>
              <div className="text-gray-500 text-xs mt-0.5">{v.driverName}</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {pickedPoint && <Marker position={pickedPoint} icon={pickedPointIcon} />}
    </MapContainer>
  )
}
