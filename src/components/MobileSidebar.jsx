"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import { Menu, X } from "lucide-react"

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Mobile sidebar toggle button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed bottom-6 right-6 z-30 bg-[#D3A2FF] text-black p-3 rounded-full shadow-lg"
      >
        <Menu size={24} />
      </button>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-70 z-40" onClick={toggleSidebar}>
          <div className="h-full w-4/5 max-w-xs bg-[#050A04] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 flex justify-end">
              <button onClick={toggleSidebar} className="text-gray-400">
                <X size={24} />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}
    </>
  )
}
