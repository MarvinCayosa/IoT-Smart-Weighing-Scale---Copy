"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Eye, EyeOff, X } from "lucide-react"
import { getAuth, updatePassword, signInWithEmailAndPassword } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "../firebase"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [resetError, setResetError] = useState("")
  const [resetSuccess, setResetSuccess] = useState("")
  const [verificationEmail, setVerificationEmail] = useState("")
  const [verificationPassword, setVerificationPassword] = useState("")
  const [showVerificationPassword, setShowVerificationPassword] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const { login, signInWithGoogle, user } = useAuth()
  const navigate = useNavigate()

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/")
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Simple validation
      if (!email || !password) {
        setError("Please fill in all fields")
        setLoading(false)
        return
      }

      await login(email, password)
      // Navigation will be handled by the useEffect above
    } catch (error) {
      console.error("Login error:", error)
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Invalid email or password")
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address")
      } else {
        setError("Failed to log in. Please try again.")
      }
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setLoading(true)
    try {
      await signInWithGoogle()
      // Navigation will be handled by the useEffect above
    } catch (error) {
      console.error("Google sign-in error:", error)
      setError("Failed to sign in with Google. Please try again.")
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setResetError("")
    setResetSuccess("")
    setLoading(true)

    try {
      if (!isVerified) {
        // First step: Verify user credentials
        if (!verificationEmail || !verificationPassword) {
          setResetError("Please enter your current email and password")
          setLoading(false)
          return
        }

        const auth = getAuth()
        await signInWithEmailAndPassword(auth, verificationEmail, verificationPassword)
        setIsVerified(true)
        setResetSuccess("Verification successful. Please enter your new password.")
        setLoading(false)
        return
      }

      // Second step: Update password
      if (!newPassword || !confirmNewPassword) {
        setResetError("Please fill in all fields")
        setLoading(false)
        return
      }

      if (newPassword !== confirmNewPassword) {
        setResetError("Passwords do not match")
        setLoading(false)
        return
      }

      if (newPassword.length < 6) {
        setResetError("Password must be at least 6 characters")
        setLoading(false)
        return
      }

      const auth = getAuth()
      const currentUser = auth.currentUser

      if (!currentUser) {
        setResetError("Authentication failed. Please try again.")
        setLoading(false)
        return
      }

      await updatePassword(currentUser, newPassword)

      // Update metadata in Firestore
      const userRef = doc(db, "users", currentUser.uid)
      await updateDoc(userRef, {
        lastPasswordUpdate: new Date().toISOString()
      })

      setResetSuccess("Password updated successfully.")
      setNewPassword("")
      setConfirmNewPassword("")
      setVerificationEmail("")
      setVerificationPassword("")
      setIsVerified(false)
      setShowForgotPasswordModal(false)
    } catch (error) {
      console.error("Password reset error:", error)
      if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        setResetError("Invalid email or password")
      } else if (error.code === "auth/requires-recent-login") {
        setResetError("Please log out and log in again to change your password for security.")
      } else {
        setResetError("Failed to update password. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050A04]">
      <div className="fixed w-[1000px] h-[1000px] bg-[#D3A2FF] opacity-100 blur-[800px] rounded-full top-[-1000px] left-[-350px] z-0"></div>
      <div className="fixed w-[1000px] h-[1000px] bg-[#A9DEFF] opacity-100 blur-[800px] rounded-full bottom-[-1000px] right-[-350px] z-0"></div>
      <div className="w-full max-w-md p-8 rounded-[40px] bg-gray-800 bg-opacity-80 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Log in</h2>

        {error && <div className="bg-red-500 bg-opacity-20 text-red-300 p-3 rounded-md mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Email address"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="mt-2 text-left">
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full text-white font-medium py-2 px-4 rounded-md transition duration-200 bg-[#169CD2] hover:bg-[#107095] disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-gray-600 w-full"></div>
            <span className="px-4 text-gray-400 text-sm">or</span>
            <div className="border-t border-gray-600 w-full"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full text-gray-800 font-medium py-2 px-4 rounded-md transition duration-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={loading}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Sign in with Google
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-400">Don't have an account? </span>
          <Link to="/signup" className="text-blue-400 hover:text-blue-300">
            Create one
          </Link>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Reset Password</h2>
                  <button
                    onClick={() => {
                      setShowForgotPasswordModal(false)
                      setIsVerified(false)
                      setVerificationEmail("")
                      setVerificationPassword("")
                      setNewPassword("")
                      setConfirmNewPassword("")
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                {resetError && (
                  <div className="bg-red-500 bg-opacity-20 text-red-300 p-3 rounded-md mb-4">
                    {resetError}
                  </div>
                )}

                {resetSuccess && (
                  <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-md mb-4">
                    {resetSuccess}
                  </div>
                )}

                <form onSubmit={handleForgotPassword}>
                  {!isVerified ? (
                    <>
                      <div className="mb-4">
                        <label htmlFor="verificationEmail" className="block text-sm font-medium text-gray-300 mb-1">
                          Current Email
                        </label>
                        <input
                          id="verificationEmail"
                          type="email"
                          placeholder="Enter your current email"
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={verificationEmail}
                          onChange={(e) => setVerificationEmail(e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <div className="mb-6">
                        <label htmlFor="verificationPassword" className="block text-sm font-medium text-gray-300 mb-1">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            id="verificationPassword"
                            type={showVerificationPassword ? "text" : "password"}
                            placeholder="Enter your current password"
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={verificationPassword}
                            onChange={(e) => setVerificationPassword(e.target.value)}
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowVerificationPassword(!showVerificationPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                            disabled={loading}
                          >
                            {showVerificationPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                            disabled={loading}
                          >
                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      <div className="mb-6">
                        <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-300 mb-1">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            id="confirmNewPassword"
                            type={showConfirmNewPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                            disabled={loading}
                          >
                            {showConfirmNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="w-full text-white font-medium py-2 px-4 rounded-md transition duration-200 bg-[#169CD2] hover:bg-[#107095] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : isVerified ? "Update Password" : "Verify"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
