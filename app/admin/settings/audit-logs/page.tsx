"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/admin/sidebar"
import { Topbar } from "@/components/admin/topbar"
import { RefreshCw, Search } from "lucide-react"

interface AuditLogItem {
  _id: string
  action: string
  actor: string
  resource: string
  ipAddress: string
  details: string
  timestamp: string
}

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin?action=audit-logs")
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.logs || [])
      } else {
        showToast("Failed to load audit logs data", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Network connection error", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const filteredLogs = auditLogs.filter(log => {
    const query = searchQuery.toLowerCase()
    return (
      log.action?.toLowerCase().includes(query) ||
      log.actor?.toLowerCase().includes(query) ||
      log.resource?.toLowerCase().includes(query) ||
      log.ipAddress?.toLowerCase().includes(query) ||
      log.details?.toLowerCase().includes(query)
    )
  })

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
            <span className="text-slate-600 font-medium">Audit Logs</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Audit Logs</h1>
              <p className="text-xs text-slate-500 mt-1">
                View platform administrative security events, user action histories, and configuration updates.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-[#EEF2F7] bg-white px-4 py-2 pl-9 text-xs outline-none focus:border-emerald-500 shadow-sm w-48 sm:w-64 transition-all"
                />
              </div>

              <button
                onClick={fetchAuditLogs}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-[#EEF2F7] bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-emerald-500" : "text-slate-500"}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Audit Logs list */}
          <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#EEF2F7]/30">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Platform Administrative Security Logs</h3>
            <div className="overflow-x-auto max-h-[550px] overflow-y-auto pr-1">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-transparent border-b border-[#EEF2F7] sticky top-0 bg-white z-10">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Action</th>
                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Actor</th>
                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Resource</th>
                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">IP Address</th>
                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Details</th>
                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F7] text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading audit history...</td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-405">No administrative logs recorded yet.</td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{log.action}</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{log.actor}</td>
                        <td className="px-6 py-4 capitalize text-slate-600">{log.resource}</td>
                        <td className="px-6 py-4 font-mono text-slate-500">{log.ipAddress}</td>
                        <td className="px-6 py-4 max-w-xs truncate text-slate-650" title={log.details}>{log.details}</td>
                        <td className="px-6 py-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
