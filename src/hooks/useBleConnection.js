"use client"

import { useState, useEffect, useCallback } from "react"
import {
  isBleSupported,
  scanForDevices,
  connectToDevice,
  sendWifiCredentials,
  disconnectDevice,
} from "../utils/ble-service"

export default function useBleConnection() {
  const [isSupported, setIsSupported] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [bleServer, setBleServer] = useState(null)
  const [bleCharacteristics, setBleCharacteristics] = useState(null)
  const [error, setError] = useState(null)
  const [wifiStatus, setWifiStatus] = useState("Disconnected")

  // Check if BLE is supported
  useEffect(() => {
    setIsSupported(isBleSupported())
  }, [])

  // Scan for devices
  const startScan = useCallback(async () => {
    if (!isSupported) {
      setError("Web Bluetooth API is not supported in your browser")
      return
    }

    try {
      setIsScanning(true)
      setError(null)

      const device = await scanForDevices()
      setDevices([device])

      setIsScanning(false)
      return device
    } catch (error) {
      setIsScanning(false)
      setError(error.message || "Failed to scan for devices")
      return null
    }
  }, [isSupported])

  // Connect to a device
  const connect = useCallback(async (device) => {
    try {
      setSelectedDevice(device)
      setIsConnecting(true)
      setError(null)

      const { server, characteristics } = await connectToDevice(device)

      setBleServer(server)
      setBleCharacteristics(characteristics)

      // Set up notification for status changes
      await characteristics.status.startNotifications()
      characteristics.status.addEventListener("characteristicvaluechanged", (event) => {
        const value = new TextDecoder().decode(event.target.value)
        setWifiStatus(value)
      })

      setIsConnecting(false)
      setIsConnected(true)

      return { server, characteristics }
    } catch (error) {
      setIsConnecting(false)
      setError(error.message || "Failed to connect to device")
      return null
    }
  }, [])

  // Send WiFi credentials
  const sendCredentials = useCallback(
    async (ssid, password) => {
      if (!bleCharacteristics) {
        setError("Not connected to a device")
        return false
      }

      try {
        setError(null)
        await sendWifiCredentials(bleCharacteristics, ssid, password)
        return true
      } catch (error) {
        setError(error.message || "Failed to send WiFi credentials")
        return false
      }
    },
    [bleCharacteristics],
  )

  // Disconnect
  const disconnect = useCallback(() => {
    if (bleServer) {
      disconnectDevice(bleServer)
      setBleServer(null)
      setBleCharacteristics(null)
      setIsConnected(false)
      setSelectedDevice(null)
    }
  }, [bleServer])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isSupported,
    isScanning,
    devices,
    selectedDevice,
    isConnecting,
    isConnected,
    error,
    wifiStatus,
    startScan,
    connect,
    sendCredentials,
    disconnect,
  }
}
