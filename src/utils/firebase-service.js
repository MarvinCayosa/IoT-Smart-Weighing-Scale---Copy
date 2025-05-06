// Firebase configuration and utility functions
import { initializeApp } from "firebase/app"
import { getDatabase, ref, onValue, set, get } from "firebase/database"
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"

// Your Firebase configuration
const firebaseConfig = {
  // Replace with your Firebase project configuration
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const auth = getAuth(app)

// Authentication functions
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error("Error logging in:", error)
    throw error
  }
}

export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error("Error registering user:", error)
    throw error
  }
}

// Health data functions
export const subscribeToHealthData = (userId, callback) => {
  const healthDataRef = ref(database, `users/${userId}/healthData`)

  // Listen for changes to the health data
  const unsubscribe = onValue(healthDataRef, (snapshot) => {
    const data = snapshot.val() || {}
    callback(data)
  })

  // Return unsubscribe function to stop listening when needed
  return unsubscribe
}

export const getLastConnectionStatus = async (deviceId) => {
  try {
    const statusRef = ref(database, `devices/${deviceId}/status`)
    const snapshot = await get(statusRef)
    return snapshot.val() || { connected: false, lastSeen: null }
  } catch (error) {
    console.error("Error getting connection status:", error)
    return { connected: false, lastSeen: null }
  }
}

export const updateUserProfile = async (userId, profileData) => {
  try {
    await set(ref(database, `users/${userId}/profile`), profileData)
    return true
  } catch (error) {
    console.error("Error updating profile:", error)
    return false
  }
}

export const updateUserHeight = async (userId, height) => {
  try {
    await set(ref(database, `users/${userId}/profile/height`), height)
    return true
  } catch (error) {
    console.error("Error updating height:", error)
    return false
  }
}

export default {
  loginUser,
  registerUser,
  subscribeToHealthData,
  getLastConnectionStatus,
  updateUserProfile,
  updateUserHeight,
}
