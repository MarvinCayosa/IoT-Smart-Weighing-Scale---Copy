// Utility functions for BLE operations

// Define the UUIDs that match the ESP32 code
export const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
export const WIFI_SSID_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a9"
export const WIFI_PASS_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26aa"
export const WIFI_STATUS_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26ab"

// Check if Web Bluetooth API is supported
export const isBleSupported = () => {
  return !!navigator.bluetooth
}

// Scan for BLE devices with our service
export const scanForDevices = async () => {
  if (!isBleSupported()) {
    throw new Error("Web Bluetooth API is not supported in your browser")
  }

  try {
    // Request device with the specific service UUID
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }],
      optionalServices: [SERVICE_UUID],
    })

    return device
  } catch (error) {
    console.error("Error scanning for devices:", error)
    throw error
  }
}

// Connect to a BLE device and get the service and characteristics
export const connectToDevice = async (device) => {
  try {
    console.log("Connecting to device:", device.name)
    const server = await device.gatt.connect()

    console.log("Getting primary service")
    const service = await server.getPrimaryService(SERVICE_UUID)

    console.log("Getting characteristics")
    const ssidChar = await service.getCharacteristic(WIFI_SSID_UUID)
    const passChar = await service.getCharacteristic(WIFI_PASS_UUID)
    const statusChar = await service.getCharacteristic(WIFI_STATUS_UUID)

    return {
      server,
      characteristics: {
        ssid: ssidChar,
        pass: passChar,
        status: statusChar,
      },
    }
  } catch (error) {
    console.error("Error connecting to device:", error)
    throw error
  }
}

// Send WiFi credentials to the device
export const sendWifiCredentials = async (characteristics, ssid, password) => {
  try {
    // Convert strings to ArrayBuffer
    const ssidEncoder = new TextEncoder()
    const passEncoder = new TextEncoder()

    const ssidBuffer = ssidEncoder.encode(ssid)
    const passBuffer = passEncoder.encode(password)

    // Write SSID and password to the device
    console.log("Writing SSID")
    await characteristics.ssid.writeValue(ssidBuffer)

    console.log("Writing password")
    await characteristics.pass.writeValue(passBuffer)

    console.log("Credentials sent")
    return true
  } catch (error) {
    console.error("Error sending WiFi credentials:", error)
    throw error
  }
}

// Disconnect from the BLE device
export const disconnectDevice = (server) => {
  if (server) {
    try {
      server.disconnect()
      return true
    } catch (error) {
      console.error("Error disconnecting from BLE device:", error)
      return false
    }
  }
  return false
}
