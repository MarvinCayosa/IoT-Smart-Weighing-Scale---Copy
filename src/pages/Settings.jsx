"use client"

import { useState, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import { Bell, User, Shield, HelpCircle } from "react-feather"
import HeightModal from "../components/HeightModal"
import { useAuth } from "../context/AuthContext"

const Settings = () => {
  const { user, updateUserData, getHealthData } = useAuth()
  const [showHeightModal, setShowHeightModal] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [currentHeight, setCurrentHeight] = useState(null)
  const [settings, setSettings] = useState({
    notifications: {
      weightAlerts: true,
      healthInsights: true,
      weeklyReports: false,
    },
    appearance: {
      darkMode: true,
    },
    units: {
      weightUnit: "kg",
      heightUnit: "cm",
      temperatureUnit: "celsius",
    },
  })

  // Fetch current height when component mounts
  useEffect(() => {
    const fetchCurrentHeight = async () => {
      if (user?.uid) {
        try {
          const healthData = await getHealthData(user.uid)
          setCurrentHeight(healthData.height || 0)
        } catch (error) {
          console.error("Error fetching height:", error)
        }
      }
    }
    fetchCurrentHeight()
  }, [user, getHealthData])

  // Handle toggle changes
  const handleToggle = (category, setting) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: !settings[category][setting],
      },
    })
  }

  // Handle radio button changes
  const handleRadioChange = (category, setting, value) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value,
      },
    })
  }

  // Handle height submission
  const handleHeightSubmit = async (height) => {
    try {
      setError(null)
      setSuccess(null)
      
      if (user?.uid) {
        await updateUserData(user.uid, { height: Number.parseFloat(height) })
        setCurrentHeight(Number.parseFloat(height))
        setSuccess("Height updated successfully")
        setShowHeightModal(false)
      }
    } catch (error) {
      console.error("Error updating height:", error)
      setError("Failed to update height")
    }
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar />

      <main className="flex-1 ml-24 md:ml-28 px-4 md:px-10 pt-8 pb-20 md:pb-8 relative z-10 overflow-y-auto mt-[5vh]">
        <div className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-gray-400">Manage your preferences</p>
          </header>

          {/* Error and Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-20 text-red-300 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-500 bg-opacity-20 text-green-300 rounded-lg">
              {success}
            </div>
          )}

          {/* Settings Sections */}
          <div className="space-y-8">
            {/* Account */}
            <section className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <User className="text-purple-400 mr-3" size={20} />
                <h2 className="text-xl font-medium">Account</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Current Height</h3>
                    <p className="text-sm text-gray-400">
                      {currentHeight ? `${currentHeight} cm` : "Not set"}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowHeightModal(true)}
                    className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md"
                  >
                    Change Height
                  </button>
                </div>

                <button className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-left">
                  Change Password
                </button>

                <button className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-left">
                  Update Profile
                </button>

                <button className="w-full py-2 px-4 bg-red-900 hover:bg-red-800 rounded-md text-left text-red-200">
                  Delete Account
                </button>
              </div>
            </section>

            {/* Notifications */}
            <section className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Bell className="text-blue-400 mr-3" size={20} />
                <h2 className="text-xl font-medium">Notifications</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Weight Alerts</h3>
                    <p className="text-sm text-gray-400">Get notified about significant weight changes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.notifications.weightAlerts}
                      onChange={() => handleToggle("notifications", "weightAlerts")}
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Health Insights</h3>
                    <p className="text-sm text-gray-400">Receive personalized health recommendations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.notifications.healthInsights}
                      onChange={() => handleToggle("notifications", "healthInsights")}
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Weekly Reports</h3>
                    <p className="text-sm text-gray-400">Get a summary of your health data every week</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.notifications.weeklyReports}
                      onChange={() => handleToggle("notifications", "weeklyReports")}
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </section>

            {/* Units */}
            <section className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Shield className="text-green-400 mr-3" size={20} />
                <h2 className="text-xl font-medium">Units</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Weight Unit</h3>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="weightUnit"
                        value="kg"
                        checked={settings.units.weightUnit === "kg"}
                        onChange={() => handleRadioChange("units", "weightUnit", "kg")}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-600 focus:ring-offset-gray-800"
                      />
                      <span className="ml-2">Kilograms (kg)</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="weightUnit"
                        value="lb"
                        checked={settings.units.weightUnit === "lb"}
                        onChange={() => handleRadioChange("units", "weightUnit", "lb")}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-600 focus:ring-offset-gray-800"
                      />
                      <span className="ml-2">Pounds (lb)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Height Unit</h3>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="heightUnit"
                        value="cm"
                        checked={settings.units.heightUnit === "cm"}
                        onChange={() => handleRadioChange("units", "heightUnit", "cm")}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-600 focus:ring-offset-gray-800"
                      />
                      <span className="ml-2">Centimeters (cm)</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="heightUnit"
                        value="ft"
                        checked={settings.units.heightUnit === "ft"}
                        onChange={() => handleRadioChange("units", "heightUnit", "ft")}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-600 focus:ring-offset-gray-800"
                      />
                      <span className="ml-2">Feet/Inches (ft/in)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Temperature Unit</h3>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="temperatureUnit"
                        value="celsius"
                        checked={settings.units.temperatureUnit === "celsius"}
                        onChange={() => handleRadioChange("units", "temperatureUnit", "celsius")}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-600 focus:ring-offset-gray-800"
                      />
                      <span className="ml-2">Celsius (°C)</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="temperatureUnit"
                        value="fahrenheit"
                        checked={settings.units.temperatureUnit === "fahrenheit"}
                        onChange={() => handleRadioChange("units", "temperatureUnit", "fahrenheit")}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-600 focus:ring-offset-gray-800"
                      />
                      <span className="ml-2">Fahrenheit (°F)</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* Help & Support */}
            <section className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <HelpCircle className="text-yellow-400 mr-3" size={20} />
                <h2 className="text-xl font-medium">Help & Support</h2>
              </div>

              <div className="space-y-4">
                <button className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-left">FAQs</button>

                <button className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-left">
                  Contact Support
                </button>

                <button className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-left">
                  Privacy Policy
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Height Modal */}
      {showHeightModal && (
        <HeightModal 
          currentHeight={currentHeight}
          onSubmit={handleHeightSubmit} 
          onClose={() => {
            setShowHeightModal(false)
            setError(null)
            setSuccess(null)
          }} 
        />
      )}
    </div>
  )
}

export default Settings
