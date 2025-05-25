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
import { collection, getDocs, orderBy, query, where } from "firebase/firestore"
import { db } from "../firebase"
import { ChevronDown, Check, TrendingUp, TrendingDown, BarChart2, Activity, Calendar } from "lucide-react"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const History = () => {
  const [activeTab, setActiveTab] = useState("weight")
  const [healthData, setHealthData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeFilter, setTimeFilter] = useState("day")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showTabDropdown, setShowTabDropdown] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const { user } = useAuth()

  // Get available months from data
  const getAvailableMonths = () => {
    const months = new Set()
    healthData.forEach(entry => {
      const date = new Date(entry.timestamp)
      months.add(date.toLocaleString('default', { month: 'long', year: 'numeric' }))
    })
    return Array.from(months).sort((a, b) => {
      const dateA = new Date(a)
      const dateB = new Date(b)
      return dateB - dateA
    })
  }

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
        console.log("Fetching health data for user:", user.uid)

        // Fetch all data from the history collection
        const historyRef = collection(db, "users", user.uid, "history")
        const q = query(historyRef, orderBy("timestamp", "desc"))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          console.log("No health data found in history collection")
          setHealthData([])
          setError("No health data available")
          return
        }

        const data = snapshot.docs.map(doc => {
          const docData = doc.data()
          return {
            ...docData,
            timestamp: docData.timestamp,
            bpm: docData.heart_rate || 0,
            weight: docData.weight || 0,
            spo2: docData.spo2 || 0,
            temperature: docData.temperature || 0
          }
        })

        console.log("Fetched health data:", data)
        setHealthData(data)
      } catch (error) {
        console.error("Error fetching health data:", error)
        setError(`Failed to load health data: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHealthData()
  }, [user])

  const getFilteredData = () => {
    const now = new Date()
    let filteredData = [...healthData]

    switch (timeFilter) {
      case "day":
        // Filter last 24 hours
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        filteredData = healthData.filter(entry => new Date(entry.timestamp) >= dayAgo)
        break

      case "week":
        // Filter last 7 days and group by day
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filteredData = healthData.filter(entry => new Date(entry.timestamp) >= weekAgo)
        
        // Group by day and calculate averages
        const dailyData = {}
        filteredData.forEach(entry => {
          const date = new Date(entry.timestamp)
          const dayKey = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
          })
          
          if (!dailyData[dayKey]) {
            dailyData[dayKey] = {
              values: [],
              timestamp: entry.timestamp
            }
          }
          dailyData[dayKey].values.push(entry[activeTab] || 0)
        })

        // Convert to array of daily averages
        filteredData = Object.entries(dailyData).map(([day, data]) => ({
          timestamp: data.timestamp,
          [activeTab]: data.values.reduce((a, b) => a + b, 0) / data.values.length
        }))
        break

      case "month":
        // Filter selected month and group by week
        const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
        const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
        filteredData = healthData.filter(entry => {
          const date = new Date(entry.timestamp)
          return date >= monthStart && date <= monthEnd
        })

        // Group by week and calculate averages
        const weeklyData = {}
        filteredData.forEach(entry => {
          const date = new Date(entry.timestamp)
          const weekNumber = Math.floor((date - monthStart) / (7 * 24 * 60 * 60 * 1000))
          const weekKey = `Week ${weekNumber + 1}`
          
          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
              values: [],
              timestamp: entry.timestamp
            }
          }
          weeklyData[weekKey].values.push(entry[activeTab] || 0)
        })

        // Convert to array of weekly averages
        filteredData = Object.entries(weeklyData).map(([week, data]) => ({
          timestamp: data.timestamp,
          [activeTab]: data.values.reduce((a, b) => a + b, 0) / data.values.length
        }))
        break
    }

    return filteredData
  }

  const getChartData = (key) => {
    const filteredData = getFilteredData()

    return {
      labels: filteredData.map((entry) => {
        const date = new Date(entry.timestamp)
        if (timeFilter === "month") {
          const weekNumber = Math.floor((date - new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)) / (7 * 24 * 60 * 60 * 1000)) + 1
          return `Week ${weekNumber}`
        }
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        }).split(", ").join("\n")
      }),
      datasets: [
        {
          label: key === "bpm" ? "Heart Rate" : key.charAt(0).toUpperCase() + key.slice(1),
          data: filteredData.map((entry) => entry[key] || 0),
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
    }
  }

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "center",
        labels: {
          color: "white",
          font: {
            size: 10,
            weight: "500"
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          boxHeight: 8,
          margin: activeTab === "weight" ? 20 : 0 // Add extra margin for weight label
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        padding: 8,
        cornerRadius: 6,
        displayColors: true,
        usePointStyle: true,
        titleFont: {
          size: 10
        },
        bodyFont: {
          size: 10
        },
        callbacks: {
          title: function(context) {
            if (timeFilter === "month") {
              return context[0].label;
            }
            const date = new Date(context[0].label);
            return date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true
            }).split(", ").join("\n");
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1);
              if (activeTab === "spo2") label += "%";
              else if (activeTab === "temperature") label += "°C";
              else if (activeTab === "bpm") label += " BPM";
              else if (activeTab === "weight") label += " kg";
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: { 
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            size: 9
          },
          padding: 8
        },
        grid: { 
          color: "rgba(255, 255, 255, 0.1)",
          drawBorder: false
        },
        border: {
          display: false
        }
      },
      x: {
        ticks: { 
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            size: 9
          },
          maxRotation: 0,
          minRotation: 0,
          padding: 8,
          callback: function(value, index) {
            if (timeFilter === "month") {
              return this.getLabelForValue(value);
            }
            const date = new Date(this.getLabelForValue(value));
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true
            }).split(", ").join("\n");
          }
        },
        grid: { 
          color: "rgba(255, 255, 255, 0.1)",
          drawBorder: false
        },
        border: {
          display: false
        }
      },
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 4,
        hoverBorderWidth: 2,
        hoverBorderColor: "white"
      },
      line: {
        borderWidth: 1.5,
        tension: 0.4
      }
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false
    },
    animation: {
      duration: 750,
      easing: "easeInOutQuart"
    }
  }

  const timeFilterOptions = [
    { id: "day", label: "Last 24 Hours" },
    { id: "week", label: "Last 7 Days" },
    { id: "month", label: "Monthly View" }
  ]

  const tabOptions = [
    { id: "weight", label: "Weight" },
    { id: "bpm", label: "Heart Rate" },
    { id: "spo2", label: "Oxygen" },
    { id: "temperature", label: "Temperature" }
  ]

  const handleFilterSelect = (filterId) => {
    setTimeFilter(filterId)
    setShowFilterDropdown(false)
  }

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId)
    setShowTabDropdown(false)
  }

  const getSummary = (key) => {
    if (!healthData.length) {
      console.log("No health data available for summary")
      return { avg: "-", max: "-", min: "-", change: "-" }
    }
    
    // Filter data based on timeFilter
    const now = new Date()
    let startDate = new Date()
    switch (timeFilter) {
      case "day":
        startDate.setHours(now.getHours() - 24)
        break
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setDate(now.getDate() - 30)
        break
      default:
        // No date filter for "all" time
        startDate = null
    }

    console.log("Calculating summary for:", key)
    console.log("Start date for summary filter:", startDate)

    const filteredData = startDate 
      ? healthData.filter(entry => {
          const entryDate = new Date(entry.timestamp)
          const isInRange = entryDate >= startDate
          console.log("Entry date:", entryDate, "Is in range:", isInRange)
          return isInRange
        })
      : healthData

    console.log("Filtered data for summary:", filteredData)

    const values = filteredData.map((entry) => entry[key] || 0)
    const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
    const max = Math.max(...values).toFixed(1)
    const min = Math.min(...values).toFixed(1)
    const change = (values[0] - values[values.length - 1]).toFixed(1)

    console.log("Summary calculations:", { avg, max, min, change })

    return { avg, max, min, change }
  }

  const summary = getSummary(activeTab)

  return (
    <div className="flex h-screen bg-[#050A04] text-white">
      <div className="fixed w-[1000px] h-[1000px] bg-[#D3A2FF] opacity-100 blur-[800px] rounded-full top-[-1000px] left-[-350px] z-0"></div>
      <div className="fixed w-[1000px] h-[1000px] bg-[#A9DEFF] opacity-100 blur-[800px] rounded-full bottom-[-1000px] right-[-350px] z-0"></div>

      <Sidebar />

      <main className="flex-1 px-4 md:px-10 pt-8 pb-28 md:pb-8 relative z-10 h-screen overflow-y-auto flex items-center justify-center md:ml-0 lg:ml-0">
        <div className="w-[90%] sm:w-[85%] md:w-[80%] lg:w-[70%] xl:w-[60%] mx-auto flex flex-col min-h-[calc(100vh-8rem)] mt-16 mb-16 lg:mt-0 lg:mb-0">
          <header className="mb-4 w-full">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">History</h1>
            <p className="text-[10px] sm:text-xs text-gray-400">View your health trends over time</p>
          </header>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-20 text-red-300 rounded-lg text-[10px]">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          {/* Tabs and Time Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4 w-full">
            {/* Desktop Tabs */}
            <div className="hidden lg:flex">
              {tabOptions.map((tab) => (
                <button
                  key={tab.id}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium ${
                    activeTab === tab.id
                      ? "text-[#D3A2FF] border-b-2 border-[#D3A2FF]"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mobile/Tablet Tabs Dropdown */}
            <div className="lg:hidden relative w-full sm:w-auto">
              <button
                onClick={() => setShowTabDropdown(!showTabDropdown)}
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#020202] bg-opacity-40 rounded-lg hover:bg-opacity-60 transition-colors w-full sm:w-auto justify-between"
              >
                <span className="text-[10px] sm:text-xs font-medium">
                  {tabOptions.find(option => option.id === activeTab)?.label || "Select Metric"}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showTabDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTabDropdown && (
                <div className="absolute left-0 mt-2 w-full sm:w-48 bg-[#020202] bg-opacity-90 backdrop-blur-30 rounded-lg shadow-lg border border-gray-700 z-50">
                  <div className="py-1">
                    {tabOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleTabSelect(option.id)}
                        className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs hover:bg-[#D3A2FF] hover:bg-opacity-10 flex items-center justify-between"
                      >
                        <span>{option.label}</span>
                        {activeTab === option.id && (
                          <Check className="w-3 h-3 text-[#D3A2FF]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Time Filter Controls */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Month Selector (only visible in month view) */}
              {timeFilter === "month" && (
                <div className="flex items-center gap-2 bg-[#020202] bg-opacity-40 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 flex-1 sm:flex-none">
                  <Calendar className="w-3 h-3 text-[#D3A2FF]" />
                  <select
                    value={selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                    className="bg-transparent text-[10px] sm:text-xs focus:outline-none cursor-pointer w-full"
                  >
                    {getAvailableMonths().map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time Filter Dropdown */}
              <div className="relative flex-1 sm:flex-none">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#020202] bg-opacity-40 rounded-lg hover:bg-opacity-60 transition-colors w-full sm:w-auto justify-between"
                >
                  <span className="text-[10px] sm:text-xs font-medium">
                    {timeFilterOptions.find(option => option.id === timeFilter)?.label || "Filter"}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-full sm:w-48 bg-[#020202] bg-opacity-90 backdrop-blur-30 rounded-lg shadow-lg border border-gray-700 z-50">
                    <div className="py-1">
                      {timeFilterOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            handleFilterSelect(option.id)
                            if (option.id === "month") {
                              setSelectedMonth(new Date())
                            }
                          }}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs hover:bg-[#D3A2FF] hover:bg-opacity-10 flex items-center justify-between"
                        >
                          <span>{option.label}</span>
                          {timeFilter === option.id && (
                            <Check className="w-3 h-3 text-[#D3A2FF]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart Container and Summary */}
          <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 w-full">
            {/* Chart */}
            {!isLoading && !error && healthData.length > 0 && (
              <div className="flex-1 lg:w-[85%] bg-[#020202] bg-opacity-40 backdrop-blur-30 rounded-[15px] sm:rounded-[30px] p-3 sm:p-4 md:p-6 flex items-center justify-center">
                <div className="w-full h-[250px] sm:h-[300px] md:h-[400px] lg:h-[500px] relative">
                  <Line options={chartOptions} data={getChartData(activeTab)} />
                </div>
              </div>
            )}

            {/* No Data Message */}
            {!isLoading && !error && healthData.length === 0 && (
              <div className="flex-1 lg:w-[85%] bg-[#020202] bg-opacity-40 backdrop-blur-30 rounded-[15px] sm:rounded-[30px] p-4 sm:p-6 text-center flex items-center justify-center">
                <p className="text-[10px] sm:text-xs text-gray-400">No health data available for the selected period</p>
              </div>
            )}

            {/* Stats Summary */}
            {!isLoading && !error && healthData.length > 0 && (
              <div className="lg:w-[15%] grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
                <div className="bg-[#020202] bg-opacity-40 backdrop-blur-30 rounded-[15px] sm:rounded-[20px] p-2 sm:p-3 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1 mb-1">
                    <BarChart2 className="w-3 h-3 text-[#D3A2FF]" />
                    <h3 className="text-[8px] sm:text-[10px] text-gray-400">Average</h3>
                  </div>
                  <div className="text-xs sm:text-sm md:text-base font-bold text-center">
                    {summary.avg} {activeTab === "spo2" ? "%" : activeTab === "temperature" ? "°C" : activeTab === "bpm" ? "BPM" : "kg"}
                  </div>
                </div>

                <div className="bg-[#020202] bg-opacity-40 backdrop-blur-30 rounded-[15px] sm:rounded-[20px] p-2 sm:p-3 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-[#51CF66]" />
                    <h3 className="text-[8px] sm:text-[10px] text-gray-400">Highest</h3>
                  </div>
                  <div className="text-xs sm:text-sm md:text-base font-bold text-center">
                    {summary.max} {activeTab === "spo2" ? "%" : activeTab === "temperature" ? "°C" : activeTab === "bpm" ? "BPM" : "kg"}
                  </div>
                </div>

                <div className="bg-[#020202] bg-opacity-40 backdrop-blur-30 rounded-[15px] sm:rounded-[20px] p-2 sm:p-3 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingDown className="w-3 h-3 text-[#FF6B6B]" />
                    <h3 className="text-[8px] sm:text-[10px] text-gray-400">Lowest</h3>
                  </div>
                  <div className="text-xs sm:text-sm md:text-base font-bold text-center">
                    {summary.min} {activeTab === "spo2" ? "%" : activeTab === "temperature" ? "°C" : activeTab === "bpm" ? "BPM" : "kg"}
                  </div>
                </div>

                <div className="bg-[#020202] bg-opacity-40 backdrop-blur-30 rounded-[15px] sm:rounded-[20px] p-2 sm:p-3 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1 mb-1">
                    <Activity className={`w-3 h-3 ${Number(summary.change) > 0 ? 'text-[#51CF66]' : 'text-[#FF6B6B]'}`} />
                    <h3 className="text-[8px] sm:text-[10px] text-gray-400">Change</h3>
                  </div>
                  <div className="text-xs sm:text-sm md:text-base font-bold text-center">
                    {summary.change} {activeTab === "spo2" ? "%" : activeTab === "temperature" ? "°C" : activeTab === "bpm" ? "BPM" : "kg"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default History
