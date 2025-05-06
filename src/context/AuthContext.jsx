"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  // Mock login function
  const login = (email) => {
    // Create a mock user object
    const mockUser = {
      id: "123456",
      name: "Alliya",
      email: email,
      profileImage: "https://i.pravatar.cc/150?u=alliya",
    }

    // Store user in localStorage
    localStorage.setItem("user", JSON.stringify(mockUser))
    setUser(mockUser)
    return true
  }

  // Mock signup function
  const signup = (email) => {
    // Create a mock user object
    const mockUser = {
      id: "123456",
      name: "Alliya",
      email: email,
      profileImage: "https://i.pravatar.cc/150?u=alliya",
    }

    // Store user in localStorage
    localStorage.setItem("user", JSON.stringify(mockUser))
    setUser(mockUser)
    return true
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem("user")
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
