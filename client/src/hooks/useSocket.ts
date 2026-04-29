import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { supabase } from '../lib/supabase'

// En prod, VITE_SERVER_URL pointe vers Railway. En dev, on passe par le proxy Vite (même origine).
const SERVER_URL = import.meta.env.VITE_SERVER_URL || undefined

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    let s: Socket

    supabase.auth.getSession().then(({ data: { session } }) => {
      s = io(SERVER_URL as string, {
        auth: { token: session?.access_token },
      })
      socketRef.current = s
      setSocket(s)
    })

    return () => {
      s?.disconnect()
      setSocket(null)
    }
  }, [])

  return { socket, socketRef }
}
