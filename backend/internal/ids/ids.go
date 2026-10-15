// Package ids generates short, prefixed, unique public identifiers
// (e.g. "geo_4e1b2c3d9f0a") so resource types stay self-describing in logs,
// URLs and alert payloads without leaking sequential database IDs.
package ids

import (
	"crypto/rand"
	"encoding/hex"
)

func New(prefix string) string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return prefix + "_" + hex.EncodeToString(b)
}
