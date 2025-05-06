"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")

    // Simple validation
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    // Call login function from context
    const success = login(email)
    if (success) {
      navigate("/")
    } else {
      setError("Invalid credentials")
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
              User
            </label>
            <input
              id="email"
              type="email"
              placeholder="Email address"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            />
          </div>

          <button
              type="submit"
              className="w-full text-white font-medium py-2 px-4 rounded-md transition duration-200 bg-[#169CD2] hover:bg-[#107095]"
            >

            Sign in
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
