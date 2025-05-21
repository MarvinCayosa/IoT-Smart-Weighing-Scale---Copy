import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "../firebase/firebaseConfig"

// Update health data in Firestore
export const updateHealthData = async (userId, healthData) => {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      healthData: healthData
    })
    return true
  } catch (error) {
    console.error("Error updating health data:", error)
    throw error
  }
}

// Get health data from Firestore
export const getHealthData = async (userId) => {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      return userDoc.data().healthData
    }
    return null
  } catch (error) {
    console.error("Error getting health data:", error)
    throw error
  }
}

// Calculate BMI
export const calculateBMI = (weight, height) => {
  if (!weight || !height) return null
  const heightInMeters = height / 100
  return (weight / (heightInMeters * heightInMeters)).toFixed(1)
}

// Get BMI category
export const getBMICategory = (bmi) => {
  if (!bmi) return ""
  if (bmi < 18.5) return "Underweight"
  if (bmi < 25) return "Normal"
  if (bmi < 30) return "Overweight"
  return "Obese"
}

// Get BMI color class
export const getBMIColorClass = (bmi) => {
  const category = getBMICategory(bmi)
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