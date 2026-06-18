"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"

export function Topbar() {
  const router = useRouter()
  const [unreadContactCount, setUnreadContactCount] = useState(0)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)

  useEffect(() => {
    async function fetchUnreadNotifications() {
      try {
        const res = await fetch("/api/admin/notifications")
        if (res.ok) {
          const data = await res.json()
          setUnreadContactCount(data.unreadCount || 0)
        }
      } catch (err) {
        console.error("Failed to fetch unread contact notifications:", err)
      }
    }
    
    // Initial fetch
    fetchUnreadNotifications()
    
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#EEF2F7] bg-[#FCFAF6]/80 backdrop-blur-md px-8 print:hidden">
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Command Center</span>
        <div className="flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-2.5 py-1 text-[11px] font-semibold text-[#22C55E]">
          <div className="size-1.5 rounded-full bg-[#30FC47] animate-pulse" />
          Platform Online
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="relative p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Admin Alerts"
          >
            <Bell className="size-4.5" />
            {unreadContactCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* Notification Popover Dropdown content */}
          {showNotificationDropdown && (
            <>
              <div 
                className="fixed inset-0 z-20 cursor-default" 
                onClick={() => setShowNotificationDropdown(false)} 
              />
              <div className="absolute right-0 mt-2 z-30 w-72 rounded-2xl border border-[#EEF2F7] bg-white p-4 shadow-xl animate-fade-in-up text-left">
                <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-2 mb-2">
                  <span className="font-bold text-xs text-[#111111]">Admin Alerts</span>
                  {unreadContactCount > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-semibold text-red-600">
                      {unreadContactCount} New
                    </span>
                  )}
                </div>
                {unreadContactCount > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <div 
                      onClick={() => {
                        setShowNotificationDropdown(false)
                        router.push("/admin/contact-messages")
                      }}
                      className="flex flex-col gap-1 rounded-xl p-2.5 hover:bg-slate-50 transition-colors cursor-pointer border border-[#EEF2F7]/60"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span>🔔</span>
                        <span>New Contact Message</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Unread: {unreadContactCount}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-normal">
                        Click to open Contact Center
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="py-4 text-center text-xs text-slate-400">No new contact messages</p>
                )}
              </div>
            </>
          )}
        </div>

        <span className="h-4 w-px bg-slate-200" />
        <span>Server: localhost:3000</span>
      </div>
    </header>
  )
}
