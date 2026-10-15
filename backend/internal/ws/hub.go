// Package ws implements the /ws/alerts real-time channel: a small hub that
// fans out alert events to every connected client, independent of how many
// clients are connected or when they joined.
package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Dashboards may be served from a different origin (e.g. Vercel) than
	// the API, so origin checking is intentionally permissive here; lock
	// this down to known frontend origins before production use.
	CheckOrigin: func(r *http.Request) bool { return true },
}

type client struct {
	conn *websocket.Conn
	send chan []byte
}

type Hub struct {
	mu         sync.RWMutex
	clients    map[*client]struct{}
	register   chan *client
	unregister chan *client
	broadcast  chan []byte
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*client]struct{}),
		register:   make(chan *client),
		unregister: make(chan *client),
		broadcast:  make(chan []byte, 256),
	}
}

// Run drives the hub's event loop and must be started in its own goroutine.
func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			h.clients[c] = struct{}{}
			h.mu.Unlock()

		case c := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[c]; ok {
				delete(h.clients, c)
				close(c.send)
			}
			h.mu.Unlock()

		case msg := <-h.broadcast:
			h.mu.RLock()
			for c := range h.clients {
				select {
				case c.send <- msg:
				default:
					// Client's buffer is full (too slow / stuck); drop the
					// message for it rather than block every other client.
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastJSON marshals v and fans it out to every connected client. Safe
// to call from any goroutine, including concurrently.
func (h *Hub) BroadcastJSON(v interface{}) {
	b, err := json.Marshal(v)
	if err != nil {
		log.Printf("ws: failed to marshal broadcast payload: %v", err)
		return
	}
	h.broadcast <- b
}

// ServeWS upgrades the HTTP connection and registers it with the hub.
func ServeWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws: upgrade failed: %v", err)
		return
	}
	c := &client{conn: conn, send: make(chan []byte, 16)}
	hub.register <- c

	go c.writePump()
	go c.readPump(hub)
}

// readPump keeps the connection alive and detects client disconnects. The
// dashboard never sends application messages over this socket, so incoming
// frames are discarded.
func (c *client) readPump(hub *Hub) {
	defer func() {
		hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(512)
	for {
		if _, _, err := c.conn.ReadMessage(); err != nil {
			return
		}
	}
}

func (c *client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
