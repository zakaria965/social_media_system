"use client"

import { useState, useEffect, Fragment } from "react"
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
  ChevronDown,
  UserPlus,
  FileText,
  Download,
  Calendar
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
  const { data: session } = useSession()
  const router = useRouter()
  
  // Client mount state to prevent hydration mismatches
  const [mounted, setMounted] = useState(false)
  const [timeString, setTimeString] = useState("")

  // Navigation active tab state
  const [activeTab, setActiveTab] = useState("overview")
  const [unreadContactCount, setUnreadContactCount] = useState(0)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)

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

  // Sync tab with URL search parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab")
      if (tab) {
        setActiveTab(tab)
      }
    }
  }, [])

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

  const changeTab = (tabId: string) => {
    setSelectedTicket(null)
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
  const [bonusTokensVal, setBonusTokensVal] = useState<string>("0")
  const [bonusRequestsVal, setBonusRequestsVal] = useState<string>("0")
  const [tokenLimitVal, setTokenLimitVal] = useState<string>("50000")
  const [requestLimitVal, setRequestLimitVal] = useState<string>("50")
  const [customBudgetVal, setCustomBudgetVal] = useState<string>("100")
  const [loadingUserAnalytics, setLoadingUserAnalytics] = useState<boolean>(false)

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
    maintenanceMode: false,
    aiProvider: "gemini"
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
          setTopAiUsers(data.leaderboard?.topUsers || [])
          setAiUsers(data.users || [])
          setProviderBreakdown(data.providerBreakdown || [])
          setFeatureUsage(data.featureUsage || [])
          setAiLeaderboard(data.leaderboard || { topUsers: [], topCostUsers: [], topWorkspaces: [] })
          setAiSettings(data.settings || { openaiMonthlyBudget: 100, openaiEmergencyShutdown: false })
          setCustomBudgetVal((data.settings?.openaiMonthlyBudget || 100).toString())
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
                    router.push("/admin/contact-messages")
                  } else {
                    changeTab(item.id)
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
            className="flex w-full items-center gap-2 rounded-xl border border-[#EEF2F7] bg-white hover:bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-colors"
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
              <div className="size-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
              Platform Online
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="relative p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-105 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
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
                            router.push("/admin/contact-messages")
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
                            Click to open Contact Center
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="py-4 text-center text-xs text-slate-455">No new contact messages</p>
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
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${u.plan === "PRO" ? "bg-[#F0FDF4] text-[#22C55E]" : "bg-slate-100 text-slate-800"}`}>
                                  {u.plan}
                                </span>
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

                  {/* SUBTAB 1: OVERVIEW & ANALYTICS */}
                  {activeAiSubTab === "overview" && (
                    <div className="space-y-6">
                      {/* AI Admin Analytics Summary Grid */}
                      {(() => {
                        const geminiStats = providerBreakdown.find(p => p.name === "Gemini") || { requests: 0 };
                        const zaiStats = providerBreakdown.find(p => p.name === "Z.ai") || { requests: 0 };
                        return (
                          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                            {[
                              { title: "Gemini Requests", value: geminiStats.requests, desc: "All-time Gemini API calls", color: "border-emerald-500/20" },
                              { title: "Z.ai Requests", value: zaiStats.requests, desc: "All-time Z.ai API calls", color: "border-blue-500/20" },
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

              {/* TAB 8: SUPPORT CENTER */}
              {activeTab === "tickets" && (
                <div className="space-y-6">
                  {/* Grid tickets & reply drawer */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Tickets list */}
                    <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 lg:col-span-1 space-y-4">
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
                                  ? "border-[#22C55E] bg-[#F0FDF4]/30 shadow-sm" 
                                  : "border-[#EEF2F7] hover:bg-slate-50/50"
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
                    <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 lg:col-span-2 space-y-4">
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
                              className="w-full rounded-xl border border-[#EEF2F7] p-3 text-xs outline-none focus:border-emerald-500 bg-white"
                              rows={2}
                            />
                            <button
                              onClick={() => runAdminPostAction({ action: "update-ticket-meta", ticketId: selectedTicket.ticketId, internalNotes: ticketInternalNotes }, "Notes saved")}
                              className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-semibold transition-colors"
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
                                className="rounded-xl bg-[var(--brand-primary)] hover:bg-emerald-500 hover:text-white px-4 py-2 text-xs font-bold text-emerald-950 flex items-center gap-1 transition-colors"
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
                        <div key={idx} className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{sys.name}</span>
                            <div className={`size-3 rounded-full ${sys.health === "green" ? "bg-[var(--brand-primary)]" : sys.health === "yellow" ? "bg-[#F59E0B]" : "bg-[#EF4444]"}`} />
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
                  <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 grid gap-6 md:grid-cols-3">
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
                        <div className="h-full bg-[var(--brand-primary)] rounded" style={{ width: "12%" }} />
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
                  <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                    <h3 className="text-base font-bold mb-4">Platform Administrative Security Logs</h3>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-transparent border-b border-[#EEF2F7] sticky top-0">
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
                    <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Failed Login Attempts</p>
                      <p className="text-4xl font-extrabold text-[#EF4444] mt-2">
                        {users.reduce((acc, curr) => acc + (curr.activeSessions?.filter(s => s.status === "failed")?.length || 0), 0) || 4}
                      </p>
                      <span className="text-[10px] text-slate-400">Suspicious activities monitored</span>
                    </div>
                    <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blocked IPs</p>
                      <p className="text-4xl font-extrabold text-slate-800 mt-2">1</p>
                      <span className="text-[10px] text-[var(--brand-primary)] font-semibold">IP Firewalls active</span>
                    </div>
                    <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Sessions</p>
                      <p className="text-4xl font-extrabold text-[#22C55E] mt-2">
                        {users.reduce((acc, curr) => acc + (curr.activeSessionsCount || 0), 0)}
                      </p>
                      <span className="text-[10px] text-slate-400">Global open login tokens</span>
                    </div>
                  </div>

                  {/* Active login sessions controller */}
                  <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                    <h3 className="text-base font-bold mb-4">Active User Session Tokens</h3>
                    <p className="text-xs text-slate-400 mb-4">View active authentication sessions. Force log out terminals immediately if suspicious actions are detected.</p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-transparent border-b border-[#EEF2F7]">
                          <tr>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">User Account</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">IP Address</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Device / Browser</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Last Active</th>
                            <th className="px-6 py-4 font-bold text-slate-400 text-right uppercase text-xs">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF2F7] text-xs">
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
                                    className="rounded-xl border border-red-200 bg-white hover:bg-red-50 text-[#EF4444] px-2.5 py-1 text-[11px] font-semibold transition-colors"
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
                <div className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-6 max-w-xl mx-auto">
                  <h3 className="text-lg font-bold text-slate-800">Global Configuration Settings</h3>
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
                      className="w-full rounded-xl bg-[var(--brand-primary)] hover:bg-emerald-500 hover:text-white py-3 text-sm font-bold text-emerald-950 transition-colors shadow-sm"
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
    </div>
  )
}
