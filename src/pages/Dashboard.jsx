"use client"

import { useState, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import HeightModal from "../components/HeightModal"
import ConnectionStatusIndicator from "../components/ConnectionStatusIndicator"
import ConnectionModal from "../components/ConnectionModal"
import WeighingScale from "../components/WeighingScale"
import { useAuth } from "../context/AuthContext"
import { Activity } from "lucide-react"

const Dashboard = () => {
  const { user, getHealthData, setupUserDataListener, updateUserData, error: authError } = useAuth()
  const [showHeightModal, setShowHeightModal] = useState(false)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showBmiInfoModal, setShowBmiInfoModal] = useState(false)
  const [showSpo2InfoModal, setShowSpo2InfoModal] = useState(false)
  const [showBpmInfoModal, setShowBpmInfoModal] = useState(false)
  const [showTempInfoModal, setShowTempInfoModal] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [esp32Status, setEsp32Status] = useState('offline')
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [healthData, setHealthData] = useState({
    weight: 0,
    bpm: 0,
    spo2: 0,
    temperature: 0,
    batteryLevel: 100,
    FSR1: 0,
    FSR2: 0,
    FSR3: 0,
    FSR4: 0,
  })
  const [bmi, setBmi] = useState(0)
  const [bleHealthData, setBleHealthData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Set up real-time listener for user data
  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = setupUserDataListener(user.uid, (userData) => {
        // Update health data with user's stored data
        setHealthData(prev => ({
          ...prev,
          weight: userData.healthData?.weight || prev.weight,
          bpm: userData.healthData?.bpm || prev.bpm,
          spo2: userData.healthData?.spo2 || prev.spo2,
          temperature: userData.healthData?.temperature || prev.temperature,
          bodyFat: userData.healthData?.bodyFat || prev.bodyFat,
          bodyWater: userData.healthData?.bodyWater || prev.bodyWater,
          skeletalMuscle: userData.healthData?.skeletalMuscle || prev.skeletalMuscle,
          FSR1: userData.FSR1 || prev.FSR1,
          FSR2: userData.FSR2 || prev.FSR2,
          FSR3: userData.FSR3 || prev.FSR3,
          FSR4: userData.FSR4 || prev.FSR4,
        }))
        
        // Set BMI if available
        if (userData.bmi) {
          setBmi(userData.bmi)
        }

        setIsLoading(false)
      })

      return () => unsubscribe()
    }
  }, [user, setupUserDataListener])

  // Initial health data fetch
  useEffect(() => {
    const loadHealthData = async () => {
      if (user?.uid) {
        try {
          setIsLoading(true)
          setError(null)
          console.log("Loading health data for user:", user.uid)
          
          const healthData = await getHealthData(user.uid)
          console.log("Received health data:", healthData)
          
          if (healthData) {
            // Update health data state with data from Firestore
            setHealthData(prev => ({
              ...prev,
              weight: healthData.healthData?.weight || prev.weight,
              bpm: healthData.healthData?.bpm || prev.bpm,
              spo2: healthData.healthData?.spo2 || prev.spo2,
              temperature: healthData.healthData?.temperature || prev.temperature,
              bodyFat: healthData.healthData?.bodyFat || prev.bodyFat,
              bodyWater: healthData.healthData?.bodyWater || prev.bodyWater,
              skeletalMuscle: healthData.healthData?.skeletalMuscle || prev.skeletalMuscle,
              FSR1: healthData.FSR1 || prev.FSR1,
              FSR2: healthData.FSR2 || prev.FSR2,
              FSR3: healthData.FSR3 || prev.FSR3,
              FSR4: healthData.FSR4 || prev.FSR4,
            }))
            
            // Set BMI if available
            if (healthData.bmi) {
              setBmi(healthData.bmi)
            }

            // Show height modal if height is missing or 0
            if (!healthData.height || healthData.height === 0) {
              setShowHeightModal(true)
            }
          }
        } catch (error) {
          console.error("Error in loadHealthData:", error)
          setError(error.message || "Failed to load health data")
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadHealthData()
  }, [user, getHealthData])

  // Remove the height check from localStorage since we're using Firestore
  useEffect(() => {
    // Check if we have a saved connection state
    const savedConnectionState = localStorage.getItem("bleConnected")
    if (savedConnectionState === "true") {
      setIsConnected(true)
    }

    // Battery status monitoring
    if ('getBattery' in navigator) {
      navigator.getBattery().then(function(battery) {
        function updateBatteryStatus() {
          const level = Math.floor(battery.level * 100);
          setHealthData(prev => ({
            ...prev,
            batteryLevel: level
          }));
        }

        battery.addEventListener('levelchange', updateBatteryStatus);
        updateBatteryStatus();
      });
    }
  }, [])

  const calculateBMI = (height) => {
    if (height && healthData.weight) {
      const heightInMeters = height / 100
      const bmiValue = (healthData.weight / (heightInMeters * heightInMeters)).toFixed(1)
      setBmi(Number.parseFloat(bmiValue))
    }
  }

  // Handle height submission
  const handleHeightSubmit = async (height) => {
    try {
      // Update height in Firestore
      if (user?.uid) {
        await updateUserData(user.uid, { height: Number.parseFloat(height) })
        setShowHeightModal(false)
      }
    } catch (error) {
      console.error("Error updating height:", error)
      setError("Failed to save height")
    }
  }

  const getBmiCategory = () => {
    if (!bmi) return "Height Required"
    if (bmi < 18.5) return "Underweight"
    if (bmi < 25) return "Normal"
    if (bmi < 30) return "Overweight"
    return "Obese"
  }

  const getBmiColorClass = () => {
    if (!bmi) return "bg-gray-500"
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

  // Handle health data updates
  const handleHealthData = async (data) => {
    try {
      setBleHealthData(data)
      
      // Update health data in Firestore
      if (user?.uid) {
        await updateUserData(user.uid, {
          weight: data.weight,
          bpm: data.hr,
          spo2: data.spo2,
          temperature: data.temp,
          bodyFat: data.bodyFat,
          bodyWater: data.bodyWater,
          skeletalMuscle: data.skeletalMuscle
        })
      }
    } catch (error) {
      console.error("Error updating health data:", error)
      setError("Failed to save health measurements")
    }
  }

  const getBatteryColor = (level) => {
    if (level <= 20) return "#ef4444"; // red
    if (level <= 50) return "#f59e0b"; // orange
    return "#22c55e"; // green
  }

  const handleSessionSubmit = (sessionName) => {
    // Handle session start logic here
    console.log("Starting session:", sessionName)
    setShowSessionModal(false)
  }

  return (
    <div className="flex h-screen text-white bg-[#050A04] overflow-hidden">
      {/* Background gradients */}
      <div className="fixed w-[1000px] h-[1000px] bg-[#D3A2FF] opacity-100 blur-[800px] rounded-full top-[-1000px] left-[-350px] z-0"></div>
      <div className="fixed w-[1000px] h-[1000px] bg-[#A9DEFF] opacity-100 blur-[800px] rounded-full bottom-[-1000px] right-[-350px] z-0"></div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 ml-24 md:ml-28 px-4 md:px-10 pt-8 pb-20 md:pb-8 relative z-10 overflow-y-auto mt-[5vh]">
        <div className="max-w-6xl mx-auto">
          {/* Error Display */}
          {(error || authError) && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-20 text-red-300 rounded-lg">
              {error || authError}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-[28px] md:text-[36px] font-bold">
                Welcome, <span className="text-[#D3A2FF]">{user?.name || "User"}</span>!
              </h1>
              <p className="text-sm sm:text-[16px] text-gray-400">Here Is Your Dashboard</p>
            </div>

            {/* Action buttons */}
            <div className="mt-2 sm:mt-0 flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-[20px] sm:rounded-[30px] px-4 py-2">
                <div className="relative w-6 h-3">
                  <div className="absolute inset-0 border-2 border-white rounded-sm">
                    <div 
                      className="h-full bg-white rounded-sm transition-all duration-300"
                      style={{ 
                        width: `${healthData.batteryLevel}%`,
                        backgroundColor: getBatteryColor(healthData.batteryLevel)
                      }}
                    />
                  </div>
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-1.5 bg-white rounded-r-sm" />
                </div>
                <span className={healthData.batteryLevel <= 20 ? "text-red-500" : healthData.batteryLevel <= 50 ? "text-yellow-500" : "text-green-500"}>
                  {healthData.batteryLevel}%
                </span>
              </div>
              <ConnectionStatusIndicator isConnected={isConnected} onClick={handleConnectionStatusClick} />
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
            {/* Main Section Left */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Weight */}
              <div>
                <h2 className="text-sm sm:text-base text-gray-300 mb-0">Weight</h2>
                <div className="flex items-end text-white">
                  <span className="text-[5rem] xs:text-[5rem] sm:text-[8rem] md:text-[8rem] lg:text-[12rem] xl:text-[15rem] 2xl:text-[15rem] font-bold leading-none">{healthData.weight}</span>
                  <span className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl ml-2 mb-2 sm:mb-3 md:mb-4 lg:mb-6">kg</span>
                </div>
              </div>

              {/* Vitals and BMI Container */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Vitals */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button 
                    onClick={() => setShowSessionModal(true)}
                    className="bg-[#D3A2FF] text-black rounded-[20px] sm:rounded-[30px] p-3 sm:p-4 flex items-center hover:bg-[#C090EE] transition-all duration-200"
                  >
                    <div className="bg-black bg-opacity-10 p-2 rounded-full mr-2 sm:mr-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg sm:text-xl font-bold">Start Session</p>
                      <p className="text-xs text-black text-opacity-70"></p>
                    </div>
                  </button>
                  <div className="bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-[20px] sm:rounded-[30px] p-3 sm:p-4 flex items-center relative">
                    <button 
                      onClick={() => setShowBpmInfoModal(true)}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-500 hover:text-[#D3A2FF] transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <div className="bg-gray-700 p-2 rounded-full mr-2 sm:mr-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{healthData.bpm}</p>
                      <p className="text-xs text-gray-400">bpm</p>
                    </div>
                  </div>
                  <div className="bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-[20px] sm:rounded-[30px] p-3 sm:p-4 flex items-center relative">
                    <button 
                      onClick={() => setShowSpo2InfoModal(true)}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-500 hover:text-[#D3A2FF] transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <div className="bg-gray-700 p-2 rounded-full mr-2 sm:mr-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                        <path d="M12 6a6 6 0 100 12 6 6 0 000-12z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{healthData.spo2}%</p>
                      <p className="text-xs text-gray-400">SpO₂</p>
                    </div>
                  </div>
                  <div className="bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-[20px] sm:rounded-[30px] p-3 sm:p-4 flex items-center relative">
                    <button 
                      onClick={() => setShowTempInfoModal(true)}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-500 hover:text-[#D3A2FF] transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <div className="bg-gray-700 p-2 rounded-full mr-2 sm:mr-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{healthData.temperature}</p>
                      <p className="text-xs text-gray-400">Body Temperature</p>
                    </div>
                  </div>
                </div>

                {/* BMI */}
                <div className="bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-[20px] sm:rounded-[30px] p-4 sm:p-6 flex flex-col items-center justify-center h-full relative">
                  <button 
                    onClick={() => setShowBmiInfoModal(true)}
                    className="absolute top-4 right-4 sm:top-5 sm:right-5 text-gray-500 hover:text-[#D3A2FF] transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <h2 className="text-xs sm:text-sm text-gray-400 mb-2">BMI</h2>
                  <span className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2">{bmi || "--"}</span>
                  <div className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm ${getBmiColorClass()}`}>
                    {getBmiCategory() || "Calculating..."}
                  </div>
                </div>
              </div>
            </div>

            {/* Body Composition Chart - Right Section */}
            <div className="bg-[#020202] bg-opacity-60 backdrop-blur-30 rounded-[20px] sm:rounded-[40px] p-4 sm:p-6 lg:h-full flex flex-col">
              {/* Body Composition Metrics */}
              <div className="flex-1 flex flex-col justify-center mb-6">
                <h2 className="text-base sm:text-lg font-semibold mb-6 text-center">Body Composition</h2>
                <div className="flex justify-center">
                  <div className="relative w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px] lg:w-[220px] lg:h-[220px]">
                    {/* Outer Circle - Body Fat */}
                    <svg className="absolute w-full h-full" viewBox="0 0 261 261">
                      <circle
                        cx="130.5"
                        cy="130.5"
                        r="124"
                        fill="none"
                        stroke="rgba(96,96,96,0.15)"
                        strokeWidth="13"
                      />
                      <circle
                        cx="130.5"
                        cy="130.5"
                        r="124"
                        fill="none"
                        stroke="rgba(219,72,72,0.91)"
                        strokeWidth="13"
                        strokeLinecap="round"
                        strokeDasharray={`${(healthData.bodyFat / 100) * 2 * Math.PI * 124} ${2 * Math.PI * 124}`}
                        transform="rotate(-90 130.5 130.5)"
                        className="transition-all duration-1000 ease-in-out"
                      />
                    </svg>
                    
                    {/* Middle Circle - Body Water */}
                    <svg className="absolute w-[87%] h-[87%] left-[6.5%] top-[6.5%]" viewBox="0 0 227 227">
                      <circle
                        cx="113.5"
                        cy="113.5"
                        r="107"
                        fill="none"
                        stroke="rgba(96,96,96,0.15)"
                        strokeWidth="13"
                      />
                      <circle
                        cx="113.5"
                        cy="113.5"
                        r="107"
                        fill="none"
                        stroke="#169CD2"
                        strokeWidth="13"
                        strokeLinecap="round"
                        strokeDasharray={`${(healthData.bodyWater / 100) * 2 * Math.PI * 107} ${2 * Math.PI * 107}`}
                        transform="rotate(-90 113.5 113.5)"
                        className="transition-all duration-1000 ease-in-out"
                      />
                    </svg>
                    
                    {/* Inner Circle - Skeletal Muscle */}
                    <svg className="absolute w-[74%] h-[74%] left-[13%] top-[13%]" viewBox="0 0 193 193">
                      <circle
                        cx="96.5"
                        cy="96.5"
                        r="90"
                        fill="none"
                        stroke="rgba(96,96,96,0.15)"
                        strokeWidth="13"
                      />
                      <circle
                        cx="96.5"
                        cy="96.5"
                        r="90"
                        fill="none"
                        stroke="#DED24C"
                        strokeWidth="13"
                        strokeLinecap="round"
                        strokeDasharray={`${(healthData.skeletalMuscle / 100) * 2 * Math.PI * 90} ${2 * Math.PI * 90}`}
                        transform="rotate(-90 96.5 96.5)"
                        className="transition-all duration-1000 ease-in-out"
                      />
                    </svg>

                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-center">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-2 h-2 rounded-full bg-[rgba(219,72,72,0.91)]"></div>
                          <span className="text-xs sm:text-sm text-gray-300">Body Fat: {healthData.bodyFat}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#169CD2]"></div>
                          <span className="text-xs sm:text-sm text-gray-300">Body Water: {healthData.bodyWater}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#DED24C]"></div>
                          <span className="text-xs sm:text-sm text-gray-300">Muscle: {healthData.skeletalMuscle}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Foot Image with Pressure Labels */}
              <div className="flex-1 flex items-end">
                <div className="w-full h-[160px] sm:h-[180px] md:h-[200px] lg:h-[220px] relative">
                  {/* Pressure Labels */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {/* Top Row - Front Sensors */}
                    <div className="flex justify-between px-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Front Left</div>
                        <div className="text-sm font-medium text-[#D3A2FF]">{healthData.FSR1 || 0}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Front Right</div>
                        <div className="text-sm font-medium text-[#D3A2FF]">{healthData.FSR3 || 0}%</div>
                      </div>
                    </div>

                    {/* Bottom Row - Back Sensors */}
                    <div className="flex justify-between px-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Back Left</div>
                        <div className="text-sm font-medium text-[#D3A2FF]">{healthData.FSR2 || 0}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Back Right</div>
                        <div className="text-sm font-medium text-[#D3A2FF]">{healthData.FSR4 || 0}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Foot Image */}
                  <img 
                    src="/foot.png" 
                    alt="Body Composition" 
                    className="w-full h-full object-contain invert"
                    style={{ opacity: 0.5 }}
                  />
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
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Smart Scale Instructions</h2>
              <button onClick={() => setShowSessionModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-gray-300">
              <p className="text-sm italic">
                Follow these steps to start your session:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="bg-[#D3A2FF] text-black rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <p className="text-sm italic">Ensure your weighing scale status is online</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-[#D3A2FF] text-black rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <p className="text-sm italic">Stand still on the scale with bare feet for accurate measurements</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-[#D3A2FF] text-black rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <p className="text-sm italic">Wait for the measurements to complete (at least 10 seconds)</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-[#D3A2FF] text-black rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                    <span className="text-sm font-bold">4</span>
                  </div>
                  <p className="text-sm italic">Check your measurements on the dashboard</p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="w-full px-4 py-2 bg-[#D3A2FF] text-black rounded-md hover:bg-[#C090EE] transition-colors duration-200"
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showBmiInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">BMI Information</h2>
              <button onClick={() => setShowBmiInfoModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-gray-300">
              <p className="text-sm">
                Body Mass Index (BMI) is a measure of body fat based on height and weight. Here's what the categories mean:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <p className="text-sm">Underweight: BMI less than 18.5</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <p className="text-sm">Normal: BMI between 18.5 and 24.9</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <p className="text-sm">Overweight: BMI between 25 and 29.9</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <p className="text-sm">Obese: BMI 30 or higher</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Note: BMI is a screening tool but not a diagnostic of body fatness or health. Consult with a healthcare provider for a comprehensive health assessment.
              </p>
            </div>
          </div>
        </div>
      )}
      {showSpo2InfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">SpO₂ Information</h2>
              <button onClick={() => setShowSpo2InfoModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-gray-300">
              <p className="text-sm">
                SpO₂ (Peripheral Oxygen Saturation) measures the oxygen level in your blood. Here's what the levels mean:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <p className="text-sm">Critical: Below 90% - Requires immediate medical attention</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <p className="text-sm">Low: 90-94% - May indicate health issues</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <p className="text-sm">Normal: 95-100% - Healthy oxygen level</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Factors Affecting SpO₂:</h3>
                <ul className="text-xs space-y-2">
                  <li>• Altitude and air quality</li>
                  <li>• Physical activity level</li>
                  <li>• Respiratory conditions</li>
                  <li>• Smoking and air pollution</li>
                </ul>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Note: SpO₂ readings can vary throughout the day. Consult with a healthcare provider if you consistently see readings below 95%.
              </p>
            </div>
          </div>
        </div>
      )}
      {showBpmInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Heart Rate (BPM) Information</h2>
              <button onClick={() => setShowBpmInfoModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-gray-300">
              <p className="text-sm">
                Heart Rate (BPM - Beats Per Minute) measures how many times your heart beats in one minute. Here's what the ranges mean:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <p className="text-sm">High: Above 100 BPM (at rest) - May indicate stress or health issues</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <p className="text-sm">Normal: 60-100 BPM (at rest) - Healthy adult range</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <p className="text-sm">Low: Below 60 BPM - May be normal for athletes</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Factors Affecting Heart Rate:</h3>
                <ul className="text-xs space-y-2">
                  <li>• Physical activity and exercise</li>
                  <li>• Stress and emotional state</li>
                  <li>• Age and fitness level</li>
                  <li>• Medications and caffeine</li>
                </ul>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Note: Heart rate varies throughout the day. Consult with a healthcare provider if you notice persistent abnormal readings.
              </p>
            </div>
          </div>
        </div>
      )}
      {showTempInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Body Temperature Information</h2>
              <button onClick={() => setShowTempInfoModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-gray-300">
              <p className="text-sm">
                Body Temperature is a measure of your body's ability to generate and get rid of heat. Here's what the ranges mean:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <p className="text-sm">High: Above 37.5°C - May indicate fever or infection</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <p className="text-sm">Normal: 36.1°C - 37.2°C - Healthy adult range</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <p className="text-sm">Low: Below 36.1°C - May indicate hypothermia</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Factors Affecting Body Temperature:</h3>
                <ul className="text-xs space-y-2">
                  <li>• Time of day (lower in morning, higher in evening)</li>
                  <li>• Physical activity and exercise</li>
                  <li>• Age and gender</li>
                  <li>• Environmental temperature</li>
                </ul>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Note: Body temperature can vary throughout the day. Consult with a healthcare provider if you notice persistent abnormal readings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
