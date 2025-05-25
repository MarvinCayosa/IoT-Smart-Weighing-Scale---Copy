"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { X, Eye, EyeOff, Scale, Heart, Shield, User, AlertCircle, AlertTriangle, Database, Lock, Settings, Clock, Users, Bell } from "lucide-react"

const Signup = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signup, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validation
      if (!email || !password || !confirmPassword || !username) {
        setError("Please fill in all fields")
        return
      }

      if (!consent) {
        setError("You must agree to the terms and conditions")
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

      await signup(email, password, username)
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
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
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
          </div>

          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 rounded border-gray-600 text-[#169CD2] focus:ring-[#169CD2] checked:bg-[#169CD2] checked:border-[#169CD2]"
                disabled={loading}
              />
              <span className="text-sm text-gray-300">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-[#169CD2] hover:text-[#107095]"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-[#169CD2] hover:text-[#107095]"
                >
                  Privacy Policy
                </button>
              </span>
            </label>
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
            className="w-full text-gray-800 font-medium py-2 px-4 rounded-md transition duration-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-7">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Terms of Service</h2>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="text-gray-300 space-y-6">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                
                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <Scale className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Purpose of the Platform</h3>
                    <p>ScaleUP is designed solely for tracking and monitoring health-related metrics such as body weight, heart rate (BPM), oxygen saturation (SpO₂), and foot pressure distribution. It does not provide medical diagnoses, prescriptions, or treatments, and is not intended for medical decision-making or emergency use.</p>
                  </div>
                </section>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <AlertCircle className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Medical Advice</h3>
                    <p>The information provided through ScaleUP is for general monitoring purposes only and should not be used as a substitute for professional medical advice or care. Always consult a qualified healthcare provider with any questions you may have regarding your health.</p>
                  </div>
                </section>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <Heart className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Data Usage</h3>
                    <p>Your health data is used strictly to improve your personal monitoring experience and to enhance ScaleUP's features and services. We do not use your data for any medical, diagnostic, treatment, or advertising purposes.</p>
                  </div>
                </section>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <Shield className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Privacy and Security</h3>
                    <p>We are committed to protecting your personal data. Your information will be handled in accordance with our Privacy Policy, and we will not share your data without your explicit consent, except where required by law.</p>
                  </div>
                </section>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <User className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">User Responsibility</h3>
                    <p>You are responsible for the accuracy of the personal and health information you input. ScaleUP is not liable for any issues arising from incorrect or misleading user data.</p>
                  </div>
                </section>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <AlertTriangle className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Service Limitations</h3>
                    <p>ScaleUP may be subject to occasional downtime or data inaccuracies due to technical limitations. We do not guarantee uninterrupted service.</p>
                  </div>
                </section>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <AlertCircle className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Termination and Misuse</h3>
                    <p>We reserve the right to suspend or terminate accounts that misuse the platform or violate these terms.</p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-7">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="text-gray-300 space-y-6">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                
                <p>Your privacy is important to us. By creating an account with ScaleUP, you agree to the practices described below.</p>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <Database className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Data We Collect</h3>
                    <p>We collect only the necessary personal and health-related data you provide or that is captured by your device, such as:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Heart rate (BPM)</li>
                      <li>Oxygen saturation (SpO₂)</li>
                      <li>Foot pressure distribution</li>
                      <li>Body weight</li>
                      <li>Basic account information (e.g., name, email)</li>
                    </ul>
                  </div>
                </section>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <Heart className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Purpose of Data Collection</h3>
                    <p>Your data is used solely for monitoring your health metrics and for improving the performance, safety, and reliability of ScaleUP. We do not use your data for advertising, medical advice, treatment, or diagnosis.</p>
                  </div>
                </section>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <Shield className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Data Sharing</h3>
                    <p>We do not sell, rent, or share your personal or health data with third parties. Data may only be shared:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>With your explicit consent</li>
                      <li>When legally required (e.g., by a court order)</li>
                    </ul>
                  </div>
                </section>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <Lock className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Data Security</h3>
                    <p>We implement strict measures to protect your data from unauthorized access, loss, or misuse, including encryption and secure storage practices.</p>
                  </div>
                </section>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <Settings className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">User Control</h3>
                    <p>You may view, update, or request the deletion of your data at any time by contacting our support team or through your account settings.</p>
                  </div>
                </section>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <Clock className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Data Retention</h3>
                    <p>We retain your data only as long as your account is active or as needed to improve ScaleUP. Deleted accounts are permanently removed from our active systems.</p>
                  </div>
                </section>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <Users className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Children's Privacy</h3>
                    <p>ScaleUP is not intended for users under the age of 13. We do not knowingly collect data from minors without verified parental consent.</p>
                  </div>
                </section>

                <section className="flex items-start gap-3">
                  <div className="mt-1">
                    <Bell className="w-5 h-5 text-[#D3A2FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Policy Updates</h3>
                    <p>We may update this policy as necessary. You will be notified of significant changes through the app or email.</p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Signup
