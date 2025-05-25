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
import { doc, setDoc, getDoc, onSnapshot, updateDoc, collection, query, where, orderBy, limit, getDocs, addDoc } from "firebase/firestore"
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

      // Get latest data
      const latestDataDoc = await getDoc(doc(db, "users", uid, "latestData", "latest"))
      const latestData = latestDataDoc.exists() ? latestDataDoc.data() : {}

      // Get user info
      const userInfo = userDoc.data().userInfo || {}

      // Calculate BMI if both height and weight are available
      let bmi = null
      if (userInfo.height && userInfo.height > 0 && latestData.weight && latestData.weight > 0) {
        const heightInMeters = userInfo.height / 100
        bmi = Number.parseFloat((latestData.weight / (heightInMeters * heightInMeters)).toFixed(1))
      }

      // Return the combined data
      return {
        ...userInfo,
        ...latestData,
        bmi: bmi
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
      console.log("Setting up real-time listeners for user:", uid);
      
      // Listen to user document
      const userRef = doc(db, "users", uid);
      const userUnsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          console.log("User data updated:", doc.data());
          callback(doc.data());
        }
      }, (error) => {
        console.error("Error in user data listener:", error);
        setError("Failed to listen for user data updates");
      });

      // Listen to latestData subcollection
      const latestDataRef = doc(db, "users", uid, "latestData", "latest");
      const latestDataUnsubscribe = onSnapshot(latestDataRef, (doc) => {
        if (doc.exists()) {
          console.log("Latest data updated:", doc.data());
          // Get current user data
          getDoc(userRef).then((userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // Merge latestData with user data
              callback({
                ...userData,
                latestData: doc.data()
              });
            }
          });
        }
      }, (error) => {
        console.error("Error in latestData listener:", error);
        setError("Failed to listen for latest data updates");
      });

      // Return cleanup function that unsubscribes from both listeners
      return () => {
        console.log("Cleaning up real-time listeners");
        userUnsubscribe();
        latestDataUnsubscribe();
      };
    } catch (error) {
      console.error("Error setting up user data listener:", error);
      setError("Failed to set up real-time updates");
      throw error;
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
      const userRef = doc(db, "users", uid)
      const latestDataRef = doc(db, "users", uid, "latestData", "latest")
      const historyRef = collection(db, "users", uid, "history")
      
      // Get current user data
      const userDoc = await getDoc(userRef)
      const currentData = userDoc.exists() ? userDoc.data() : {}
      
      // If height is being updated, update it in userInfo
      if (data.height !== undefined) {
        const height = Number.parseFloat(data.height)
        await updateDoc(userRef, {
          "userInfo.height": height
        })
        // Refresh user data after updating height
        await refreshUserData()
        return
      }
      
      // Prepare the latest data update
      const latestData = {
        weight: data.weight || 0,
        heart_rate: data.bpm || 0,
        spo2: data.spo2 || 0,
        temperature: data.temperature || 0,
        fsr1: data.fsr1 || 0,
        fsr2: data.fsr2 || 0,
        fsr3: data.fsr3 || 0,
        fsr4: data.fsr4 || 0,
        timestamp: new Date().toISOString()
      }

      // Check if this is the first data update
      const latestDataDoc = await getDoc(latestDataRef)
      const isFirstDataUpdate = !latestDataDoc.exists()

      // Update latest data
      await setDoc(latestDataRef, latestData)

      // Add to history collection
      await addDoc(historyRef, latestData)

      // If this is the first data update, log it
      if (isFirstDataUpdate) {
        console.log("First data update from ESP32 - created latestData and history collections")
      }

      console.log("Updated user data in Firestore:", latestData)
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

      // Create user document in Firestore with only userInfo
      const userRef = doc(db, "users", user.uid)
      await setDoc(userRef, {
        userInfo: {
          username: name,
          email: email,
          password: password,
          height: 0
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
      
      // If user document doesn't exist, create it with only userInfo
      if (!userDoc.exists()) {
        const userRef = doc(db, "users", user.uid)
        await setDoc(userRef, {
          userInfo: {
            username: user.displayName || user.email.split('@')[0],
            email: user.email,
            password: "google_auth",
            height: 0
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
