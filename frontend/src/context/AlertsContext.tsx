import { createContext, useContext, type ReactNode } from 'react'
import { useAlertsSocket, type ConnectionStatus } from '../hooks/useAlertsSocket'
import type { AlertEvent } from '../api/types'

interface AlertsContextValue {
  status: ConnectionStatus
  feed: AlertEvent[]
  latest: AlertEvent | null
}

const AlertsContext = createContext<AlertsContextValue>({ status: 'closed', feed: [], latest: null })

export function AlertsProvider({ children }: { children: ReactNode }) {
  const value = useAlertsSocket()
  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export function useAlerts() {
  return useContext(AlertsContext)
}
