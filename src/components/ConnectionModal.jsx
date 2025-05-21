"use client"

import { useState, useEffect } from "react"
import { Loader, Check, X, Wifi, Lock, RefreshCw, Send, Signal } from "lucide-react"
import { useAuth } from "../context/AuthContext"

// ESP32 AP Configuration
const ESP32_AP_IP = "192.168.4.1"
const STATUS_ENDPOINT = `http://${ESP32_AP_IP}/status`
const SCAN_ENDPOINT = `http://${ESP32_AP_IP}/scan`
const CONNECT_ENDPOINT = `http://${ESP32_AP_IP}/connect`

// List of ESP32 device prefixes to look for
const ESP32_PREFIXES = ["ESP32", "ESP-"]

export default function ConnectionModal({ isOpen, onClose, onConnect }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [ssid, setSsid] = useState("")
  const [password, setPassword] = useState("")
  const [sending, setSending] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [wifiConnected, setWifiConnected] = useState(false)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState("idle")
  const [deviceIp, setDeviceIp] = useState("")
  const [isConnectedToAp, setIsConnectedToAp] = useState(false)
  const [wifiNetworks, setWifiNetworks] = useState([])
  const [selectedNetwork, setSelectedNetwork] = useState(null)
  const [isOffline, setIsOffline] = useState(false)

  // Check if we're connected to the ESP32 AP
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(STATUS_ENDPOINT, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(2000),
        })
        setIsOffline(false)
      } catch (error) {
        setIsOffline(true)
      }
    }

    if (isOpen) {
      checkConnection()
    }
  }, [isOpen])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSsid("")
      setPassword("")
      setSending(false)
      setScanning(false)
      setWifiConnected(false)
      setError(null)
      setConnectionStatus("idle")
      setDeviceIp("")
      setWifiNetworks([])
      setSelectedNetwork(null)
      checkApConnection()
    }
  }, [isOpen])

  // Check if connected to ESP32 AP
  const checkApConnection = async () => {
    setScanning(true)
    setError(null)

    try {
      const response = await fetch(STATUS_ENDPOINT, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(2000),
      })

      if (response.ok) {
        setIsConnectedToAp(true)
        const data = await response.json()
        if (data.status === "connected") {
          setConnectionStatus("connected")
          setDeviceIp(data.ip || "")
          setWifiConnected(true)
          setStep(3)
          onConnect(true)
        } else if (data.status === "connecting") {
          setConnectionStatus("connecting")
          setStep(2)
          pollConnectionStatus()
        } else {
          scanWifiNetworks()
        }
      } else {
        setIsConnectedToAp(false)
        setError("Connected to ESP32 AP but couldn't communicate with it")
      }
    } catch (err) {
      console.error("Error checking AP connection:", err)
      setIsConnectedToAp(false)
      setError("Not connected to ESP32 AP. Please connect to an ESP32 WiFi network first.")
    } finally {
      setScanning(false)
    }
  }

  // Scan for WiFi networks
  const scanWifiNetworks = async () => {
    if (!isConnectedToAp) return

    setScanning(true)
    setError(null)

    try {
      const response = await fetch(SCAN_ENDPOINT, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Sort networks by signal strength (RSSI)
        const sortedNetworks = data.networks.sort((a, b) => b.rssi - a.rssi)
        setWifiNetworks(sortedNetworks)
      } else {
        setError("Failed to scan for WiFi networks")
      }
    } catch (err) {
      console.error("Error scanning WiFi networks:", err)
      setError("Failed to scan for WiFi networks. Make sure you're connected to the ESP32 AP.")
    } finally {
      setScanning(false)
    }
  }

  // Poll for connection status updates
  const pollConnectionStatus = async () => {
    try {
      const response = await fetch(STATUS_ENDPOINT, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data.status)

        if (data.status === "connected") {
          setDeviceIp(data.ip || "")
          setWifiConnected(true)
          setStep(3)
          onConnect(true)
        } else if (data.status === "failed") {
          setWifiConnected(false)
          setStep(3)
          onConnect(false)
        } else if (data.status === "connecting") {
          // Continue polling if still connecting
          setTimeout(pollConnectionStatus, 2000)
        }
      }
    } catch (err) {
      console.error("Error polling status:", err)
      // If we can't reach the ESP32 anymore, it might have switched to station mode
      // Wait a bit and try again
      setTimeout(pollConnectionStatus, 5000)
    }
  }

  // Send WiFi credentials to ESP32
  const sendWifiCredentials = async () => {
    if (!selectedNetwork && !ssid) {
      setError("Please select a WiFi network or enter SSID manually")
      return
    }

    if (!password) {
      setError("Please enter the WiFi password")
      return
    }

    if (!user?.uid || !user?.email) {
      setError("User information not available")
      return
    }

    const networkSsid = selectedNetwork ? selectedNetwork.ssid : ssid

    try {
      setSending(true)
      setError(null)

      const response = await fetch(CONNECT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ssid: networkSsid,
          password: password,
          uid: user.uid,
          email: user.email
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data.status)

        if (data.status === "connecting") {
          setStep(2)
          // Start polling for status updates
          pollConnectionStatus()
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to send WiFi credentials")
      }
    } catch (err) {
      console.error("Error sending credentials:", err)
      setError("Failed to communicate with ESP32. Make sure you're connected to the ESP32 WiFi network.")
    } finally {
      setSending(false)
    }
  }

  // Get signal strength icon based on RSSI
  const getSignalIcon = (rssi) => {
    if (rssi >= -50) return <Signal className="text-green-400" size={18} />
    if (rssi >= -65) return <Signal className="text-green-400 opacity-75" size={18} />
    if (rssi >= -75) return <Signal className="text-yellow-400" size={18} />
    return <Signal className="text-red-400" size={18} />
  }

  // Handle network selection
  const handleNetworkSelect = (network) => {
    setSelectedNetwork(network)
    setSsid(network.ssid)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A0F09] border border-[#1A1F19] rounded-[30px] w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">
                {step === 1 && "Connect to Wi-Fi"}
                {step === 2 && "Connecting..."}
                {step === 3 && "Connection Status"}
              </h2>
              <div className="relative">
                <div className={`w-2 h-2 rounded-full ${
                  isConnectedToAp 
                    ? connectionStatus === "connected" 
                      ? "bg-green-500" 
                      : connectionStatus === "connecting"
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-gray-500"
                    : "bg-red-500"
                }`} />
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          {isOffline && (
            <div className="bg-yellow-500 bg-opacity-10 text-yellow-400 p-4 rounded-lg mb-4">
              <p className="text-sm">
                You are currently offline. This is normal when connected to the ESP32 setup network.
                The app will continue to function in offline mode.
              </p>
            </div>
          )}

          {/* Step 1: Check AP connection and enter Wi-Fi credentials */}
          {step === 1 && (
            <div className="space-y-4">
              {scanning ? (
                <div className="flex items-center justify-center py-4">
                  <Loader size={24} className="animate-spin text-[#D3A2FF] mr-2" />
                  <span className="text-gray-300">
                    {isConnectedToAp ? "Scanning for WiFi networks..." : "Checking connection to ESP32..."}
                  </span>
                </div>
              ) : isConnectedToAp ? (
                <>
                  <div className="bg-green-500 bg-opacity-10 text-green-400 p-3 rounded-lg flex items-center mb-4">
                    <Check size={18} className="mr-2" />
                    Connected to ESP32 setup network
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-medium">Available WiFi Networks</h3>
                    <button
                      onClick={scanWifiNetworks}
                      className="text-[#D3A2FF] hover:text-[#C090EE] flex items-center"
                    >
                      <RefreshCw size={16} className="mr-1" />
                      Refresh
                    </button>
                  </div>

                  {wifiNetworks.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-2 mb-4 pr-1">
                      {wifiNetworks.map((network, index) => (
                        <button
                          key={index}
                          onClick={() => handleNetworkSelect(network)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border ${
                            selectedNetwork?.ssid === network.ssid
                              ? "border-[#D3A2FF] bg-[#D3A2FF] bg-opacity-10"
                              : "border-gray-700 hover:border-gray-500"
                          }`}
                        >
                          <div className="flex items-center">
                            {getSignalIcon(network.rssi)}
                            <span className="text-white ml-2">{network.ssid}</span>
                          </div>
                          {network.encryption && <Lock size={14} className="text-gray-400" />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-4 border border-gray-800 rounded-xl mb-4">
                      No WiFi networks found. Click refresh to scan again.
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="ssid" className="block text-sm text-gray-400 mb-1">
                        WiFi Name (SSID)
                      </label>
                      <input
                        id="ssid"
                        type="text"
                        value={ssid}
                        onChange={(e) => {
                          setSsid(e.target.value)
                          setSelectedNetwork(null)
                        }}
                        placeholder="Select a network or enter manually"
                        className="w-full bg-[#1A1F19] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D3A2FF]"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm text-gray-400 mb-1">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter WiFi password"
                        className="w-full bg-[#1A1F19] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D3A2FF]"
                      />
                    </div>
                  </div>

                  {error && <div className="text-red-400 text-sm bg-red-400 bg-opacity-10 p-3 rounded-lg">{error}</div>}

                  <button
                    onClick={sendWifiCredentials}
                    disabled={sending}
                    className="w-full bg-[#D3A2FF] hover:bg-[#C090EE] text-black font-medium py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Connect to Wi-Fi
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-500 bg-opacity-10 text-yellow-400 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Connect to ESP32 Setup Network</h3>
                    <p className="text-sm mb-3">Please connect to the ESP32 WiFi network to continue setup:</p>

                    <div className="space-y-3 mb-3">
                      <div className="bg-black bg-opacity-30 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <Wifi size={16} className="text-[#D3A2FF] mr-2" />
                            <span className="text-white font-medium">ESP32-Health-Setup</span>
                          </div>
                          <Signal className="text-green-400" size={16} />
                        </div>
                        <div className="text-xs text-gray-400">ESP32 Setup Network</div>
                      </div>
                    </div>

                    <ol className="list-decimal list-inside text-sm space-y-1">
                      <li>Go to your device's WiFi settings</li>
                      <li>
                        Connect to <strong>ESP32-Health-Setup</strong>
                      </li>
                      <li>
                        Use password: <strong>12345678</strong>
                      </li>
                      <li>Return to this app and click "Check Connection"</li>
                    </ol>
                  </div>

                  {error && <div className="text-red-400 text-sm bg-red-400 bg-opacity-10 p-3 rounded-lg">{error}</div>}

                  <button
                    onClick={checkApConnection}
                    disabled={scanning}
                    className="w-full bg-[#D3A2FF] hover:bg-[#C090EE] text-black font-medium py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    {scanning ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Wifi size={18} />
                        Check Connection
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Connecting animation */}
          {step === 2 && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#D3A2FF] bg-opacity-20 flex items-center justify-center mb-4">
                  <Loader size={32} className="animate-spin text-[#D3A2FF]" />
                </div>
                <h3 className="text-xl font-medium text-white mb-1">Connecting to Wi-Fi</h3>
                <p className="text-gray-400 text-center">
                  Please wait while the device connects to your Wi-Fi network...
                </p>
                {ssid && <p className="text-[#D3A2FF] mt-2">Network: {ssid}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Connection status */}
          {step === 3 && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center justify-center">
                {wifiConnected ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center mb-4">
                      <Check size={32} className="text-green-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-1">Successfully Connected</h3>
                    <p className="text-gray-400 text-center">Your device is now connected to the Wi-Fi network.</p>
                    {ssid && <p className="text-[#D3A2FF] mt-1">Network: {ssid}</p>}
                    {deviceIp && <p className="text-[#D3A2FF]">Device IP: {deviceIp}</p>}
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center mb-4">
                      <X size={32} className="text-red-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-1">Connection Failed</h3>
                    <p className="text-gray-400 text-center">
                      There was an error connecting to the Wi-Fi network. Please check your credentials and try again.
                    </p>
                    {ssid && <p className="text-red-400 mt-1">Network: {ssid}</p>}
                  </>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-[#1A1F19] hover:bg-[#252A24] text-white font-medium py-3 rounded-xl"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-[#D3A2FF] hover:bg-[#C090EE] text-black font-medium py-3 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex border-t border-gray-800">
          <div
            className={`flex-1 py-3 text-center text-sm font-medium ${
              step === 1 ? "text-[#D3A2FF] border-t-2 border-[#D3A2FF]" : "text-gray-400"
            }`}
          >
            Setup
          </div>
          <div
            className={`flex-1 py-3 text-center text-sm font-medium ${
              step === 2 ? "text-[#D3A2FF] border-t-2 border-[#D3A2FF]" : "text-gray-400"
            }`}
          >
            Connecting
          </div>
          <div
            className={`flex-1 py-3 text-center text-sm font-medium ${
              step === 3 ? "text-[#D3A2FF] border-t-2 border-[#D3A2FF]" : "text-gray-400"
            }`}
          >
            Status
          </div>
        </div>
      </div>
    </div>
  )
}
