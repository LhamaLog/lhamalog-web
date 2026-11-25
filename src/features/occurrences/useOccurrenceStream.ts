import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/react'
import { readPublicConfig } from '../../shared/config'
import { ACCESS_DENIED, authMessage, backoffSeconds, parseServerMessage, wsUrl } from './occurrenceStream'
import type { OccurrenceNotice } from './occurrenceStream'

export type StreamStatus = 'connecting' | 'ready' | 'paused' | 'stopped'

type StreamCallbacks = {
  onNotice: (notice: OccurrenceNotice) => void
  // Called when the connection is ready again after a drop, so the screen can synchronize.
  onReconnected: () => void
}

const RENEW_MS = 50_000
const PAUSED_AFTER_MS = 10_000

// Occurrence WebSocket of the list (spec 014): authenticates with the Clerk token in a message, renews it every 50 s,
// reconnects with a growing wait and stops on 4403. The list keeps working without it.
export function useOccurrenceStream(callbacks: StreamCallbacks): StreamStatus {
  const { getToken } = useAuth()
  const [status, setStatus] = useState<StreamStatus>('connecting')
  const latest = useRef(callbacks)
  latest.current = callbacks
  const tokenRef = useRef(getToken)
  tokenRef.current = getToken

  useEffect(() => {
    let socket: WebSocket | null = null
    let attempt = 0
    let everReady = false
    let stopped = false
    let renew: number | undefined
    let retry: number | undefined
    let paused: number | undefined

    const sendAuth = async () => {
      const token = await tokenRef.current().catch(() => null)
      if (!token) {
        // Session over: the /api calls handle it (spec 006); here we only stop.
        stop()
        return
      }
      if (socket?.readyState === WebSocket.OPEN) socket.send(authMessage(token))
    }

    const stop = () => {
      stopped = true
      setStatus('stopped')
      window.clearInterval(renew)
      window.clearTimeout(retry)
      window.clearTimeout(paused)
      socket?.close()
    }

    const connect = () => {
      if (stopped) return
      setStatus(current => (current === 'paused' ? 'paused' : 'connecting'))
      let opened: WebSocket
      try {
        opened = new WebSocket(wsUrl(readPublicConfig().apiUrl))
      }
      catch {
        scheduleRetry()
        return
      }
      socket = opened
      let socketReady = false
      opened.onopen = () => { void sendAuth() }
      opened.onmessage = (event) => {
        const message = parseServerMessage(event.data)
        if (!message) return
        if (message.type === 'ready') {
          // Later "ready" messages only acknowledge a token renewal.
          if (socketReady) return
          socketReady = true
          window.clearTimeout(paused)
          window.clearInterval(renew)
          renew = window.setInterval(() => { void sendAuth() }, RENEW_MS)
          const reconnected = everReady
          everReady = true
          attempt = 0
          setStatus('ready')
          if (reconnected) latest.current.onReconnected()
          return
        }
        latest.current.onNotice(message)
      }
      opened.onclose = (event) => {
        window.clearInterval(renew)
        if (stopped || socket !== opened) return
        if (event.code === ACCESS_DENIED) {
          stop()
          return
        }
        scheduleRetry()
      }
    }

    const scheduleRetry = () => {
      if (stopped) return
      attempt += 1
      if (attempt === 1) {
        window.clearTimeout(paused)
        paused = window.setTimeout(() => setStatus('paused'), PAUSED_AFTER_MS)
      }
      retry = window.setTimeout(connect, backoffSeconds(attempt) * 1000)
    }

    connect()
    return () => {
      stopped = true
      window.clearInterval(renew)
      window.clearTimeout(retry)
      window.clearTimeout(paused)
      socket?.close()
    }
  }, [])

  return status
}
