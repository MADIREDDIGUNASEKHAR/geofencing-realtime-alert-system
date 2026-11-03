import { useEffect, useRef, useState } from 'react'
import { getAlertHistory, WS_URL } from '../api/client'
import type { AlertEvent } from '../api/types'

export type ConnectionStatus = 'connecting' | 'open' | 'closed'

const MAX_FEED_LENGTH = 100
const BASE_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 15000

// On reconnect, alerts delivered more than this long ago are treated as
// "missed while away" — they still backfill the feed list, but don't pop a
// toast, so waking up after a long gap (e.g. a Render free-tier cold start)
// doesn't dump a flood of stale toasts.
const CATCH_UP_TOAST_WINDOW_MS = 2 * 60 * 1000

/**
 * Connects to /ws/alerts and keeps a rolling feed of received alerts.
 * Reconnects automatically with exponential backoff so a backend restart or
 * a flaky network doesn't silently stop live updates. A dropped connection
 * (the backend sleeping and cold-starting, for instance) otherwise loses
 * every alert dispatched while disconnected — they'd still be persisted and
 * visible on the History page, but never reach this live feed — so every
 * reconnect after the first also fetches recent alert history and merges in
 * anything newer than the last alert we'd already seen.
 */
export function useAlertsSocket() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [feed, setFeed] = useState<AlertEvent[]>([])
  const [latest, setLatest] = useState<AlertEvent | null>(null)
  const attemptRef = useRef(0)
  const closedByClientRef = useRef(false)
  const hasConnectedOnceRef = useRef(false)
  const lastSeenAtRef = useRef<string | null>(null)

  useEffect(() => {
    closedByClientRef.current = false
    let socket: WebSocket
    let reconnectTimer: ReturnType<typeof setTimeout>

    function recordAlert(alert: AlertEvent) {
      setFeed((prev) => (prev.some((a) => a.event_id === alert.event_id) ? prev : [alert, ...prev].slice(0, MAX_FEED_LENGTH)))
      if (!lastSeenAtRef.current || alert.timestamp > lastSeenAtRef.current) {
        lastSeenAtRef.current = alert.timestamp
      }
    }

    async function catchUpOnReconnect() {
      try {
        const { alerts } = await getAlertHistory({ limit: 20 })
        const missed = alerts.filter((a) => !lastSeenAtRef.current || a.delivered_at > lastSeenAtRef.current)
        // History comes back newest-first; replay oldest-first so the feed
        // and any toasts land in the order they actually happened.
        for (const a of missed.slice().reverse()) {
          const event: AlertEvent = {
            event_id: a.id,
            event_type: a.event_type,
            timestamp: a.delivered_at,
            vehicle: a.vehicle,
            geofence: a.geofence,
            location: a.location,
          }
          recordAlert(event)
          if (Date.now() - new Date(event.timestamp).getTime() <= CATCH_UP_TOAST_WINDOW_MS) {
            setLatest(event)
          }
        }
      } catch {
        // Best-effort catch-up — the live socket carries future alerts
        // regardless, so a failed fetch here isn't fatal.
      }
    }

    const connect = () => {
      setStatus('connecting')
      socket = new WebSocket(WS_URL)

      socket.onopen = () => {
        attemptRef.current = 0
        setStatus('open')
        if (hasConnectedOnceRef.current) {
          catchUpOnReconnect()
        }
        hasConnectedOnceRef.current = true
      }

      socket.onmessage = (event) => {
        try {
          const alert = JSON.parse(event.data) as AlertEvent
          recordAlert(alert)
          setLatest(alert)
        } catch {
          // ignore malformed frames
        }
      }

      socket.onclose = () => {
        setStatus('closed')
        if (closedByClientRef.current) return
        const delay = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** attemptRef.current, MAX_RECONNECT_DELAY_MS)
        attemptRef.current += 1
        reconnectTimer = setTimeout(connect, delay)
      }

      socket.onerror = () => {
        socket.close()
      }
    }

    connect()

    return () => {
      closedByClientRef.current = true
      clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [])

  return { status, feed, latest }
}
