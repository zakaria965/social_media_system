"use client"

import React, { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Bell,
  Cpu,
  CreditCard,
  HelpCircle,
  History,
  Layers,
  ListTodo,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  Settings,
  Share2,
  ShieldAlert,
  Users as UsersIcon,
  Archive,
  CheckCircle2,
  Trash2,
  X,
  Phone,
  User,
  Clock,
  ExternalLink,
  MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ContactMessageItem {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  subject: string
  message: string
  status: "New" | "Read" | "Replied" | "Archived"
  createdAt: string
}

interface KPIStats {
  total: number
  new: number
  read: number
  replied: number
  archived: number
}

export default function AdminContactMessages() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [mounted, setMounted] = useState(false)
  const [timeString, setTimeString] = useState("")
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  
  // Navigation sidebar list (contact-messages is active)
  const activeTab = "contact-messages"
  
  // Notification states
  const [unreadContactCount, setUnreadContactCount] = useState(0)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)

  // Message page states
  const [messages, setMessages] = useState<ContactMessageItem[]>([])
  const [kpis, setKpis] = useState<KPIStats>({ total: 0, new: 0, read: 0, replied: 0, archived: 0 })
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(null)
  
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load clock
  useEffect(() => {
    setMounted(true)
    setTimeString(new Date().toLocaleTimeString())
    const interval = setInterval(() => {
      setTimeString(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch unread notification counts
  const fetchUnreadNotifications = async () => {
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

  // Fetch contact messages
  const fetchContactMessages = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/contact-messages?search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`
      )
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setKpis(data.kpis || { total: 0, new: 0, read: 0, replied: 0, archived: 0 })
      } else {
        showToast("Failed to load contact messages", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Network error loading messages", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnreadNotifications()
    const interval = setInterval(fetchUnreadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchContactMessages()
  }, [searchQuery, statusFilter])

  // Update contact message status
  const updateMessageStatus = async (id: string, nextStatus: "New" | "Read" | "Replied" | "Archived") => {
    try {
      const res = await fetch("/api/admin/contact-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus })
      })

      if (res.ok) {
        showToast(`Message status updated to ${nextStatus}`, "success")
        
        // Update local status
        setMessages(prev => prev.map(m => m._id === id ? { ...m, status: nextStatus } : m))
        
        // If updating the currently viewed message, sync details
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage(prev => prev ? { ...prev, status: nextStatus } : null)
        }

        // Refresh counts
        fetchUnreadNotifications()
        
        // Retrieve fresh stats & list
        const resList = await fetch(
          `/api/admin/contact-messages?search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`
        )
        if (resList.ok) {
          const data = await resList.json()
          setKpis(data.kpis)
        }
      } else {
        showToast("Failed to update message status", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Error updating message status", "error")
    }
  }

  // Delete spam message
  const deleteSpamMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message? This action is permanent.")) {
      return
    }

    try {
      const res = await fetch(`/api/admin/contact-messages?id=${id}`, {
        method: "DELETE"
      })

      if (res.ok) {
        showToast("Spam message deleted successfully", "success")
        setMessages(prev => prev.filter(m => m._id !== id))
        setSelectedMessage(null)
        
        // Refresh counts
        fetchUnreadNotifications()
        
        // Retrieve fresh stats & list
        const resList = await fetch(
          `/api/admin/contact-messages?search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`
        )
        if (resList.ok) {
          const data = await resList.json()
          setKpis(data.kpis)
        }
      } else {
        showToast("Failed to delete message", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Error deleting message", "error")
    }
  }

  // Handle viewing message details
  const handleViewMessage = (message: ContactMessageItem) => {
    setSelectedMessage(message)
    // If the message is New, automatically mark it as Read
    if (message.status === "New") {
      updateMessageStatus(message._id, "Read")
    }
  }

  return (
    <div className="flex min-h-screen bg-[#FCFAF6] text-[#111111] font-sans antialiased">
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl bg-white border border-[#EAEAEA] p-4 shadow-xl animate-fade-in-up">
          <div className={`size-3 rounded-full ${toast.type === "success" ? "bg-[#30FC47]" : toast.type === "error" ? "bg-[#EF4444]" : "bg-[#F59E0B]"}`} />
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* ADMIN SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-[#EEF2F7] bg-[#FCFAF6] print:hidden">
        {/* Brand Section */}
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="size-6 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center">
            <Layers className="size-3 text-white" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">GrowWave Admin</span>
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
            { id: "tickets", label: "Support Center", icon: HelpCircle },
            { id: "contact-messages", label: "Contact Center", icon: Mail },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "monitoring", label: "System Monitoring", icon: Activity },
            { id: "audit-logs", label: "Audit Logs", icon: History },
            { id: "security", label: "Security Center", icon: ShieldAlert },
            { id: "settings", label: "Platform Settings", icon: Settings },
          ].map((item) => {
            const IconComponent = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "contact-messages") {
                    // Already here, trigger refresh
                    fetchContactMessages()
                  } else {
                    router.push(`/admin?tab=${item.id}`)
                  }
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
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

        {/* Footer Admin log out */}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
              {session?.user?.name ? session.user.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold">{session?.user?.name || "Administrator"}</p>
              <p className="truncate text-[10px] text-slate-400">{session?.user?.email || "admin@growwave.com"}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 rounded-xl border border-[#EEF2F7] bg-white hover:bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-colors cursor-pointer"
          >
            <LogOut className="size-3.5" />
            Log out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen print:pl-0 bg-[#FCFAF6]">
        {/* TOP BAR */}
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
                            fetchContactMessages()
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
                            Click to refresh lists
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
            <span className="h-4 w-px bg-slate-200" />
            <span>Time: {mounted ? timeString : ""}</span>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <main className="flex-1 p-8 max-w-6xl w-full mx-auto print:p-0">
          <div className="space-y-6">
            
            {/* Header Title Area */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Contact Center</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Manage visitor queries, filter inquiries by category, and record business actions.
                </p>
              </div>
              <button
                onClick={fetchContactMessages}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#EEF2F7] bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
                Refresh Messages
              </button>
            </div>

            {/* KPI STATS CARDS */}
            <div className="grid gap-6 grid-cols-2 lg:grid-cols-5">
              {[
                { title: "Total Submissions", value: kpis.total, desc: "All incoming requests", color: "text-slate-800" },
                { title: "New Requests", value: kpis.new, desc: "Awaiting review", color: "text-[#EF4444]" },
                { title: "Read Messages", value: kpis.read, desc: "Opened inquiries", color: "text-blue-500" },
                { title: "Replied Queries", value: kpis.replied, desc: "Responded cases", color: "text-[#22C55E]" },
                { title: "Archived Files", value: kpis.archived, desc: "Stored / Closed", color: "text-slate-400" }
              ].map((card, idx) => (
                <div key={idx} className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] border border-[#EEF2F7] transition-all">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{card.title}</span>
                  <span className={cn("text-3xl font-extrabold tracking-tight mt-3 block", card.color)}>
                    {card.value}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(15,23,42,0.04)] border border-[#EEF2F7]">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by sender name, email, subject, keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-[#EEF2F7] focus:border-[#30FC47] focus:ring-1 focus:ring-[#30FC47] transition-all outline-none bg-[#FCFAF6]"
                />
              </div>

              {/* Status filter tabs */}
              <div className="flex gap-1.5 p-1 bg-[#FCFAF6] rounded-xl border border-[#EEF2F7] self-start md:self-auto overflow-x-auto max-w-full">
                {["All", "New", "Read", "Replied", "Archived"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                      statusFilter === status
                        ? "bg-white text-slate-800 shadow-sm border border-[#EEF2F7]"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* MESSAGES LIST TABLE CONTAINER */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(15,23,42,0.04)] border border-[#EEF2F7] overflow-hidden">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw className="size-6 text-slate-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Mail className="size-10 text-slate-300" />
                  <h3 className="text-sm font-bold text-slate-700 mt-4">No Messages Found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    We couldn&apos;t find any contact submissions matching the active search or filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#EEF2F7] bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Sender</th>
                        <th className="px-6 py-4">Subject & Details</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF2F7]">
                      {messages.map((message) => (
                        <tr 
                          key={message._id}
                          className={cn(
                            "hover:bg-[#FCFAF6]/60 transition-colors cursor-pointer",
                            message.status === "New" && "bg-[#30FC47]/[0.02] font-medium"
                          )}
                          onClick={() => handleViewMessage(message)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-[#111111]">
                                {message.firstName} {message.lastName}
                              </span>
                              <span className="text-xs text-slate-450 mt-0.5">{message.email}</span>
                              {message.phone && (
                                <span className="text-[10px] text-slate-400 mt-0.5">{message.phone}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 max-w-sm">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 truncate">{message.subject}</span>
                              <p className="text-xs text-slate-450 mt-0.5 line-clamp-1 truncate font-normal">
                                {message.message}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                            {new Date(message.createdAt).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short"
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                                message.status === "New" && "bg-red-50 text-red-600 border border-red-100",
                                message.status === "Read" && "bg-blue-50 text-blue-600 border border-blue-100",
                                message.status === "Replied" && "bg-green-50 text-green-600 border border-green-100",
                                message.status === "Archived" && "bg-slate-100 text-slate-500 border border-slate-200"
                              )}
                            >
                              <span className={cn(
                                "size-1.5 rounded-full",
                                message.status === "New" && "bg-red-500",
                                message.status === "Read" && "bg-blue-500",
                                message.status === "Replied" && "bg-green-500",
                                message.status === "Archived" && "bg-slate-400"
                              )} />
                              {message.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleViewMessage(message)}
                                className="p-1.5 rounded-lg border border-[#EEF2F7] hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                                title="Open Details"
                              >
                                <ExternalLink className="size-3.5" />
                              </button>
                              <button
                                onClick={() => deleteSpamMessage(message._id)}
                                className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                                title="Delete Spam"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* DETAIL MODAL DRAWER */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedMessage(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <div className="relative h-full w-full max-w-lg bg-white shadow-2xl border-l border-[#EEF2F7] flex flex-col justify-between z-10 animate-fade-in-right p-6">
            
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-4">
                <div className="flex items-center gap-2">
                  <Mail className="size-5 text-slate-700" />
                  <h3 className="text-lg font-bold text-[#111111]">Inquiry Details</h3>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Sender Details Cards */}
              <div className="mt-6 space-y-4">
                <div className="bg-[#FCFAF6] border border-[#EEF2F7] rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-white border border-[#EEF2F7] flex items-center justify-center text-slate-600">
                      <User className="size-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sender Name</p>
                      <p className="text-sm font-bold text-[#111111] mt-0.5">
                        {selectedMessage.firstName} {selectedMessage.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-white border border-[#EEF2F7] flex items-center justify-center text-slate-600">
                      <Mail className="size-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</p>
                      <a 
                        href={`mailto:${selectedMessage.email}`}
                        className="text-sm font-bold text-blue-600 hover:underline mt-0.5 block"
                      >
                        {selectedMessage.email}
                      </a>
                    </div>
                  </div>

                  {selectedMessage.phone && (
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-white border border-[#EEF2F7] flex items-center justify-center text-slate-600">
                        <Phone className="size-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone number</p>
                        <a
                          href={`tel:${selectedMessage.phone}`}
                          className="text-sm font-bold text-slate-800 hover:underline mt-0.5 block"
                        >
                          {selectedMessage.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-white border border-[#EEF2F7] flex items-center justify-center text-slate-600">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Submitted On</p>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {new Date(selectedMessage.createdAt).toLocaleString(undefined, {
                          dateStyle: "full",
                          timeStyle: "medium"
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subject and Message details */}
                <div className="space-y-1 pt-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Subject</p>
                  <p className="text-base font-extrabold text-slate-800 leading-snug">{selectedMessage.subject}</p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Message Content</p>
                  <div className="rounded-xl border border-[#EEF2F7] p-4 text-sm leading-relaxed text-slate-700 bg-white min-h-[120px] max-h-[220px] overflow-y-auto whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-[#EEF2F7] pt-4 mt-auto space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Current Status: <strong className="text-slate-700">{selectedMessage.status}</strong></span>
                {selectedMessage.status === "New" && (
                  <span className="text-emerald-500 font-semibold">Automatically marked as Read</span>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateMessageStatus(selectedMessage._id, "Replied")}
                  disabled={selectedMessage.status === "Replied"}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 disabled:opacity-50 disabled:pointer-events-none py-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  <CheckCircle2 className="size-4" />
                  Replied
                </button>
                <button
                  onClick={() => updateMessageStatus(selectedMessage._id, "Archived")}
                  disabled={selectedMessage.status === "Archived"}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:pointer-events-none py-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  <Archive className="size-4" />
                  Archive
                </button>
                <button
                  onClick={() => deleteSpamMessage(selectedMessage._id)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 text-red-500 py-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="size-4" />
                  Spam (Delete)
                </button>
              </div>
              
              {selectedMessage.status === "Read" && (
                <button
                  onClick={() => updateMessageStatus(selectedMessage._id, "New")}
                  className="w-full py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 font-semibold text-xs cursor-pointer"
                >
                  Mark as Unread (New)
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
