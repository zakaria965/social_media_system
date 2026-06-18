"use client"

import { Sidebar } from "@/components/admin/sidebar"
import { Topbar } from "@/components/admin/topbar"
import { useRouter } from "next/navigation"
import {
  HelpCircle,
  Activity,
  History,
  ShieldAlert,
  Settings,
  ChevronRight
} from "lucide-react"

export default function SettingsHub() {
  const router = useRouter()

  const categories = [
    {
      title: "Support Settings",
      desc: "Manage support inbox, contact requests, ticket rules, auto responses, and support notifications.",
      route: "/admin/settings/support",
      icon: HelpCircle,
      color: "text-emerald-500 bg-emerald-50",
    },
    {
      title: "System Monitoring",
      desc: "Manage server health, API health, background jobs, queue status, and error tracking.",
      route: "/admin/settings/system-monitoring",
      icon: Activity,
      color: "text-blue-500 bg-blue-50",
    },
    {
      title: "Audit Logs",
      desc: "Manage user actions, admin actions, login history, security events, and system events.",
      route: "/admin/settings/audit-logs",
      icon: History,
      color: "text-purple-500 bg-purple-50",
    },
    {
      title: "Security Center",
      desc: "Manage authentication, permissions, admin roles, session controls, and API security.",
      route: "/admin/settings/security",
      icon: ShieldAlert,
      color: "text-red-500 bg-red-50",
    },
    {
      title: "Platform Settings",
      desc: "Manage GrowWave branding, platform configuration, environment settings, default user settings, and global platform behavior.",
      route: "/admin/settings/platform",
      icon: Settings,
      color: "text-amber-500 bg-amber-50",
    },
  ]

  return (
    <div className="flex min-h-screen bg-[#FCFAF6] text-[#111111] font-sans antialiased">
      {/* Sidebar */}
      <Sidebar activeTab="settings" />

      {/* Main Content */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <Topbar />

        <main className="flex-1 p-8 max-w-4xl w-full mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-800 tracking-tight">Admin Settings</h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Central operational hub for managing platform configurations, security keys, audit history, support tickets, and system metrics.
            </p>
          </div>

          <div className="space-y-4">
            {categories.map((cat, idx) => {
              const Icon = cat.icon
              return (
                <button
                  key={idx}
                  onClick={() => router.push(cat.route)}
                  className="w-full text-left flex items-center justify-between p-6 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#EEF2F7]/50 group cursor-pointer"
                >
                  <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-xl ${cat.color} transition-colors group-hover:bg-[#30FC47]/10`}>
                      <Icon className="size-6 text-slate-700 group-hover:text-[#22C55E]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 group-hover:text-[#22C55E] transition-colors">{cat.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{cat.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-slate-400 group-hover:text-[#22C55E] group-hover:translate-x-1 transition-all" />
                </button>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
