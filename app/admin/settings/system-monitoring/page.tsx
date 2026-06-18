"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/admin/sidebar"
import { Topbar } from "@/components/admin/topbar"
import { 
  Activity, 
  Globe, 
  Database, 
  Cpu, 
  Share2, 
  Layers, 
  RefreshCw 
} from "lucide-react"

export default function SystemMonitoring() {
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 750)
  }

  return (
    <div className="flex min-h-screen bg-[#FCFAF6] text-[#111111] font-sans antialiased">
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
            <span className="text-slate-600 font-medium">System Monitoring</span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-800 tracking-tight">System Monitoring</h1>
              <p className="text-xs text-slate-500 mt-1">
                Real-time services health monitoring, resource allocation, and core API connectivity.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-[#EEF2F7] bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-emerald-500" : "text-slate-500"}`} />
              Refresh Status
            </button>
          </div>

          {refreshing ? (
            <div className="flex h-96 flex-col items-center justify-center space-y-4">
              <RefreshCw className="size-8 animate-spin text-[var(--brand-primary)]" />
              <p className="text-xs text-slate-405 font-medium">Querying platform resources...</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Grid System Statuses */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: "REST API Endpoint", status: "Healthy", desc: "Response latency 42ms", health: "green", icon: Globe },
                  { name: "MongoDB Database", status: "Healthy", desc: "No deadlock threads, 12 active pools", health: "green", icon: Database },
                  { name: "OpenAI API Core", status: "Healthy", desc: "Slight network delay in completions", health: "green", icon: Cpu },
                  { name: "Meta Graph API Core", status: "Healthy", desc: "Webhooks responding to FB posts", health: "green", icon: Share2 },
                  { name: "S3 Storage Bucket", status: "Warning", desc: "Storage utilization near 82% threshold", health: "yellow", icon: Layers },
                  { name: "Platform Server Instance", status: "Healthy", desc: "CPU load 12%, Memory usage 1.2GB", health: "green", icon: Activity }
                ].map((sys, idx) => {
                  const Icon = sys.icon
                  return (
                    <div key={idx} className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#EEF2F7]/40">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{sys.name}</span>
                        <div className={`size-2.5 rounded-full ${sys.health === "green" ? "bg-[#30FC47]" : sys.health === "yellow" ? "bg-[#F59E0B]" : "bg-[#EF4444]"}`} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-50 p-2.5">
                          <Icon className="size-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{sys.status}</p>
                          <p className="text-[11px] text-slate-400">{sys.desc}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* System Load Metrics */}
              <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#EEF2F7]/40 grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Memory Allocation</p>
                  <div className="h-1.5 rounded bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded" style={{ width: "32%" }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Used: 1.2GB</span>
                    <span>Total: 4.0GB</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Server CPU Utilization</p>
                  <div className="h-1.5 rounded bg-slate-100 overflow-hidden">
                    <div className="h-full bg-[#30FC47] rounded" style={{ width: "12%" }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Load: 12%</span>
                    <span>Capacity: 8 Cores</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Disk Volume Storage</p>
                  <div className="h-1.5 rounded bg-slate-100 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded" style={{ width: "82%" }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Used: 41.2GB</span>
                    <span>Total: 50.0GB</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
