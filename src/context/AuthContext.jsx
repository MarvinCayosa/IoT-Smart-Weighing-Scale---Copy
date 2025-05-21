"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth"
import { doc, setDoc, getDoc, onSnapshot, updateDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { auth, db, googleProvider } from "../firebase"

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch user data from Firestore
  async function fetchUserData(uid) {
    try {
      const docRef = doc(db, "users", uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const userData = docSnap.data()
        return userData
      } else {
        console.log("No user document found!")
        return null
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setError("Failed to fetch user data")
      throw error
    }
  }

  // Get health data for a user
  async function getHealthData(uid) {
    try {
      if (!uid) {
        console.error("No user ID provided to getHealthData")
        throw new Error("User ID is required")
      }

      // Get user's document
      const userDoc = await getDoc(doc(db, "users", uid))
      if (!userDoc.exists()) {
        console.error("User document not found for ID:", uid)
        throw new Error("User not found")
      }

      const userData = userDoc.data()
      console.log("User data from Firestore:", userData)

      // Get health data from the user's document
      const healthData = userData.healthData || {}
      console.log("Health data from user document:", healthData)

      // Calculate BMI if both height and weight are available
      let bmi = null
      if (userData.height && userData.height > 0 && healthData.weight && healthData.weight > 0) {
        const heightInMeters = userData.height / 100
        bmi = Number.parseFloat((healthData.weight / (heightInMeters * heightInMeters)).toFixed(1))
      }

      // Return the combined data
      return {
        ...userData,
        height: userData.height || 0,
        weight: healthData.weight || 0,
        bpm: healthData.bpm || 0,
        spo2: healthData.spo2 || 0,
        temperature: healthData.temperature || 0,
        bodyFat: healthData.bodyFat || 0,
        bodyWater: healthData.bodyWater || 0,
        skeletalMuscle: healthData.skeletalMuscle || 0,
        bmi: bmi,
        lastMeasurement: healthData.timestamp || userData.lastMeasurement
      }
    } catch (error) {
      console.error("Error in getHealthData:", error)
      setError(`Failed to fetch health data: ${error.message}`)
      throw error
    }
  }

  // Set up real-time listener for user data
  function setupUserDataListener(uid, callback) {
    try {
      const docRef = doc(db, "users", uid)
      return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          callback(doc.data())
        }
      }, (error) => {
        console.error("Error in user data listener:", error)
        setError("Failed to listen for user data updates")
      })
    } catch (error) {
      console.error("Error setting up user data listener:", error)
      setError("Failed to set up real-time updates")
      throw error
    }
  }

  // Refresh user data
  async function refreshUserData() {
    if (user?.uid) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setUser(prev => ({
            ...prev,
            ...userDoc.data()
          }))
        }
      } catch (error) {
        console.error("Error refreshing user data:", error)
        setError("Failed to refresh user data")
      }
    }
  }

  // Update user data in Firestore
  async function updateUserData(uid, data) {
    try {
      const docRef = doc(db, "users", uid)
      
      // Get current user data
      const userDoc = await getDoc(docRef)
      const currentData = userDoc.exists() ? userDoc.data() : {}
      
      // If height is being updated, update it at the top level and recalculate BMI
      if (data.height !== undefined) {
        const height = Number.parseFloat(data.height)
        const weight = currentData.healthData?.weight || 0
        let bmi = null

        if (height > 0 && weight > 0) {
          const heightInMeters = height / 100
          bmi = Number.parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1))
        }

        await updateDoc(docRef, {
          height: height,
          bmi: bmi
        })
        // Refresh user data after updating height
        await refreshUserData()
        return
      }
      
      // Update the healthData field with proper structure
      const updatedHealthData = {
        ...currentData.healthData,
        weight: data.weight || currentData.healthData?.weight || 0,
        bpm: data.bpm || currentData.healthData?.bpm || 0,
        spo2: data.spo2 || currentData.healthData?.spo2 || 0,
        temperature: data.temperature || currentData.healthData?.temperature || 0,
        bodyFat: data.bodyFat || currentData.healthData?.bodyFat || 0,
        bodyWater: data.bodyWater || currentData.healthData?.bodyWater || 0,
        skeletalMuscle: data.skeletalMuscle || currentData.healthData?.skeletalMuscle || 0,
        timestamp: new Date().toISOString()
      }

      // Recalculate BMI if weight is being updated and height exists
      let bmi = currentData.bmi
      if (data.weight !== undefined && currentData.height > 0) {
        const heightInMeters = currentData.height / 100
        bmi = Number.parseFloat((data.weight / (heightInMeters * heightInMeters)).toFixed(1))
      }

      await updateDoc(docRef, {
        healthData: updatedHealthData,
        bmi: bmi,
        lastMeasurement: new Date().toISOString()
      })

      console.log("Updated user data in Firestore:", {
        healthData: updatedHealthData,
        bmi: bmi
      })
    } catch (error) {
      console.error("Error updating user data:", error)
      setError("Failed to update user data")
      throw error
    }
  }

  // Sign up with email and password
  async function signup(email, password, name) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile with name
      await updateProfile(user, {
        displayName: name
      })

      // Create user document in Firestore with all necessary fields
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        name: name,
        created: new Date().toISOString(),
        height: 0,
        FSR1: 0,
        FSR2: 0,
        FSR3: 0,
        FSR4: 0,
        healthData: {
          weight: 0,
          bpm: 0,
          spo2: 0,
          temperature: 0,
          bodyFat: 0,
          bodyWater: 0,
          skeletalMuscle: 0,
          timestamp: null
        }
      })

      return user
    } catch (error) {
      setError("Failed to create account")
      throw error
    }
  }

  // Sign in with email and password
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error) {
      setError("Failed to log in")
      throw error
    }
  }

  // Sign in with Google
  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      // Check if user document exists
      const userDoc = await getDoc(doc(db, "users", user.uid))
      
      // If user document doesn't exist, create it with all necessary fields
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.displayName || user.email.split('@')[0], // Use email username if no display name
          created: new Date().toISOString(),
          height: 0,
          FSR1: 0,
          FSR2: 0,
          FSR3: 0,
          FSR4: 0,
          healthData: {
            weight: 0,
            bpm: 0,
            spo2: 0,
            temperature: 0,
            bodyFat: 0,
            bodyWater: 0,
            skeletalMuscle: 0,
            timestamp: null
          }
        })
      }

      return user
    } catch (error) {
      setError("Failed to sign in with Google")
      throw error
    }
  }

  // Sign out
  async function logout() {
    try {
      await signOut(auth)
    } catch (error) {
      setError("Failed to sign out")
      throw error
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setUser({
            ...user,
            ...userDoc.data()
          })
        } else {
          setUser(user)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    user,
    signup,
    login,
    signInWithGoogle,
    logout,
    loading,
    error,
    fetchUserData,
    getHealthData,
    setupUserDataListener,
    updateUserData,
    refreshUserData
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
