"use client"

import { useState } from "react"

const HeightModal = ({ onSubmit, onClose }) => {
  const [height, setHeight] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate height
    const heightValue = Number.parseFloat(height)
    if (!height || isNaN(heightValue)) {
      setError("Please enter a valid height")
      return
    }

    if (heightValue < 50 || heightValue > 250) {
      setError("Please enter a height between 50cm and 250cm")
      return
    }

    // Submit height
    onSubmit(height)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Enter Your Height</h2>
        <p className="text-gray-300 mb-4">
          We need your height to calculate your BMI and provide accurate health insights.
        </p>

        {error && <div className="bg-red-500 bg-opacity-20 text-red-300 p-3 rounded-md mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-1">
              Height (cm)
            </label>
            <div className="relative">
              <input
                id="height"
                type="number"
                placeholder="Enter your height in cm"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
              <span className="absolute right-3 top-2 text-gray-400">cm</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              Skip
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HeightModal
