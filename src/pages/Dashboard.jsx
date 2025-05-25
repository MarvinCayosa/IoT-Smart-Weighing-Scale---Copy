"use client"

import { useState, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import HeightModal from "../components/HeightModal"
import ConnectionStatusIndicator from "../components/ConnectionStatusIndicator"
import ConnectionModal from "../components/ConnectionModal"
import WeighingScale from "../components/WeighingScale"
import { useAuth } from "../context/AuthContext"
import { Activity, Thermometer, RefreshCw } from "lucide-react"

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
    weight: null,
    bpm: null,
    spo2: null,
    temperature: null,
    batteryLevel: 100,
    fsr1: null,
    fsr2: null,
    fsr3: null,
    fsr4: null,
  })
  const [bmi, setBmi] = useState(null)
  const [bleHealthData, setBleHealthData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [hasInitialData, setHasInitialData] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // Set up real-time listener for user data
  useEffect(() => {
    if (user?.uid) {
      console.log("Setting up real-time listener for user:", user.uid);
      const unsubscribe = setupUserDataListener(user.uid, (userData) => {
        console.log("Received real-time update:", userData);
        
        // Update health data with user's stored data from latestData
        if (userData.latestData) {
          setHealthData(prev => {
            const newData = {
              ...prev,
              weight: userData.latestData.weight ?? prev.weight,
              bpm: userData.latestData.heart_rate ?? prev.bpm,
              spo2: userData.latestData.spo2 ?? prev.spo2,
              temperature: userData.latestData.temperature ?? prev.temperature,
              fsr1: userData.latestData.fsr1 ?? prev.fsr1,
              fsr2: userData.latestData.fsr2 ?? prev.fsr2,
              fsr3: userData.latestData.fsr3 ?? prev.fsr3,
              fsr4: userData.latestData.fsr4 ?? prev.fsr4,
              bodyFat: userData.latestData.bodyFat ?? prev.bodyFat,
              bodyWater: userData.latestData.bodyWater ?? prev.bodyWater,
              skeletalMuscle: userData.latestData.skeletalMuscle ?? prev.skeletalMuscle
            };
            // Check if we have any non-null values
            if (!hasInitialData && Object.values(newData).some(val => val !== null)) {
              setHasInitialData(true);
            }
            return newData;
          });
        }
        
        // Set username from userInfo
        if (userData.userInfo?.username) {
          setUsername(userData.userInfo.username);
        }
        
        // Set height if available and show height modal if not set
        if (userData.userInfo?.height) {
          calculateBMI(userData.userInfo.height);
          setShowHeightModal(false); // Ensure modal is closed if height exists
        } else if (!userData.userInfo?.height && !showHeightModal) {
          setShowHeightModal(true); // Only show modal if height doesn't exist and modal isn't already showing
        }

        setIsLoading(false);
      });

      // Cleanup subscription on unmount
      return () => {
        console.log("Cleaning up real-time listener");
        unsubscribe();
      };
    }
  }, [user, setupUserDataListener, hasInitialData, showHeightModal]);

  // Add effect to calculate BMI whenever weight changes
  useEffect(() => {
    if (user?.userInfo?.height && healthData.weight) {
      calculateBMI(user.userInfo.height);
    }
  }, [healthData.weight, user?.userInfo?.height]);

  // Remove the initial health data fetch since we're using real-time updates
  useEffect(() => {
    if (user?.uid) {
      setIsLoading(true);
      setError(null);
    }
  }, [user]);

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
        calculateBMI(Number.parseFloat(height))
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

  const handleDeviceConnect = (status, ipAddress) => {
    setIsConnected(status)
    // Save connection state and IP address to localStorage
    localStorage.setItem("bleConnected", status.toString())
    if (ipAddress) {
      localStorage.setItem("esp32IP", ipAddress)
    }
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
        // Data received and updated, session is complete
        setIsRecording(false);
        setIsLoading(false);
        setIsComplete(true);
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

  const handleSessionSubmit = async (sessionName) => {
    try {
      const esp32IP = "192.168.139.68"; // Updated IP address

      console.log("Triggering recording session on ESP32...");
      console.log("Sending POST request to:", `http://${esp32IP}/trigger-record`);

      // Reset states
      setIsRecording(true);
      setIsComplete(false);
      setRecordingProgress(0);
      setIsLoading(true);

      // Start progress animation
      const startTime = Date.now();
      const duration = 10000; // 10 seconds

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setRecordingProgress(progress);

        if (progress >= 100) {
          clearInterval(progressInterval);
          setIsComplete(true);
          setIsRecording(false);
          setIsLoading(false);
        }
      }, 50);

      // Make POST request to ESP32's trigger endpoint
      const response = await fetch(`http://${esp32IP}/trigger-record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: '' // Empty body as expected by ESP32
      });

      console.log("Response status:", response.status);
      const result = await response.text();
      console.log('ESP32 Response:', result);

      if (!response.ok) {
        throw new Error(`Failed to trigger recording: ${result}`);
      }

    } catch (error) {
      console.error('Error triggering recording:', error);
      setError(`Failed to start recording session: ${error.message}`);
      setIsRecording(false);
      setRecordingProgress(0);
      setIsComplete(false);
      setIsLoading(false);
    }
  }

  const handleDismiss = () => {
    setIsRecording(false);
    setRecordingProgress(0);
    setIsComplete(false);
    setShowSessionModal(false);
  }

  return (
    <div className="flex h-screen text-white bg-[#050A04] overflow-hidden">
      {/* Background gradients */}
      <div className="fixed w-[1000px] h-[1000px] bg-[#D3A2FF] opacity-100 blur-[800px] rounded-full top-[-1000px] left-[-350px] z-0"></div>
      <div className="fixed w-[1000px] h-[1000px] bg-[#A9DEFF] opacity-100 blur-[800px] rounded-full bottom-[-1000px] right-[-350px] z-0"></div>

      {/* Sidebar - Hidden on medium and small screens */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-24 md:ml-0 px-3 md:px-6 pt-8 md:pt-8 pb-24 md:pb-6 relative z-10 h-screen overflow-y-auto lg:flex lg:items-center">
        <div className="w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto flex flex-col mb-16 lg:mb-0">
          <div className="w-full">
            <header className="mb-3 w-full flex justify-between items-center">
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
                  Welcome, <span className="text-[#D3A2FF]">{username || "User"}</span>!
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-400">Monitor your health metrics in real-time</p>
              </div>

              {/* Device Status Button */}
              <div 
                onClick={handleConnectionStatusClick}
                className="flex items-center gap-1.5 bg-[#020202] bg-opacity-40 backdrop-blur-30 rounded-[12px] sm:rounded-[15px] px-3 py-1.5 cursor-pointer hover:bg-opacity-60 transition-all duration-200"
              >
                <span className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Sync your device
                </span>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 items-start">
              {/* Left Column - Weight */}
              <div className="h-full flex items-center">
                <div className="w-full">
                  <h2 className="text-xs sm:text-sm text-gray-300 mb-0">Weight</h2>
                  <div className="flex items-end text-white">
                    <span className="text-[4rem] xs:text-[5rem] sm:text-[6rem] md:text-[7rem] lg:text-[8rem] xl:text-[9rem] 2xl:text-[10rem] font-bold leading-none">
                      {isLoading && !hasInitialData ? (
                        <div className="animate-pulse bg-gray-700 rounded-lg w-20 h-16"></div>
                      ) : (
                        healthData.weight ? healthData.weight.toFixed(1) : "--"
                      )}
                    </span>
                    <span className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl ml-1.5 mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">kg</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Vitals and BMI */}
              <div className="space-y-2 sm:space-y-3 h-full">
                {/* Vitals Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button 
                    onClick={() => setShowSessionModal(true)}
                    className="bg-[#D3A2FF] text-black rounded-[12px] sm:rounded-[15px] p-2 sm:p-2.5 flex items-center hover:bg-[#C090EE] transition-all duration-200"
                  >
                    <div className="bg-black bg-opacity-10 p-1.5 rounded-full mr-2">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm sm:text-base font-bold">Start Session</p>
                      <p className="text-xs text-black text-opacity-70"></p>
                    </div>
                  </button>
                  <div className="bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-[12px] sm:rounded-[15px] p-2 sm:p-2.5 flex items-center relative group">
                    <button 
                      onClick={() => setShowBpmInfoModal(true)}
                      className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-gray-500 hover:text-[#D3A2FF] transition-colors duration-200"
                    >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <div className="bg-gray-700 p-1.5 rounded-full mr-2">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                    <div className="relative flex-1">
                      <p className="text-base sm:text-lg font-bold">
                        {isLoading && !hasInitialData ? (
                          <div className="animate-pulse bg-gray-700 rounded-lg w-10 h-5"></div>
                        ) : (
                          healthData.bpm ?? "--"
                        )}
                      </p>
                      <p className="text-xs text-gray-400">bpm</p>
                    </div>
                    {/* Heart Rate Bar */}
                    {healthData.bpm && (
                      <div className="relative w-1.5 h-14 bg-[#1A1F19] rounded-full ml-1.5 mr-4 group">
                        <div 
                          className="absolute bottom-0 w-full rounded-full transition-all duration-300"
                          style={{
                            height: `${Math.min(Math.max(((healthData.bpm - 40) / 120) * 100, 0), 100)}%`,
                            backgroundColor: healthData.bpm > 100 || healthData.bpm < 60 
                              ? '#FF6B6B' 
                              : '#51CF66'
                          }}
                        />
                        {/* Tooltip */}
                        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-[#1A1F19] border border-[#2A2F29] text-white text-xs rounded-lg p-1.5 w-40 z-10 shadow-lg">
                          {healthData.bpm > 100 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] animate-pulse" />
                              <p>High Heart Rate Alert</p>
                            </div>
                          ) : healthData.bpm < 60 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] animate-pulse" />
                              <p>Low Heart Rate Alert</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#51CF66]" />
                              <p>Normal Heart Rate</p>
                            </div>
                          )}
                          <p className="mt-1 text-gray-400 text-[10px]">
                            {healthData.bpm > 100 
                              ? "Your heart rate is elevated. Consider resting and monitoring."
                              : healthData.bpm < 60
                              ? "Your heart rate is lower than normal. This may be normal for athletes."
                              : "Your heart rate is within the normal range (60-100 bpm)."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-[12px] sm:rounded-[15px] p-2 sm:p-2.5 flex items-center relative group">
                    <button 
                      onClick={() => setShowSpo2InfoModal(true)}
                      className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-gray-500 hover:text-[#D3A2FF] transition-colors duration-200"
                    >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <div className="bg-gray-700 p-1.5 rounded-full mr-2">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                        <path d="M12 6a6 6 0 100 12 6 6 0 000-12z" />
                      </svg>
                    </div>
                    <div className="relative flex-1">
                      <p className="text-base sm:text-lg font-bold">
                        {isLoading && !hasInitialData ? (
                          <div className="animate-pulse bg-gray-700 rounded-lg w-10 h-5"></div>
                        ) : (
                          healthData.spo2 ? `${healthData.spo2}%` : "--"
                        )}
                      </p>
                      <p className="text-xs text-gray-400">SpO₂</p>
                    </div>
                    {/* SpO2 Bar */}
                    {healthData.spo2 && (
                      <div className="relative w-1.5 h-14 bg-[#1A1F19] rounded-full ml-1.5 mr-4 group">
                        <div 
                          className="absolute bottom-0 w-full rounded-full transition-all duration-300"
                          style={{
                            height: `${Math.min(Math.max(((healthData.spo2 - 80) / 20) * 100, 0), 100)}%`,
                            backgroundColor: healthData.spo2 < 90 
                              ? '#FF6B6B' 
                              : healthData.spo2 < 95 
                              ? '#FFD43B' 
                              : '#51CF66'
                          }}
                        />
                        {/* Tooltip */}
                        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-[#1A1F19] border border-[#2A2F29] text-white text-xs rounded-lg p-1.5 w-40 z-10 shadow-lg">
                          {healthData.spo2 < 90 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] animate-pulse" />
                              <p>Critical SpO₂ Alert</p>
                            </div>
                          ) : healthData.spo2 < 95 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#FFD43B] animate-pulse" />
                              <p>Low SpO₂ Alert</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#51CF66]" />
                              <p>Normal SpO₂ Level</p>
                            </div>
                          )}
                          <p className="mt-1 text-gray-400 text-[10px]">
                            {healthData.spo2 < 90 
                              ? "Your oxygen level is critically low. Seek medical attention."
                              : healthData.spo2 < 95
                              ? "Your oxygen level is slightly low. Monitor and rest."
                              : "Your oxygen level is within the normal range (95-100%)."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-[12px] sm:rounded-[15px] p-2 sm:p-2.5 flex items-center relative group">
                    <button 
                      onClick={() => setShowTempInfoModal(true)}
                      className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-gray-500 hover:text-[#D3A2FF] transition-colors duration-200"
                    >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <div className="bg-gray-700 p-1.5 rounded-full mr-2">
                      <Thermometer className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" />
                    </div>
                    <div className="relative flex-1">
                      <p className="text-base sm:text-lg font-bold">
                        {isLoading && !hasInitialData ? (
                          <div className="animate-pulse bg-gray-700 rounded-lg w-10 h-5"></div>
                        ) : (
                          healthData.temperature ?? "--"
                        )}
                      </p>
                      <p className="text-xs text-gray-400">Body Temperature</p>
                    </div>
                    {/* Temperature Bar */}
                    {healthData.temperature && (
                      <div className="relative w-1.5 h-14 bg-[#1A1F19] rounded-full ml-1.5 mr-4 group">
                        <div 
                          className="absolute bottom-0 w-full rounded-full transition-all duration-300"
                          style={{
                            height: `${Math.min(Math.max(((parseFloat(healthData.temperature) - 35) / 3) * 100, 0), 100)}%`,
                            backgroundColor: parseFloat(healthData.temperature) > 37.2 
                              ? '#FF6B6B' 
                              : parseFloat(healthData.temperature) < 36.1
                              ? '#4DABF7'
                              : '#51CF66'
                          }}
                        />
                        {/* Tooltip */}
                        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-[#1A1F19] border border-[#2A2F29] text-white text-xs rounded-lg p-1.5 w-40 z-10 shadow-lg">
                          {parseFloat(healthData.temperature) > 37.2 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] animate-pulse" />
                              <p>High Temperature Alert</p>
                            </div>
                          ) : parseFloat(healthData.temperature) < 36.1 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#4DABF7] animate-pulse" />
                              <p>Low Temperature Alert</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#51CF66]" />
                              <p>Normal Temperature</p>
                            </div>
                          )}
                          <p className="mt-1 text-gray-400 text-[10px]">
                            {parseFloat(healthData.temperature) > 37.2 
                              ? "Your body temperature is elevated. Consider monitoring for fever."
                              : parseFloat(healthData.temperature) < 36.1
                              ? "Your body temperature is lower than normal. Keep warm."
                              : "Your body temperature is within the normal range (36.1°C - 37.2°C)."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* BMI */}
                <div className="bg-[#FFFEFE] bg-opacity-10 backdrop-blur-30 rounded-[12px] sm:rounded-[15px] p-2.5 sm:p-3 flex flex-col items-center justify-center relative">
                  <button 
                    onClick={() => setShowBmiInfoModal(true)}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-500 hover:text-[#D3A2FF] transition-colors duration-200"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <h2 className="text-xs sm:text-sm text-gray-400 mb-1">BMI</h2>
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
                    {isLoading && !hasInitialData ? (
                      <div className="animate-pulse bg-gray-700 rounded-lg w-16 h-10"></div>
                    ) : (
                      bmi ?? "--"
                    )}
                  </span>
                  <div className={`px-2 py-0.5 rounded-full text-xs sm:text-sm ${getBmiColorClass()}`}>
                    {isLoading && !hasInitialData ? (
                      <div className="animate-pulse bg-gray-700 rounded-full w-16 h-4"></div>
                    ) : (
                      getBmiCategory() || "Calculating..."
                    )}
                  </div>
                </div>
              </div>

              {/* Foot Pressure Sensors - Spans both columns */}
              <div className="lg:col-span-2 bg-[#020202] bg-opacity-60 backdrop-blur-30 rounded-[12px] sm:rounded-[20px] p-2.5 sm:p-3 mt-4 sm:mt-6">
                <h2 className="text-sm sm:text-base font-semibold mb-3 text-center">Foot Pressure Distribution</h2>
                <div className="w-full h-[120px] sm:h-[140px] md:h-[160px] lg:h-[180px] relative">
                  {/* Pressure Labels */}
                  <div className="absolute inset-0 flex flex-col justify-center">
                    {/* Left and Right Labels */}
                    <div className="flex justify-between px-4 sm:px-8 md:px-12 lg:px-16">
                      <div className="text-center">
                        <div className="text-[10px] xs:text-xs sm:text-sm text-gray-400">Left</div>
                        <div className="text-xs xs:text-sm sm:text-base md:text-lg font-medium text-[#D3A2FF]">
                          {healthData.fsr1 || 0}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] xs:text-xs sm:text-sm text-gray-400">Right</div>
                        <div className="text-xs xs:text-sm sm:text-base md:text-lg font-medium text-[#D3A2FF]">
                          {healthData.fsr2 || 0}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Foot Image */}
                  <img 
                    src="/foot.png" 
                    alt="Foot Pressure Distribution" 
                    className="w-full h-full object-contain invert"
                    style={{ opacity: 0.5 }}
                  />
                </div>
                {/* Balance Status */}
                <div className="mt-2 text-center">
                  {healthData.fsr1 && healthData.fsr2 ? (
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm ${
                      Math.abs(healthData.fsr1 - healthData.fsr2) <= 5 
                        ? 'bg-green-500 bg-opacity-20 text-green-300' 
                        : 'bg-yellow-500 bg-opacity-20 text-yellow-300'
                    }`}>
                      {Math.abs(healthData.fsr1 - healthData.fsr2) <= 5 ? (
                        <>
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Balance Distribution
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Imbalance Distribution
                          <span className="ml-1">
                            ({healthData.fsr1 > healthData.fsr2 ? 'Left Side Heavy' : 'Right Side Heavy'})
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm bg-gray-500 bg-opacity-20 text-gray-300">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      No Pressure Data
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Only visible on medium and small screens */}
      <div className="lg:hidden">
        <Sidebar />
      </div>

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
              <button onClick={handleDismiss} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-gray-300">
              {!isRecording && !isComplete && !isLoading && (
                <>
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
                </>
              )}

              <div className="pt-4">
                {isLoading && (
                  <div className="space-y-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#D3A2FF]"></div>
                    </div>
                    <p className="text-lg font-medium text-white">Please wait...</p>
                    <p className="text-sm text-gray-400">Initializing recording session</p>
                  </div>
                )}

                {isRecording && !isComplete && !isLoading && (
                  <div className="space-y-3">
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-[#D3A2FF] h-3 rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${recordingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-center text-gray-400">
                      Recording in progress... {Math.round(recordingProgress)}%
                    </p>
                  </div>
                )}

                {isComplete && (
                  <div className="space-y-4 text-center">
                    <div className="w-16 h-16 mx-auto bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-white">Recording Complete!</p>
                    <p className="text-sm text-gray-400">Your measurements have been saved.</p>
                    <button
                      onClick={handleDismiss}
                      className="w-full px-4 py-2 bg-[#D3A2FF] text-black rounded-md hover:bg-[#C090EE] transition-colors duration-200"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {!isRecording && !isComplete && !isLoading && (
                  <button
                    onClick={() => handleSessionSubmit("new_session")}
                    disabled={isRecording || isLoading}
                    className="w-full px-4 py-2 bg-[#D3A2FF] text-black rounded-md hover:bg-[#C090EE] transition-colors duration-200"
                  >
                    {isRecording ? "Recording..." : "Start"}
                  </button>
                )}
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
