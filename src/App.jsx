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

function App() {
  const [showHeightModal, setShowHeightModal] = useState(false)

  // Check if height is stored in localStorage on initial load
  useEffect(() => {
    const height = localStorage.getItem("userHeight")
    if (!height) {
      setShowHeightModal(true)
    }
  }, [])

  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}

export default App
