"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/admin/sidebar"
import { Topbar } from "@/components/admin/topbar"
import { HelpCircle, Send, RefreshCw } from "lucide-react"

interface SupportTicketItem {
  _id: string
  ticketId: string
  userId: string
  userEmail: string
  subject: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "OPEN" | "PENDING" | "CLOSED"
  assignedTo: string
  messages: { sender: string; content: string; timestamp: string }[]
  internalNotes: string
  createdAt: string
}

export default function SupportSettings() {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null)
  const [ticketReply, setTicketReply] = useState("")
  const [ticketInternalNotes, setTicketInternalNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin?action=tickets")
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
        // Update selected ticket details if already open
        if (selectedTicket) {
          const updated = data.tickets.find((t: SupportTicketItem) => t.ticketId === selectedTicket.ticketId)
          if (updated) {
            setSelectedTicket(updated)
            setTicketInternalNotes(updated.internalNotes || "")
          }
        }
      } else {
        showToast("Failed to load tickets data", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Network connection error", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const runAdminPostAction = async (payload: any, successMsg: string) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        showToast(successMsg, "success")
        fetchTickets()
        return true
      } else {
        const err = await res.json()
        showToast(err.error || "Action failed", "error")
        return false
      }
    } catch (err) {
      console.error(err)
      showToast("Network request error", "error")
      return false
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

      {/* Sidebar */}
      <Sidebar activeTab="settings" />

      {/* Main Content */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <Topbar />

        <main className="flex-1 p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/admin/settings" className="hover:text-slate-650 transition-colors">Admin Settings</Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">Support Settings</span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Support Settings</h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage incoming user reports, handle ticket threads, configure auto responses, and adjust ticket parameters.
              </p>
            </div>
            <button
              onClick={fetchTickets}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-[#EEF2F7] bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-emerald-500" : "text-slate-500"}`} />
              Refresh
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Tickets list */}
            <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 lg:col-span-1 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Support Inquiries</h3>
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {tickets.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">No support tickets found.</p>
                ) : (
                  tickets.map((t) => (
                    <button
                      key={t._id}
                      onClick={() => {
                        setSelectedTicket(t)
                        setTicketInternalNotes(t.internalNotes || "")
                      }}
                      className={`w-full text-left rounded-xl p-3 border text-xs transition-all cursor-pointer ${
                        selectedTicket?._id === t._id 
                          ? "border-[#22C55E] bg-[#F0FDF4]/30 shadow-sm" 
                          : "border-[#EEF2F7] hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[9px] text-slate-400">{t.ticketId}</span>
                        <span className={`px-1.5 py-0.5 rounded-[4px] font-bold text-[8px] ${
                          t.priority === "URGENT" ? "bg-red-105 text-[#EF4444]" : t.priority === "HIGH" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-650"
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                      <p className="font-bold text-sm truncate mb-1 text-slate-800">{t.subject}</p>
                      <div className="flex justify-between items-center text-slate-400 text-[10px]">
                        <span className="truncate">{t.userEmail}</span>
                        <span className="capitalize">{t.status.toLowerCase()}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Ticket details / reply */}
            <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 lg:col-span-2 space-y-4">
              {selectedTicket ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <span className="font-mono text-xs text-slate-400">{selectedTicket.ticketId}</span>
                      <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedTicket.subject}</h3>
                      <p className="text-xs text-slate-400">
                        Customer: {selectedTicket.userEmail} | Opened: {new Date(selectedTicket.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <select
                        value={selectedTicket.priority}
                        onChange={(e) => runAdminPostAction({ action: "update-ticket-meta", ticketId: selectedTicket.ticketId, priority: e.target.value }, "Priority updated")}
                        className="border border-[#EEF2F7] rounded-xl px-2.5 py-1 text-xs outline-none bg-white cursor-pointer font-semibold"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => runAdminPostAction({ action: "update-ticket-meta", ticketId: selectedTicket.ticketId, status: e.target.value }, "Status updated")}
                        className="border border-[#EEF2F7] rounded-xl px-2.5 py-1 text-xs outline-none bg-white cursor-pointer font-semibold"
                      >
                        <option value="OPEN">Open</option>
                        <option value="PENDING">Pending</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                      <select
                        value={selectedTicket.assignedTo}
                        onChange={(e) => runAdminPostAction({ action: "update-ticket-meta", ticketId: selectedTicket.ticketId, assignedTo: e.target.value }, "Assignee updated")}
                        className="border border-[#EEF2F7] rounded-xl px-2.5 py-1 text-xs outline-none bg-white cursor-pointer font-semibold"
                      >
                        <option value="Unassigned">Unassigned</option>
                        <option value="Admin Agent 1">Admin Agent 1</option>
                        <option value="Admin Agent 2">Admin Agent 2</option>
                      </select>
                    </div>
                  </div>

                  {/* Message thread logs */}
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 bg-slate-50/50 rounded-xl p-4 border border-[#EEF2F7]">
                    {selectedTicket.messages.map((m, idx) => {
                      const isAdmin = m.sender.includes("Admin") || m.sender.includes("Support")
                      return (
                        <div key={idx} className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs ${
                          isAdmin 
                            ? "bg-emerald-950 text-white rounded-tr-none ml-auto" 
                            : "bg-white border border-[#EEF2F7] rounded-tl-none mr-auto text-slate-800"
                        }`}>
                          <span className="font-bold mb-1">{m.sender}</span>
                          <p className="leading-relaxed">{m.content}</p>
                          <span className={`text-[8px] text-right mt-1.5 ${isAdmin ? "text-emerald-300" : "text-slate-400"}`}>
                            {new Date(m.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Internal notes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-450 uppercase">Internal Notes (Not visible to customer)</label>
                    <textarea
                      value={ticketInternalNotes}
                      onChange={(e) => setTicketInternalNotes(e.target.value)}
                      placeholder="Write private internal notes..."
                      className="w-full rounded-xl border border-[#EEF2F7] p-3 text-xs outline-none focus:border-emerald-500 bg-white"
                      rows={2}
                    />
                    <button
                      onClick={() => runAdminPostAction({ action: "update-ticket-meta", ticketId: selectedTicket.ticketId, internalNotes: ticketInternalNotes }, "Notes saved")}
                      className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Save Notes
                    </button>
                  </div>

                  {/* Admin Reply Input */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-450 uppercase">Reply to Customer</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write support message copy here..."
                        value={ticketReply}
                        onChange={(e) => setTicketReply(e.target.value)}
                        className="flex-1 rounded-xl border border-[#EEF2F7] px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-white"
                      />
                      <button
                        onClick={async () => {
                          if (!ticketReply.trim()) return
                          const ok = await runAdminPostAction({ action: "reply-ticket", ticketId: selectedTicket.ticketId, replyContent: ticketReply }, "Support response sent")
                          if (ok) {
                            setTicketReply("")
                          }
                        }}
                        className="rounded-xl bg-[var(--brand-primary)] hover:bg-[#22C55E] hover:text-white px-4 py-2 text-xs font-bold text-emerald-950 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Send className="size-3.5" /> Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-slate-400 text-sm">
                  <HelpCircle className="size-12 stroke-[1] mb-2" />
                  <span>Select a ticket from the left column to view message thread & reply</span>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
