"use client"

import { useState, useEffect, Fragment } from "react"
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
  User,
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
  ChevronDown,
  ChevronUp,
  UserPlus,
  FileText,
  Download,
  Calendar
} from "lucide-react"

import { GrowWaveModal } from "@/components/growwave-modal"
import { Sidebar } from "@/components/admin/sidebar"
import { Topbar } from "@/components/admin/topbar"

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
  totalReportsExported?: number
  reportsThisMonth?: number
  pdfDownloads?: number
  mostActiveWorkspace?: string
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
  plan: "FREE" | "PRO" | "AGENCY"
  role: "USER" | "ADMIN"
  status: "ACTIVE" | "SUSPENDED"
  createdAt: string
  lastLogin: string
  activeSessionsCount: number
  activeSessions: any[]
  aiCredits?: number
  aiUsedCredits?: number
  totalTokensUsed?: number
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
  members?: {
    id: string
    name: string
    email: string
    role: string
    joinedAt: string
    customPermissions?: string[]
  }[]
  invitations?: {
    id: string
    email: string
    role: string
    invitedBy: string
    inviteExpiresAt: string
  }[]
  activityLogs?: {
    id: string
    action: string
    details: string
    userId: string
    createdAt: string
  }[]
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
  aiProvider: string
}

export default function AdminDashboard() {
  const router = useRouter()
  
  // Client mount state to prevent hydration mismatches
  const [mounted, setMounted] = useState(false)
  const [timeString, setTimeString] = useState("")

  // Navigation active tab state
  const [activeTab, setActiveTab] = useState("overview")

  // Common UI indicators
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    setTimeString(new Date().toLocaleTimeString())
    const interval = setInterval(() => {
      setTimeString(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Sync tab with URL search parameter and handle settings redirects
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab")
      if (tab) {
        if (tab === "tickets") {
          router.push("/admin/settings/support")
        } else if (tab === "monitoring") {
          router.push("/admin/settings/system-monitoring")
        } else if (tab === "audit-logs") {
          router.push("/admin/settings/audit-logs")
        } else if (tab === "security") {
          router.push("/admin/settings/security")
        } else if (tab === "settings") {
          router.push("/admin/settings/platform")
        } else {
          setActiveTab(tab)
        }
      }
    }
  }, [router])

  const changeTab = (tabId: string) => {
    setActiveTab(tabId)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("tab", tabId)
      window.history.pushState({}, "", url.toString())
    }
  }

  // Section States
  const [overviewStats, setOverviewStats] = useState<Stats | null>(null)
  const [activityFeed, setActivityFeed] = useState<AuditLogItem[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  
  const [users, setUsers] = useState<UserItem[]>([])
  const [searchUserQuery, setSearchUserQuery] = useState("")
  const [filterUserPlan, setFilterUserPlan] = useState("ALL")

  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([])
  const [searchWorkspaceQuery, setSearchWorkspaceQuery] = useState("")
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<string[]>([])

  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [paymentSummary, setPaymentSummary] = useState({ totalSubscribers: 0, mrr: 0, arr: 0, churnRate: 0, conversionRate: 0 })

  const [aiUsageSummary, setAiUsageSummary] = useState({ totalTokensUsed: 0, costToday: 0, costThisWeek: 0, costThisMonth: 0, costLifetime: 0, failedRequests: 0, avgResponseTime: 0 })
  const [aiLogs, setAiLogs] = useState<any[]>([])
  const [topAiUsers, setTopAiUsers] = useState<any[]>([])
  const [aiUsers, setAiUsers] = useState<any[]>([])
  const [providerBreakdown, setProviderBreakdown] = useState<any[]>([])
  const [featureUsage, setFeatureUsage] = useState<any[]>([])
  const [aiLeaderboard, setAiLeaderboard] = useState<any>({ topUsers: [], topCostUsers: [], topWorkspaces: [] })
  const [aiSettings, setAiSettings] = useState<any>({ openaiMonthlyBudget: 100, openaiEmergencyShutdown: false })
  const [activeAiSubTab, setActiveAiSubTab] = useState<string>("overview")
  const [selectedAiUserAnalytics, setSelectedAiUserAnalytics] = useState<any | null>(null)
  const [adjustingAiUser, setAdjustingAiUser] = useState<any | null>(null)
  const [selectedCreditUser, setSelectedCreditUser] = useState<any | null>(null)
  const [addCreditsVal, setAddCreditsVal] = useState("500")
  const [removeCreditsVal, setRemoveCreditsVal] = useState("200")
  const [updateCreditsVal, setUpdateCreditsVal] = useState("1000")
  const [aiCreditsSummary, setAiCreditsSummary] = useState<any>({ totalCreditsIssued: 0, totalCreditsUsed: 0, creditsRemaining: 0, mostActiveUser: "None", geminiUsage: 0, zaiUsage: 0, nexUsage: 0 })
  const [bonusTokensVal, setBonusTokensVal] = useState<string>("0")
  const [bonusRequestsVal, setBonusRequestsVal] = useState<string>("0")
  const [tokenLimitVal, setTokenLimitVal] = useState<string>("50000")
  const [requestLimitVal, setRequestLimitVal] = useState<string>("50")
  const [customBudgetVal, setCustomBudgetVal] = useState<string>("100")
  const [loadingUserAnalytics, setLoadingUserAnalytics] = useState<boolean>(false)

  const [channels, setChannels] = useState<any[]>([])

  const [announcementSubject, setAnnouncementSubject] = useState("")
  const [announcementTarget, setAnnouncementTarget] = useState("ALL")
  const [announcementContent, setAnnouncementContent] = useState("")
  const [announcementType, setAnnouncementType] = useState("BOTH") // Email, In-app, Both

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
          setAiCreditsSummary(data.creditsSummary || { totalCreditsIssued: 0, totalCreditsUsed: 0, creditsRemaining: 0, mostActiveUser: "None", geminiUsage: 0, zaiUsage: 0, nexUsage: 0 })
          setTopAiUsers(data.leaderboard?.topUsers || [])
          setAiUsers(data.users || [])
          setProviderBreakdown(data.providerBreakdown || [])
          setFeatureUsage(data.featureUsage || [])
          setAiLeaderboard(data.leaderboard || { topUsers: [], topCostUsers: [], topWorkspaces: [] })
          setAiSettings(data.settings || { openaiMonthlyBudget: 100, openaiEmergencyShutdown: false })
          setCustomBudgetVal((data.settings?.openaiMonthlyBudget || 100).toString())
        } else if (tabName === "channels") {
          setChannels(data.channels)
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

  const [aiSearchQuery, setAiSearchQuery] = useState("")

  const handleViewUserAnalytics = async (user: any) => {
    setLoadingUserAnalytics(true)
    setSelectedAiUserAnalytics({ user, loading: true })
    try {
      const res = await fetch(`/api/admin?action=user-ai-analytics&userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedAiUserAnalytics({ user, ...data.analytics })
      } else {
        showToast("Failed to fetch user analytics", "error")
      }
    } catch (err) {
      showToast("Error loading user analytics", "error")
    } finally {
      setLoadingUserAnalytics(false)
    }
  }

  useEffect(() => {
    fetchDataForTab(activeTab)
  }, [activeTab])

  const toggleWorkspaceExpand = (id: string) => {
    setExpandedWorkspaces(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

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
          <div className={`size-3 rounded-full ${toast.type === "success" ? "bg-[var(--brand-primary)]" : toast.type === "error" ? "bg-[#EF4444]" : "bg-[#F59E0B]"}`} />
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* ADMIN SIDEBAR */}
      <Sidebar activeTab={activeTab} onTabChange={changeTab} />

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen print:pl-0 bg-[#FCFAF6]">
        {/* TOP BAR */}
        <Topbar />
        
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
                        <div key={idx} className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
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

                  {/* PDF Export Analytics Section */}
                  <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                    <h3 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                      <FileText className="size-4 text-emerald-500" /> PDF Report Export Analytics
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { title: "Total Reports Exported", value: overviewStats.totalReportsExported || 0, desc: "Cumulative PDF/email runs", icon: FileText },
                        { title: "Reports This Month", value: overviewStats.reportsThisMonth || 0, desc: "Current month's volume", icon: Calendar },
                        { title: "PDF Downloads", value: overviewStats.pdfDownloads || 0, desc: "Direct client device downloads", icon: Download },
                        { title: "Most Active Workspace", value: overviewStats.mostActiveWorkspace || "None", desc: "Highest exporting workspace", icon: Layers }
                      ].map((card, idx) => {
                        const Icon = card.icon
                        return (
                          <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-400">{card.title}</span>
                              <div className="rounded-lg bg-white p-1.5 shadow-sm">
                                <Icon className="size-3.5 text-slate-400" />
                              </div>
                            </div>
                            <div className="mt-3">
                              <span className="text-xl font-bold tracking-tight text-slate-800">{card.value}</span>
                              <p className="mt-1 text-[10px] text-slate-400 leading-normal">{card.desc}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* SVG Charts Section */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* User Growth Chart */}
                    <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                      <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-1.5">
                        <TrendingUp className="size-4 text-[var(--brand-primary)]" /> User Registration Trend (7 Days)
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
                                  className="w-8 rounded-t bg-gradient-to-t from-emerald-100 to-[var(--brand-primary)] hover:brightness-95 transition-all duration-300 shadow-sm"
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
                    <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
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
                  <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
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
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-[#EEF2F7] pb-4 print:hidden">
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search users by name, email..."
                        value={searchUserQuery}
                        onChange={(e) => setSearchUserQuery(e.target.value)}
                        className="w-full rounded-xl border border-[#EEF2F7] bg-white pl-10 pr-4 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 items-center justify-end w-full md:w-auto">
                      <div className="flex items-center gap-2 border border-[#EEF2F7] rounded-xl bg-white px-3 py-1.5 text-xs font-semibold">
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
                        className="flex items-center gap-1.5 rounded-xl border border-[#EEF2F7] bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold"
                      >
                        <FileDown className="size-3.5 text-slate-500" /> Export CSV
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-1.5 rounded-xl bg-[#22C55E] text-white hover:bg-[#16A34A] px-4 py-2 text-xs font-semibold transition-colors"
                      >
                        <FileDown className="size-3.5" /> PDF / Print Report
                      </button>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-all duration-300">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-transparent border-b border-[#EEF2F7]">
                        <tr>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Name</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Plan</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">AI Credits</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">AI Usage</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Role</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Status</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Created Date</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Last Login</th>
                          <th className="px-6 py-4 font-bold text-slate-400 text-right uppercase text-xs print:hidden">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF2F7]">
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
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${u.plan === "PRO" ? "bg-[#F0FDF4] text-[#22C55E]" : u.plan === "AGENCY" ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-800"}`}>
                                  {u.plan}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-700">
                                {Math.max(0, (u.aiCredits ?? 0) - (u.aiUsedCredits ?? 0))} / {u.aiCredits ?? 0}
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500 font-semibold">
                                {u.aiUsedCredits ?? 0} used
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-700">{u.role}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.status === "ACTIVE" ? "bg-[#F0FDF4] text-[#22C55E]" : "bg-red-50 text-[#EF4444]"}`}>
                                  <div className={`size-1.5 rounded-full ${u.status === "ACTIVE" ? "bg-[#22C55E]" : "bg-[#EF4444]"}`} />
                                  {u.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-xs text-slate-500">{new Date(u.lastLogin).toLocaleString()}</td>
                              <td className="px-6 py-4 text-right print:hidden">
                                <div className="inline-flex gap-1.5 justify-end">
                                  {/* Manage AI Credits */}
                                  <button
                                    title="Manage AI Credits"
                                    onClick={() => setSelectedCreditUser(u)}
                                    className="rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 p-1.5 transition-colors"
                                  >
                                    <Zap className="size-3.5" />
                                  </button>

                                  {/* Suspend/Activate */}
                                  {u.status === "ACTIVE" ? (
                                    <button
                                      title="Suspend User"
                                      onClick={() => runAdminPostAction({ action: "suspend-user", userId: u.id }, "User suspended")}
                                      className="rounded-xl bg-red-50 hover:bg-red-100 text-[#EF4444] p-1.5 transition-colors"
                                    >
                                      <UserX className="size-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      title="Activate User"
                                      onClick={() => runAdminPostAction({ action: "activate-user", userId: u.id }, "User activated")}
                                      className="rounded-xl bg-[#F0FDF4] hover:bg-[#F0FDF4]/80 text-[#22C55E] p-1.5 transition-colors"
                                    >
                                      <UserCheck className="size-3.5" />
                                    </button>
                                  )}
                                  
                                  {/* Admin Promote/Demote */}
                                  {u.role !== "ADMIN" ? (
                                    <button
                                      title="Promote to Admin"
                                      onClick={() => runAdminPostAction({ action: "promote-admin", userId: u.id }, "Promoted to Admin")}
                                      className="rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 p-1.5 transition-colors"
                                    >
                                      <UserPlus className="size-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      title="Remove Admin Access"
                                      onClick={() => runAdminPostAction({ action: "remove-admin", userId: u.id }, "Removed admin access")}
                                      className="rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 p-1.5 transition-colors"
                                    >
                                      <Lock className="size-3.5" />
                                    </button>
                                  )}
 
                                  {/* Reset Limits */}
                                  <button
                                    title="Reset limits & quotas"
                                    onClick={() => runAdminPostAction({ action: "reset-user-limits", userId: u.id }, "AI token quota reset")}
                                    className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 transition-colors"
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
                                    className="rounded-xl bg-slate-100 hover:bg-red-500 hover:text-white text-slate-500 p-1.5 transition-all"
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

              {/* TAB 3: WORKSPACES & TEAMS */}
              {activeTab === "workspaces" && (
                <div className="space-y-6">
                  {/* Filters & Actions Header */}
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-[#EEF2F7] pb-4 print:hidden">
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search workspaces by name, owner..."
                        value={searchWorkspaceQuery}
                        onChange={(e) => setSearchWorkspaceQuery(e.target.value)}
                        className="w-full rounded-xl border border-[#EEF2F7] bg-white pl-10 pr-4 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Workspaces List Table */}
                  <div className="overflow-x-auto rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-all duration-300">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-transparent border-b border-[#EEF2F7]">
                        <tr>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Workspace Name</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Owner</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Plan</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Stats</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Status</th>
                          <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Created Date</th>
                          <th className="px-6 py-4 font-bold text-slate-400 text-right uppercase text-xs print:hidden">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF2F7]">
                        {workspaces.filter(ws => 
                          ws.name.toLowerCase().includes(searchWorkspaceQuery.toLowerCase()) || 
                          ws.ownerEmail.toLowerCase().includes(searchWorkspaceQuery.toLowerCase()) ||
                          ws.ownerName.toLowerCase().includes(searchWorkspaceQuery.toLowerCase())
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                              No workspaces found.
                            </td>
                          </tr>
                        ) : (
                          workspaces
                            .filter(ws => 
                              ws.name.toLowerCase().includes(searchWorkspaceQuery.toLowerCase()) || 
                              ws.ownerEmail.toLowerCase().includes(searchWorkspaceQuery.toLowerCase()) ||
                              ws.ownerName.toLowerCase().includes(searchWorkspaceQuery.toLowerCase())
                            )
                            .map((ws) => {
                              const isExpanded = expandedWorkspaces.includes(ws.id)
                              return (
                                <Fragment key={ws.id}>
                                  <tr 
                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer" 
                                    onClick={() => toggleWorkspaceExpand(ws.id)}
                                  >
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                        {isExpanded ? (
                                          <ChevronDown className="size-4 text-slate-400 flex-shrink-0" />
                                        ) : (
                                          <ChevronRight className="size-4 text-slate-400 flex-shrink-0" />
                                        )}
                                        <div>
                                          <div className="font-semibold text-[#111111]">{ws.name}</div>
                                          <div className="text-xs text-slate-400">ID: {ws.id}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="font-medium text-slate-700">{ws.ownerName}</div>
                                      <div className="text-xs text-slate-400">{ws.ownerEmail}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ws.plan === "PRO" ? "bg-[#F0FDF4] text-[#22C55E]" : "bg-slate-100 text-slate-800"}`}>
                                        {ws.plan}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-600">
                                      <div>Members: {ws.members?.length || 0}</div>
                                      <div>Channels: {ws.channelsCount || 0}</div>
                                      <div>Posts: {ws.postsCount || 0}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ws.status === "ACTIVE" ? "bg-[#F0FDF4] text-[#22C55E]" : "bg-red-50 text-[#EF4444]"}`}>
                                        <div className={`size-1.5 rounded-full ${ws.status === "ACTIVE" ? "bg-[#22C55E]" : "bg-[#EF4444]"}`} />
                                        {ws.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                      {new Date(ws.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right print:hidden" onClick={(e) => e.stopPropagation()}>
                                      <div className="inline-flex gap-1.5 justify-end">
                                        {ws.status === "ACTIVE" ? (
                                          <button
                                            title="Suspend Workspace"
                                            onClick={() => runAdminPostAction({ action: "suspend-workspace", workspaceId: ws.id }, "Workspace suspended")}
                                            className="rounded-xl bg-red-50 hover:bg-red-100 text-[#EF4444] p-1.5 transition-colors"
                                          >
                                            <UserX className="size-3.5" />
                                          </button>
                                        ) : (
                                          <button
                                            title="Activate Workspace"
                                            onClick={() => runAdminPostAction({ action: "activate-workspace", workspaceId: ws.id }, "Workspace activated")}
                                            className="rounded-xl bg-[#F0FDF4] hover:bg-[#F0FDF4]/80 text-[#22C55E] p-1.5 transition-colors"
                                          >
                                            <UserCheck className="size-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                  {isExpanded && (
                                    <tr>
                                      <td colSpan={7} className="bg-slate-50/50 p-6 border-b border-[#EEF2F7]">
                                        <div className="grid gap-6 md:grid-cols-3">
                                          {/* Active Members */}
                                          <div className="bg-white p-4 rounded-xl border border-[#EEF2F7] shadow-sm">
                                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                              <UsersIcon className="size-3.5 text-slate-500" /> Active Members ({ws.members?.length || 0})
                                            </h4>
                                            {ws.members && ws.members.length > 0 ? (
                                              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                                                {ws.members.map((m) => (
                                                  <div key={m.id} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                                                    <div className="space-y-0.5">
                                                      <div className="font-bold text-[#111111]">{m.name}</div>
                                                      <div className="text-[10px] text-slate-400">{m.email}</div>
                                                      {m.customPermissions && m.customPermissions.length > 0 && (
                                                        <div className="text-[9px] text-slate-500 italic">Custom permissions assigned</div>
                                                      )}
                                                    </div>
                                                    <select
                                                      value={m.role}
                                                      onChange={(e) => runAdminPostAction({ action: "adjust-member-permissions", memberId: m.id, role: e.target.value }, "Member role adjusted")}
                                                      className="rounded-lg border border-slate-200 bg-white p-1 text-[11px] font-semibold outline-none cursor-pointer focus:border-emerald-500"
                                                    >
                                                      <option value="Workspace Owner">Workspace Owner</option>
                                                      <option value="Admin">Admin</option>
                                                      <option value="Content Manager">Content Manager</option>
                                                      <option value="Designer">Designer</option>
                                                      <option value="Analyst">Analyst</option>
                                                    </select>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-xs text-slate-400 italic">No active members found.</p>
                                            )}
                                          </div>

                                          {/* Pending Invitations */}
                                          <div className="bg-white p-4 rounded-xl border border-[#EEF2F7] shadow-sm">
                                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                              <Mail className="size-3.5 text-slate-500" /> Pending Invitations ({ws.invitations?.length || 0})
                                            </h4>
                                            {ws.invitations && ws.invitations.length > 0 ? (
                                              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                                                {ws.invitations.map((i) => (
                                                  <div key={i.id} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                                                    <div className="space-y-0.5">
                                                      <div className="font-semibold text-slate-800">{i.email}</div>
                                                      <div className="text-[10px] text-slate-400">Expires: {new Date(i.inviteExpiresAt).toLocaleDateString()}</div>
                                                    </div>
                                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                                                      {i.role}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-xs text-slate-400 italic">No pending invitations found.</p>
                                            )}
                                          </div>

                                          {/* Team Activity Logs */}
                                          <div className="bg-white p-4 rounded-xl border border-[#EEF2F7] shadow-sm">
                                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                              <History className="size-3.5 text-slate-500" /> Recent Team Activity
                                            </h4>
                                            {ws.activityLogs && ws.activityLogs.length > 0 ? (
                                              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                                {ws.activityLogs.map((a) => (
                                                  <div key={a.id} className="text-[11px] pb-2 border-b border-slate-100 last:border-0 last:pb-0 space-y-0.5">
                                                    <div className="flex justify-between items-center text-slate-500 text-[9px]">
                                                      <span>User: {a.userId || "System"}</span>
                                                      <span>{new Date(a.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                    <div className="font-semibold text-slate-800">{a.action}</div>
                                                    {a.details && <div className="text-slate-400 text-[10px]">{a.details}</div>}
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-xs text-slate-400 italic">No recent activity logs.</p>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              )
                            })
                        )}
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
                      <div key={idx} className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                        <span className="text-sm font-semibold text-slate-400">{card.title}</span>
                        <div className="mt-4">
                          <span className="text-3xl font-bold tracking-tight">{card.value}</span>
                          <p className="mt-1 text-xs text-slate-400">{card.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* List of active users to upgrade/downgrade */}
                  <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                    <h3 className="text-base font-bold mb-4">Manual User Subscription Overrides</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-transparent border-b border-[#EEF2F7]">
                          <tr>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">User Name</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Current Plan</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Status</th>
                            <th className="px-6 py-4 font-bold text-slate-400 text-right uppercase text-xs">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF2F7]">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-semibold">{u.name}</div>
                                <div className="text-xs text-slate-400">{u.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${u.plan === "PRO" ? "bg-[#F0FDF4] text-[#22C55E]" : "bg-slate-100 text-slate-800"}`}>
                                  {u.plan}
                                </span>
                              </td>
                              <td className="px-6 py-4 capitalize">{u.status}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="inline-flex gap-1.5 justify-end">
                                  {u.plan === "FREE" ? (
                                    <button
                                      onClick={() => runAdminPostAction({ action: "upgrade-user", userId: u.id }, `Upgraded ${u.name} to PRO`)}
                                      className="rounded-xl bg-[#F0FDF4] hover:bg-[#F0FDF4]/80 text-[#22C55E] px-3 py-1.5 text-xs font-semibold transition-colors"
                                    >
                                      Upgrade to PRO
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => runAdminPostAction({ action: "downgrade-user", userId: u.id }, `Downgraded ${u.name} to FREE`)}
                                        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold transition-colors"
                                      >
                                        Downgrade to FREE
                                      </button>
                                      <button
                                        onClick={() => runAdminPostAction({ action: "cancel-subscription", userId: u.id }, `Cancelled plan subscription for ${u.name}`)}
                                        className="rounded-xl bg-red-50 hover:bg-red-100 text-[#EF4444] px-3 py-1.5 text-xs font-semibold transition-colors"
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
                      <div key={idx} className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                        <span className="text-sm font-semibold text-slate-400">{card.title}</span>
                        <div className="mt-4">
                          <span className="text-3xl font-bold tracking-tight">{card.value}</span>
                          <p className="mt-1 text-xs text-slate-400">{card.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Transactions table */}
                  <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                    <h3 className="text-base font-bold mb-4">Transactions Logs</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-transparent border-b border-[#EEF2F7]">
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
                        <tbody className="divide-y divide-[#EEF2F7]">
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
                                      ? "bg-[#F0FDF4] text-[#22C55E]" 
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
                                        className="rounded-xl border border-red-200 bg-white hover:bg-red-50 text-[#EF4444] px-2.5 py-1 text-xs font-semibold transition-colors"
                                      >
                                        Refund
                                      </button>
                                    )}
                                    {p.status === "FAILED" && (
                                      <button
                                        onClick={() => runAdminPostAction({ action: "retry-payment", transactionId: p.transactionId }, "Payment retry succeeded")}
                                        className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 text-xs font-semibold transition-colors"
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
                  {/* Global settings info (Shutdown Warning Alert) */}
                  {aiSettings.openaiEmergencyShutdown && (
                    <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-800 flex items-center gap-2">
                      <ShieldAlert className="size-4 animate-bounce text-red-600" />
                      <span>Platform AI is currently suspended by the Emergency Kill Switch. No users (except Admins) can access AI features.</span>
                    </div>
                  )}

                  {/* AI usage metrics row */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { title: "Today Cost", value: `$${aiUsageSummary.costToday.toFixed(4)}`, desc: "Total OpenAI invoice costs today" },
                      { title: "Week Cost", value: `$${aiUsageSummary.costThisWeek.toFixed(4)}`, desc: "Total OpenAI costs last 7 days" },
                      { title: "Month Cost", value: `$${aiUsageSummary.costThisMonth.toFixed(4)}`, desc: `Limit: $${aiSettings.openaiMonthlyBudget.toFixed(2)}` },
                      { title: "Lifetime Cost", value: `$${aiUsageSummary.costLifetime.toFixed(4)}`, desc: "All-time platform AI expenditure" }
                    ].map((card, idx) => (
                      <div key={idx} className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                        <span className="text-sm font-semibold text-slate-400">{card.title}</span>
                        <div className="mt-4">
                          <span className="text-3xl font-bold tracking-tight">{card.value}</span>
                          <p className="mt-1 text-xs text-slate-400">{card.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sub-Navigation Tabs */}
                  <div className="flex border-b border-[#EEF2F7] gap-6 text-sm font-semibold">
                    {[
                      { id: "overview", label: "Overview & Analytics" },
                      { id: "credits", label: "AI Credit Center" },
                      { id: "users", label: "User Limits & Access" },
                      { id: "logs", label: "Request Logs" },
                      { id: "settings", label: "Platform Budget & Switch" }
                    ].map((subTab) => (
                      <button
                        key={subTab.id}
                        onClick={() => setActiveAiSubTab(subTab.id)}
                        className={`pb-3 border-b-2 px-1 transition-all ${
                          activeAiSubTab === subTab.id
                            ? "border-emerald-500 text-emerald-600"
                            : "border-transparent text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        {subTab.label}
                      </button>
                    ))}
                  </div>

                  {/* SUBTAB: AI CREDIT CENTER */}
                  {activeAiSubTab === "credits" && (
                    <div className="space-y-6">
                      {/* Credit metrics grid */}
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          { title: "Total Credits Issued", value: (aiCreditsSummary.totalCreditsIssued || 0).toLocaleString(), desc: "Global allocated credits pool", color: "text-[#0F766E]" },
                          { title: "Total Credits Used", value: (aiCreditsSummary.totalCreditsUsed || 0).toLocaleString(), desc: "Global consumed credits count", color: "text-[#EF4444]" },
                          { title: "Credits Remaining", value: (aiCreditsSummary.creditsRemaining || 0).toLocaleString(), desc: "Unused credits remaining", color: "text-[#22C55E]" },
                          { title: "Most Active User", value: aiCreditsSummary.mostActiveUser || "None", desc: "User with highest AI credit usage", color: "text-slate-800" }
                        ].map((card, idx) => (
                          <div key={idx} className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                            <div className="mt-4">
                              <span className={`text-2xl font-black tracking-tight ${card.color}`}>{card.value}</span>
                              <p className="mt-1 text-xs text-slate-400">{card.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Provider usage credits row */}
                      <div className="grid gap-6 md:grid-cols-3">
                        {[
                          { name: "Gemini Usage", requests: aiCreditsSummary.geminiUsage || 0, color: "from-emerald-400 to-emerald-600" },
                          { name: "Z.ai Usage", requests: aiCreditsSummary.zaiUsage || 0, color: "from-blue-400 to-blue-600" },
                          { name: "Nex N2 Pro Usage", requests: aiCreditsSummary.nexUsage || 0, color: "from-purple-400 to-purple-600" }
                        ].map((prov, idx) => (
                          <div key={idx} className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Provider Usage</span>
                              <span className="text-xl font-extrabold text-slate-800 mt-1 block">{prov.name}</span>
                              <span className="text-xs text-slate-400 mt-0.5 block">Total successful calls log</span>
                            </div>
                            <div className={`size-14 rounded-2xl bg-gradient-to-br ${prov.color} text-white flex flex-col items-center justify-center font-black shadow-md`}>
                              <span className="text-lg leading-none">{prov.requests}</span>
                              <span className="text-[8px] uppercase font-bold tracking-widest leading-none mt-0.5">reqs</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Top AI Users by Credits */}
                      <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 font-sans">Top AI Users by Credits Usage</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-[#EEF2F7] text-slate-400 font-bold uppercase">
                                <th className="pb-3 text-left">User</th>
                                <th className="pb-3 text-center">Plan</th>
                                <th className="pb-3 text-center">Credits Remaining</th>
                                <th className="pb-3 text-center">Credits Used</th>
                                <th className="pb-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EEF2F7] text-slate-700 font-semibold">
                              {aiUsers
                                .slice()
                                .sort((a, b) => (b.aiUsedCredits || 0) - (a.aiUsedCredits || 0))
                                .slice(0, 5)
                                .map((user) => (
                                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3.5 text-left">
                                      <div className="font-bold text-slate-800">{user.name}</div>
                                      <div className="text-[10px] text-slate-400">{user.email}</div>
                                    </td>
                                    <td className="py-3.5 text-center">
                                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${user.plan === "PRO" ? "bg-[#F0FDF4] text-[#22C55E]" : user.plan === "AGENCY" ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-800"}`}>
                                        {user.plan}
                                      </span>
                                    </td>
                                    <td className="py-3.5 text-center font-mono font-bold text-[#22C55E]">
                                      {Math.max(0, (user.aiCredits ?? 0) - (user.aiUsedCredits ?? 0))}
                                    </td>
                                    <td className="py-3.5 text-center font-mono font-bold text-slate-500">
                                      {user.aiUsedCredits ?? 0}
                                    </td>
                                    <td className="py-3.5 text-right">
                                      <button
                                        onClick={() => setSelectedCreditUser(user)}
                                        className="rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 px-3 py-1.5 font-bold text-[10.5px] transition-colors"
                                      >
                                        ⚡ Manage Credits
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 1: OVERVIEW & ANALYTICS */}
                  {activeAiSubTab === "overview" && (
                    <div className="space-y-6">
                      {/* AI Admin Analytics Summary Grid */}
                      {(() => {
                        const geminiStats = providerBreakdown.find(p => p.name === "Gemini") || { requests: 0 };
                        const zaiStats = providerBreakdown.find(p => p.name === "Z.ai") || { requests: 0 };
                        const openrouterStats = providerBreakdown.find(p => p.name === "Nex N2 Pro") || { requests: 0 };
                        return (
                          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            {[
                              { title: "Gemini Requests", value: geminiStats.requests, desc: "All-time Gemini API calls", color: "border-emerald-500/20" },
                              { title: "Z.ai Requests", value: zaiStats.requests, desc: "All-time Z.ai API calls", color: "border-blue-500/20" },
                              { title: "Nex N2 Pro Requests", value: openrouterStats.requests, desc: "All-time Nex N2 Pro API calls", color: "border-purple-500/20" },
                              { title: "Total AI Usage", value: `${aiUsageSummary.totalTokensUsed.toLocaleString()} tkn`, desc: "Total generated tokens count", color: "border-purple-500/20" },
                              { title: "Avg Response Time", value: `${aiUsageSummary.avgResponseTime || 0}ms`, desc: "Successful request latency", color: "border-amber-500/20" },
                              { title: "Failed Requests", value: aiUsageSummary.failedRequests, desc: "Total failed API calls", color: "border-red-500/20" }
                            ].map((card, idx) => (
                              <div key={idx} className="rounded-2xl bg-white p-5 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300">
                                <span className="text-xs font-semibold text-slate-400">{card.title}</span>
                                <div className="mt-3">
                                  <span className="text-2xl font-bold tracking-tight text-slate-800">{card.value}</span>
                                  <p className="mt-1 text-[10px] text-slate-400 leading-normal">{card.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Provider Breakdown */}
                        <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Provider Expenditure Breakdown</h3>
                          <div className="space-y-4">
                            {providerBreakdown.map((p) => (
                              <div key={p.name} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold text-slate-700">
                                  <span>{p.name}</span>
                                  <span>${p.cost.toFixed(4)}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${aiUsageSummary.costLifetime > 0 ? (p.cost / aiUsageSummary.costLifetime) * 100 : 0}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Feature Usage counts */}
                        <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">AI Feature Usage Counts</h3>
                          <div className="space-y-4">
                            {featureUsage.map((f) => (
                              <div key={f.name} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold text-slate-700">
                                  <span>{f.name}</span>
                                  <span>{f.count} requests</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-sky-500 h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${
                                        Math.max(...featureUsage.map(x => x.count)) > 0
                                          ? (f.count / Math.max(...featureUsage.map(x => x.count))) * 100
                                          : 0
                                      }%`
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Provider Performance Table */}
                      <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">AI Provider Performance & Metrics</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">Real-time statistics compiled across successful and failed API integrations</p>
                          </div>
                        </div>
                        <div className="overflow-x-auto font-sans">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-[#EEF2F7] text-slate-400 font-bold uppercase">
                                <th className="pb-3 text-left">Provider</th>
                                <th className="pb-3 text-center">Requests</th>
                                <th className="pb-3 text-center">Total Tokens</th>
                                <th className="pb-3 text-center">Errors</th>
                                <th className="pb-3 text-center">Avg Latency</th>
                                <th className="pb-3 text-right">Total Cost</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EEF2F7] text-slate-700 font-semibold">
                              {providerBreakdown.map((p) => (
                                <tr key={p.name} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-3.5 text-left font-bold text-slate-800">{p.name}</td>
                                  <td className="py-3.5 text-center font-mono">{p.requests}</td>
                                  <td className="py-3.5 text-center font-mono">{p.tokens.toLocaleString()}</td>
                                  <td className={`py-3.5 text-center font-mono ${p.errors > 0 ? "text-[#EF4444]" : "text-slate-500"}`}>{p.errors}</td>
                                  <td className="py-3.5 text-center font-mono">{p.avgResponseTime || 0}ms</td>
                                  <td className="py-3.5 text-right font-extrabold text-[#22C55E]">${p.cost.toFixed(4)}</td>
                                </tr>
                              ))}
                              {providerBreakdown.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="py-4 text-center text-slate-400 font-normal">No provider breakdown data available.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Leaderboards */}
                      <div className="grid gap-6 md:grid-cols-3">
                        {/* Top Users */}
                        <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Top Users (Tokens)</h3>
                          <div className="space-y-3">
                            {aiLeaderboard.topUsers?.length === 0 ? (
                              <p className="text-xs text-slate-400">No token logs recorded.</p>
                            ) : (
                              aiLeaderboard.topUsers?.map((user: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                                  <div className="truncate pr-2">
                                    <p className="text-xs font-bold truncate">{user.name}</p>
                                    <p className="text-[9px] text-slate-400 truncate">{user.email}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-bold text-slate-700">{user.tokens.toLocaleString()} tkn</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Top Cost Users */}
                        <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Top Cost Generated</h3>
                          <div className="space-y-3">
                            {aiLeaderboard.topCostUsers?.length === 0 ? (
                              <p className="text-xs text-slate-400">No logs recorded.</p>
                            ) : (
                              aiLeaderboard.topCostUsers?.map((user: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                                  <div className="truncate pr-2">
                                    <p className="text-xs font-bold truncate">{user.name}</p>
                                    <p className="text-[9px] text-slate-400 truncate">{user.email}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-bold text-[#22C55E]">${user.cost.toFixed(4)}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Most Active Workspaces */}
                        <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Active Workspaces</h3>
                          <div className="space-y-3">
                            {aiLeaderboard.topWorkspaces?.length === 0 ? (
                              <p className="text-xs text-slate-400">No workspace logs.</p>
                            ) : (
                              aiLeaderboard.topWorkspaces?.map((ws: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                                  <div className="truncate pr-2">
                                    <p className="text-xs font-bold truncate">{ws.name}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-bold text-slate-700">{ws.requests} reqs</p>
                                    <p className="text-[9px] text-slate-400">${ws.cost.toFixed(4)}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 2: USER LIMITS & ACCESS */}
                  {activeAiSubTab === "users" && (
                    <div className="space-y-4">
                      {/* Search & Stats */}
                      <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-4 gap-4">
                        <div className="relative w-full max-w-sm">
                          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search users by name, email..."
                            value={aiSearchQuery}
                            onChange={(e) => setAiSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-[#EEF2F7] bg-white pl-10 pr-4 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Users table */}
                      <div className="overflow-x-auto rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-all duration-300">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead className="bg-transparent border-b border-[#EEF2F7]">
                            <tr>
                              <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">User</th>
                              <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Plan</th>
                              <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Tokens Used</th>
                              <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Requests Used</th>
                              <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Status</th>
                              <th className="px-6 py-4 font-bold text-slate-400 text-right uppercase text-xs">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EEF2F7]">
                            {aiUsers
                              .filter(u => u.name.toLowerCase().includes(aiSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(aiSearchQuery.toLowerCase()))
                              .map((u) => {
                                const tokenLimit = u.tokenLimit + (u.bonusTokens || 0)
                                const requestLimit = u.requestLimit + (u.bonusRequests || 0)
                                const tokenPct = tokenLimit > 0 ? (u.tokensUsed / tokenLimit) * 100 : 0
                                const requestPct = requestLimit > 0 ? (u.requestsUsed / requestLimit) * 100 : 0

                                return (
                                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="font-semibold text-slate-800">{u.name}</div>
                                      <div className="text-xs text-slate-400">{u.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${u.plan === "PRO" ? "bg-[#F0FDF4] text-[#22C55E]" : "bg-slate-100 text-slate-800"}`}>
                                        {u.plan}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="space-y-1 w-44">
                                        <div className="flex justify-between text-xs">
                                          <span className="font-semibold">{u.tokensUsed.toLocaleString()}</span>
                                          <span className="text-slate-400">/ {tokenLimit <= 0 || tokenLimit > 10000000 ? "∞" : tokenLimit.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full ${tokenPct >= 90 ? "bg-rose-500" : tokenPct >= 75 ? "bg-amber-500" : "bg-[#22C55E]"}`}
                                            style={{ width: `${tokenLimit <= 0 || tokenLimit > 10000000 ? 0 : Math.min(tokenPct, 100)}%` }}
                                          />
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="space-y-1 w-44">
                                        <div className="flex justify-between text-xs">
                                          <span className="font-semibold">{u.requestsUsed}</span>
                                          <span className="text-slate-400">/ {requestLimit === -1 ? "∞" : requestLimit}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full ${requestPct >= 90 ? "bg-rose-500" : requestPct >= 75 ? "bg-amber-500" : "bg-[#22C55E]"}`}
                                            style={{ width: `${requestLimit === -1 ? 0 : Math.min(requestPct, 100)}%` }}
                                          />
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                        u.status === "ACTIVE"
                                          ? "bg-[#F0FDF4] text-[#22C55E]"
                                          : u.status === "LIMIT REACHED"
                                          ? "bg-amber-50 text-amber-800"
                                          : u.status === "DISABLED"
                                          ? "bg-red-50 text-red-800"
                                          : "bg-slate-100 text-slate-500"
                                      }`}>
                                        {u.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="inline-flex gap-1.5 justify-end">
                                        <button
                                          title="View usage analytics"
                                          onClick={() => handleViewUserAnalytics(u)}
                                          className="rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#EEF2F7] text-slate-700 px-2 py-1 text-xs font-semibold transition-colors"
                                        >
                                          Analytics
                                        </button>
                                        <button
                                          title="Adjust quota limits"
                                          onClick={() => {
                                            setAdjustingAiUser(u)
                                            setTokenLimitVal(u.tokenLimit.toString())
                                            setRequestLimitVal(u.requestLimit.toString())
                                            setBonusTokensVal(u.bonusTokens.toString())
                                            setBonusRequestsVal(u.bonusRequests.toString())
                                          }}
                                          className="rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#EEF2F7] text-slate-700 px-2 py-1 text-xs font-semibold transition-colors"
                                        >
                                          Adjust
                                        </button>
                                        {u.aiEnabled ? (
                                          <button
                                            title="Disable AI for user"
                                            onClick={() => runAdminPostAction({ action: "toggle-user-ai", userId: u.id, enabled: false }, "AI suspended for user")}
                                            className="rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 px-2 py-1 text-xs font-semibold transition-colors"
                                          >
                                            Disable
                                          </button>
                                        ) : (
                                          <button
                                            title="Enable AI for user"
                                            onClick={() => runAdminPostAction({ action: "toggle-user-ai", userId: u.id, enabled: true }, "AI enabled for user")}
                                            className="rounded-xl border border-emerald-100 bg-white hover:bg-[#F0FDF4] text-emerald-600 px-2 py-1 text-xs font-semibold transition-colors"
                                          >
                                            Enable
                                          </button>
                                        )}
                                        <button
                                          title="Reset limits & quotas"
                                          onClick={() => {
                                            if (confirm(`Reset AI counters for user ${u.email}?`)) {
                                              runAdminPostAction({ action: "reset-user-limits", userId: u.id }, "AI token quota reset")
                                            }
                                          }}
                                          className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 p-1 transition-colors"
                                        >
                                          <RefreshCw className="size-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 3: REQUEST LOGS */}
                  {activeAiSubTab === "logs" && (
                    <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 font-mono">OpenAI & Provider Request Logs</h3>
                      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead className="bg-transparent border-b border-[#EEF2F7] sticky top-0">
                            <tr>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Timestamp</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">User</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Workspace</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Feature</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Model</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Tokens</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Cost</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Latency</th>
                              <th className="px-4 py-3 font-bold text-slate-400 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EEF2F7]">
                            {aiLogs.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="px-4 py-6 text-center text-slate-400">No request logs recorded in MongoDB yet.</td>
                              </tr>
                            ) : (
                              aiLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-700 truncate max-w-[150px]" title={log.user}>{log.user}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-700 truncate max-w-[150px]" title={log.workspace}>{log.workspace}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-700">{log.feature}</td>
                                  <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{log.model}</td>
                                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-800">{log.totalTokens.toLocaleString()}</span>
                                      <span className="text-[9px] text-slate-400">in: {log.promptTokens} | out: {log.completionTokens}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-[#22C55E] font-extrabold whitespace-nowrap">${log.cost.toFixed(4)}</td>
                                  <td className="px-4 py-3 font-medium text-slate-600">{log.responseTime}ms</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.status === "success" ? "bg-[#F0FDF4] text-[#22C55E]" : "bg-red-50 text-red-800"}`}>
                                      {log.status.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 4: PLATFORM BUDGET & EMERGENCY KILL SWITCH */}
                  {activeAiSubTab === "settings" && (
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Budget settings */}
                      <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Monthly Platform Budget</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Configure platform budget ceiling limits. Admins will receive warnings at 80% and critical block suspensions when 100% of limits are breached.
                        </p>
                        
                        <div className="flex flex-wrap gap-2.5 pt-2">
                          {[50, 100, 500].map((val) => (
                            <button
                              key={val}
                              onClick={() => runAdminPostAction({ action: "save-ai-budget", monthlyBudget: val }, "Platform budget updated")}
                              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                                aiSettings.openaiMonthlyBudget === val
                                  ? "bg-slate-900 text-white border-slate-900"
                                  : "bg-white hover:bg-slate-50 border-[#EEF2F7] text-slate-700"
                              }`}
                            >
                              ${val}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-1.5 pt-2">
                          <label className="text-xs font-bold text-slate-600">Custom Budget (USD)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={customBudgetVal}
                              onChange={(e) => setCustomBudgetVal(e.target.value)}
                              className="w-full max-w-[150px] rounded-xl border border-[#EEF2F7] px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-[#FCFAF6] font-semibold"
                            />
                            <button
                              onClick={() => runAdminPostAction({ action: "save-ai-budget", monthlyBudget: customBudgetVal }, "Platform budget updated")}
                              className="rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs px-4 py-2"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Platform AI Kill switch */}
                      <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Emergency Platform Kill Switch</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Immediately disables all platform AI generation services (such as Caption, Hashtag, and Chat Strategist tools). Use in case of model degradation, billing leaks, or API outages.
                        </p>
                        
                        <div className="pt-2">
                          {aiSettings.openaiEmergencyShutdown ? (
                            <button
                              onClick={() => runAdminPostAction({ action: "toggle-platform-ai", shutdown: false }, "Platform AI services restored")}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3 uppercase tracking-wider transition-all shadow-sm"
                            >
                              Enable Platform AI
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm("WARNING: Are you sure you want to shut down platform AI operations? All client generations will fail instantly.")) {
                                  runAdminPostAction({ action: "toggle-platform-ai", shutdown: true }, "Platform AI emergency suspended")
                                }
                              }}
                              className="rounded-xl bg-rose-650 hover:bg-rose-700 text-white font-extrabold text-xs px-5 py-3 uppercase tracking-wider transition-all shadow-sm"
                            >
                              Disable Platform AI
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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
                        <div key={plat} className="rounded-2xl bg-white p-4 shadow-card hover:shadow-card-hover transition-all duration-300 text-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{plat}</span>
                          <p className="text-3xl font-extrabold mt-2 text-slate-800">{count}</p>
                          <span className="text-[10px] text-slate-400 font-semibold">Active Channels</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Connected channels list */}
                  <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                    <h3 className="text-base font-bold mb-4">SaaS Connected Social Media Channels</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-transparent border-b border-[#EEF2F7]">
                          <tr>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Channel Details</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Owner Account</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Followers count</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Token Status</th>
                            <th className="px-6 py-4 font-bold text-slate-400 text-right uppercase text-xs">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF2F7]">
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
                                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${ch.status === "connected" ? "bg-[#F0FDF4] text-[#22C55E]" : "bg-red-50 text-[#EF4444]"}`}>
                                    {ch.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="inline-flex gap-1.5 justify-end">
                                    <button
                                      onClick={() => alert(`Token refresh simulation completed for ${ch.username} (${ch.platform})`)}
                                      className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 text-xs font-semibold transition-colors"
                                    >
                                      Refresh Token
                                    </button>
                                    <button
                                      onClick={() => alert(`Simulating platform channel disconnect. Disconnected successfully.`)}
                                      className="rounded-xl border border-red-200 bg-white hover:bg-red-50 text-[#EF4444] px-2.5 py-1.5 text-xs font-semibold transition-colors"
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

              {/* TAB 9: NOTIFICATIONS CENTER */}
              {activeTab === "notifications" && (
                <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-6 max-w-xl mx-auto">
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
                        className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2 text-sm outline-none focus:border-emerald-500 bg-[#FCFAF6]"
                      />
                    </div>

                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Target Audience</label>
                        <select
                          value={announcementTarget}
                          onChange={(e) => setAnnouncementTarget(e.target.value)}
                          className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2 text-sm outline-none bg-[#FCFAF6] cursor-pointer"
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
                          className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2 text-sm outline-none bg-[#FCFAF6] cursor-pointer"
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
                        className="w-full rounded-xl border border-[#EEF2F7] p-4 text-sm outline-none focus:border-emerald-500 bg-[#FCFAF6]"
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
                      className="w-full rounded-xl bg-[var(--brand-primary)] hover:bg-emerald-500 hover:text-white py-3 text-sm font-bold text-emerald-950 transition-colors shadow-sm"
                    >
                      Broadcast Announcement Now
                    </button>
                  </div>
                </div>
              )}


            </div>
          )}
        </main>
      </div>

      {/* AI Limits Adjustment Modal */}
      {adjustingAiUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-modal space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Adjust AI Quotas & Limits</h3>
                <p className="text-xs text-slate-400">Configure custom parameters for {adjustingAiUser.name}</p>
              </div>
              <button
                onClick={() => setAdjustingAiUser(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="size-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#FCFAF6] rounded-xl p-3 border border-[#EEF2F7] text-xs text-slate-600 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-700">{adjustingAiUser.email}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Plan: {adjustingAiUser.plan}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  adjustingAiUser.status === "ACTIVE"
                    ? "bg-[#F0FDF4] text-[#22C55E]"
                    : adjustingAiUser.status === "LIMIT REACHED"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-red-50 text-red-800"
                }`}>
                  {adjustingAiUser.status}
                </span>
              </div>

              {/* Token Limit */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase">Monthly Token Limit</label>
                  <span className="text-[10px] text-slate-400">Default: Free (50k) | Pro (5M)</span>
                </div>
                <input
                  type="number"
                  value={tokenLimitVal}
                  onChange={(e) => setTokenLimitVal(e.target.value)}
                  className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-[#FCFAF6] font-semibold"
                />
              </div>

              {/* Request Limit */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase">Monthly Request Limit</label>
                  <span className="text-[10px] text-slate-400">Default: Free (50) | Pro (Unlimited: -1)</span>
                </div>
                <input
                  type="number"
                  value={requestLimitVal}
                  onChange={(e) => setRequestLimitVal(e.target.value)}
                  className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-[#FCFAF6] font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Bonus Tokens */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bonus Tokens</label>
                  <input
                    type="number"
                    value={bonusTokensVal}
                    onChange={(e) => setBonusTokensVal(e.target.value)}
                    className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-[#FCFAF6] font-semibold"
                  />
                </div>

                {/* Bonus Requests */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bonus Requests</label>
                  <input
                    type="number"
                    value={bonusRequestsVal}
                    onChange={(e) => setBonusRequestsVal(e.target.value)}
                    className="w-full rounded-xl border border-[#EEF2F7] px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-[#FCFAF6] font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-[#EEF2F7]">
              <button
                onClick={() => setAdjustingAiUser(null)}
                className="rounded-xl border border-[#EEF2F7] bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const userId = adjustingAiUser.id
                  let ok = true
                  if (tokenLimitVal !== adjustingAiUser.tokenLimit.toString()) {
                    ok = await runAdminPostAction({ action: "adjust-user-tokens", userId, limit: Number(tokenLimitVal) }, "Token limit updated")
                  }
                  if (ok && requestLimitVal !== adjustingAiUser.requestLimit.toString()) {
                    ok = await runAdminPostAction({ action: "adjust-user-requests", userId, limit: Number(requestLimitVal) }, "Request limit updated")
                  }
                  if (ok && (bonusTokensVal !== adjustingAiUser.bonusTokens.toString() || bonusRequestsVal !== adjustingAiUser.bonusRequests.toString())) {
                    ok = await runAdminPostAction({ action: "adjust-user-bonus", userId, bonusTokens: Number(bonusTokensVal), bonusRequests: Number(bonusRequestsVal) }, "Bonus limits adjusted")
                  }
                  if (ok) {
                    setAdjustingAiUser(null)
                  }
                }}
                className="rounded-xl bg-[var(--brand-primary)] hover:bg-[#16A34A] hover:text-white px-5 py-2.5 text-xs font-bold text-emerald-950 transition-colors shadow-sm"
              >
                Save Limits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI User Analytics Modal */}
      {selectedAiUserAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-modal space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">AI Quota Analytics</h3>
                <p className="text-xs text-slate-400">Detailed usage statistics for user</p>
              </div>
              <button
                onClick={() => setSelectedAiUserAnalytics(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="size-6" />
              </button>
            </div>

            {selectedAiUserAnalytics.loading ? (
              <div className="flex h-48 flex-col items-center justify-center space-y-3">
                <RefreshCw className="size-8 animate-spin text-emerald-500" />
                <span className="text-xs text-slate-400">Fetching OpenAI audit logs...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#FCFAF6] p-4 rounded-xl">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{selectedAiUserAnalytics.user?.name}</h4>
                    <p className="text-xs text-slate-400">{selectedAiUserAnalytics.user?.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-bold text-[#22C55E] capitalize">
                      {selectedAiUserAnalytics.user?.plan} Plan
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl p-4 bg-[#FCFAF6] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tokens Used</span>
                    <p className="text-2xl font-black text-slate-800">{(selectedAiUserAnalytics.tokensUsed || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">
                      Limit: {((selectedAiUserAnalytics.user?.tokenLimit || 0) + (selectedAiUserAnalytics.user?.bonusTokens || 0)).toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl p-4 bg-[#FCFAF6] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Requests</span>
                    <p className="text-2xl font-black text-slate-800">{selectedAiUserAnalytics.requests || 0}</p>
                    <p className="text-[10px] text-slate-400">
                      Limit: {selectedAiUserAnalytics.user?.requestLimit === -1 ? "Unlimited" : (selectedAiUserAnalytics.user?.requestLimit || 0) + (selectedAiUserAnalytics.user?.bonusRequests || 0)}
                    </p>
                  </div>

                  <div className="rounded-xl p-4 bg-[#FCFAF6] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Cost</span>
                    <p className="text-2xl font-black text-[#22C55E]">${(selectedAiUserAnalytics.costGenerated || 0).toFixed(4)}</p>
                    <p className="text-[10px] text-slate-400">Calculated from pricing rates</p>
                  </div>

                  <div className="rounded-xl p-4 bg-[#FCFAF6] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Response Latency</span>
                    <p className="text-2xl font-black text-slate-800">{selectedAiUserAnalytics.avgResponseTime || 0}ms</p>
                    <p className="text-[10px] text-slate-400">OpenAI API connection time</p>
                  </div>
                </div>

                <div className="rounded-xl p-4 bg-[#FCFAF6] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Most Active Feature</span>
                    <span className="font-semibold text-slate-700">{selectedAiUserAnalytics.mostUsedFeature}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-50">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Last Request Timestamp</span>
                    <span className="font-semibold text-slate-700">
                      {selectedAiUserAnalytics.lastRequest ? new Date(selectedAiUserAnalytics.lastRequest).toLocaleString() : "Never"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedAiUserAnalytics(null)}
                className="rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs px-5 py-2.5 transition-colors shadow-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Management Modal */}
      {selectedCreditUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-modal space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Manage AI Credits</h3>
                <p className="text-xs text-slate-400">Update credit quotas for user</p>
              </div>
              <button
                onClick={() => setSelectedCreditUser(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="size-6" />
              </button>
            </div>

            {/* User Meta Info */}
            <div className="bg-[#FCFAF6] p-4 rounded-xl flex justify-between items-center text-sm">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase block">User</span>
                <span className="font-extrabold text-slate-800">{selectedCreditUser.name || selectedCreditUser.email.split("@")[0]}</span>
                <span className="text-xs text-slate-400 block">{selectedCreditUser.email}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-bold uppercase block">Current Plan</span>
                <span className="inline-flex rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-bold text-[#22C55E] capitalize mt-0.5">
                  {selectedCreditUser.plan}
                </span>
              </div>
            </div>

            <div className="bg-[#FCFAF6] p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase block">Remaining Credits</span>
                <span className="text-2xl font-black text-slate-800">
                  {Math.max(0, (selectedCreditUser.aiCredits ?? 0) - (selectedCreditUser.aiUsedCredits ?? 0))}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-bold uppercase block">Total Allocated</span>
                <span className="text-lg font-bold text-slate-700">{selectedCreditUser.aiCredits ?? 0}</span>
              </div>
            </div>

            {/* Admin Controls */}
            <div className="space-y-4 pt-2">
              {/* Add Credits */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Add Credits</label>
                  <input
                    type="number"
                    value={addCreditsVal}
                    onChange={(e) => setAddCreditsVal(e.target.value)}
                    placeholder="+500"
                    className="w-full rounded-xl border border-[#EEF2F7] bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <button
                  onClick={async () => {
                    const ok = await runAdminPostAction({ action: "add-credits", userId: selectedCreditUser.id, amount: Number(addCreditsVal) }, `Successfully added ${addCreditsVal} credits`)
                    if (ok) setSelectedCreditUser(null)
                  }}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 mt-5 shadow-sm transition-colors"
                >
                  Add Credits
                </button>
              </div>

              {/* Remove Credits */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Remove Credits</label>
                  <input
                    type="number"
                    value={removeCreditsVal}
                    onChange={(e) => setRemoveCreditsVal(e.target.value)}
                    placeholder="-200"
                    className="w-full rounded-xl border border-[#EEF2F7] bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <button
                  onClick={async () => {
                    const ok = await runAdminPostAction({ action: "remove-credits", userId: selectedCreditUser.id, amount: Number(removeCreditsVal) }, `Successfully removed ${removeCreditsVal} credits`)
                    if (ok) setSelectedCreditUser(null)
                  }}
                  className="rounded-xl bg-[#EF4444] hover:bg-rose-600 text-white font-bold text-xs px-4 py-2.5 mt-5 shadow-sm transition-colors"
                >
                  Remove Credits
                </button>
              </div>

              {/* Set Exact Amount */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Set Exact Amount</label>
                  <input
                    type="number"
                    value={updateCreditsVal}
                    onChange={(e) => setUpdateCreditsVal(e.target.value)}
                    placeholder="1000"
                    className="w-full rounded-xl border border-[#EEF2F7] bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <button
                  onClick={async () => {
                    const ok = await runAdminPostAction({ action: "update-credits", userId: selectedCreditUser.id, amount: Number(updateCreditsVal) }, `Successfully set credits to ${updateCreditsVal}`)
                    if (ok) setSelectedCreditUser(null)
                  }}
                  className="rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs px-4 py-2.5 mt-5 shadow-sm transition-colors"
                >
                  Update Credits
                </button>
              </div>

              {/* Reset Usage */}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Reset Usage Counters</span>
                  <span className="text-[10px] text-slate-400">Resets user's credits consumed back to 0</span>
                </div>
                <button
                  onClick={async () => {
                    const ok = await runAdminPostAction({ action: "reset-usage", userId: selectedCreditUser.id }, "Successfully reset credits usage")
                    if (ok) setSelectedCreditUser(null)
                  }}
                  className="rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs px-4 py-2.5 transition-colors border border-amber-200/50"
                >
                  Reset AI Usage
                </button>
              </div>
            </div>

            {/* Footer Close */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedCreditUser(null)}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
