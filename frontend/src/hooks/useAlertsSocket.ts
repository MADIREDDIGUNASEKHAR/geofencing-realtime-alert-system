import { useEffect, useRef, useState } from 'react'
import { WS_URL } from '../api/client'
import type { AlertEvent } from '../api/types'

export type ConnectionStatus = 'connecting' | 'open' | 'closed'

const MAX_FEED_LENGTH = 100
const BASE_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 15000

/**
 * Connects to /ws/alerts and keeps a rolling feed of received alerts.
 * Reconnects automatically with exponential backoff so a backend restart or
 * a flaky network doesn't silently stop live updates.
 */
export function useAlertsSocket() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [feed, setFeed] = useState<AlertEvent[]>([])
  const [latest, setLatest] = useState<AlertEvent | null>(null)
  const attemptRef = useRef(0)
  const closedByClientRef = useRef(false)

  useEffect(() => {
    closedByClientRef.current = false
    let socket: WebSocket
    let reconnectTimer: ReturnType<typeof setTimeout>

    const connect = () => {
      setStatus('connecting')
      socket = new WebSocket(WS_URL)

      socket.onopen = () => {
        attemptRef.current = 0
        setStatus('open')
      }

      socket.onmessage = (event) => {
        try {
          const alert = JSON.parse(event.data) as AlertEvent
          setLatest(alert)
          setFeed((prev) => [alert, ...prev].slice(0, MAX_FEED_LENGTH))
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
