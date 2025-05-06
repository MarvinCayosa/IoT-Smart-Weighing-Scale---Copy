"use client"

import { useState, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import HeightModal from "../components/HeightModal"
import ConnectionStatusIndicator from "../components/ConnectionStatusIndicator"
import ConnectionModal from "../components/ConnectionModal"
import { useAuth } from "../context/AuthContext"
import { Activity } from "lucide-react"

const Dashboard = () => {
  const { user } = useAuth()
  const [showHeightModal, setShowHeightModal] = useState(false)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [healthData, setHealthData] = useState({
    weight: 51.3,
    bpm: 83,
    spo2: 90,
    temperature: 30.5,
    bodyFat: 25,
    bodyWater: 60,
    skeletalMuscle: 44,
  })
  const [bmi, setBmi] = useState(null)
  const [bleHealthData, setBleHealthData] = useState(null)

  useEffect(() => {
    const height = localStorage.getItem("userHeight")
    if (!height) {
      setShowHeightModal(true)
    } else {
      calculateBMI(Number.parseFloat(height))
    }

    // Check if we have a saved connection state
    const savedConnectionState = localStorage.getItem("bleConnected")
    if (savedConnectionState === "true") {
      setIsConnected(true)
    }
  }, [])

  // Update health data when we receive it from BLE
  useEffect(() => {
    if (bleHealthData) {
      setHealthData((prevData) => ({
        ...prevData,
        bpm: bleHealthData.hr || prevData.bpm,
        spo2: bleHealthData.spo2 || prevData.spo2,
        temperature: bleHealthData.temp || prevData.temperature,
      }))
    }
  }, [bleHealthData])

  const calculateBMI = (height) => {
    if (height && healthData.weight) {
      const heightInMeters = height / 100
      const bmiValue = (healthData.weight / (heightInMeters * heightInMeters)).toFixed(1)
      setBmi(Number.parseFloat(bmiValue))
    }
  }

  const handleHeightSubmit = (height) => {
    localStorage.setItem("userHeight", height)
    calculateBMI(Number.parseFloat(height))
    setShowHeightModal(false)
  }

  const getBmiCategory = () => {
    if (!bmi) return ""
    if (bmi < 18.5) return "Underweight"
    if (bmi < 25) return "Normal"
    if (bmi < 30) return "Overweight"
    return "Obese"
  }

  const getBmiColorClass = () => {
    const category = getBmiCategory()
    switch (category) {
      case "Underweight":
        return "bg-blue-500"
      case "Normal":
        return "bg-green-500"
      case "Overweight":
        return "bg-yellow-500"
      case "Obese":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleConnectionStatusClick = () => {
    setShowConnectionModal(true)
  }

  const handleConnectionModalClose = () => {
    setShowConnectionModal(false)
  }

  const handleDeviceConnect = (status) => {
    setIsConnected(status)
    // Save connection state to localStorage
    localStorage.setItem("bleConnected", status.toString())
  }

  // Function to receive health data from BLE
  const handleHealthData = (data) => {
    setBleHealthData(data)
  }

  return (
    <div className="flex h-screen text-white bg-[#050A04] overflow-hidden">
      {/* Background gradients */}
      <div className="fixed w-[1000px] h-[1000px] bg-[#D3A2FF] opacity-100 blur-[800px] rounded-full top-[-1000px] left-[-350px] z-0"></div>
      <div className="fixed w-[1000px] h-[1000px] bg-[#A9DEFF] opacity-100 blur-[800px] rounded-full bottom-[-1000px] right-[-350px] z-0"></div>

      {/* Sidebar */}

        <Sidebar />

      {/* Main content */}
      <main className="flex-1 px-4 md:px-10 pt-8 pb-20 md:pb-8 relative z-10 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-[28px] md:text-[36px] font-bold">
                Welcome, <span className="text-[#D3A2FF]">{user?.name || "User"}</span>!
              </h1>
              <p className="text-[16px] text-gray-400">Here Is Your Dashboard</p>
            </div>

            {/* Connection status indicator */}
            <div className="mt-4 md:mt-0">
              <ConnectionStatusIndicator isConnected={isConnected} onClick={handleConnectionStatusClick} />
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Main Section Left */}
            <div className="lg:col-span-2 space-y-6">
              {/* Weight */}
              <div>
                <h2 className="text-m text-gray-300 mb-0">Weight</h2>
                <div className="flex items-end text-white">
                  <span className="text-[100px] md:text-[200px] font-bold leading-none">{healthData.weight}</span>
                  <span className="text-2xl md:text-4xl ml-1 mb-3 md:mb-6">kg</span>
                </div>
              </div>

              {/* Vitals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-[30px] p-4 flex items-center">
                  <div className="bg-gray-700 p-2 rounded-full mr-3">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{healthData.bpm}</p>
                    <p className="text-xs text-gray-400">bpm</p>
                  </div>
                </div>
                <div className="bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-[30px] p-4 flex items-center">
                  <div className="bg-gray-700 p-2 rounded-full mr-3">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                      <path d="M12 6a6 6 0 100 12 6 6 0 000-12z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{healthData.spo2}%</p>
                    <p className="text-xs text-gray-400">SpO₂</p>
                  </div>
                </div>
                <div className="bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-[30px] p-4">
                  <h3 className="text-sm text-gray-400 mb-1">Body Temperature</h3>
                  <div className="flex items-end">
                    <span className="text-3xl font-bold">{healthData.temperature}</span>
                    <span className="text-lg ml-1 mb-1">°C</span>
                  </div>
                </div>
              </div>

              {/* BMI */}
              <div className="bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-[30px] p-6 flex flex-col items-center justify-center">
                <h2 className="text-gray-400 mb-2 text-sm">BMI</h2>
                <span className="text-6xl font-bold mb-2">{bmi || "--"}</span>
                <div className={`px-4 py-1 rounded-full text-sm ${getBmiColorClass()}`}>
                  {getBmiCategory() || "Calculating..."}
                </div>
              </div>
            </div>

            {/* Body Composition Chart - Right Section */}
            <div className="bg-[#020202] bg-opacity-60 backdrop-blur-30 rounded-xl rounded-[40px] p-6 lg:h-full">
              <div className="flex justify-center mb-4">
                <svg className="w-40 h-40" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#F87171"
                    strokeWidth="6"
                    strokeDasharray={`${healthData.bodyFat * 2.83} 283`}
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill="transparent"
                    stroke="#60A5FA"
                    strokeWidth="6"
                    strokeDasharray={`${healthData.bodyWater * 2.2} 220`}
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="20"
                    fill="transparent"
                    stroke="#FBBF24"
                    strokeWidth="6"
                    strokeDasharray={`${healthData.skeletalMuscle * 1.57} 157`}
                    transform="rotate(-90 50 50)"
                  />
                  <g transform="translate(38, 38) scale(0.24)">
                    <Activity size={100} stroke="white" strokeWidth="1.5" />
                  </g>
                </svg>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-400 rounded-full mr-2" /> Body Fat
                  </div>
                  <span>{healthData.bodyFat}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-2" /> Body Water
                  </div>
                  <span>{healthData.bodyWater}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2" /> Skeletal Muscle
                  </div>
                  <span>{healthData.skeletalMuscle}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showHeightModal && <HeightModal onSubmit={handleHeightSubmit} onClose={() => setShowHeightModal(false)} />}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={handleConnectionModalClose}
        onConnect={handleDeviceConnect}
        onHealthData={handleHealthData}
      />
    </div>
  )
}

export default Dashboard
