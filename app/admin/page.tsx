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
  ShieldAlert,
  Settings,
  ListTodo,
  LogOut,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Send,
  FileDown,
  RefreshCw,
  Plus,
  Lock,
  Unlock,
  Trash2,
  UserCheck,
  UserX,
  History,
  TrendingUp,
  Mail,
  Zap,
  Globe,
  Database,
  CloudLightning,
  ChevronRight,
  UserPlus
} from "lucide-react"

// Types matching the API response
interface Stats {
  totalUsers: number
  freeUsers: number
  proUsers: number
  activeWorkspaces: number
  connectedChannels: number
  postsPublishedToday: number
  aiRequestsToday: number
  monthlyRevenue: number
  newRegistrations: number
  dbStatus: string
}

interface AuditLogItem {
  _id: string
  action: string
  actor: string
  resource: string
  ipAddress: string
  details: string
  timestamp: string
}

interface UserItem {
  id: string
  name: string
  email: string
  plan: "FREE" | "PRO"
  role: "USER" | "ADMIN"
  status: "ACTIVE" | "SUSPENDED"
  createdAt: string
  lastLogin: string
  activeSessionsCount: number
  activeSessions: any[]
}

interface WorkspaceItem {
  id: string
  name: string
  ownerName: string
  ownerEmail: string
  plan: string
  createdAt: string
  channelsCount: number
  postsCount: number
  status: string
}

interface PaymentItem {
  _id: string
  transactionId: string
  userId: string
  userEmail: string
  amount: number
  status: "SUCCESS" | "FAILED" | "PENDING" | "REFUNDED"
  plan: string
  billingCycle: string
  createdAt: string
}

interface AiLogItem {
  _id: string
  userId: string
  provider: string
  action: string
  tokensUsed: number
  cost: number
  responseTimeMs: number
  status: "success" | "failed"
  createdAt: string
}

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
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Navigation active tab state
  const [activeTab, setActiveTab] = useState("overview")

  // Common UI indicators
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  const [loading, setLoading] = useState(true)

  // Section States
  const [overviewStats, setOverviewStats] = useState<Stats | null>(null)
  const [activityFeed, setActivityFeed] = useState<AuditLogItem[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  
  const [users, setUsers] = useState<UserItem[]>([])
  const [searchUserQuery, setSearchUserQuery] = useState("")
  const [filterUserPlan, setFilterUserPlan] = useState("ALL")

  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([])
  const [searchWorkspaceQuery, setSearchWorkspaceQuery] = useState("")

  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [paymentSummary, setPaymentSummary] = useState({ totalSubscribers: 0, mrr: 0, arr: 0, churnRate: 0, conversionRate: 0 })

  const [aiUsageSummary, setAiUsageSummary] = useState({ totalTokensUsed: 0, costToday: 0, costThisMonth: 0, failedRequests: 0, avgResponseTime: 0 })
  const [aiLogs, setAiLogs] = useState<AiLogItem[]>([])
  const [topAiUsers, setTopAiUsers] = useState<any[]>([])

  const [channels, setChannels] = useState<any[]>([])

  const [tickets, setTickets] = useState<SupportTicketItem[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null)
  const [ticketReply, setTicketReply] = useState("")
  const [ticketInternalNotes, setTicketInternalNotes] = useState("")

  const [announcementSubject, setAnnouncementSubject] = useState("")
  const [announcementTarget, setAnnouncementTarget] = useState("ALL")
  const [announcementContent, setAnnouncementContent] = useState("")
  const [announcementType, setAnnouncementType] = useState("BOTH") // Email, In-app, Both

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])

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
    maintenanceMode: false
  })

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Fetch Tab Specific Data
  const fetchDataForTab = async (tabName: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin?action=${tabName}`)
      if (res.ok) {
        const data = await res.json()
        if (tabName === "overview") {
          setOverviewStats(data.stats)
          setActivityFeed(data.activityFeed)
          setChartData(data.chartData)
        } else if (tabName === "users") {
          setUsers(data.users)
        } else if (tabName === "workspaces") {
          setWorkspaces(data.workspaces)
        } else if (tabName === "payments") {
          setPayments(data.payments)
          setPaymentSummary(data.summary)
        } else if (tabName === "ai-usage") {
          setAiLogs(data.logs)
          setAiUsageSummary(data.summary)
          setTopAiUsers(data.topUsers)
        } else if (tabName === "channels") {
          setChannels(data.channels)
        } else if (tabName === "tickets") {
          setTickets(data.tickets)
        } else if (tabName === "audit-logs") {
          setAuditLogs(data.logs)
        } else if (tabName === "settings") {
          setSettings(data.settings)
        }
      } else {
        showToast(`Failed to load ${tabName} data`, "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Network connection error", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDataForTab(activeTab)
  }, [activeTab])

  // Admin Actions
  const runAdminPostAction = async (payload: any, successMsg: string) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        showToast(successMsg, "success")
        fetchDataForTab(activeTab)
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

  // Export Users to CSV
  const handleExportCSV = () => {
    if (users.length === 0) return
    const headers = ["Name", "Email", "Plan", "Role", "Created Date", "Status", "Last Login"]
    const rows = users.map(u => [
      u.name,
      u.email,
      u.plan,
      u.role,
      new Date(u.createdAt).toLocaleDateString(),
      u.status,
      new Date(u.lastLogin).toLocaleString()
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `growwave_users_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast("CSV exported successfully")
  }

  // Export Users to Print-friendly PDF format
  const handleExportPDF = () => {
    window.print()
  }

  return (
    <div className="flex min-h-screen bg-[#FCFAF6] text-[#111111]">
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl bg-white border border-[#EAEAEA] p-4 shadow-xl animate-fade-in-up">
          <div className={`size-3 rounded-full ${toast.type === "success" ? "bg-[#30FC47]" : toast.type === "error" ? "bg-[#EF4444]" : "bg-[#F59E0B]"}`} />
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* ADMIN SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-[#EAEAEA] bg-white print:hidden">
        {/* Brand Section */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-[#EAEAEA]">
          <div className="size-6 rounded-lg bg-[#30FC47] flex items-center justify-center">
            <Layers className="size-3 text-white" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">GrowWave Admin</span>
        </div>

        {/* Navigation Sidebar List */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "users", label: "Users", icon: UsersIcon },
            { id: "workspaces", label: "Workspaces", icon: Layers },
            { id: "subscriptions", label: "Subscriptions", icon: ListTodo },
            { id: "payments", label: "Payments", icon: CreditCard },
            { id: "ai-usage", label: "AI Usage", icon: Cpu },
            { id: "channels", label: "Channels", icon: Share2 },
            { id: "tickets", label: "Support Center", icon: HelpCircle },
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
                  setSelectedTicket(null)
                  setActiveTab(item.id)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#30FC47]/10 text-emerald-950 font-bold border-l-4 border-[#30FC47]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#111111]"
                }`}
              >
                <IconComponent className={`size-4 ${isActive ? "text-emerald-800" : "text-slate-400"}`} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Footer Admin log out */}
        <div className="border-t border-[#EAEAEA] p-4 flex flex-col gap-2">
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
            className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-colors"
          >
            <LogOut className="size-3.5" />
            Log out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen print:pl-0 bg-[#FCFAF6]">
        {/* TOP BAR */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#EAEAEA] bg-white/80 backdrop-blur-md px-8 print:hidden">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Command Center</span>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
              <div className="size-1.5 rounded-full bg-[#30FC47] animate-pulse" />
              Platform Online
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span>Server: localhost:3000</span>
            <span className="h-4 w-px bg-slate-200" />
            <span>Time: {new Date().toLocaleTimeString()}</span>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <main className="flex-1 p-8 max-w-6xl w-full mx-auto print:p-0">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <RefreshCw className="size-8 text-slate-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* TAB 1: OVERVIEW DASHBOARD */}
              {activeTab === "overview" && overviewStats && (
                <div className="space-y-6">
                  {/* Stats Grid Cards */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { title: "Total Users", value: overviewStats.totalUsers, desc: `${overviewStats.freeUsers} Free / ${overviewStats.proUsers} Pro`, icon: UsersIcon },
                      { title: "Active Workspaces", value: overviewStats.activeWorkspaces, desc: "SaaS Workspace channels", icon: Layers },
                      { title: "Monthly Revenue", value: `$${overviewStats.monthlyRevenue}`, desc: "Calculated active PRO subs", icon: CreditCard },
                      { title: "AI Requests Today", value: overviewStats.aiRequestsToday, desc: "OpenAI generation stats", icon: Cpu }
                    ].map((card, idx) => {
                      const Icon = card.icon
                      return (
                        <div key={idx} className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-400">{card.title}</span>
                            <div className="rounded-lg bg-slate-50 p-2">
                              <Icon className="size-4 text-slate-400" />
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="text-3xl font-bold tracking-tight">{card.value}</span>
                            <p className="mt-1 text-xs text-slate-400">{card.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* SVG Charts Section */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* User Growth Chart */}
                    <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-1.5">
                        <TrendingUp className="size-4 text-[#30FC47]" /> User Registration Trend (7 Days)
                      </h3>
                      {chartData.length > 0 && (
                        <div className="relative h-64 w-full flex items-end justify-between px-2 pt-6">
                          {/* Draw bars or lines */}
                          {chartData.map((data, idx) => {
                            const maxUsers = Math.max(...chartData.map(c => c.users)) || 1
                            const barHeight = (data.users / maxUsers) * 160 // scaling max height to 160px
                            return (
                              <div key={idx} className="flex flex-col items-center flex-1 group">
                                <span className="text-[10px] font-bold mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white rounded px-1 py-0.5 absolute -translate-y-8">{data.users}</span>
                                <div 
                                  className="w-8 rounded-t bg-gradient-to-t from-emerald-100 to-[#30FC47] hover:brightness-95 transition-all duration-300 shadow-sm"
                                  style={{ height: `${Math.max(barHeight, 15)}px` }}
                                />
                                <span className="text-[10px] text-slate-400 mt-2 rotate-12">{data.date}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Revenue growth Chart */}
                    <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-1.5">
                        <CreditCard className="size-4 text-emerald-600" /> MRR growth simulation (7 Days)
                      </h3>
                      {chartData.length > 0 && (
                        <div className="relative h-64 w-full flex items-end justify-between px-2 pt-6">
                          {chartData.map((data, idx) => {
                            const maxRev = Math.max(...chartData.map(c => c.revenue)) || 1
                            const barHeight = (data.revenue / maxRev) * 160
                            return (
                              <div key={idx} className="flex flex-col items-center flex-1 group">
                                <span className="text-[10px] font-bold mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white rounded px-1 py-0.5 absolute -translate-y-8">${data.revenue}</span>
                                <div 
                                  className="w-8 rounded-t bg-gradient-to-t from-emerald-200 to-emerald-500 hover:brightness-95 transition-all duration-300 shadow-sm"
                                  style={{ height: `${Math.max(barHeight, 15)}px` }}
                                />
                                <span className="text-[10px] text-slate-400 mt-2 rotate-12">{data.date}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* System & Audit Log Activity feed */}
                  <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                      <History className="size-4 text-slate-400" /> Platform Audit logs activity feed
                    </h3>
                    <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-2">
                      {activityFeed.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4">No recent activity logs.</p>
                      ) : (
                        activityFeed.map((log) => (
                          <div key={log._id} className="py-3 flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded mr-2 uppercase tracking-tight">{log.action}</span>
                              <span className="text-sm font-semibold">{log.details}</span>
                              <p className="text-[10px] text-slate-400 mt-1">Resource: {log.resource} | Actor: {log.actor} | IP: {log.ipAddress}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: USER MANAGEMENT */}
              {activeTab === "users" && (
                <div className="space-y-6">
                  {/* Filters & Actions Header */}
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-[#EAEAEA] pb-4 print:hidden">
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search users by name, email..."
                        value={searchUserQuery}
                        onChange={(e) => setSearchUserQuery(e.target.value)}
                        className="w-full rounded-xl border border-[#EAEAEA] bg-white pl-10 pr-4 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 items-center justify-end w-full md:w-auto">
                      <div className="flex items-center gap-2 border border-[#EAEAEA] rounded-xl bg-white px-3 py-1.5 text-xs font-semibold">
                        <Filter className="size-3.5 text-slate-400" />
                        <select 
                          value={filterUserPlan} 
                          onChange={(e) => setFilterUserPlan(e.target.value)}
                          className="bg-transparent outline-none cursor-pointer"
                        >
                          <option value="ALL">All Plans</option>
                          <option value="FREE">Free Users</option>
                          <option value="PRO">Pro Users</option>
                        </select>
                      </div>
                      <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 rounded-xl border border-[#EAEAEA] bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold"
                      >
                        <FileDown className="size-3.5 text-slate-500" /> Export CSV
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-800 text-white hover:bg-emerald-950 px-4 py-2 text-xs font-semibold"
                      >
                        <FileDown className="size-3.5" /> PDF / Print Report
                      </button>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto rounded-2xl border border-[#EAEAEA] bg-white shadow-sm">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-50 border-b border-[#EAEAEA]">
                        <tr>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Name</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Plan</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Role</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Status</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Created Date</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Last Login</th>
                          <th className="px-6 py-4 font-bold text-slate-400 text-right uppercase text-xs print:hidden">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEA]">
                        {users
                          .filter(u => {
                            const matchesSearch = u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) || u.email.toLowerCase().includes(searchUserQuery.toLowerCase())
                            const matchesPlan = filterUserPlan === "ALL" || u.plan === filterUserPlan
                            return matchesSearch && matchesPlan
                          })
                          .map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-[#111111]">{u.name}</div>
                                <div className="text-xs text-slate-400">{u.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${u.plan === "PRO" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-slate-100 text-slate-800"}`}>
                                  {u.plan}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-700">{u.role}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.status === "ACTIVE" ? "text-emerald-700" : "text-[#EF4444]"}`}>
                                  <div className={`size-1.5 rounded-full ${u.status === "ACTIVE" ? "bg-[#30FC47]" : "bg-[#EF4444]"}`} />
                                  {u.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-xs text-slate-500">{new Date(u.lastLogin).toLocaleString()}</td>
                              <td className="px-6 py-4 text-right print:hidden">
                                <div className="inline-flex gap-1.5 justify-end">
                                  {/* Suspend/Activate */}
                                  {u.status === "ACTIVE" ? (
                                    <button
                                      title="Suspend User"
                                      onClick={() => runAdminPostAction({ action: "suspend-user", userId: u.id }, "User suspended")}
                                      className="rounded bg-red-50 hover:bg-red-100 text-[#EF4444] p-1.5 transition-colors border border-red-100"
                                    >
                                      <UserX className="size-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      title="Activate User"
                                      onClick={() => runAdminPostAction({ action: "activate-user", userId: u.id }, "User activated")}
                                      className="rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 transition-colors border border-emerald-100"
                                    >
                                      <UserCheck className="size-3.5" />
                                    </button>
                                  )}
                                  
                                  {/* Admin Promote/Demote */}
                                  {u.role !== "ADMIN" ? (
                                    <button
                                      title="Promote to Admin"
                                      onClick={() => runAdminPostAction({ action: "promote-admin", userId: u.id }, "Promoted to Admin")}
                                      className="rounded bg-blue-50 hover:bg-blue-100 text-blue-700 p-1.5 transition-colors border border-blue-100"
                                    >
                                      <UserPlus className="size-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      title="Remove Admin Access"
                                      onClick={() => runAdminPostAction({ action: "remove-admin", userId: u.id }, "Removed admin access")}
                                      className="rounded bg-amber-50 hover:bg-amber-100 text-amber-700 p-1.5 transition-colors border border-amber-100"
                                    >
                                      <Lock className="size-3.5" />
                                    </button>
                                  )}

                                  {/* Reset Limits */}
                                  <button
                                    title="Reset limits & quotas"
                                    onClick={() => runAdminPostAction({ action: "reset-user-limits", userId: u.id }, "AI token quota reset")}
                                    className="rounded bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 transition-colors"
                                  >
                                    <RefreshCw className="size-3.5" />
                                  </button>

                                  {/* Delete */}
                                  <button
                                    title="Delete User Account"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to permanently delete user ${u.email}?`)) {
                                        runAdminPostAction({ action: "delete-user", userId: u.id }, "User deleted successfully")
                                      }
                                    }}
                                    className="rounded bg-slate-100 hover:bg-red-500 hover:text-white text-slate-500 p-1.5 transition-all"
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
                </div>
              )}

              {/* TAB 3: WORKSPACE MANAGEMENT */}
              {activeTab === "workspaces" && (
                <div className="space-y-6">
                  {/* Filter Header */}
                  <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-4">
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search workspaces..."
                        value={searchWorkspaceQuery}
                        onChange={(e) => setSearchWorkspaceQuery(e.target.value)}
                        className="w-full rounded-xl border border-[#EAEAEA] bg-white pl-10 pr-4 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Workspaces list */}
                  <div className="overflow-x-auto rounded-2xl border border-[#EAEAEA] bg-white shadow-sm">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-50 border-b border-[#EAEAEA]">
                        <tr>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Workspace Name</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Owner</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Owner Plan</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Connected Channels</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Posts Count</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Created Date</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Status</th>
                          <th className="px-6 py-4 font-bold text-slate-400 text-right uppercase text-xs">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEA]">
                        {workspaces
                          .filter(w => w.name.toLowerCase().includes(searchWorkspaceQuery.toLowerCase()) || w.ownerEmail.toLowerCase().includes(searchWorkspaceQuery.toLowerCase()))
                          .map((w) => (
                            <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-semibold">{w.name}</td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-slate-700">{w.ownerName}</div>
                                <div className="text-xs text-slate-400">{w.ownerEmail}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${w.plan === "PRO" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-slate-100 text-slate-800"}`}>
                                  {w.plan}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-800">{w.channelsCount}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{w.postsCount}</td>
                              <td className="px-6 py-4 text-xs text-slate-500">{new Date(w.createdAt).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${w.status === "Active" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#EF4444]"}`}>
                                  {w.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="inline-flex gap-1.5 justify-end">
                                  <button
                                    title="Open Workspace (Simulated)"
                                    onClick={() => alert(`Opening workspace dashboard preview for workspace: ${w.name}`)}
                                    className="rounded bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 text-xs font-semibold transition-colors"
                                  >
                                    Open
                                  </button>
                                  {w.status === "Active" ? (
                                    <button
                                      onClick={() => runAdminPostAction({ action: "disable-workspace", workspaceId: w.id }, "Workspace disabled (owner suspended)")}
                                      className="rounded border border-red-200 bg-white hover:bg-red-50 text-[#EF4444] px-2.5 py-1 text-xs font-semibold transition-colors"
                                    >
                                      Disable
                                    </button>
                                  ) : null}
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to permanently delete workspace ${w.name}?`)) {
                                        runAdminPostAction({ action: "delete-workspace", workspaceId: w.id }, "Workspace deleted")
                                      }
                                    }}
                                    className="rounded bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600 p-1.5 transition-all"
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
                </div>
              )}

              {/* TAB 4: SUBSCRIPTION MANAGEMENT */}
              {activeTab === "subscriptions" && (
                <div className="space-y-6">
                  {/* Metric overview cards */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { title: "Total Subscribers", value: paymentSummary.totalSubscribers, desc: "Active SaaS PRO plan conversions" },
                      { title: "Monthly Recurring Revenue (MRR)", value: `$${paymentSummary.mrr}`, desc: "MRR estimated today" },
                      { title: "Annual Recurring Revenue (ARR)", value: `$${paymentSummary.arr}`, desc: "ARR calculated estimate" },
                      { title: "SaaS Churn Rate", value: `${paymentSummary.churnRate}%`, desc: "Average user cancellations" }
                    ].map((card, idx) => (
                      <div key={idx} className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
                        <span className="text-sm font-semibold text-slate-400">{card.title}</span>
                        <div className="mt-4">
                          <span className="text-3xl font-bold tracking-tight">{card.value}</span>
                          <p className="mt-1 text-xs text-slate-400">{card.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* List of active users to upgrade/downgrade */}
                  <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold mb-4">Manual User Subscription Overrides</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-slate-50 border-b border-[#EAEAEA]">
                          <tr>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">User Name</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Current Plan</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Status</th>
                            <th className="px-6 py-4 font-bold text-slate-400 text-right uppercase text-xs">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAEAEA]">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-semibold">{u.name}</div>
                                <div className="text-xs text-slate-400">{u.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${u.plan === "PRO" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-slate-100 text-slate-800"}`}>
                                  {u.plan}
                                </span>
                              </td>
                              <td className="px-6 py-4 capitalize">{u.status}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="inline-flex gap-1.5 justify-end">
                                  {u.plan === "FREE" ? (
                                    <button
                                      onClick={() => runAdminPostAction({ action: "upgrade-user", userId: u.id }, `Upgraded ${u.name} to PRO`)}
                                      className="rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 text-xs font-semibold transition-colors border border-emerald-100"
                                    >
                                      Upgrade to PRO
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => runAdminPostAction({ action: "downgrade-user", userId: u.id }, `Downgraded ${u.name} to FREE`)}
                                        className="rounded border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold transition-colors"
                                      >
                                        Downgrade to FREE
                                      </button>
                                      <button
                                        onClick={() => runAdminPostAction({ action: "cancel-subscription", userId: u.id }, `Cancelled plan subscription for ${u.name}`)}
                                        className="rounded bg-red-50 hover:bg-red-100 text-[#EF4444] px-3 py-1.5 text-xs font-semibold transition-colors border border-[#EF4444]/10"
                                      >
                                        Cancel Subscription
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PAYMENTS CENTER */}
              {activeTab === "payments" && (
                <div className="space-y-6">
                  {/* Payment overview */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { title: "Monthly Revenue", value: `$${paymentSummary.mrr}`, desc: "MRR today" },
                      { title: "Pending Payments", value: `$0`, desc: "Outstanding invoices" },
                      { title: "Failed Payments", value: `$${payments.filter(p => p.status === "FAILED").reduce((acc, curr) => acc + curr.amount, 0)}`, desc: "Declined transactions" },
                      { title: "Refunds Issued", value: `$${payments.filter(p => p.status === "REFUNDED").reduce((acc, curr) => acc + curr.amount, 0)}`, desc: "Returned charges" }
                    ].map((card, idx) => (
                      <div key={idx} className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
                        <span className="text-sm font-semibold text-slate-400">{card.title}</span>
                        <div className="mt-4">
                          <span className="text-3xl font-bold tracking-tight">{card.value}</span>
                          <p className="mt-1 text-xs text-slate-400">{card.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Transactions table */}
                  <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold mb-4">Transactions Logs</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-slate-50 border-b border-[#EAEAEA]">
                          <tr>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Transaction ID</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Customer Email</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Amount</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Plan</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Date</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Status</th>
                            <th className="px-6 py-4 font-bold text-slate-400 text-right uppercase text-xs">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAEAEA]">
                          {payments.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No payment transactions recorded yet.</td>
                            </tr>
                          ) : (
                            payments.map((p) => (
                              <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs">{p.transactionId}</td>
                                <td className="px-6 py-4 font-semibold text-slate-700">{p.userEmail}</td>
                                <td className="px-6 py-4 font-bold">${p.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 capitalize">{p.plan} ({p.billingCycle})</td>
                                <td className="px-6 py-4 text-xs text-slate-500">{new Date(p.createdAt).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    p.status === "SUCCESS" 
                                      ? "bg-emerald-50 text-emerald-800" 
                                      : p.status === "REFUNDED" 
                                      ? "bg-slate-100 text-slate-800" 
                                      : "bg-red-50 text-[#EF4444]"
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="inline-flex gap-1.5 justify-end">
                                    {p.status === "SUCCESS" && (
                                      <button
                                        onClick={() => runAdminPostAction({ action: "issue-refund", transactionId: p.transactionId }, "Refund completed successfully")}
                                        className="rounded border border-red-200 bg-white hover:bg-red-50 text-[#EF4444] px-2.5 py-1 text-xs font-semibold transition-colors"
                                      >
                                        Refund
                                      </button>
                                    )}
                                    {p.status === "FAILED" && (
                                      <button
                                        onClick={() => runAdminPostAction({ action: "retry-payment", transactionId: p.transactionId }, "Payment retry succeeded")}
                                        className="rounded bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 text-xs font-semibold transition-colors"
                                      >
                                        Retry Charge
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: AI USAGE CENTER */}
              {activeTab === "ai-usage" && (
                <div className="space-y-6">
                  {/* AI usage metrics */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { title: "Total Tokens Used", value: aiUsageSummary.totalTokensUsed.toLocaleString(), desc: "Aggregated tokens generated" },
                      { title: "Cost This Month", value: `$${aiUsageSummary.costThisMonth.toFixed(4)}`, desc: "Calculated API invoice costs" },
                      { title: "Cost Today", value: `$${aiUsageSummary.costToday.toFixed(4)}`, desc: "OpenAI costs today" },
                      { title: "Avg Latency Speed", value: `${aiUsageSummary.avgResponseTime}ms`, desc: "OpenAI average response time" }
                    ].map((card, idx) => (
                      <div key={idx} className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
                        <span className="text-sm font-semibold text-slate-400">{card.title}</span>
                        <div className="mt-4">
                          <span className="text-3xl font-bold tracking-tight">{card.value}</span>
                          <p className="mt-1 text-xs text-slate-400">{card.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Top users & AI Logs */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Top Users */}
                    <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm lg:col-span-1">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Top AI Users By Token Consumption</h3>
                      <div className="space-y-4">
                        {topAiUsers.length === 0 ? (
                          <p className="text-xs text-slate-400">No token logs.</p>
                        ) : (
                          topAiUsers.map((user, idx) => (
                            <div key={idx} className="flex justify-between items-center pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                              <div>
                                <p className="text-sm font-bold">{user.name}</p>
                                <p className="text-[10px] text-slate-400">{user.email}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-slate-800">{user.tokens.toLocaleString()} tkn</p>
                                <p className="text-[10px] text-emerald-600 font-semibold">${user.cost.toFixed(4)}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* AI Logs */}
                    <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm lg:col-span-2">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">OpenAI / LLM Request Logs</h3>
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead className="bg-slate-50 border-b border-[#EAEAEA] sticky top-0">
                            <tr>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Provider</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Action</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Tokens</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Cost</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Latency</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Date</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EAEAEA]">
                            {aiLogs.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">No request logs recorded yet.</td>
                              </tr>
                            ) : (
                              aiLogs.map((log) => (
                                <tr key={log._id}>
                                  <td className="px-4 py-3 uppercase font-semibold">{log.provider}</td>
                                  <td className="px-4 py-3 font-mono">{log.action}</td>
                                  <td className="px-4 py-3 font-bold">{log.tokensUsed.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-emerald-700 font-bold">${log.cost.toFixed(4)}</td>
                                  <td className="px-4 py-3">{log.responseTimeMs}ms</td>
                                  <td className="px-4 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.status === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#EF4444]"}`}>
                                      {log.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: CHANNEL MANAGEMENT */}
              {activeTab === "channels" && (
                <div className="space-y-6">
                  {/* Platforms Connected Stats */}
                  <div className="grid gap-6 grid-cols-2 lg:grid-cols-5">
                    {["facebook", "instagram", "linkedin", "tiktok", "twitter"].map((plat) => {
                      const count = channels.filter(c => c.platform === plat && c.status === "connected").length
                      return (
                        <div key={plat} className="rounded-2xl border border-[#EAEAEA] bg-white p-4 shadow-sm text-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{plat}</span>
                          <p className="text-3xl font-extrabold mt-2 text-slate-800">{count}</p>
                          <span className="text-[10px] text-slate-400 font-semibold">Active Channels</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Connected channels list */}
                  <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold mb-4">SaaS Connected Social Media Channels</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-slate-50 border-b border-[#EAEAEA]">
                          <tr>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Channel Details</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Owner Account</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Followers count</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Token Status</th>
                            <th className="px-6 py-4 font-bold text-slate-400 text-right uppercase text-xs">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAEAEA]">
                          {channels.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No social channels connected yet.</td>
                            </tr>
                          ) : (
                            channels.map((ch) => (
                              <tr key={ch.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 flex items-center gap-3">
                                  {ch.avatar ? (
                                    <img src={ch.avatar} alt="Avatar" className="size-8 rounded-full border border-slate-100" />
                                  ) : (
                                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs uppercase">{ch.platform.slice(0, 2)}</div>
                                  )}
                                  <div>
                                    <div className="font-semibold text-slate-800 capitalize">{ch.platform}</div>
                                    <div className="text-xs text-slate-400">@{ch.username}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-semibold">{ch.ownerName}</div>
                                  <div className="text-xs text-slate-400">{ch.ownerEmail}</div>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-700">{ch.followers.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${ch.status === "connected" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#EF4444]"}`}>
                                    {ch.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="inline-flex gap-1.5 justify-end">
                                    <button
                                      onClick={() => alert(`Token refresh simulation completed for ${ch.username} (${ch.platform})`)}
                                      className="rounded bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 text-xs font-semibold transition-colors"
                                    >
                                      Refresh Token
                                    </button>
                                    <button
                                      onClick={() => alert(`Simulating platform channel disconnect. Disconnected successfully.`)}
                                      className="rounded border border-red-200 bg-white hover:bg-red-50 text-[#EF4444] px-2.5 py-1.5 text-xs font-semibold transition-colors"
                                    >
                                      Disconnect
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: SUPPORT CENTER */}
              {activeTab === "tickets" && (
                <div className="space-y-6">
                  {/* Grid tickets & reply drawer */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Tickets list */}
                    <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm lg:col-span-1 space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Support Inquiries</h3>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {tickets.length === 0 ? (
                          <p className="text-sm text-slate-400 py-4 text-center">No support tickets.</p>
                        ) : (
                          tickets.map((t) => (
                            <button
                              key={t._id}
                              onClick={() => {
                                setSelectedTicket(t)
                                setTicketInternalNotes(t.internalNotes || "")
                              }}
                              className={`w-full text-left rounded-xl p-3 border text-xs transition-all ${
                                selectedTicket?._id === t._id 
                                  ? "border-emerald-500 bg-emerald-50/25 shadow-sm" 
                                  : "border-[#EAEAEA] hover:bg-slate-50/50"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-mono text-[10px] text-slate-400">{t.ticketId}</span>
                                <span className={`px-1.5 py-0.5 rounded-[4px] font-bold text-[9px] ${
                                  t.priority === "URGENT" ? "bg-red-100 text-[#EF4444]" : t.priority === "HIGH" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
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
                    <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
                      {selectedTicket ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                            <div>
                              <span className="font-mono text-xs text-slate-400">{selectedTicket.ticketId}</span>
                              <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedTicket.subject}</h3>
                              <p className="text-xs text-slate-400">Customer: {selectedTicket.userEmail} | Opened: {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-end">
                              <select
                                value={selectedTicket.priority}
                                onChange={(e) => runAdminPostAction({ action: "update-ticket-meta", ticketId: selectedTicket.ticketId, priority: e.target.value }, "Priority updated")}
                                className="border border-slate-200 rounded px-2.5 py-1 text-xs outline-none bg-white cursor-pointer font-semibold"
                              >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                              </select>
                              <select
                                value={selectedTicket.status}
                                onChange={(e) => runAdminPostAction({ action: "update-ticket-meta", ticketId: selectedTicket.ticketId, status: e.target.value }, "Status updated")}
                                className="border border-slate-200 rounded px-2.5 py-1 text-xs outline-none bg-white cursor-pointer font-semibold"
                              >
                                <option value="OPEN">Open</option>
                                <option value="PENDING">Pending</option>
                                <option value="CLOSED">Closed</option>
                              </select>
                              <select
                                value={selectedTicket.assignedTo}
                                onChange={(e) => runAdminPostAction({ action: "update-ticket-meta", ticketId: selectedTicket.ticketId, assignedTo: e.target.value }, "Assignee updated")}
                                className="border border-slate-200 rounded px-2.5 py-1 text-xs outline-none bg-white cursor-pointer font-semibold"
                              >
                                <option value="Unassigned">Unassigned</option>
                                <option value="Admin Agent 1">Admin Agent 1</option>
                                <option value="Admin Agent 2">Admin Agent 2</option>
                              </select>
                            </div>
                          </div>

                          {/* Message thread logs */}
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 bg-slate-50/50 rounded-xl p-4 border border-[#EAEAEA]">
                            {selectedTicket.messages.map((m, idx) => {
                              const isAdmin = m.sender.includes("Admin") || m.sender.includes("Support")
                              return (
                                <div key={idx} className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs ${
                                  isAdmin 
                                    ? "bg-emerald-950 text-white rounded-tr-none ml-auto" 
                                    : "bg-white border border-[#EAEAEA] rounded-tl-none mr-auto text-slate-800"
                                }`}>
                                  <span className="font-bold mb-1">{m.sender}</span>
                                  <p className="leading-relaxed">{m.content}</p>
                                  <span className={`text-[8px] text-right mt-1.5 ${isAdmin ? "text-emerald-300" : "text-slate-400"}`}>{new Date(m.timestamp).toLocaleTimeString()}</span>
                                </div>
                              )
                            })}
                          </div>

                          {/* Internal notes */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Internal Notes (Not visible to customer)</label>
                            <textarea
                              value={ticketInternalNotes}
                              onChange={(e) => setTicketInternalNotes(e.target.value)}
                              placeholder="Write private internal notes..."
                              className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-emerald-500 bg-white"
                              rows={2}
                            />
                            <button
                              onClick={() => runAdminPostAction({ action: "update-ticket-meta", ticketId: selectedTicket.ticketId, internalNotes: ticketInternalNotes }, "Notes saved")}
                              className="rounded bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-semibold transition-colors"
                            >
                              Save Notes
                            </button>
                          </div>

                          {/* Admin Reply Input */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <label className="text-xs font-bold text-slate-400 uppercase">Reply to Customer</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Write support message copy here..."
                                value={ticketReply}
                                onChange={(e) => setTicketReply(e.target.value)}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-white"
                              />
                              <button
                                onClick={async () => {
                                  if (!ticketReply.trim()) return
                                  const ok = await runAdminPostAction({ action: "reply-ticket", ticketId: selectedTicket.ticketId, replyContent: ticketReply }, "Support response sent")
                                  if (ok) {
                                    setTicketReply("")
                                  }
                                }}
                                className="rounded-xl bg-[#30FC47] hover:bg-emerald-500 hover:text-white px-4 py-2 text-xs font-bold text-emerald-950 flex items-center gap-1 transition-colors"
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
                </div>
              )}

              {/* TAB 9: NOTIFICATIONS CENTER */}
              {activeTab === "notifications" && (
                <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm space-y-6 max-w-xl mx-auto">
                  <h3 className="text-lg font-bold text-slate-800">Broadcast Platform Announcement</h3>
                  <p className="text-xs text-slate-400">Send massive notifications, news, or system updates directly to selected customer plan segments.</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Subject Headline</label>
                      <input
                        type="text"
                        placeholder="e.g. Growth Campaign Update 2026"
                        value={announcementSubject}
                        onChange={(e) => setAnnouncementSubject(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500 bg-[#FCFAF6]"
                      />
                    </div>

                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Target Audience</label>
                        <select
                          value={announcementTarget}
                          onChange={(e) => setAnnouncementTarget(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none bg-[#FCFAF6] cursor-pointer"
                        >
                          <option value="ALL">All Users</option>
                          <option value="FREE">Free Users Only</option>
                          <option value="PRO">Pro Users Only</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Notification Type</label>
                        <select
                          value={announcementType}
                          onChange={(e) => setAnnouncementType(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none bg-[#FCFAF6] cursor-pointer"
                        >
                          <option value="BOTH">Email + In-App Notice</option>
                          <option value="EMAIL">Email Campaign Only</option>
                          <option value="IN_APP">In-App Banner Only</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Message Content (Markdown supported)</label>
                      <textarea
                        placeholder="Draft your announcement message here..."
                        value={announcementContent}
                        onChange={(e) => setAnnouncementContent(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-emerald-500 bg-[#FCFAF6]"
                        rows={6}
                      />
                    </div>

                    <button
                      onClick={async () => {
                        if (!announcementSubject.trim() || !announcementContent.trim()) {
                          showToast("Please fill all subject and content fields.", "error")
                          return
                        }
                        const ok = await runAdminPostAction({
                          action: "create-announcement",
                          subject: announcementSubject,
                          target: announcementTarget,
                          type: announcementType,
                          content: announcementContent
                        }, "Announcement broadcasted successfully")
                        if (ok) {
                          setAnnouncementSubject("")
                          setAnnouncementContent("")
                        }
                      }}
                      className="w-full rounded-xl bg-[#30FC47] hover:bg-emerald-500 hover:text-white py-3 text-sm font-bold text-emerald-950 transition-colors shadow-sm"
                    >
                      Broadcast Announcement Now
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 10: SYSTEM MONITORING */}
              {activeTab === "monitoring" && (
                <div className="space-y-6">
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
                        <div key={idx} className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{sys.name}</span>
                            <div className={`size-3 rounded-full ${sys.health === "green" ? "bg-[#30FC47]" : sys.health === "yellow" ? "bg-[#F59E0B]" : "bg-[#EF4444]"}`} />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-slate-50 p-2.5">
                              <Icon className="size-5 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-bold text-base">{sys.status}</p>
                              <p className="text-xs text-slate-400">{sys.desc}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* System Load Metrics */}
                  <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm grid gap-6 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Memory Allocation</p>
                      <div className="h-2 rounded bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded" style={{ width: "32%" }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Used: 1.2GB</span>
                        <span>Total: 4.0GB</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Server CPU Utilization</p>
                      <div className="h-2 rounded bg-slate-100 overflow-hidden">
                        <div className="h-full bg-[#30FC47] rounded" style={{ width: "12%" }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Load: 12%</span>
                        <span>Capacity: 8 Cores</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Disk Volume Storage</p>
                      <div className="h-2 rounded bg-slate-100 overflow-hidden">
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

              {/* TAB 11: AUDIT LOGS */}
              {activeTab === "audit-logs" && (
                <div className="space-y-6">
                  {/* Audit Logs list */}
                  <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold mb-4">Platform Administrative Security Logs</h3>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-slate-50 border-b border-[#EAEAEA] sticky top-0">
                          <tr>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Action</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Actor</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Resource</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">IP Address</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Details</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAEAEA] text-xs">
                          {auditLogs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No administrative logs recorded yet.</td>
                            </tr>
                          ) : (
                            auditLogs.map((log) => (
                              <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{log.action}</span>
                                </td>
                                <td className="px-6 py-4 font-semibold">{log.actor}</td>
                                <td className="px-6 py-4 capitalize">{log.resource}</td>
                                <td className="px-6 py-4 font-mono">{log.ipAddress}</td>
                                <td className="px-6 py-4 max-w-xs truncate" title={log.details}>{log.details}</td>
                                <td className="px-6 py-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 12: SECURITY CENTER */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  {/* Security Stats Grid */}
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Failed Login Attempts</p>
                      <p className="text-4xl font-extrabold text-[#EF4444] mt-2">
                        {users.reduce((acc, curr) => acc + (curr.activeSessions?.filter(s => s.status === "failed")?.length || 0), 0) || 4}
                      </p>
                      <span className="text-[10px] text-slate-400">Suspicious activities monitored</span>
                    </div>
                    <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blocked IPs</p>
                      <p className="text-4xl font-extrabold text-slate-800 mt-2">1</p>
                      <span className="text-[10px] text-[#30FC47] font-semibold">IP Firewalls active</span>
                    </div>
                    <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Sessions</p>
                      <p className="text-4xl font-extrabold text-emerald-800 mt-2">
                        {users.reduce((acc, curr) => acc + (curr.activeSessionsCount || 0), 0)}
                      </p>
                      <span className="text-[10px] text-slate-400">Global open login tokens</span>
                    </div>
                  </div>

                  {/* Active login sessions controller */}
                  <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold mb-4">Active User Session Tokens</h3>
                    <p className="text-xs text-slate-400 mb-4">View active authentication sessions. Force log out terminals immediately if suspicious actions are detected.</p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-slate-50 border-b border-[#EAEAEA]">
                          <tr>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">User Account</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">IP Address</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Device / Browser</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Last Active</th>
                            <th className="px-6 py-4 font-bold text-slate-400 text-right uppercase text-xs">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAEAEA] text-xs">
                          {users.filter(u => u.activeSessionsCount > 0).map(u => 
                            u.activeSessions.map((sessionItem) => (
                              <tr key={sessionItem.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-semibold">{u.name}</div>
                                  <div className="text-[10px] text-slate-400">{u.email}</div>
                                </td>
                                <td className="px-6 py-4 font-mono">{sessionItem.ip || "127.0.0.1"}</td>
                                <td className="px-6 py-4">{sessionItem.device} / {sessionItem.browser}</td>
                                <td className="px-6 py-4 text-slate-500">{new Date(sessionItem.lastActive).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => runAdminPostAction({ action: "force-logout-session", sessionId: sessionItem.id }, `Terminated session for user: ${u.email}`)}
                                    className="rounded border border-red-200 bg-white hover:bg-red-50 text-[#EF4444] px-2.5 py-1 text-[11px] font-semibold transition-colors"
                                  >
                                    Force Log out
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                          {users.filter(u => u.activeSessionsCount > 0).length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No active login sessions monitored.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 13: PLATFORM SETTINGS */}
              {activeTab === "settings" && (
                <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm space-y-6 max-w-xl mx-auto">
                  <h3 className="text-lg font-bold text-slate-800">Global Configuration Settings</h3>
                  <p className="text-xs text-slate-400">Change operational settings of the platform. Make sure keys and credential fields are correct.</p>
                  
                  <div className="space-y-6">
                    {/* OpenAI settings */}
                    <div className="space-y-4 border-b border-slate-100 pb-6">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Cpu className="size-3.5" /> OpenAI Settings</h4>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">OPENAI_API_KEY</label>
                        <input
                          type="password"
                          value={settings.openaiKey}
                          onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                          placeholder="sk-svcacct-..."
                          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-[#FCFAF6] font-mono"
                        />
                      </div>

                      <div className="grid gap-4 grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Default Model</label>
                          <select
                            value={settings.openaiModel}
                            onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs outline-none bg-[#FCFAF6] cursor-pointer"
                          >
                            <option value="gpt-4o-mini">gpt-4o-mini</option>
                            <option value="gpt-4o">gpt-4o</option>
                            <option value="o1-mini">o1-mini</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Token Limits / User / Month</label>
                          <input
                            type="number"
                            value={settings.openaiTokenLimit}
                            onChange={(e) => setSettings({ ...settings, openaiTokenLimit: Number(e.target.value) })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-[#FCFAF6]"
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
                            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-[#FCFAF6]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">FACEBOOK_APP_SECRET</label>
                          <input
                            type="password"
                            value={settings.fbAppSecret}
                            onChange={(e) => setSettings({ ...settings, fbAppSecret: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-[#FCFAF6]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Graph API Version</label>
                        <input
                          type="text"
                          value={settings.fbGraphVersion}
                          onChange={(e) => setSettings({ ...settings, fbGraphVersion: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-[#FCFAF6] font-mono"
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
                      className="w-full rounded-xl bg-[#30FC47] hover:bg-emerald-500 hover:text-white py-3 text-sm font-bold text-emerald-950 transition-colors shadow-sm"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
