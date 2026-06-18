"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/admin/sidebar"
import { Topbar } from "@/components/admin/topbar"
import { Cpu, Share2, RefreshCw } from "lucide-react"

interface PlatformSettingsData {
  openaiKey: string
  openaiModel: string
  openaiTokenLimit: number
  openaiMonthlyBudget: number
  openaiEmergencyShutdown: boolean
  openaiUsageAlerts: boolean
  fbAppId: string
  fbAppSecret: string
  fbGraphVersion: string
  maintenanceMode: boolean
  aiProvider: string
}

export default function PlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettingsData>({
    openaiKey: "",
    openaiModel: "gpt-4o-mini",
    openaiTokenLimit: 500000,
    openaiMonthlyBudget: 100,
    openaiEmergencyShutdown: false,
    openaiUsageAlerts: true,
    fbAppId: "",
    fbAppSecret: "",
    fbGraphVersion: "v20.0",
    maintenanceMode: false,
    aiProvider: "gemini"
  })

  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin?action=settings")
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      } else {
        showToast("Failed to load settings data", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Network connection error", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
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
        fetchSettings()
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

        <main className="flex-1 p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/admin/settings" className="hover:text-slate-650 transition-colors">Admin Settings</Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">Platform Settings</span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Platform Settings</h1>
              <p className="text-xs text-slate-500 mt-1">
                Configure global service integrations, default tokens policies, and administrative maintenance switches.
              </p>
            </div>
            <button
              onClick={fetchSettings}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-[#EEF2F7] bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-emerald-500" : "text-slate-500"}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white p-12 shadow-card text-center border border-[#EEF2F7]/30 text-xs text-slate-400">
              Querying platform configurations...
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-6 max-w-xl mx-auto border border-[#EEF2F7]/30">
              <h3 className="text-sm font-bold text-slate-850">Global Configuration Settings</h3>
              <p className="text-xs text-slate-400">Change operational settings of the platform. Make sure keys and credential fields are correct.</p>
              
              <div className="space-y-6">
                {/* Z.ai settings */}
                <div className="space-y-4 border-b border-slate-100 pb-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Cpu className="size-3.5" /> Z.ai Settings</h4>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ZAI_API_KEY</label>
                    <input
                      type="password"
                      value={settings.openaiKey}
                      onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                      placeholder="95517b7591a047949c643d27530a36c5.FShnEkmne1d2YDva"
                      className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-[#FCFAF6] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Active AI Provider</label>
                    <select
                      value={settings.aiProvider || "gemini"}
                      onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
                      className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2 text-xs outline-none bg-[#FCFAF6] cursor-pointer font-semibold"
                    >
                      <option value="openai">Z.ai (GLM)</option>
                      <option value="gemini">Gemini (Recommended)</option>
                      <option value="auto">Auto (Gemini with Z.ai Fallback)</option>
                    </select>
                  </div>

                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Default Model</label>
                      <select
                        value={settings.openaiModel}
                        onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
                        className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2 text-xs outline-none bg-[#FCFAF6] cursor-pointer"
                      >
                        <option value="glm-5-turbo">glm-5-turbo</option>
                        <option value="glm-5">glm-5</option>
                        <option value="glm-5.1">glm-5.1</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Token Limits / User / Month</label>
                      <input
                        type="number"
                        value={settings.openaiTokenLimit}
                        onChange={(e) => setSettings({ ...settings, openaiTokenLimit: Number(e.target.value) })}
                        className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-[#FCFAF6]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-slate-50 mt-2">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Emergency AI Shutdown</p>
                      <p className="text-[10px] text-slate-400">Instantly shut down all AI caption and hashtag generators across the platform.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.openaiEmergencyShutdown}
                      onChange={(e) => setSettings({ ...settings, openaiEmergencyShutdown: e.target.checked })}
                      className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-xs font-bold text-slate-700">AI Usage Alerts</p>
                      <p className="text-[10px] text-slate-400">Send notifications to email when monthly OpenAI limits exceed budget.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.openaiUsageAlerts}
                      onChange={(e) => setSettings({ ...settings, openaiUsageAlerts: e.target.checked })}
                      className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Meta settings */}
                <div className="space-y-4 border-b border-slate-100 pb-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Share2 className="size-3.5" /> Meta API Settings</h4>
                  
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">FACEBOOK_APP_ID</label>
                      <input
                        type="text"
                        value={settings.fbAppId}
                        onChange={(e) => setSettings({ ...settings, fbAppId: e.target.value })}
                        className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-[#FCFAF6]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">FACEBOOK_APP_SECRET</label>
                      <input
                        type="password"
                        value={settings.fbAppSecret}
                        onChange={(e) => setSettings({ ...settings, fbAppSecret: e.target.value })}
                        className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-[#FCFAF6]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Graph API Version</label>
                    <input
                      type="text"
                      value={settings.fbGraphVersion}
                      onChange={(e) => setSettings({ ...settings, fbGraphVersion: e.target.value })}
                      className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-[#FCFAF6] font-mono"
                    />
                  </div>
                </div>

                {/* Maintenance Mode */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-700">Maintenance Mode</p>
                    <p className="text-[10px] text-slate-400">Put the platform in maintenance mode. Only administrators will have dashboard access.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => runAdminPostAction({ action: "save-settings", settingsData: settings }, "Global settings saved successfully")}
                  className="w-full rounded-xl bg-[var(--brand-primary)] hover:bg-[#22C55E] hover:text-white py-3 text-sm font-bold text-emerald-950 transition-colors shadow-sm cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
