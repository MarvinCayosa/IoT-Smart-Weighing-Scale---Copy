"use client"

import { useState, useEffect, useRef } from "react"
import Sidebar from "../components/Sidebar"
import { User, Bell, HelpCircle, X, Eye, EyeOff, Edit2, Camera, AlertTriangle } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "../firebase"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import HeightModal from "../components/HeightModal"
import { updatePassword, updateEmail, updateProfile, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth"
import { useNavigate } from "react-router-dom"

const Settings = () => {
  const [currentHeight, setCurrentHeight] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showHeightModal, setShowHeightModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePictureUrl, setProfilePictureUrl] = useState("")
  const [tempUsername, setTempUsername] = useState("")
  const [tempEmail, setTempEmail] = useState("")
  const [tempPassword, setTempPassword] = useState("")
  const [showSaveProfile, setShowSaveProfile] = useState(false)
  const fileInputRef = useRef(null)
  const { user } = useAuth()
  const [isEditingHeight, setIsEditingHeight] = useState(false)
  const [tempHeight, setTempHeight] = useState(null)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showFaqModal, setShowFaqModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()
  const [tempHeightUnit, setTempHeightUnit] = useState("cm")
  const [tempHeightFeet, setTempHeightFeet] = useState("")
  const [tempHeightInches, setTempHeightInches] = useState("")

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setCurrentHeight(userData.userInfo?.height || null)
          setTempHeight(userData.userInfo?.height || null)
          setTempHeightUnit("cm")
          setTempHeightFeet(userData.userInfo?.heightFeet || "")
          setTempHeightInches(userData.userInfo?.heightInches || "")
          setUsername(userData.userInfo?.username || "")
          setTempUsername(userData.userInfo?.username || "")
          setEmail(user.email || "")
          setTempEmail(user.email || "")
          setProfilePictureUrl(userData.userInfo?.profilePicture || "")
        }
        } catch (error) {
        console.error("Error fetching user data:", error)
        setError("Failed to load user data")
      }
    }

    fetchUserData()
  }, [user])

  const updateUserData = async (userId, data) => {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, data)
  }

  const handleHeightSubmit = async (height) => {
    try {
      setError(null)
      setSuccess(null)
      
      if (user?.uid) {
        await updateUserData(user.uid, { height: Number.parseFloat(height) })
        setCurrentHeight(Number.parseFloat(height))
        setSuccess("Height updated successfully")
        setShowHeightModal(false)
      }
    } catch (error) {
      console.error("Error updating height:", error)
      setError("Failed to update height")
    }
  }

  const handleEmailSubmit = async () => {
    try {
      setError(null)
      setSuccess(null)

      if (!tempEmail.trim() || !tempEmail.includes("@")) {
        setError("Please enter a valid email address")
        return
      }

      if (tempEmail === email) {
        setIsEditingEmail(false)
        return
      }

      // Update email in Firebase Auth
      await updateEmail(user, tempEmail)
      
      // Update email in Firestore
      await updateUserData(user.uid, {
        "userInfo.email": tempEmail
      })

      setEmail(tempEmail)
      setSuccess("Email updated successfully")
      setIsEditingEmail(false)
    } catch (error) {
      console.error("Error updating email:", error)
      setError("Failed to update email. Please try again.")
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      setSuccess(null)

      // Validate passwords
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("All fields are required")
        return
      }

      if (newPassword !== confirmPassword) {
        setError("New passwords do not match")
        return
      }

      // Password requirements validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      if (!passwordRegex.test(newPassword)) {
        setError("Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character")
        return
      }

      // Reauthenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(user, newPassword)
      
      setSuccess("Password updated successfully")
      setShowPasswordModal(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    } catch (error) {
      console.error("Error updating password:", error)
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect")
      } else if (error.code === "auth/requires-recent-login") {
        setError("Please log out and log in again before changing your password")
      } else {
        setError("Failed to update password. Please try again.")
      }
    }
  }

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB")
      return
    }

    setProfilePicture(file)
    setShowSaveProfile(true)
    setError(null)

    // Create a temporary URL for preview
    const tempUrl = URL.createObjectURL(file)
    setProfilePictureUrl(tempUrl)
  }

  const handleSaveProfile = async () => {
    try {
      setError(null)
      setSuccess(null)

      if (profilePicture) {
        const storage = getStorage()
        const storageRef = ref(storage, `profilePictures/${user.uid}`)
        
        await uploadBytes(storageRef, profilePicture)
        const downloadURL = await getDownloadURL(storageRef)
        
        await updateProfile(user, {
          photoURL: downloadURL
        })

        await updateUserData(user.uid, {
          "userInfo.profilePicture": downloadURL
        })

        setProfilePictureUrl(downloadURL)
        setSuccess("Profile picture updated successfully")
      }

      if (tempUsername !== username) {
        await updateUserData(user.uid, { 
          "userInfo.username": tempUsername 
        })
        setUsername(tempUsername)
        setSuccess("Username updated successfully")
      }

      if (tempEmail !== email) {
        if (!tempEmail.trim() || !tempEmail.includes("@")) {
          setError("Please enter a valid email address")
          return
        }

        await updateEmail(user, tempEmail)
        await updateUserData(user.uid, {
          "userInfo.email": tempEmail
        })
        setEmail(tempEmail)
        setSuccess("Email updated successfully")
      }

      if (isEditingPassword && newPassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          setError("All password fields are required")
          return
        }

        if (newPassword !== confirmPassword) {
          setError("New passwords do not match")
          return
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        if (!passwordRegex.test(newPassword)) {
          setError("Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character")
          return
        }

        const credential = EmailAuthProvider.credential(user.email, currentPassword)
        await reauthenticateWithCredential(user, credential)
        await updatePassword(user, newPassword)
        setSuccess("Password updated successfully")
      }

      if (tempHeight !== currentHeight) {
        let finalHeight
        if (tempHeightUnit === "cm") {
          finalHeight = Number.parseFloat(tempHeight)
        } else {
          // Convert feet and inches to cm
          const totalInches = (Number(tempHeightFeet) * 12) + Number(tempHeightInches)
          finalHeight = Math.round(totalInches * 2.54)
        }
        
        await updateUserData(user.uid, { 
          "userInfo.height": finalHeight 
        })
        setCurrentHeight(finalHeight)
        setSuccess("Height updated successfully")
      }

      setShowSaveProfile(false)
      setIsEditingUsername(false)
      setIsEditingEmail(false)
      setIsEditingPassword(false)
      setIsEditingHeight(false)
      setProfilePicture(null)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect")
      } else if (error.code === "auth/requires-recent-login") {
        setError("Please log out and log in again before changing your password")
      } else {
        setError("Failed to update profile. Please try again.")
      }
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      setSuccess(null)

      if (!username.trim()) {
        setError("Username cannot be empty")
        return
      }

      if (!email.trim() || !email.includes("@")) {
        setError("Please enter a valid email address")
        return
      }

      // Update email in Firebase Auth if it has changed
      if (email !== user.email) {
        await updateEmail(user, email)
      }

      // Update username in Firestore
      await updateUserData(user.uid, { 
        "userInfo.username": username 
      })
      
      // Upload profile picture if one is selected
      if (profilePicture) {
        await handleSaveProfile()
      }
      
      setSuccess("Profile updated successfully")
      setShowProfileModal(false)
      setIsEditingUsername(false)
      setIsEditingEmail(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile. Please try again.")
    }
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Here you would typically send the form data to your backend
      // For now, we'll just show a success message
      setSuccess("Your message has been sent. We'll get back to you soon!")
      setShowContactModal(false)
      setContactForm({ name: "", email: "", subject: "", message: "" })
    } catch (error) {
      setError("Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    setIsDeleting(true)
    setError(null)

    try {
      if (!deletePassword) {
        setError("Please enter your password to confirm deletion")
        setIsDeleting(false)
        return
      }

      // Reauthenticate user before deletion
      const credential = EmailAuthProvider.credential(user.email, deletePassword)
      await reauthenticateWithCredential(user, credential)

      // Delete user's profile picture from storage if it exists
      if (profilePictureUrl) {
        const storage = getStorage()
        const profilePictureRef = ref(storage, `profilePictures/${user.uid}`)
        try {
          await deleteObject(profilePictureRef)
        } catch (error) {
          console.error("Error deleting profile picture:", error)
        }
      }

      // Delete user's document from Firestore
      await deleteDoc(doc(db, "users", user.uid))

      // Delete the user account from Firebase Auth
      await deleteUser(user)

      // Navigate to login page
      navigate("/login")
    } catch (error) {
      console.error("Error deleting account:", error)
      if (error.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.")
      } else if (error.code === "auth/requires-recent-login") {
        setError("Please log out and log in again before deleting your account")
      } else {
        setError("Failed to delete account. Please try again.")
      }
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#050A04] text-white">
      <div className="fixed w-[1000px] h-[1000px] bg-[#D3A2FF] opacity-100 blur-[800px] rounded-full top-[-1000px] left-[-350px] z-0"></div>
      <div className="fixed w-[1000px] h-[1000px] bg-[#A9DEFF] opacity-100 blur-[800px] rounded-full bottom-[-1000px] right-[-350px] z-0"></div>

      <Sidebar />

      <main className="flex-1 lg:ml-24 md:ml-0 px-4 md:px-10 pt-8 pb-20 md:pb-8 relative z-10 h-screen overflow-y-auto">
        <div className="w-[90%] sm:w-[85%] md:w-[80%] lg:w-[70%] xl:w-[60%] mx-auto flex flex-col mb-16 lg:mb-0">
          <header className="mb-4 w-full">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Settings
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-400">Manage your preferences</p>
          </header>

          {/* Error and Success Messages */}
          {error && (
            <div className="mb-4 p-3 text-sm bg-red-500 bg-opacity-20 text-red-300 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 text-sm bg-green-500 bg-opacity-20 text-green-300 rounded-lg">
              {success}
            </div>
          )}

          {/* Settings Sections */}
          <div className="space-y-4">
            {/* Account */}
            <section className="bg-[#020202] bg-opacity-40 backdrop-blur-30 rounded-[15px] sm:rounded-[30px] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <User className="text-[#D3A2FF] mr-2" size={18} />
                  <h2 className="text-lg font-medium">Account</h2>
                </div>
                {showSaveProfile && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setShowSaveProfile(false)
                        setIsEditingUsername(false)
                        setIsEditingEmail(false)
                        setIsEditingPassword(false)
                        setIsEditingHeight(false)
                        setTempUsername(username)
                        setTempEmail(email)
                        setTempHeight(currentHeight)
                        setTempHeightUnit("cm")
                        setTempHeightFeet(tempHeightFeet)
                        setTempHeightInches(tempHeightInches)
                        setProfilePicture(null)
                        setTempPassword("")
                      }}
                      className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      Cancel
                </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Save Changes
                </button>
              </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Profile Picture Section */}
                <div className="flex flex-col items-center mb-4">
                  <div className="relative w-24 h-24 mb-2">
                    {profilePictureUrl ? (
                      <img
                        src={profilePictureUrl}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-[#D3A2FF] to-[#8E77A4] flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-medium text-white">
                          {username ? username.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-purple-600 p-1.5 rounded-full hover:bg-purple-700 transition-colors"
                    >
                      <Camera size={18} />
                    </button>
                  </div>
                    <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfilePictureChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {profilePicture && (
                    <p className="text-xs text-gray-400">
                      {profilePicture.name}
                    </p>
                  )}
                </div>

                {/* Username Field */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">Username</h3>
                    {isEditingUsername ? (
                      <input
                        type="text"
                        value={tempUsername}
                        onChange={(e) => {
                          setTempUsername(e.target.value)
                          setShowSaveProfile(true)
                        }}
                        className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-xs text-gray-400">{username || "Not set"}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setIsEditingUsername(!isEditingUsername)
                      if (!isEditingUsername) {
                        setTempUsername(username)
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-white focus:outline-none"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                {/* Email Field */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">Email</h3>
                    {isEditingEmail ? (
                      <input
                        type="email"
                        value={tempEmail}
                        onChange={(e) => {
                          setTempEmail(e.target.value)
                          setShowSaveProfile(true)
                        }}
                        className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-xs text-gray-400">{email || "Not set"}</p>
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">Password</h3>
                    {isEditingPassword ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => {
                              setCurrentPassword(e.target.value)
                              setShowSaveProfile(true)
                            }}
                            placeholder="Current Password"
                            className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                          >
                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <div className="relative">
                      <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => {
                              setNewPassword(e.target.value)
                              setShowSaveProfile(true)
                            }}
                            placeholder="New Password"
                            className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                          >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <div className="relative">
                      <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value)
                              setShowSaveProfile(true)
                            }}
                            placeholder="Confirm New Password"
                            className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-400">
                          Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">••••••••</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setIsEditingPassword(!isEditingPassword)
                      if (!isEditingPassword) {
                        setCurrentPassword("")
                        setNewPassword("")
                        setConfirmPassword("")
                        setShowCurrentPassword(false)
                        setShowNewPassword(false)
                        setShowConfirmPassword(false)
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-white focus:outline-none"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                {/* Height Field */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">Current Height</h3>
                    {isEditingHeight ? (
                      <div className="space-y-3">
                        <div className="mb-2">
                          <select
                            value={tempHeightUnit}
                            onChange={(e) => {
                              setTempHeightUnit(e.target.value)
                              if (e.target.value === "cm" && tempHeight) {
                                // Convert feet/inches to cm
                                const totalInches = (Number(tempHeightFeet) * 12) + Number(tempHeightInches)
                                setTempHeight(Math.round(totalInches * 2.54))
                              } else if (e.target.value === "ft" && tempHeight) {
                                // Convert cm to feet/inches
                                const totalInches = Number(tempHeight) / 2.54
                                setTempHeightFeet(Math.floor(totalInches / 12).toString())
                                setTempHeightInches(Math.round(totalInches % 12).toString())
                              }
                            }}
                            className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="cm">Centimeters (cm)</option>
                            <option value="ft">Feet and Inches (ft)</option>
                          </select>
                        </div>

                        {tempHeightUnit === "cm" ? (
                          <div className="relative">
                            <input
                              type="number"
                              value={tempHeight || ""}
                              onChange={(e) => {
                                setTempHeight(e.target.value)
                                setShowSaveProfile(true)
                              }}
                              className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Enter height in centimeters (e.g., 170)"
                              min="1"
                              max="300"
                              required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">cm</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                              <input
                                type="number"
                                value={tempHeightFeet}
                                onChange={(e) => {
                                  setTempHeightFeet(e.target.value)
                                  setShowSaveProfile(true)
                                }}
                                placeholder="Feet (e.g., 5)"
                                className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                min="1"
                                max="8"
                                required
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">ft</span>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                value={tempHeightInches}
                                onChange={(e) => {
                                  setTempHeightInches(e.target.value)
                                  setShowSaveProfile(true)
                                }}
                                placeholder="Inches (e.g., 5)"
                                className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                min="0"
                                max="11"
                                required
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">in</span>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">
                          {tempHeightUnit === "cm" 
                            ? "Enter your height in centimeters (e.g., 170 cm)"
                            : "Enter your height in feet and inches (e.g., 5'5 ft)"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">
                      {currentHeight ? `${currentHeight} cm` : "Not set"}
                    </p>
                        {currentHeight && (
                          <p className="text-xs text-gray-400">
                            {(() => {
                              const totalInches = currentHeight / 2.54
                              const feet = Math.floor(totalInches / 12)
                              const inches = Math.round(totalInches % 12)
                              return `${feet}'${inches}" ft`
                            })()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      setIsEditingHeight(!isEditingHeight)
                      if (!isEditingHeight) {
                        setTempHeight(currentHeight)
                        setTempHeightUnit("cm")
                        // Convert current height to feet and inches
                        const totalInches = currentHeight / 2.54
                        setTempHeightFeet(Math.floor(totalInches / 12).toString())
                        setTempHeightInches(Math.round(totalInches % 12).toString())
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-white focus:outline-none"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            </section>

            {/* Help & Support */}
            <section className="bg-[#020202] bg-opacity-40 backdrop-blur-30 rounded-[15px] sm:rounded-[30px] p-4">
              <div className="flex items-center mb-3">
                <HelpCircle className="text-[#A9DEFF] mr-2" size={18} />
                <h2 className="text-lg font-medium">Help & Support</h2>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => setShowFaqModal(true)}
                  className="w-full py-1.5 px-3 text-sm bg-[#020202] bg-opacity-40 hover:bg-opacity-60 rounded-md text-left transition-colors"
                >
                  FAQs
                </button>

                <button 
                  onClick={() => setShowContactModal(true)}
                  className="w-full py-1.5 px-3 text-sm bg-[#020202] bg-opacity-40 hover:bg-opacity-60 rounded-md text-left transition-colors"
                >
                  Contact Support
                </button>

                <button 
                  onClick={() => setShowPrivacyModal(true)}
                  className="w-full py-1.5 px-3 text-sm bg-[#020202] bg-opacity-40 hover:bg-opacity-60 rounded-md text-left transition-colors"
                >
                  Privacy Policy
                </button>
              </div>
            </section>

            {/* Delete Account Button */}
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-1.5 px-3 text-sm bg-red-900 hover:bg-red-800 rounded-md text-left text-red-200 transition-colors"
            >
              Delete Account
            </button>
              </div>
        </div>
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-white">Change Password</h2>
              <button 
                onClick={() => {
                  setShowPasswordModal(false)
                  setError(null)
                  setSuccess(null)
                  setCurrentPassword("")
                  setNewPassword("")
                  setConfirmPassword("")
                  setShowCurrentPassword(false)
                  setShowNewPassword(false)
                  setShowConfirmPassword(false)
                }} 
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
                  </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                    <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                </div>

                  <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                    <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character
                </p>
                </div>

                  <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                    <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setError(null)
                    setSuccess(null)
                    setCurrentPassword("")
                    setNewPassword("")
                    setConfirmPassword("")
                    setShowCurrentPassword(false)
                    setShowNewPassword(false)
                    setShowConfirmPassword(false)
                  }}
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Update Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Update Profile</h2>
              <button 
                onClick={() => {
                  setShowProfileModal(false)
            setError(null)
            setSuccess(null)
                  setIsEditingUsername(false)
                  setIsEditingEmail(false)
                  setProfilePicture(null)
                }} 
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {/* Username Field */}
                <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Username
                    </label>
                <div className="relative">
                      <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!isEditingUsername}
                    className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                    required
                  />
                  </div>
                </div>

              {/* Email Field */}
                <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email
                    </label>
                <div className="relative">
                      <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditingEmail}
                    className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                    required
                  />
                  </div>
                </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false)
                    setError(null)
                    setSuccess(null)
                    setIsEditingUsername(false)
                    setIsEditingEmail(false)
                    setProfilePicture(null)
                  }}
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-[#D3A2FF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h2 className="text-lg font-bold text-white">Privacy Policy</h2>
              </div>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3 text-gray-300">
              <section className="bg-gray-700 bg-opacity-30 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-[#D3A2FF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-base font-semibold text-white">1. Information We Collect</h3>
                </div>
                <p className="text-sm mb-2">We collect the following types of information:</p>
                <ul className="list-none space-y-1.5">
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#D3A2FF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Personal information (name, email, height)
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#D3A2FF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Health metrics (weight, heart rate, SpO2, temperature)
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#D3A2FF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Foot pressure distribution data
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#D3A2FF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Device connection information
                  </li>
                </ul>
              </section>

              <section className="bg-gray-700 bg-opacity-30 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-[#A9DEFF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-base font-semibold text-white">2. How We Use Your Information</h3>
                </div>
                <p className="text-sm mb-2">Your data is used to:</p>
                <ul className="list-none space-y-1.5">
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#A9DEFF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Provide real-time health monitoring
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#A9DEFF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Track your health progress over time
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#A9DEFF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Generate health insights and recommendations
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#A9DEFF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Improve our services
                  </li>
                </ul>
              </section>

              <section className="bg-gray-700 bg-opacity-30 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-[#FFD43B] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h3 className="text-base font-semibold text-white">3. Data Security</h3>
                </div>
                <p className="text-sm mb-2">We implement security measures to protect your data:</p>
                <ul className="list-none space-y-1.5">
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#FFD43B] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    End-to-end encryption for data transmission
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#FFD43B] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Secure cloud storage with Firebase
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#FFD43B] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Regular security audits
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#FFD43B] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Access controls and authentication
                  </li>
                </ul>
              </section>

              <section className="bg-gray-700 bg-opacity-30 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-[#51CF66] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="text-base font-semibold text-white">4. Your Rights</h3>
                </div>
                <p className="text-sm mb-2">You have the right to:</p>
                <ul className="list-none space-y-1.5">
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#51CF66] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Access your personal data
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#51CF66] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Request data correction or deletion
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#51CF66] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Export your health data
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[#51CF66] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Opt-out of data collection
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <svg className="w-8 h-8 text-[#D3A2FF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-bold text-white">Frequently Asked Questions</h2>
              </div>
              <button 
                onClick={() => setShowFaqModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gray-700 bg-opacity-30 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="w-14 h-14 text-[#D3A2FF] mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                <div>
                    <h3 className="text-base font-semibold text-white mb-1.5">How do I connect my smart scale?</h3>
                    <p className="text-sm text-gray-300">Click on the device status indicator in the top right corner of the dashboard. Follow the connection wizard to pair your device with the app. Make sure your scale is powered on and within range.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 bg-opacity-30 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="w-14 h-14 text-[#A9DEFF] mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1.5">What measurements does the scale provide?</h3>
                    <p className="text-sm text-gray-300">The smart scale measures weight, heart rate, blood oxygen (SpO2), body temperature, and foot pressure distribution. All measurements are displayed in real-time on the dashboard.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 bg-opacity-30 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="w-14 h-14 text-[#FFD43B] mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1.5">How accurate are the measurements?</h3>
                    <p className="text-sm text-gray-300">Our smart scale uses high-precision sensors for accurate measurements. For best results, stand still on the scale with bare feet and wait for the complete measurement cycle (about 10 seconds).</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 bg-opacity-30 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="w-14 h-14 text-[#51CF66] mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1.5">What does the foot pressure distribution show?</h3>
                    <p className="text-sm text-gray-300">The foot pressure distribution shows how your weight is distributed between your left and right feet. This helps identify any imbalances in your posture or weight distribution that might need attention.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 bg-opacity-30 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="w-14 h-14 text-[#D3A2FF] mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1.5">How do I update my profile information?</h3>
                    <p className="text-sm text-gray-300">Go to the Settings page and click the edit button next to the information you want to update. Make your changes and click Save. You can update your username, email, password, and height.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 bg-opacity-30 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="w-14 h-14 text-[#A9DEFF] mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1.5">Is my health data secure?</h3>
                    <p className="text-sm text-gray-300">Yes, we use Firebase's secure infrastructure to store your data. All data is encrypted during transmission and storage. We never share your personal health data with third parties without your consent.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 bg-opacity-30 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="w-14 h-14 text-[#FFD43B] mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1.5">What should I do if my measurements seem incorrect?</h3>
                    <p className="text-sm text-gray-300">First, ensure you're using the scale correctly with bare feet. If measurements still seem off, try recalibrating the scale by disconnecting and reconnecting it. If issues persist, contact our support team.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Support Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <svg className="w-8 h-8 text-[#D3A2FF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h2 className="text-lg font-bold text-white">Contact Support</h2>
              </div>
              <button 
                onClick={() => {
                  setShowContactModal(false)
                  setContactForm({ name: "", email: "", subject: "", message: "" })
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Your Name
                </label>
                      <input
                  type="text"
                  id="name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Your Email
                    </label>
                <input
                  type="email"
                  id="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">
                  Subject
                </label>
                      <input
                  type="text"
                  id="subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                  Message
                    </label>
                <textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  required
                />
                  </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowContactModal(false)
                    setContactForm({ name: "", email: "", subject: "", message: "" })
                  }}
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
                </div>
            </form>
              </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                <h2 className="text-lg font-bold text-white">Delete Account</h2>
              </div>
              <button 
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletePassword("")
                  setError(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
              </div>

            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                Are you sure you want to delete your account? This action cannot be undone. All your data including:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 mb-4">
                <li>Personal information</li>
                <li>Health measurements</li>
                <li>Profile settings</li>
                <li>Account data</li>
              </ul>
              <p className="text-sm text-red-400 font-medium">
                will be permanently deleted.
              </p>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Enter your password to confirm
                </label>
                <div className="relative">
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    id="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                  >
                    {showDeletePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
          </div>

              {error && (
                <div className="bg-red-500 bg-opacity-20 text-red-300 p-3 rounded-md text-sm">
                  {error}
        </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletePassword("")
            setError(null)
                  }}
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
