"use client"

import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Home, BarChart2, Settings, LogOut, User } from "react-feather"

const Sidebar = () => {
  const location = useLocation()
  const { logout } = useAuth()

  const isActive = (path) => location.pathname === path

  return (
    <div className="fixed left-8 top-1/2 transform -translate-y-1/2 h-[90vh] w-16 md:w-20 
      bg-[#8E8E8E] bg-opacity-10 backdrop-blur-30 rounded-3xl 
      flex flex-col justify-between items-center py-4 shadow-lg z-50">

      {/* Profile Icon */}
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-neutral-700 bg-opacity-60 flex items-center justify-center text-white shadow-inner">
          <User size={25} />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col items-center gap-8">
        <SidebarIcon to="/" icon={<Home size={25} />} active={isActive("/")} />
        <SidebarIcon to="/history" icon={<BarChart2 size={25} />} active={isActive("/history")} />
        <SidebarIcon to="/settings" icon={<Settings size={25} />} active={isActive("/settings")} />
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="p-2 text-[#8E77A4] hover:text-white transition-all"
        aria-label="Log out"
      >
        <LogOut size={23} />
      </button>
    </div>
  )
}

const SidebarIcon = ({ to, icon, active }) => {
  return (
    <Link
      to={to}
      className={`p-2 rounded-lg transition-all ${
        active
          ? "text-white"
          : "text-[#8E77A4] hover:text-white"
      }`}
    >
      {icon}
    </Link>
  )
}

export default Sidebar
