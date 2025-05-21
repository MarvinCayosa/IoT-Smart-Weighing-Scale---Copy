"use client"

import { useState } from "react"

const HeightModal = ({ currentHeight, onSubmit, onClose }) => {
  const [height, setHeight] = useState(currentHeight || "")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (height && !isNaN(height) && height > 0) {
      onSubmit(height)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Update Height</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-2">
              Current Height: {currentHeight ? `${currentHeight} cm` : "Not set"}
            </label>
            <div className="relative">
              <input
                type="number"
                id="height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Enter your height in centimeters"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="1"
                max="300"
                step="0.1"
                required
              />
              <span className="absolute right-3 top-2 text-gray-400">cm</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Save Height
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HeightModal
