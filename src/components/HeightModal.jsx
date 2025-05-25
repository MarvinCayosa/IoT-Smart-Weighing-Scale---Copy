"use client"

import { useState, useEffect } from "react"

const HeightModal = ({ currentHeight, onSubmit, onClose }) => {
  const [height, setHeight] = useState("")
  const [unit, setUnit] = useState("cm")
  const [feet, setFeet] = useState("")
  const [inches, setInches] = useState("")

  useEffect(() => {
    if (currentHeight) {
      // Convert current height to feet and inches if it's in cm
      const heightInCm = currentHeight
      const totalInches = heightInCm / 2.54
      const feet = Math.floor(totalInches / 12)
      const inches = Math.round(totalInches % 12)
      
      setFeet(feet.toString())
      setInches(inches.toString())
      setHeight(currentHeight.toString())
    }
  }, [currentHeight])

  const handleSubmit = (e) => {
    e.preventDefault()
    let finalHeight

    if (unit === "cm") {
      if (!height || isNaN(height) || height <= 0) return
      finalHeight = Math.round(Number(height))
    } else {
      if (!feet || !inches || isNaN(feet) || isNaN(inches) || feet <= 0 || inches < 0 || inches >= 12) return
      // Convert feet and inches to cm
      const totalInches = (Number(feet) * 12) + Number(inches)
      finalHeight = Math.round(totalInches * 2.54)
    }

    onSubmit(finalHeight)
  }

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit)
    if (newUnit === "cm" && feet && inches) {
      // Convert feet and inches to cm
      const totalInches = (Number(feet) * 12) + Number(inches)
      setHeight(Math.round(totalInches * 2.54).toString())
    } else if (newUnit === "ft" && height) {
      // Convert cm to feet and inches
      const totalInches = Number(height) / 2.54
      const newFeet = Math.floor(totalInches / 12)
      const newInches = Math.round(totalInches % 12)
      setFeet(newFeet.toString())
      setInches(newInches.toString())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{currentHeight ? "Update Height" : "Enter Height"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-2">
              {currentHeight ? `Current Height: ${currentHeight} cm` : "Enter your height"}
            </label>
            
            {/* Unit Selection */}
            <div className="mb-3">
              <select
                value={unit}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="cm">Centimeters (cm)</option>
                <option value="ft">Feet and Inches (ft)</option>
              </select>
            </div>

            {unit === "cm" ? (
              <div className="relative">
                <input
                  type="number"
                  id="height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Enter height in centimeters (e.g., 170)"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  max="300"
                  required
                />
                <span className="absolute right-3 top-2 text-gray-400">cm</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    value={feet}
                    onChange={(e) => setFeet(e.target.value)}
                    placeholder="Feet (e.g., 5)"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    max="8"
                    required
                  />
                  <span className="absolute right-3 top-2 text-gray-400">ft</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={inches}
                    onChange={(e) => setInches(e.target.value)}
                    placeholder="Inches (e.g., 5)"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="0"
                    max="11"
                    required
                  />
                  <span className="absolute right-3 top-2 text-gray-400">in</span>
                </div>
              </div>
            )}
            <p className="mt-1 text-xs text-gray-400">
              {unit === "cm" 
                ? "Enter your height in centimeters (e.g., 170 cm)"
                : "Enter your height in feet and inches (e.g., 5'5 ft)"}
            </p>
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
              {currentHeight ? "Update Height" : "Save Height"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HeightModal
