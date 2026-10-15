// Package geo validates geofence polygons and converts them to WKT for
// PostGIS, which performs the actual point-in-polygon containment checks
// (ST_Covers against a GIST-indexed GEOGRAPHY column) so lookups stay fast
// as the number of geofences grows.
package geo

import (
	"errors"
	"fmt"
	"strings"
)

// ValidatePolygon enforces the API's polygon rules: at least 3 unique
// vertices plus a closing point identical to the first, and all coordinates
// within valid latitude/longitude ranges.
func ValidatePolygon(coords [][2]float64) error {
	if len(coords) < 4 {
		return errors.New("coordinates must contain at least 4 points (3 unique vertices plus a closing point)")
	}
	first, last := coords[0], coords[len(coords)-1]
	if first[0] != last[0] || first[1] != last[1] {
		return errors.New("first and last coordinates must be identical (closed polygon)")
	}
	for _, c := range coords {
		lat, lng := c[0], c[1]
		if lat < -90 || lat > 90 {
			return fmt.Errorf("latitude %v out of range (-90 to 90)", lat)
		}
		if lng < -180 || lng > 180 {
			return fmt.Errorf("longitude %v out of range (-180 to 180)", lng)
		}
	}
	return nil
}

// PolygonWKT renders [lat,lng] pairs as a PostGIS WKT POLYGON, which expects
// coordinates in (X Y) = (longitude latitude) order.
func PolygonWKT(coords [][2]float64) string {
	parts := make([]string, len(coords))
	for i, c := range coords {
		lat, lng := c[0], c[1]
		parts[i] = fmt.Sprintf("%g %g", lng, lat)
	}
	return "POLYGON((" + strings.Join(parts, ", ") + "))"
}
