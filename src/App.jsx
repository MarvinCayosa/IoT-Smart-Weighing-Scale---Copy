"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"
import History from "./pages/History"
import Settings from "./pages/Settings"
import HeightModal from "./components/HeightModal"
import { AuthProvider, useAuth } from "./context/AuthContext"

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" />
  }

  return children
}

// Main App Content
const AppContent = () => {
  const [showHeightModal, setShowHeightModal] = useState(false)
  const { user } = useAuth()

  // Check if height is stored in localStorage on initial load
  useEffect(() => {
    if (user) {  // Only check for height if user is logged in
      const height = localStorage.getItem("userHeight")
      if (!height) {
        setShowHeightModal(true)
      }
    }
  }, [user])  // Add user as a dependency

  return (
    <Router>
      {showHeightModal && <HeightModal onClose={() => setShowHeightModal(false)} />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
