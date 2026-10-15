// Package pagination parses and applies optional limit/offset query
// parameters shared by every list endpoint. Both are opt-in: omitting them
// preserves a resource's original, unpaginated response.
package pagination

import (
	"fmt"
	"strconv"
)

type Params struct {
	Limit  int
	Offset int
}

// Apply appends LIMIT/OFFSET clauses (only for values > 0) to query using
// positional parameters, returning the updated query and args slice.
func (p Params) Apply(query string, args []interface{}) (string, []interface{}) {
	if p.Limit > 0 {
		args = append(args, p.Limit)
		query += fmt.Sprintf(" LIMIT $%d", len(args))
	}
	if p.Offset > 0 {
		args = append(args, p.Offset)
		query += fmt.Sprintf(" OFFSET $%d", len(args))
	}
	return query, args
}

// Parse reads "limit"/"offset" query string values. An empty string leaves
// the corresponding field unset (0). A non-empty, invalid value is reported
// via the returned message so the caller can respond with 400.
func Parse(limitRaw, offsetRaw string) (Params, string) {
	var p Params
	if limitRaw != "" {
		v, err := strconv.Atoi(limitRaw)
		if err != nil || v < 1 {
			return Params{}, "limit must be a positive integer"
		}
		p.Limit = v
	}
	if offsetRaw != "" {
		v, err := strconv.Atoi(offsetRaw)
		if err != nil || v < 0 {
			return Params{}, "offset must be a non-negative integer"
		}
		p.Offset = v
	}
	return p, ""
}
