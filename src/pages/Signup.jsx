"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const Signup = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signup, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validation
      if (!email || !password || !confirmPassword || !name) {
        setError("Please fill in all fields")
        return
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match")
        return
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters")
        return
      }

      await signup(email, password, name)
      navigate("/")
    } catch (error) {
      console.error("Signup error:", error)
      if (error.code === "auth/email-already-in-use") {
        setError("Email is already registered")
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address")
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak")
      } else {
        setError("Failed to create account. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate("/")
    } catch (error) {
      console.error("Google sign-in error:", error)
      setError("Failed to sign in with Google. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050A04]">
      <div className="fixed w-[1000px] h-[1000px] bg-[#D3A2FF] opacity-100 blur-[800px] rounded-full top-[-1000px] left-[-350px] z-0"></div>
      <div className="fixed w-[1000px] h-[1000px] bg-[#A9DEFF] opacity-100 blur-[800px] rounded-full bottom-[-1000px] right-[-350px] z-0"></div>
      <div className="w-full max-w-md p-8 rounded-[40px] bg-gray-800 bg-opacity-80 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>

        {error && <div className="bg-red-500 bg-opacity-20 text-red-300 p-3 rounded-md mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

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

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Create password"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full text-white font-medium py-2 px-4 rounded-md transition duration-200 bg-[#169CD2] hover:bg-[#107095] disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-gray-600 w-full"></div>
            <span className="px-4 text-gray-400 text-sm">or</span>
            <div className="border-t border-gray-600 w-full"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full text-white font-medium py-2 px-4 rounded-md transition duration-200 bg-white text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={loading}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Sign up with Google
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-400">Already have an account? </span>
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Signup
