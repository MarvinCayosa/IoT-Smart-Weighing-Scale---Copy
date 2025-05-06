"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"

// ESP32 AP Configuration
const ESP32_AP_IP = "192.168.4.1"
const STATUS_ENDPOINT = `http://${ESP32_AP_IP}/status`

export default function ConnectionStatusIndicator({ isConnected, onClick }) {
  const [localStatus, setLocalStatus] = useState(isConnected)

  // Periodically check connection status if we're in normal operation mode
  // (not in AP setup mode)
  useEffect(() => {
    setLocalStatus(isConnected)

    // Only poll if we're already connected
    if (isConnected) {
      const checkStatus = async () => {
        try {
          const response = await fetch(STATUS_ENDPOINT, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            // Short timeout to avoid hanging
            signal: AbortSignal.timeout(2000),
          })

          if (response.ok) {
            const data = await response.json()
            setLocalStatus(data.status === "connected")
          } else {
            setLocalStatus(false)
          }
        } catch (err) {
          // If we can't reach the ESP32, assume it's not connected
          setLocalStatus(false)
        }
      }

      // Check immediately
      checkStatus()

      // Then check every 30 seconds
      const interval = setInterval(checkStatus, 30000)

      return () => clearInterval(interval)
    }
  }, [isConnected])

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-full px-4 py-2 transition-all hover:bg-opacity-20"
    >
      {localStatus ? (
        <>
          <Wifi size={18} className="text-green-400" />
          <span className="text-green-400 font-medium">Online</span>
        </>
      ) : (
        <>
          <WifiOff size={18} className="text-red-400" />
          <span className="text-red-400 font-medium">Offline</span>
        </>
      )}
    </button>
  )
}
