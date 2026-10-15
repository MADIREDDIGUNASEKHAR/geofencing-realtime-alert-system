package geo

import "testing"

func TestValidatePolygon(t *testing.T) {
	square := [][2]float64{
		{37.7749, -122.4194},
		{37.7849, -122.4194},
		{37.7849, -122.4094},
		{37.7749, -122.4094}, // not closed: differs from first point
	}
	if err := ValidatePolygon(square); err == nil {
		t.Fatal("expected error for unclosed polygon, got nil")
	}

	closed := [][2]float64{
		{37.7749, -122.4194},
		{37.7849, -122.4194},
		{37.7849, -122.4094},
		{37.7749, -122.4094},
		{37.7749, -122.4194},
	}
	if err := ValidatePolygon(closed); err != nil {
		t.Fatalf("expected valid polygon, got error: %v", err)
	}

	tooFewPoints := [][2]float64{{0, 0}, {1, 1}, {0, 0}}
	if err := ValidatePolygon(tooFewPoints); err == nil {
		t.Fatal("expected error for fewer than 4 points, got nil")
	}

	badLat := [][2]float64{{91, 0}, {1, 1}, {2, 2}, {91, 0}}
	if err := ValidatePolygon(badLat); err == nil {
		t.Fatal("expected error for out-of-range latitude, got nil")
	}

	badLng := [][2]float64{{0, 181}, {1, 1}, {2, 2}, {0, 181}}
	if err := ValidatePolygon(badLng); err == nil {
		t.Fatal("expected error for out-of-range longitude, got nil")
	}
}

func TestPolygonWKT(t *testing.T) {
	coords := [][2]float64{
		{37.7749, -122.4194},
		{37.7849, -122.4194},
		{37.7849, -122.4094},
		{37.7749, -122.4194},
	}
	got := PolygonWKT(coords)
	want := "POLYGON((-122.4194 37.7749, -122.4194 37.7849, -122.4094 37.7849, -122.4194 37.7749))"
	if got != want {
		t.Fatalf("PolygonWKT mismatch:\n got:  %s\n want: %s", got, want)
	}
}
