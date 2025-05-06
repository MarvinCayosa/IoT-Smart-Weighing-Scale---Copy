"use client"

import { useState } from "react"
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

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const History = () => {
  const [activeTab, setActiveTab] = useState("weight")

  // Mock data for charts
  const dates = ["Apr 10", "Apr 11", "Apr 12", "Apr 13", "Apr 14", "Apr 15", "Apr 16"]

  const chartData = {
    weight: {
      labels: dates,
      datasets: [
        {
          label: "Weight (kg)",
          data: [50.2, 50.0, 49.8, 49.5, 49.3, 49.2, 49.1],
          borderColor: "rgb(99, 102, 241)",
          backgroundColor: "rgba(99, 102, 241, 0.5)",
          tension: 0.3,
        },
      ],
    },
    bpm: {
      labels: dates,
      datasets: [
        {
          label: "Heart Rate (BPM)",
          data: [75, 78, 80, 76, 82, 79, 83],
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.5)",
          tension: 0.3,
        },
      ],
    },
    spo2: {
      labels: dates,
      datasets: [
        {
          label: "Oxygen Saturation (%)",
          data: [97, 96, 98, 97, 96, 95, 90],
          borderColor: "rgb(14, 165, 233)",
          backgroundColor: "rgba(14, 165, 233, 0.5)",
          tension: 0.3,
        },
      ],
    },
    temperature: {
      labels: dates,
      datasets: [
        {
          label: "Temperature (°C)",
          data: [36.6, 36.7, 36.5, 36.8, 36.6, 36.5, 36.5],
          borderColor: "rgb(234, 88, 12)",
          backgroundColor: "rgba(234, 88, 12, 0.5)",
          tension: 0.3,
        },
      ],
    },
  }

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

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl font-bold">History</h1>
            <p className="text-gray-400">View your health trends over time</p>
          </header>

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
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="h-80">
              <Line options={chartOptions} data={chartData[activeTab]} />
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-1">Average</h3>
              <div className="text-xl font-bold">
                {activeTab === "weight" && "49.7 kg"}
                {activeTab === "bpm" && "79 BPM"}
                {activeTab === "spo2" && "96%"}
                {activeTab === "temperature" && "36.6°C"}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-1">Highest</h3>
              <div className="text-xl font-bold">
                {activeTab === "weight" && "50.2 kg"}
                {activeTab === "bpm" && "83 BPM"}
                {activeTab === "spo2" && "98%"}
                {activeTab === "temperature" && "36.8°C"}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-1">Lowest</h3>
              <div className="text-xl font-bold">
                {activeTab === "weight" && "49.1 kg"}
                {activeTab === "bpm" && "75 BPM"}
                {activeTab === "spo2" && "90%"}
                {activeTab === "temperature" && "36.5°C"}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-1">Change</h3>
              <div className="text-xl font-bold">
                {activeTab === "weight" && "-1.1 kg"}
                {activeTab === "bpm" && "+8 BPM"}
                {activeTab === "spo2" && "-7%"}
                {activeTab === "temperature" && "-0.1°C"}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default History
