import { ref, onUnmounted } from 'vue'
import type { SecurityAlert } from '@/types/graph'

interface WsMessage {
  type: string
  payload: { value: SecurityAlert[] }
}

const WS_URL = '/ws' // Proxied by Vite → ws://localhost:8080/ws

/**
 * Composable for the real-time WebSocket connection.
 * Connects to the Go backend's /ws endpoint, validates the token via query
 * param, and calls `onAlert` whenever a new alerts payload arrives.
 *
 * Features: auto-reconnect with exponential backoff (up to 30 s).
 */
export function useWebSocket(onAlert: (alerts: SecurityAlert[]) => void) {
  const connected = ref(false)
  const error     = ref<string | null>(null)

  let socket:          WebSocket | null = null
  let reconnectTimer:  ReturnType<typeof setTimeout> | null = null
  let reconnectDelay = 1000 // ms — doubles on each failed attempt, capped at 30 s

  function connect(token: string) {
    if (socket && socket.readyState === WebSocket.OPEN) return

    const url = `${WS_URL}?token=${encodeURIComponent(token)}`
    socket = new WebSocket(url)

    socket.addEventListener('open', () => {
      connected.value = true
      error.value     = null
      reconnectDelay  = 1000 // reset backoff on successful connect
    })

    socket.addEventListener('message', (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage
        if (msg.type === 'alerts' && Array.isArray(msg.payload?.value)) {
          onAlert(msg.payload.value)
        }
      } catch {
        console.warn('[useWebSocket] Failed to parse message:', event.data)
      }
    })

    socket.addEventListener('close', () => {
      connected.value = false
      scheduleReconnect(token)
    })

    socket.addEventListener('error', () => {
      error.value = 'WebSocket connection error'
    })
  }

  function scheduleReconnect(token: string) {
    if (reconnectTimer) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      reconnectDelay = Math.min(reconnectDelay * 2, 30_000)
      connect(token)
    }, reconnectDelay)
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    socket?.close(1000, 'user disconnect')
    socket = null
    connected.value = false
  }

  // Automatically clean up when the component using this composable unmounts.
  onUnmounted(disconnect)

  return { connected, error, connect, disconnect }
}
