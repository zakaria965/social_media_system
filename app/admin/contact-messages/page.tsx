"use client"

import React, { useState, useEffect } from "react"
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
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { GrowWaveModal } from "@/components/growwave-modal"
import { Sidebar } from "@/components/admin/sidebar"
import { Topbar } from "@/components/admin/topbar"

interface ContactMessageItem {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  subject: string
  message: string
  status: "NEW" | "IN_PROGRESS" | "REPLIED" | "CLOSED"
  createdAt: string
}

interface KPIStats {
  total: number
  new: number
  inProgress: number
  replied: number
  closed: number
}

export default function AdminContactMessages() {
  const router = useRouter()
  
  const [mounted, setMounted] = useState(false)
  const [timeString, setTimeString] = useState("")
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  // Navigation sidebar list (contact-messages is active)
  const activeTab = "contact-messages"

  // Message page states
  const [messages, setMessages] = useState<ContactMessageItem[]>([])
  const [kpis, setKpis] = useState<KPIStats>({ total: 0, new: 0, inProgress: 0, replied: 0, closed: 0 })
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
        setKpis(data.kpis || { total: 0, new: 0, inProgress: 0, replied: 0, closed: 0 })
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
    fetchContactMessages()
  }, [searchQuery, statusFilter])

  // Update contact message status
  const updateMessageStatus = async (id: string, nextStatus: "NEW" | "IN_PROGRESS" | "REPLIED" | "CLOSED") => {
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
    // If the message is NEW, automatically mark it as IN_PROGRESS
    if (message.status === "NEW" || (message.status as string) === "New") {
      updateMessageStatus(message._id, "IN_PROGRESS")
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
      <Sidebar activeTab={activeTab} />

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen print:pl-0 bg-[#FCFAF6]">
        {/* TOP BAR */}
        <Topbar />

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
                { title: "In Progress", value: kpis.inProgress, desc: "Active inquiries", color: "text-blue-500" },
                { title: "Replied Queries", value: kpis.replied, desc: "Responded cases", color: "text-[#22C55E]" },
                { title: "Closed Cases", value: kpis.closed, desc: "Resolved submissions", color: "text-slate-400" }
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
                {["All", "NEW", "IN_PROGRESS", "REPLIED", "CLOSED"].map((status) => (
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
                    {status === "All" ? "All" : status === "IN_PROGRESS" ? "In Progress" : status === "REPLIED" ? "Replied" : status === "CLOSED" ? "Closed" : "New"}
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
                            (message.status === "NEW" || (message.status as string) === "New") && "bg-[#30FC47]/[0.02] font-medium"
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
                                (message.status === "NEW" || (message.status as string) === "New") && "bg-red-50 text-red-600 border border-red-100",
                                (message.status === "IN_PROGRESS" || (message.status as string) === "In Progress") && "bg-blue-50 text-blue-600 border border-blue-100",
                                (message.status === "REPLIED" || (message.status as string) === "Replied") && "bg-green-50 text-green-600 border border-green-100",
                                (message.status === "CLOSED" || (message.status as string) === "Closed") && "bg-slate-100 text-slate-500 border border-slate-200"
                              )}
                            >
                              <span className={cn(
                                "size-1.5 rounded-full",
                                (message.status === "NEW" || (message.status as string) === "New") && "bg-red-500",
                                (message.status === "IN_PROGRESS" || (message.status as string) === "In Progress") && "bg-blue-500",
                                (message.status === "REPLIED" || (message.status as string) === "Replied") && "bg-green-500",
                                (message.status === "CLOSED" || (message.status as string) === "Closed") && "bg-slate-400"
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
                {(selectedMessage.status === "NEW" || (selectedMessage.status as string) === "New") && (
                  <span className="text-emerald-500 font-semibold">Automatically marked as IN_PROGRESS</span>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateMessageStatus(selectedMessage._id, "REPLIED")}
                  disabled={selectedMessage.status === "REPLIED" || (selectedMessage.status as string) === "Replied"}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 disabled:opacity-50 disabled:pointer-events-none py-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  <CheckCircle2 className="size-4" />
                  Replied
                </button>
                <button
                  onClick={() => updateMessageStatus(selectedMessage._id, "CLOSED")}
                  disabled={selectedMessage.status === "CLOSED" || (selectedMessage.status as string) === "Closed"}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:pointer-events-none py-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  <Archive className="size-4" />
                  Close
                </button>
                <button
                  onClick={() => deleteSpamMessage(selectedMessage._id)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 text-red-500 py-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="size-4" />
                  Spam (Delete)
                </button>
              </div>
              
              {(selectedMessage.status === "IN_PROGRESS" || (selectedMessage.status as string) === "In Progress") && (
                <button
                  onClick={() => updateMessageStatus(selectedMessage._id, "NEW")}
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
