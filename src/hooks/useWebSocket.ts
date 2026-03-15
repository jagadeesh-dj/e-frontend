import { useEffect, useRef, useCallback, useState, useMemo } from 'react'

interface InventoryUpdate {
  type: 'inventory_update' | 'low_stock_alert'
  product_id: string
  stock: number
  product_name?: string
  timestamp: string
}

interface UseWebSocketOptions {
  url: string
  onMessage?: (data: InventoryUpdate) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnectAttempts?: number
  reconnectInterval?: number
}

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<InventoryUpdate | null>(null)

  // Use refs for callbacks to avoid re-triggering connect/disconnect on every render
  const onMessageRef = useRef(onMessage)
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)

  // Keep refs updated with the latest versions
  useEffect(() => {
    onMessageRef.current = onMessage
    onConnectRef.current = onConnect
    onDisconnectRef.current = onDisconnect
  })

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        reconnectCountRef.current = 0
        onConnectRef.current?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as InventoryUpdate
          setLastMessage(data)
          onMessageRef.current?.(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        onDisconnectRef.current?.()

        // Check if we should reconnect - but only if not deliberately closed
        if (wsRef.current === ws && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current += 1
          setTimeout(() => {
            if (wsRef.current === ws) {
              connect()
            }
          }, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [url, reconnectAttempts, reconnectInterval])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      // Clear the ref first to prevent the onclose handler from trigger a reconnect
      const ws = wsRef.current
      wsRef.current = null
      ws.close()
    }
  }, [])

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const subscribeToProduct = useCallback((productId: string) => {
    send({ type: 'subscribe', product_id: productId })
  }, [send])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    isConnected,
    lastMessage,
    send,
    subscribeToProduct,
    connect,
    disconnect,
  }
}

interface InventoryState {
  [productId: string]: number
}

export function useInventoryWebSocket() {
  const [inventory, setInventory] = useState<InventoryState>({})
  const [alerts, setAlerts] = useState<InventoryUpdate[]>([])

  const wsUrl = useMemo(() => {
    const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
    // Ensure no double slashes and correct ending
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    return `${cleanBase}/ws/inventory`
  }, [])

  const handleMessage = useCallback((data: InventoryUpdate) => {
    if (data.type === 'inventory_update') {
      setInventory(prev => ({
        ...prev,
        [data.product_id]: data.stock,
      }))
    } else if (data.type === 'low_stock_alert') {
      setAlerts(prev => [...prev.slice(-9), data])
    }
  }, [])

  const { isConnected, subscribeToProduct } = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
  })

  const updateLocalInventory = useCallback((productId: string, stock: number) => {
    setInventory(prev => ({
      ...prev,
      [productId]: stock,
    }))
  }, [])

  const clearAlert = useCallback((index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index))
  }, [])

  return {
    isConnected,
    inventory,
    alerts,
    subscribeToProduct,
    updateLocalInventory,
    clearAlert,
    getStock: (productId: string) => inventory[productId],
  }
}

