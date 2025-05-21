"use client"

import { useState, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { useAuth } from "../context/AuthContext"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { db } from "../firebase"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const History = () => {
  const [activeTab, setActiveTab] = useState("weight")
  const [healthData, setHealthData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchHealthData = async () => {
      if (!user?.uid) {
        setError("Please log in to view your health history")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const healthRef = collection(db, "users", user.uid, "healthHistory")
        const q = query(healthRef, orderBy("timestamp", "asc"))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          setError("No health data available")
          setIsLoading(false)
          return
        }

        const data = snapshot.docs.map(doc => ({
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        }))

        setHealthData(data)
      } catch (error) {
        console.error("Error fetching health data:", error)
        setError("Failed to load health data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHealthData()
  }, [user])

  const getChartData = (key) => ({
    labels: healthData.map((entry) => entry.timestamp),
    datasets: [
      {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        data: healthData.map((entry) => entry[key] || 0),
        borderColor:
          key === "weight"
            ? "rgb(99, 102, 241)"
            : key === "bpm"
            ? "rgb(239, 68, 68)"
            : key === "spo2"
            ? "rgb(14, 165, 233)"
            : "rgb(234, 88, 12)",
        backgroundColor:
          key === "weight"
            ? "rgba(99, 102, 241, 0.5)"
            : key === "bpm"
            ? "rgba(239, 68, 68, 0.5)"
            : key === "spo2"
            ? "rgba(14, 165, 233, 0.5)"
            : "rgba(234, 88, 12, 0.5)",
        tension: 0.3,
      },
    ],
  })

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "white",
        },
      },
    },
    scales: {
      y: {
        ticks: { color: "rgba(255, 255, 255, 0.7)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      x: {
        ticks: { color: "rgba(255, 255, 255, 0.7)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  }

  // Tab data
  const tabs = [
    { id: "weight", label: "Weight" },
    { id: "bpm", label: "Heart Rate" },
    { id: "spo2", label: "Oxygen" },
    { id: "temperature", label: "Temperature" },
  ]

  const getSummary = (key) => {
    if (!healthData.length) return { avg: "-", max: "-", min: "-", change: "-" }
    
    const values = healthData.map((entry) => entry[key] || 0)
    const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
    const max = Math.max(...values).toFixed(1)
    const min = Math.min(...values).toFixed(1)
    const change = (values[values.length - 1] - values[0]).toFixed(1)

    return { avg, max, min, change }
  }

  const summary = getSummary(activeTab)

  return (
    <div className="flex h-screen bg-[#050A04] text-white">
      <div className="fixed w-[1000px] h-[1000px] bg-[#D3A2FF] opacity-100 blur-[800px] rounded-full top-[-1000px] left-[-350px] z-0"></div>
      <div className="fixed w-[1000px] h-[1000px] bg-[#A9DEFF] opacity-100 blur-[800px] rounded-full bottom-[-1000px] right-[-350px] z-0"></div>

      <Sidebar />

      <main className="flex-1 ml-24 md:ml-28 px-4 md:px-10 pt-8 pb-20 md:pb-8 relative z-10 overflow-y-auto mt-[5vh]">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl font-bold">History</h1>
            <p className="text-gray-400">View your health trends over time</p>
          </header>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-20 text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-700 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-4 py-2 font-medium ${
                  activeTab === tab.id
                    ? "text-blue-500 border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {!isLoading && !error && healthData.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="h-80">
                <Line options={chartOptions} data={getChartData(activeTab)} />
              </div>
            </div>
          )}

          {/* No Data Message */}
          {!isLoading && !error && healthData.length === 0 && (
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <p className="text-gray-400">No health data available for the selected period</p>
            </div>
          )}

          {/* Stats Summary */}
          {!isLoading && !error && healthData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm text-gray-400 mb-1">Average</h3>
                <div className="text-xl font-bold">
                  {summary.avg} {activeTab === "spo2" ? "%" : activeTab === "temperature" ? "°C" : activeTab === "bpm" ? "BPM" : "kg"}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm text-gray-400 mb-1">Highest</h3>
                <div className="text-xl font-bold">
                  {summary.max} {activeTab === "spo2" ? "%" : activeTab === "temperature" ? "°C" : activeTab === "bpm" ? "BPM" : "kg"}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm text-gray-400 mb-1">Lowest</h3>
                <div className="text-xl font-bold">
                  {summary.min} {activeTab === "spo2" ? "%" : activeTab === "temperature" ? "°C" : activeTab === "bpm" ? "BPM" : "kg"}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm text-gray-400 mb-1">Change</h3>
                <div className="text-xl font-bold">
                  {summary.change} {activeTab === "spo2" ? "%" : activeTab === "temperature" ? "°C" : activeTab === "bpm" ? "BPM" : "kg"}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default History
