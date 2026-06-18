"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Users as UsersIcon,
  Layers,
  CreditCard,
  Cpu,
  Share2,
  HelpCircle,
  Bell,
  Activity,
  Settings,
  ListTodo,
  LogOut,
  Mail,
  ChevronUp,
  ChevronDown
} from "lucide-react"
import { GrowWaveModal } from "@/components/growwave-modal"

interface SidebarProps {
  activeTab: string
  onTabChange?: (tabId: string) => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const [unreadContactCount, setUnreadContactCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Fetch unread notifications for badge counts
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

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem("growwave-active-workspace-id")
      
      // Clear cookies
      const cookies = document.cookie.split(";")
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i]
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      }
      
      // Sign out next-auth session and redirect to /login with message
      await signOut({ callbackUrl: "/login?message=Successfully%20logged%20out" })
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  const handleNavClick = (itemId: string) => {
    if (itemId === "contact-messages") {
      router.push("/admin/contact-messages")
    } else if (itemId === "settings") {
      router.push("/admin/settings")
    } else {
      if (onTabChange) {
        onTabChange(itemId)
      } else {
        router.push(`/admin?tab=${itemId}`)
      }
    }
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-[#EEF2F7] bg-[#FCFAF6] print:hidden">
        {/* Brand Section */}
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="size-6 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center">
            <Layers className="size-3 text-white" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-[#0F172A]">GrowWave Admin</span>
        </div>

        {/* Navigation Sidebar List */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "users", label: "Users", icon: UsersIcon },
            { id: "workspaces", label: "Workspaces & Teams", icon: Layers },
            { id: "subscriptions", label: "Subscriptions", icon: ListTodo },
            { id: "payments", label: "Payments", icon: CreditCard },
            { id: "ai-usage", label: "AI Usage", icon: Cpu },
            { id: "channels", label: "Channels", icon: Share2 },
            { id: "contact-messages", label: "Contact Center", icon: Mail },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "settings", label: "Admin Settings", icon: Settings },
          ].map((item) => {
            const IconComponent = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#F0FDF4] text-[#22C55E] font-semibold"
                    : "text-slate-600 hover:bg-[#F0FDF4]/50 hover:text-[#111111]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className={`size-4 ${isActive ? "text-[#22C55E]" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === "contact-messages" && unreadContactCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white leading-none">
                    {unreadContactCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer Admin Profile Card */}
        <div className="relative p-4 mt-auto">
          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              {/* Overlay for closing when clicking outside */}
              <div 
                className="fixed inset-0 z-20 bg-slate-900/10 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-none"
                onClick={() => setShowDropdown(false)}
              />
              
              <div 
                className="fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl border-t border-[#EEF2F7] bg-[#FCFAF6] p-6 pb-8 shadow-2xl animate-fade-in-up md:absolute md:bottom-[76px] md:left-4 md:right-4 md:top-auto md:rounded-2xl md:border md:p-1.5 md:pb-1.5 md:shadow-lg"
                style={{ animationDuration: '200ms' }}
              >
                {/* Mobile Handle Bar */}
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />
                
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    setShowLogoutConfirm(true)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] transition-all text-left cursor-pointer md:text-xs"
                >
                  <LogOut className="size-4 text-[#EF4444] md:size-3.5" />
                  Logout
                </button>
              </div>
            </>
          )}

          {/* Profile Card Button */}
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#EEF2F7] bg-white p-3.5 shadow-sm hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-[#0F172A]">
                {session?.user?.name ? session.user.name.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <span className="truncate text-xs font-bold text-[#0F172A]">
                {session?.user?.name || "GrowWave Admin"}
              </span>
            </div>
            {showDropdown ? (
              <ChevronUp className="size-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="size-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <GrowWaveModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Logout"
        message="Are you sure you want to logout from GrowWave Admin?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogout}
        variant="danger"
      />
    </>
  )
}
