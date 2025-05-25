"use client"

import { Link, useLocation } from "react-router-dom"
import { Home, BarChart2, Settings, LogOut, User } from "react-feather"
import { useAuth } from "../context/AuthContext"

const Sidebar = () => {
  const location = useLocation()
  const { user, logout } = useAuth()

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-8 top-1/2 transform -translate-y-1/2 h-[90vh] w-16 xl:w-20 2xl:w-24
        bg-[#8E8E8E] bg-opacity-10 backdrop-blur-30 rounded-3xl 
        flex-col justify-between items-center py-4 shadow-lg z-50">
        {/* Profile Icon */}
        <div className="flex flex-col items-center">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D3A2FF] to-[#8E77A4] flex items-center justify-center shadow-lg">
              <span className="text-lg font-medium text-white">
                {user?.userInfo?.username ? user.userInfo.username.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
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

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] sm:w-[85%] md:w-[80%] lg:w-[75%]
        bg-[#8E8E8E] bg-opacity-30 backdrop-blur-30 rounded-3xl
        flex justify-around items-center h-14 shadow-lg z-50">
        {/* Profile Icon */}
        <div className="flex flex-col items-center">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D3A2FF] to-[#8E77A4] flex items-center justify-center shadow-lg">
              <span className="text-base font-medium text-white">
                {user?.userInfo?.username ? user.userInfo.username.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
        </div>

        <SidebarIcon to="/" icon={<Home size={22} />} active={isActive("/")} />
        <SidebarIcon to="/history" icon={<BarChart2 size={22} />} active={isActive("/history")} />
        <SidebarIcon to="/settings" icon={<Settings size={22} />} active={isActive("/settings")} />
        <button
          onClick={logout}
          className="p-2 text-[#8E77A4] hover:text-white transition-all"
          aria-label="Log out"
        >
          <LogOut size={22} />
        </button>
      </div>
    </>
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
