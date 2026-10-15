# --- build stage ---
FROM golang:1.22-alpine AS build
WORKDIR /src

COPY go.mod ./
RUN go mod download 2>/dev/null || true

COPY . .
RUN go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/server ./cmd/api

# --- runtime stage ---
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /out/server ./server

EXPOSE 8080
ENTRYPOINT ["./server"]
