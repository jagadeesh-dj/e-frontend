import { useEffect, useRef, useCallback, useState } from 'react'

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

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      reconnectCountRef.current = 0
      onConnect?.()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as InventoryUpdate
        setLastMessage(data)
        onMessage?.(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      onDisconnect?.()

      if (reconnectCountRef.current < reconnectAttempts) {
        reconnectCountRef.current += 1
        setTimeout(connect, reconnectInterval)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }, [url, onMessage, onConnect, onDisconnect, reconnectAttempts, reconnectInterval])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
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

  const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/inventory`

  const { isConnected, lastMessage, subscribeToProduct } = useWebSocket({
    url: wsUrl,
    onMessage: (data) => {
      if (data.type === 'inventory_update') {
        setInventory(prev => ({
          ...prev,
          [data.product_id]: data.stock,
        }))
      } else if (data.type === 'low_stock_alert') {
        setAlerts(prev => [...prev.slice(-9), data])
      }
    },
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
