"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Simple validation
      if (!email || !password) {
        setError("Please fill in all fields")
        return
      }

      await login(email, password)
      navigate("/")
    } catch (error) {
      console.error("Login error:", error)
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Invalid email or password")
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address")
      } else {
        setError("Failed to log in. Please try again.")
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
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
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
            className="w-full text-white font-medium py-2 px-4 rounded-md transition duration-200 bg-white text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

        <div className="mt-4 text-center">
          <Link to="#" className="text-sm text-[#A9DEFF] hover:text-[#A9DEFF]">
            Forgot password?
          </Link>
        </div>

        <div className="mt-6 text-center">
          <span className="text-gray-400">Don't have an account? </span>
          <Link to="/signup" className="text-blue-400 hover:text-blue-300">
            Create one
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
