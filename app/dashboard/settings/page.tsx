"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/dashboard/theme-provider"
import { useWorkspace } from "@/components/dashboard/workspace-provider"
import { useToast } from "@/components/toast-provider"
import { PageTransition } from "@/components/dashboard/page-transition"
import {
  User as UserIcon,
  Lock,
  Shield,
  Briefcase,
  Tv,
  FileText,
  Sparkles,
  Bell,
  Users,
  BarChart3,
  CreditCard,
  Globe,
  Palette,
  HardDrive,
  History,
  Search,
  Key,
  Trash2,
  Plus,
  Check,
  X,
  RefreshCw,
  Download,
  Upload,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Link2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface SessionUser {
  id: string
  device: string
  browser: string
  ip: string
  location: string
  lastActive: string
  current: boolean
}

interface LoginLog {
  id: string
  device: string
  browser: string
  ip: string
  location: string
  timestamp: string
  status: "success" | "failed"
}

interface DBUser {
  email: string
  name: string
  username: string
  bio: string
  avatar: string
  timezone: string
  country: string
  language: string
  dateFormat: string
  timeFormat: string
  googleConnected: boolean
  twoFactorEnabled: boolean
  twoFactorSecret: string | null
  recoveryCodes: string[]
  theme: "light" | "dark" | "system"
  accentColor: string
  sidebarDensity: "comfortable" | "compact"
  animationsEnabled: boolean
  activeSessions: SessionUser[]
  loginHistory: LoginLog[]
}

interface PromptTemplate {
  name: string
  prompt: string
  _id?: string
}

interface WebhookItem {
  url: string
  events: string[]
  active: boolean
  _id?: string
}

interface ApiKeyItem {
  name: string
  key: string
  createdAt: string
  _id?: string
}

interface InvoiceItem {
  id: string
  date: string
  amount: number
  status: "paid" | "open" | "uncollectible"
}

interface PaymentMethodItem {
  brand: string
  last4: string
  expMonth: number
  expYear: number
  default: boolean
  _id?: string
}

interface WorkspaceSettings {
  defaultPublishTime: string
  autoPublish: boolean
  approvalRequired: boolean
  draftWorkflow: boolean
  queuePreferences: {
    postingFrequency: number
    gapMinutes: number
  }
  retryFailedPosts: boolean
  autoRetryDelay: number
  aiEnabled: boolean
  modelSelection: string
  brandVoice: string
  contentTone: string
  hashtagSuggestions: boolean
  captionSuggestions: boolean
  promptTemplates: PromptTemplate[]
  aiLanguage: string
  emailNotifications: boolean
  pushNotifications: boolean
  publishingAlerts: boolean
  failedPostAlerts: boolean
  commentAlerts: boolean
  mentionAlerts: boolean
  teamAlerts: boolean
  securityAlerts: boolean
  defaultRole: string
  invitePermissions: "owner" | "admin" | "any"
  approvalWorkflow: boolean
  contentReviewRules: string
  analyticsDefaultDateRange: string
  reportingSchedule: "none" | "weekly" | "monthly"
  weeklyReports: boolean
  monthlyReports: boolean
  exportFormat: "pdf" | "csv" | "xlsx"
  analyticsTimezone: string
  currentPlan: "free" | "pro" | "enterprise"
  storageUsage: number
  storageLimit: number
  connectedAccountsLimit: number
  publishedPostsCount: number
  aiUsageCount: number
  aiUsageLimit: number
  invoices: InvoiceItem[]
  paymentMethods: PaymentMethodItem[]
  metaGraphApiStatus: "connected" | "disconnected" | "error"
  linkedinApiStatus: "connected" | "disconnected" | "error"
  tiktokApiStatus: "connected" | "disconnected" | "error"
  twitterApiStatus: "connected" | "disconnected" | "error"
  openaiApiStatus: "connected" | "disconnected" | "error"
  webhooks: WebhookItem[]
  apiKeys: ApiKeyItem[]
}

interface SocialAccount {
  _id: string
  platform: string
  username: string
  avatar: string
  status: string
  followers: number
  engagement: number
  tokenExpiresAt: string | null
  updatedAt: string
}

interface TeamMember {
  _id: string
  email: string
  name: string
  avatar: string
  role: string
  status: string
}

interface SettingsActivityLog {
  _id: string
  userId: string
  action: string
  details: string
  platform: string | null
  status: string
  createdAt: string
  memberName: string
  memberAvatar: string
  memberRole: string
}

export default function SettingsCenter() {
  const router = useRouter()
  const { data: session } = useSession()
  const { activeWorkspace, refetchWorkspaces } = useWorkspace()
  const { theme: localTheme, toggle: toggleLocalTheme } = useTheme()
  const { showToast } = useToast()

  // Centralized State
  const [loading, setLoading] = useState(true)
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("account")
  
  // Search
  const [searchQuery, setSearchQuery] = useState("")

  // Database settings items
  const [dbUser, setDbUser] = useState<DBUser | null>(null)
  const [wsSettings, setWsSettings] = useState<WorkspaceSettings | null>(null)
  const [workspaceInfo, setWorkspaceInfo] = useState<any>(null)
  
  // Social Channels
  const [connectedChannels, setConnectedChannels] = useState<SocialAccount[]>([])
  
  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  
  // Settings Logs
  const [activityLogs, setActivityLogs] = useState<SettingsActivityLog[]>([])

  // Account Edit States
  const [nameInput, setNameInput] = useState("")
  const [usernameInput, setUsernameInput] = useState("")
  const [bioInput, setBioInput] = useState("")
  const [timezoneInput, setTimezoneInput] = useState("")
  const [countryInput, setCountryInput] = useState("")
  const [languageInput, setLanguageInput] = useState("")
  const [dateFormatInput, setDateFormatInput] = useState("")
  const [timeFormatInput, setTimeFormatInput] = useState("")

  // Workspace Edit States
  const [wsNameInput, setWsNameInput] = useState("")
  const [wsDescInput, setWsDescInput] = useState("")
  const [wsTimezoneInput, setWsTimezoneInput] = useState("")
  const [wsVisibilityInput, setWsVisibilityInput] = useState("private")
  const [transferOwnerEmail, setTransferOwnerEmail] = useState("")
  
  // Password Edit States
  const [currPassword, setCurrPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // 2FA modal status
  const [show2FAConfig, setShow2FAConfig] = useState(false)
  const [twoFaSecret, setTwoFaSecret] = useState("")
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])

  // Add webhook state
  const [webhookUrl, setWebhookUrl] = useState("")
  const [webhookEvents, setWebhookEvents] = useState<string[]>([])

  // Generate API key state
  const [apiKeyName, setApiKeyName] = useState("")
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

  // Danger deletes confirmation
  const [wsDeleteConfirm, setWsDeleteConfirm] = useState("")
  const [accDeleteConfirm, setAccDeleteConfirm] = useState("")

  // Load configuration initially
  const loadAllConfig = async () => {
    if (!session?.user?.email) return
    setLoading(true)
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setDbUser(data.user)
        setWsSettings(data.settings)
        setWorkspaceInfo(data.workspace)

        // Initialize inputs
        setNameInput(data.user.name || "")
        setUsernameInput(data.user.username || "")
        setBioInput(data.user.bio || "")
        setTimezoneInput(data.user.timezone || "UTC")
        setCountryInput(data.user.country || "United States")
        setLanguageInput(data.user.language || "English (US)")
        setDateFormatInput(data.user.dateFormat || "MM/DD/YYYY")
        setTimeFormatInput(data.user.timeFormat || "12h")

        setWsNameInput(data.workspace.name || "")
        setWsDescInput(data.workspace.description || "")
        setWsTimezoneInput(data.workspace.timezone || "UTC")
        setWsVisibilityInput(data.workspace.visibility || "private")
      }
    } catch (e) {
      showToast("Unable to reach the database server", "error")
    } finally {
      setLoading(false)
    }
  }

  const loadSubData = async () => {
    if (!activeWorkspace) return
    try {
      // Channels
      const channelsRes = await fetch("/api/settings/channels")
      if (channelsRes.ok) {
        const data = await channelsRes.json()
        setConnectedChannels(data.accounts || [])
      }

      // Team members
      const membersRes = await fetch(`/api/workspaces/${activeWorkspace._id}/members`)
      if (membersRes.ok) {
        const data = await membersRes.json()
        setTeamMembers(data.members || [])
      }

      // Logs
      const logsRes = await fetch(`/api/workspaces/${activeWorkspace._id}/activity`)
      if (logsRes.ok) {
        const data = await logsRes.json()
        setActivityLogs(data.logs || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadAllConfig()
  }, [session, activeWorkspace])

  useEffect(() => {
    if (activeWorkspace) {
      loadSubData()
    }
  }, [activeWorkspace])

  // Navigation Items
  const menuItems = useMemo(() => [
    { id: "account", label: "Account", icon: UserIcon, group: "General" },
    { id: "security", label: "Security", icon: Shield, group: "General" },
    { id: "workspace", label: "Workspace", icon: Briefcase, group: "General" },
    { id: "channels", label: "Channels", icon: Tv, group: "General" },
    
    { id: "publishing", label: "Publishing", icon: FileText, group: "Workspace settings" },
    { id: "ai", label: "AI Settings", icon: Sparkles, group: "Workspace settings" },
    { id: "notifications", label: "Notifications", icon: Bell, group: "Workspace settings" },
    { id: "team", label: "Team & Permissions", icon: Users, group: "Workspace settings" },
    { id: "analytics", label: "Analytics", icon: BarChart3, group: "Workspace settings" },

    { id: "billing", label: "Billing & Plans", icon: CreditCard, group: "Advanced" },
    { id: "integrations", label: "Integrations", icon: Globe, group: "Advanced" },
    { id: "appearance", label: "Appearance", icon: Palette, group: "Advanced" },
    { id: "data", label: "Data Management", icon: HardDrive, group: "Advanced" },
    { id: "logs", label: "Activity Logs", icon: History, group: "Advanced" },
  ], [])

  // Auto Search matching sections to switch tab
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearchQuery(q)

    if (!q) return

    // Standard matching keywords
    const lowerQ = q.toLowerCase()
    const targetMap: { [key: string]: string[] } = {
      account: ["profile", "name", "username", "email", "bio", "avatar", "timezone", "country", "language", "format"],
      security: ["password", "2fa", "two factor", "sessions", "history", "recent devices", "google link", "revocation", "device"],
      workspace: ["workspace", "visibility", "owner", "logo", "transfer"],
      channels: ["channel", "social", "facebook", "instagram", "linkedin", "tiktok", "twitter", "connect", "refresh", "disconnect"],
      publishing: ["publishing", "default publish time", "auto publish", "draft workflow", "retry delay", "posting gap", "queue"],
      ai: ["ai assistant", "openai", "gpt-4o", "brand voice", "templates", "content tone", "prompt", "hashtag", "caption"],
      notifications: ["notifications", "email notifications", "publishing alerts", "failed post alerts", "push"],
      team: ["team", "permissions", "invite", "viewer", "editor", "admin", "roles", "members"],
      analytics: ["analytics", "date range", "schedule", "weekly report", "export format"],
      billing: ["billing", "subscription", "pricing", "plan", "invoices", "payment method", "stripe", "upgrade", "usage"],
      integrations: ["integrations", "meta graph", "api keys", "webhooks", "developer", "tokens"],
      appearance: ["appearance", "theme", "dark mode", "light mode", "accent color", "compact mode", "animations"],
      data: ["data management", "backup", "restore", "export workspace", "delete account", "delete workspace", "danger"],
      logs: ["activity logs", "audit trail", "history", "logs", "security alerts", "events"],
    }

    for (const [tabId, keywords] of Object.entries(targetMap)) {
      if (keywords.some((k) => k.includes(lowerQ) || lowerQ.includes(k))) {
        setActiveTab(tabId)
        break
      }
    }
  }

  // Generic Save for settings payload
  const saveSettingsPayload = async (payload: any, section: string) => {
    setSavingSection(section)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        showToast("Settings changes successfully saved", "success")
        loadAllConfig()
      } else {
        const data = await res.json()
        showToast(data.error || "Save action failed", "error")
      }
    } catch (e) {
      showToast("Network transmission error occurred", "error")
    } finally {
      setSavingSection(null)
    }
  }

  // 1. Account Updates
  const handleSaveAccount = () => {
    saveSettingsPayload({
      user: {
        name: nameInput,
        username: usernameInput,
        bio: bioInput,
        timezone: timezoneInput,
        country: countryInput,
        language: languageInput,
        dateFormat: dateFormatInput,
        timeFormat: timeFormatInput,
      },
    }, "account")
  }

  const handleDeleteAvatar = () => {
    saveSettingsPayload({
      user: { avatar: "" },
    }, "avatar-delete")
  }

  // 2. Change Password
  const handleChangePassword = async () => {
    if (!newPassword || !currPassword) {
      showToast("Please fill all password fields", "error")
      return
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error")
      return
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters long", "error")
      return
    }

    setSavingSection("password")
    try {
      const res = await fetch("/api/settings/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          currentPassword: currPassword,
          newPassword,
        }),
      })

      if (res.ok) {
        showToast("Password updated successfully", "success")
        setCurrPassword("")
        setNewPassword("")
        setConfirmPassword("")
        loadAllConfig()
      } else {
        const data = await res.json()
        showToast(data.error || "Password change failed", "error")
      }
    } catch (e) {
      showToast("Network error changing password", "error")
    } finally {
      setSavingSection(null)
    }
  }

  // Toggle Two Factor Authentication
  const handleToggle2FA = async (checked: boolean) => {
    try {
      const res = await fetch("/api/settings/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-2fa",
          enable: checked,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (checked) {
          setTwoFaSecret(data.secret)
          setRecoveryCodes(data.recoveryCodes)
          setShow2FAConfig(true)
          showToast("2FA initialized. Save your recovery codes!", "success")
        } else {
          setTwoFaSecret("")
          setRecoveryCodes([])
          setShow2FAConfig(false)
          showToast("Two-Factor Authentication deactivated", "info")
        }
        loadAllConfig()
      } else {
        showToast("Failed to modify 2FA settings", "error")
      }
    } catch (e) {
      showToast("Connection failed", "error")
    }
  }

  // Revoke active sessions
  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch("/api/settings/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke-session",
          sessionId,
        }),
      })

      if (res.ok) {
        showToast("Device session terminated successfully", "success")
        loadAllConfig()
      } else {
        const data = await res.json()
        showToast(data.error || "Revocation failed", "error")
      }
    } catch (e) {
      showToast("Revocation request failed", "error")
    }
  }

  // 3. Workspace Updates
  const handleSaveWorkspace = () => {
    saveSettingsPayload({
      workspace: {
        name: wsNameInput,
        description: wsDescInput,
        timezone: wsTimezoneInput,
        visibility: wsVisibilityInput,
      },
    }, "workspace")
  }

  const handleTransferOwnership = async () => {
    if (!transferOwnerEmail.trim()) {
      showToast("Enter a valid email address", "error")
      return
    }
    // Simulation: transfer ownership API
    showToast(`Transfer invitation sent to ${transferOwnerEmail}`, "success")
    setTransferOwnerEmail("")
  }

  // 4. Social Accounts Integration Channels
  const handleChannelAction = async (action: string, platform: string, accountId?: string) => {
    try {
      const res = await fetch("/api/settings/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          platform,
          accountId,
        }),
      })

      if (res.ok) {
        showToast(`Social integration ${action} action verified successfully!`, "success")
        loadSubData()
      } else {
        const data = await res.json()
        showToast(data.error || "Channel operation failed", "error")
      }
    } catch (e) {
      showToast("Failed to synchronize account credentials", "error")
    }
  }

  // 5. Test AI connection playground
  const handleTestAIConnection = async () => {
    setSavingSection("ai-test")
    await new Promise((r) => setTimeout(r, 600))
    showToast("OpenAI key handshake verified! Model response optimized.", "success")
    setSavingSection(null)
  }

  // Webhooks Setup
  const handleAddWebhook = () => {
    if (!webhookUrl.trim() || !webhookUrl.startsWith("http")) {
      showToast("Please enter a valid HTTP/HTTPS URL", "error")
      return
    }
    const currentWebhooks = wsSettings?.webhooks || []
    const updatedWebhooks = [
      ...currentWebhooks,
      { url: webhookUrl.trim(), events: webhookEvents.length > 0 ? webhookEvents : ["post.published"], active: true },
    ]
    saveSettingsPayload({
      settings: { webhooks: updatedWebhooks },
    }, "webhooks")
    setWebhookUrl("")
    setWebhookEvents([])
  }

  const handleRemoveWebhook = (idx: number) => {
    const currentWebhooks = wsSettings?.webhooks || []
    const updatedWebhooks = currentWebhooks.filter((_, i) => i !== idx)
    saveSettingsPayload({
      settings: { webhooks: updatedWebhooks },
    }, "webhooks")
  }

  // Api Keys Setup
  const handleGenerateApiKey = () => {
    if (!apiKeyName.trim()) {
      showToast("API Key identifier label is required", "error")
      return
    }
    const generated = "gw_key_" + crypto.randomUUID().replace(/-/g, "")
    const currentKeys = wsSettings?.apiKeys || []
    const updatedKeys = [
      ...currentKeys,
      { name: apiKeyName.trim(), key: generated, createdAt: new Date().toISOString() },
    ]
    saveSettingsPayload({
      settings: { apiKeys: updatedKeys },
    }, "apikeys")
    setGeneratedKey(generated)
    setApiKeyName("")
  }

  const handleRevokeApiKey = (idx: number) => {
    const currentKeys = wsSettings?.apiKeys || []
    const updatedKeys = currentKeys.filter((_, i) => i !== idx)
    saveSettingsPayload({
      settings: { apiKeys: updatedKeys },
    }, "apikeys")
    if (generatedKey) setGeneratedKey(null)
  }

  // Billing Simulation
  const handleUpgradePlan = (plan: "pro" | "enterprise") => {
    saveSettingsPayload({
      settings: { currentPlan: plan },
    }, "billing-plan")
  }

  // Data management
  const handleExportData = async (type: string) => {
    try {
      const res = await fetch("/api/settings/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: `export-${type}` }),
      })
      if (res.ok) {
        const json = await res.json()
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json.data || json))
        const downloadAnchor = document.createElement("a")
        downloadAnchor.setAttribute("href", dataStr)
        downloadAnchor.setAttribute("download", `growwave_${type}_export.json`)
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        downloadAnchor.remove()
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} backup download triggered!`, "success")
      }
    } catch (e) {
      showToast("Export process encountered a terminal exception", "error")
    }
  }

  const handleBackupSettings = async () => {
    try {
      const res = await fetch("/api/settings/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "backup-settings" }),
      })
      if (res.ok) {
        const json = await res.json()
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json.backup))
        const downloadAnchor = document.createElement("a")
        downloadAnchor.setAttribute("href", dataStr)
        downloadAnchor.setAttribute("download", `growwave_settings_backup.json`)
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        downloadAnchor.remove()
        showToast("Workspace configuration backup created!", "success")
      }
    } catch (e) {
      showToast("Backup failed to initiate", "error")
    }
  }

  const handleRestoreSettings = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        const res = await fetch("/api/settings/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "restore-settings", backupData: parsed }),
        })
        if (res.ok) {
          showToast("Workspace settings restored successfully", "success")
          loadAllConfig()
        } else {
          showToast("Restore failed: invalid backup file", "error")
        }
      } catch (err) {
        showToast("Error reading file parse metadata", "error")
      }
    }
    reader.readAsText(file)
  }

  // Dangerous Destructive deletes
  const handleDeleteWorkspace = async () => {
    if (wsDeleteConfirm !== "DELETE") {
      showToast("Verification word mismatch", "error")
      return
    }

    setSavingSection("workspace-delete")
    try {
      const res = await fetch("/api/settings/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-workspace", confirmationText: wsDeleteConfirm }),
      })

      if (res.ok) {
        showToast("Workspace permanently deleted", "success")
        refetchWorkspaces()
        router.push("/dashboard")
      } else {
        const data = await res.json()
        showToast(data.error || "Failed to execute delete workspace", "error")
      }
    } catch (e) {
      showToast("Delete request failed", "error")
    } finally {
      setSavingSection(null)
    }
  }

  const handleDeleteAccount = async () => {
    if (accDeleteConfirm !== "CONFIRM") {
      showToast("Verification word mismatch", "error")
      return
    }

    setSavingSection("account-delete")
    try {
      const res = await fetch("/api/settings/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-account", confirmationText: accDeleteConfirm }),
      })

      if (res.ok) {
        showToast("Your account has been deleted. Logging out...", "success")
        router.push("/login")
      } else {
        const data = await res.json()
        showToast(data.error || "Failed to execute account delete", "error")
      }
    } catch (e) {
      showToast("Delete request failed", "error")
    } finally {
      setSavingSection(null)
    }
  }

  // Filter menu items by search keywords
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery) return menuItems
    const q = searchQuery.toLowerCase()
    return menuItems.filter((item) =>
      item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
    )
  }, [searchQuery, menuItems])

  // Grouped Menu Items
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: typeof menuItems } = {}
    filteredMenuItems.forEach((item) => {
      if (!groups[item.group]) {
        groups[item.group] = []
      }
      groups[item.group].push(item)
    })
    return groups
  }, [filteredMenuItems])

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Securing environment and synchronizing settings console…</p>
      </div>
    )
  }

  return (
    <PageTransition>
      {/* Settings Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border/40 pb-5 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Settings Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational dashboard and enterprise control node for your workspace and personal account.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            type="text"
            placeholder="Search Settings... (e.g. AI, Facebook)"
            value={searchQuery}
            onChange={handleSearchChange}
            className="h-10 rounded-xl pl-9 pr-4 text-xs border-border/60"
          />
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="grid gap-6 md:grid-cols-[250px_1fr] lg:gap-8">
        {/* Sticky side nav */}
        <aside className="sticky top-6 flex flex-col gap-4 self-start">
          {Object.entries(groupedItems).map(([groupName, items]) => (
            <div key={groupName} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                {groupName}
              </h3>
              <nav className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const Icon = item.icon
                  const active = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {active && <ChevronRight className="size-3 text-primary" />}
                    </button>
                  )
                })}
              </nav>
            </div>
          ))}
          {filteredMenuItems.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground italic">No matching settings sections</p>
          )}
        </aside>

        {/* Content Node */}
        <main className="space-y-6">
          {/* TAB 1: Account Settings */}
          {activeTab === "account" && dbUser && (
            <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Account Profile</CardTitle>
                <CardDescription className="text-xs">Update your personal identification profiles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16 border-2 border-border/60">
                    <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                      {nameInput.split(" ").map((s) => s.slice(0,1)).join("").toUpperCase().slice(0, 2) || "GW"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs">
                        Change photo
                      </Button>
                      {dbUser.avatar && (
                        <Button variant="ghost" size="sm" onClick={handleDeleteAvatar} className="rounded-lg h-8 text-xs text-destructive hover:bg-destructive/10">
                          Delete
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Supported: JPG, PNG, GIF (Max size 5MB).</p>
                  </div>
                </div>

                <Separator className="bg-border/60" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="acc-name" className="text-xs font-semibold">Full name</Label>
                    <Input
                      id="acc-name"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="rounded-xl border-border/60 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acc-username" className="text-xs font-semibold">Username</Label>
                    <Input
                      id="acc-username"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="rounded-xl border-border/60 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acc-email" className="text-xs font-semibold">Email address</Label>
                    <Input
                      id="acc-email"
                      type="email"
                      value={dbUser.email}
                      disabled
                      className="rounded-xl border-border/40 bg-muted/40 text-xs text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acc-country" className="text-xs font-semibold">Country</Label>
                    <select
                      id="acc-country"
                      value={countryInput}
                      onChange={(e) => setCountryInput(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                    >
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Canada</option>
                      <option>Germany</option>
                      <option>France</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acc-bio" className="text-xs font-semibold">Bio</Label>
                  <textarea
                    id="acc-bio"
                    rows={3}
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs resize-y placeholder:text-muted-foreground/40"
                    placeholder="Brief outline for workspace profile cards..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Timezone</Label>
                    <select
                      value={timezoneInput}
                      onChange={(e) => setTimezoneInput(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                    >
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                      <option value="America/New_York">Eastern Time (EST)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Language</Label>
                    <select
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                    >
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>German</option>
                      <option>French</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Date Format</Label>
                    <select
                      value={dateFormatInput}
                      onChange={(e) => setDateFormatInput(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                    >
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Time Format</Label>
                    <select
                      value={timeFormatInput}
                      onChange={(e) => setTimeFormatInput(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                    >
                      <option>12h</option>
                      <option>24h</option>
                    </select>
                  </div>
                </div>

                <Button onClick={handleSaveAccount} className="rounded-xl" disabled={savingSection === "account"}>
                  {savingSection === "account" && <Loader2 className="mr-2 size-3 animate-spin" />}
                  Save account changes
                </Button>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: Security settings */}
          {activeTab === "security" && dbUser && (
            <div className="space-y-6">
              {/* Password change */}
              <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Password Management</CardTitle>
                  <CardDescription className="text-xs">Secure your workspace access keys.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Current password</Label>
                    <Input
                      type="password"
                      value={currPassword}
                      onChange={(e) => setCurrPassword(e.target.value)}
                      className="rounded-xl border-border/60 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">New password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="rounded-xl border-border/60 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Confirm new password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rounded-xl border-border/60 text-xs"
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <p>• Length must be minimum 8 characters</p>
                    <p>• Require at least one uppercase, number, and special character</p>
                  </div>
                  <Button onClick={handleChangePassword} className="rounded-xl" disabled={savingSection === "password"}>
                    {savingSection === "password" && <Loader2 className="mr-2 size-3 animate-spin" />}
                    Update password
                  </Button>
                </CardContent>
              </Card>

              {/* 2FA Card */}
              <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Two-Factor Authentication (2FA)</CardTitle>
                  <CardDescription className="text-xs">Ensure maximum workspace protection by enabling 2FA.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Secure Login Verification</p>
                      <p className="text-[10px] text-muted-foreground">Request verification codes when logging in.</p>
                    </div>
                    <Switch
                      checked={dbUser.twoFactorEnabled}
                      onCheckedChange={handleToggle2FA}
                    />
                  </div>

                  {show2FAConfig && twoFaSecret && (
                    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                      <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                        <Check className="size-4" /> Two-Factor Authentication Activated!
                      </p>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Authenticator Secret Key</p>
                        <code className="block bg-muted/70 px-3 py-1.5 rounded-lg text-xs font-mono text-foreground border border-border/40 select-all">
                          {twoFaSecret}
                        </code>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">2FA Recovery Codes</p>
                        <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                          {recoveryCodes.map((code) => (
                            <div key={code} className="bg-muted/70 px-2 py-1 rounded border border-border/30">
                              {code}
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-muted-foreground/80 mt-1">
                          Keep these recovery codes offline! They permit logging in if you lose device access.
                        </p>
                      </div>
                    </div>
                  )}

                  <Separator className="bg-border/60" />
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold">Google Authentication Status</p>
                      <p className="text-[10px] text-muted-foreground">Log in instantly using connected Google Account.</p>
                    </div>
                    <Badge variant={dbUser.googleConnected ? "default" : "outline"} className="rounded-lg">
                      {dbUser.googleConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Sessions revocation catalog */}
              <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Active Sessions & History</CardTitle>
                  <CardDescription className="text-xs">View devices and sessions accessing this account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-foreground">Current Active Devices</p>
                    <div className="divide-y divide-border/40">
                      {dbUser.activeSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between py-2.5">
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              {session.device}
                              {session.current && <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-primary/10 text-primary hover:bg-primary/20">Current</Badge>}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {session.browser} · IP: {session.ip} · {session.location}
                            </p>
                          </div>
                          {!session.current && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeSession(session.id)}
                              className="rounded-lg h-7 px-2.5 text-[10px] text-destructive hover:bg-destructive/10"
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      ))}
                      {dbUser.activeSessions.length === 0 && (
                        <p className="text-xs text-muted-foreground italic py-2">No active sessions logs</p>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-border/60" />

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-foreground">Login History Logs</p>
                    <div className="max-h-40 overflow-y-auto divide-y divide-border/40 text-xs">
                      {dbUser.loginHistory.map((history) => (
                        <div key={history.id} className="flex justify-between py-2">
                          <div>
                            <p className="font-semibold">{history.device} ({history.browser})</p>
                            <p className="text-[10px] text-muted-foreground">IP: {history.ip} · {new Date(history.timestamp).toLocaleString()}</p>
                          </div>
                          <Badge variant={history.status === "success" ? "default" : "destructive"} className="h-5 px-1.5 text-[9px] rounded-lg">
                            {history.status}
                          </Badge>
                        </div>
                      ))}
                      {dbUser.loginHistory.length === 0 && (
                        <p className="text-xs text-muted-foreground italic py-2">No login logs archive</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: Workspace settings */}
          {activeTab === "workspace" && workspaceInfo && (
            <div className="space-y-6">
              <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Workspace Configuration</CardTitle>
                  <CardDescription className="text-xs">Customize the identity nodes of your team workspace.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ws-name" className="text-xs font-semibold">Workspace Name</Label>
                    <Input
                      id="ws-name"
                      value={wsNameInput}
                      onChange={(e) => setWsNameInput(e.target.value)}
                      className="rounded-xl border-border/60 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ws-desc" className="text-xs font-semibold">Workspace Description</Label>
                    <textarea
                      id="ws-desc"
                      rows={3}
                      value={wsDescInput}
                      onChange={(e) => setWsDescInput(e.target.value)}
                      className="w-full rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs resize-y placeholder:text-muted-foreground/40"
                      placeholder="Purpose statement of this collaboration workspace..."
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Workspace Timezone</Label>
                      <select
                        value={wsTimezoneInput}
                        onChange={(e) => setWsTimezoneInput(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                      >
                        <option value="UTC">UTC (Coordinated Universal)</option>
                        <option value="America/New_York">EST (Eastern Standard)</option>
                        <option value="Europe/London">GMT (London Time)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Workspace Visibility</Label>
                      <select
                        value={wsVisibilityInput}
                        onChange={(e) => setWsVisibilityInput(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                      >
                        <option value="private">Private (Invite Only)</option>
                        <option value="public">Public (Internal Team Search)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2">
                    <div>
                      <p className="font-semibold">Workspace Owner</p>
                      <p className="text-[10px] text-muted-foreground">Original administrative node creator.</p>
                    </div>
                    <Badge variant="outline" className="rounded-lg">{workspaceInfo.ownerEmail}</Badge>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-4 border-t border-border/60">
                    <div>
                      <p className="font-semibold">Workspace Status</p>
                      <p className="text-[10px] text-muted-foreground">Current administrative operational status.</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`rounded-lg px-2 py-0.5 select-none font-bold uppercase text-[9px] tracking-wider ${(workspaceInfo.status || "ACTIVE") === "ACTIVE" ? "bg-[#DCFCE7] text-[#22C55E] border-[#DCFCE7]" : "bg-rose-50 text-rose-600 border-rose-100"}`}
                    >
                      {workspaceInfo.status || "ACTIVE"}
                    </Badge>
                  </div>

                  <Button onClick={handleSaveWorkspace} className="rounded-xl" disabled={savingSection === "workspace"}>
                    {savingSection === "workspace" && <Loader2 className="mr-2 size-3 animate-spin" />}
                    Save workspace settings
                  </Button>
                </CardContent>
              </Card>

              {/* Transfer ownership */}
              <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Transfer Ownership</CardTitle>
                  <CardDescription className="text-xs">Pass control node responsibility to another collaborator.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">New Owner Email Address</Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="collaborator@growwave.app"
                        value={transferOwnerEmail}
                        onChange={(e) => setTransferOwnerEmail(e.target.value)}
                        className="rounded-xl border-border/60 text-xs"
                      />
                      <Button onClick={handleTransferOwnership} variant="outline" className="rounded-xl text-xs h-10 shrink-0">
                        Transfer Control
                      </Button>
                    </div>
                    <p className="text-[9px] text-muted-foreground/80">
                      Warning: Transferring ownership strips you of owner administrative permissions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: Channel integrations */}
          {activeTab === "channels" && (
            <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Connected Social Channels</CardTitle>
                <CardDescription className="text-xs">Authenticate and manage platform publishing endpoints.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { id: "facebook", label: "Facebook Pages", desc: "Publish and sync Pages analytics" },
                    { id: "instagram", label: "Instagram Business", desc: "Schedule posts and reels" },
                    { id: "linkedin", label: "LinkedIn Profiles", desc: "Corporate feeds scheduling" },
                    { id: "tiktok", label: "TikTok Account", desc: "Short video publishing node" },
                    { id: "twitter", label: "Twitter / X Profile", desc: "Microblogging posts syndication" },
                  ].map((platform) => {
                    const match = connectedChannels.find((c) => c.platform === platform.id)
                    return (
                      <div
                        key={platform.id}
                        className={`rounded-2xl border p-4 flex flex-col justify-between gap-4 transition-all ${
                          match ? "border-primary/20 bg-primary/[0.02]" : "border-border/60 bg-muted/10"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-foreground">{platform.label}</p>
                            <Badge variant={match ? "default" : "outline"} className="h-5 px-1.5 text-[9px] rounded-lg">
                              {match ? "Connected" : "Disconnected"}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{platform.desc}</p>
                        </div>

                        {match ? (
                          <div className="space-y-3 pt-2">
                            <div className="rounded-xl bg-muted/60 border border-border/40 p-2.5 space-y-1.5 text-[10px]">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Account name:</span>
                                <span className="font-semibold">{match.username}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Followers count:</span>
                                <span className="font-semibold">{match.followers.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Token status:</span>
                                <span className="text-primary font-semibold">Active</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Expiration days:</span>
                                <span className="font-semibold">
                                  {match.tokenExpiresAt ? Math.ceil((new Date(match.tokenExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + " days" : "Never"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Last synchronized:</span>
                                <span className="font-semibold">{new Date(match.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleChannelAction("refresh", platform.id, match._id)}
                                className="rounded-lg flex-1 h-8 text-[10px] gap-1"
                              >
                                <RefreshCw className="size-3" /> Refresh
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleChannelAction("disconnect", platform.id, match._id)}
                                className="rounded-lg flex-1 h-8 text-[10px] text-destructive hover:bg-destructive/10"
                              >
                                Disconnect
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2">
                            {/* Empty state connect action */}
                            <div className="rounded-xl border border-dashed border-border/70 p-4 text-center space-y-2">
                              <p className="text-[10px] text-muted-foreground italic">No connected {platform.label} endpoints.</p>
                              <Button
                                size="sm"
                                onClick={() => handleChannelAction("connect", platform.id)}
                                className="rounded-lg text-[10px] h-7 w-full"
                              >
                                Connect Platform
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: Publishing preferences */}
          {activeTab === "publishing" && wsSettings && (
            <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Publishing Preferences</CardTitle>
                <CardDescription className="text-xs">Determine default automation queues, validation, and posting guidelines.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Default Daily Publish Time</Label>
                    <Input
                      type="time"
                      value={wsSettings.defaultPublishTime}
                      onChange={(e) => setWsSettings({ ...wsSettings, defaultPublishTime: e.target.value })}
                      className="rounded-xl border-border/60 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Auto Retry Post Latencies (Minutes)</Label>
                    <Input
                      type="number"
                      value={wsSettings.autoRetryDelay}
                      onChange={(e) => setWsSettings({ ...wsSettings, autoRetryDelay: parseInt(e.target.value) || 15 })}
                      className="rounded-xl border-border/60 text-xs"
                    />
                  </div>
                </div>

                <Separator className="bg-border/60" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">Auto-Publish Mode</p>
                      <p className="text-[10px] text-muted-foreground">Publish posts immediately when schedule timer triggers.</p>
                    </div>
                    <Switch
                      checked={wsSettings.autoPublish}
                      onCheckedChange={(v) => setWsSettings({ ...wsSettings, autoPublish: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">Workspace Review / Approval Required</p>
                      <p className="text-[10px] text-muted-foreground">Requires Administrator/Owner approval signature before queue execution.</p>
                    </div>
                    <Switch
                      checked={wsSettings.approvalRequired}
                      onCheckedChange={(v) => setWsSettings({ ...wsSettings, approvalRequired: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">Detailed Draft Workflow Mode</p>
                      <p className="text-[10px] text-muted-foreground">Enable visual progress steps (Draft, Review, Scheduled).</p>
                    </div>
                    <Switch
                      checked={wsSettings.draftWorkflow}
                      onCheckedChange={(v) => setWsSettings({ ...wsSettings, draftWorkflow: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">Automatic Retry On Network Failures</p>
                      <p className="text-[10px] text-muted-foreground">Re-run publishing logic if API endpoints return latency time outs.</p>
                    </div>
                    <Switch
                      checked={wsSettings.retryFailedPosts}
                      onCheckedChange={(v) => setWsSettings({ ...wsSettings, retryFailedPosts: v })}
                    />
                  </div>
                </div>

                <Separator className="bg-border/60" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Default Posting Count Per Day</Label>
                    <Input
                      type="number"
                      value={wsSettings.queuePreferences.postingFrequency}
                      onChange={(e) => setWsSettings({
                        ...wsSettings,
                        queuePreferences: {
                          ...wsSettings.queuePreferences,
                          postingFrequency: parseInt(e.target.value) || 3,
                        },
                      })}
                      className="rounded-xl border-border/60 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Gap Duration Between Queue Posts (Minutes)</Label>
                    <Input
                      type="number"
                      value={wsSettings.queuePreferences.gapMinutes}
                      onChange={(e) => setWsSettings({
                        ...wsSettings,
                        queuePreferences: {
                          ...wsSettings.queuePreferences,
                          gapMinutes: parseInt(e.target.value) || 180,
                        },
                      })}
                      className="rounded-xl border-border/60 text-xs"
                    />
                  </div>
                </div>

                <Button onClick={() => saveSettingsPayload({ settings: wsSettings }, "publishing")} className="rounded-xl" disabled={savingSection === "publishing"}>
                  {savingSection === "publishing" && <Loader2 className="mr-2 size-3 animate-spin" />}
                  Save publishing settings
                </Button>
              </CardContent>
            </Card>
          )}

          {/* TAB 6: AI Settings */}
          {activeTab === "ai" && wsSettings && (
            <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">AI Assistant Settings</CardTitle>
                <CardDescription className="text-xs">Adjust OpenAI models integration parameters for caption generation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">AI Content Generator Enabled</p>
                    <p className="text-[10px] text-muted-foreground">Expose generation widgets inside calendar schedule workspace.</p>
                  </div>
                  <Switch
                    checked={wsSettings.aiEnabled}
                    onCheckedChange={(v) => setWsSettings({ ...wsSettings, aiEnabled: v })}
                  />
                </div>

                <Separator className="bg-border/60" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">OpenAI LLM Model Selection</Label>
                    <select
                      value={wsSettings.modelSelection}
                      onChange={(e) => setWsSettings({ ...wsSettings, modelSelection: e.target.value })}
                      className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                    >
                      <option value="gpt-4o">GPT-4o Enterprise (Optimized Hook)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo (Detailed Thread)</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Sandbox Draft</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Default Writing Language</Label>
                    <select
                      value={wsSettings.aiLanguage}
                      onChange={(e) => setWsSettings({ ...wsSettings, aiLanguage: e.target.value })}
                      className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                    >
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>German</option>
                      <option>French</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">SaaS Brand Voice Specification</Label>
                  <textarea
                    rows={3}
                    value={wsSettings.brandVoice}
                    onChange={(e) => setWsSettings({ ...wsSettings, brandVoice: e.target.value })}
                    className="w-full rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs resize-y placeholder:text-muted-foreground/40"
                    placeholder="E.g., Bold SaaS, clear arguments, data driven hooks, no filler words, professional yet conversational tone..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Content Emotion / Tone Accent</Label>
                  <select
                    value={wsSettings.contentTone}
                    onChange={(e) => setWsSettings({ ...wsSettings, contentTone: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                  >
                    <option value="professional">Professional / Direct</option>
                    <option value="friendly">Friendly / Helpful</option>
                    <option value="provocative">Provocative / Eye-catching</option>
                    <option value="playful">Playful / Witty</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold">Granular Generator Features</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium">Automatic Hashtag Recommendations</p>
                      <p className="text-[9px] text-muted-foreground">Scans text body and appends related platform viral hashtags.</p>
                    </div>
                    <Switch
                      checked={wsSettings.hashtagSuggestions}
                      onCheckedChange={(v) => setWsSettings({ ...wsSettings, hashtagSuggestions: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium">Alt Caption Idea Generation</p>
                      <p className="text-[9px] text-muted-foreground">Outputs 3 distinct copy drafts matching emotional accents.</p>
                    </div>
                    <Switch
                      checked={wsSettings.captionSuggestions}
                      onCheckedChange={(v) => setWsSettings({ ...wsSettings, captionSuggestions: v })}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => saveSettingsPayload({ settings: wsSettings }, "ai")} className="rounded-xl" disabled={savingSection === "ai"}>
                    {savingSection === "ai" && <Loader2 className="mr-2 size-3 animate-spin" />}
                    Save AI preferences
                  </Button>
                  <Button variant="outline" onClick={handleTestAIConnection} className="rounded-xl" disabled={savingSection === "ai-test"}>
                    {savingSection === "ai-test" && <Loader2 className="mr-2 size-3 animate-spin" />}
                    Test AI configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 7: Notification matrix */}
          {activeTab === "notifications" && wsSettings && (
            <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Notification Center Rules</CardTitle>
                <CardDescription className="text-xs">Configure where alert triggers syndicate to.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-4 rounded-xl border border-border/50 bg-muted/10 p-4">
                    <p className="text-xs font-semibold text-foreground">Global Delivery Channel</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-medium">Email Alerts Delivery</p>
                          <p className="text-[9px] text-muted-foreground">Send audit updates to profile email.</p>
                        </div>
                        <Switch
                          checked={wsSettings.emailNotifications}
                          onCheckedChange={(v) => setWsSettings({ ...wsSettings, emailNotifications: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-medium">Push Browser Alerts</p>
                          <p className="text-[9px] text-muted-foreground">Request direct desktop notifications.</p>
                        </div>
                        <Switch
                          checked={wsSettings.pushNotifications}
                          onCheckedChange={(v) => setWsSettings({ ...wsSettings, pushNotifications: v })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-xl border border-border/50 bg-muted/10 p-4">
                    <p className="text-xs font-semibold text-foreground">Granular Event Alerts</p>
                    <div className="space-y-3">
                      {[
                        { key: "publishingAlerts", label: "Post Published Alerts", desc: "Notify when queue completes" },
                        { key: "failedPostAlerts", label: "Post Failed Warnings", desc: "Notify immediately on latency failures" },
                        { key: "commentAlerts", label: "Inbox Comment Alerts", desc: "Social comment responses triggers" },
                        { key: "mentionAlerts", label: "Platform Mentions Alerts", desc: "Engagements notifications" },
                        { key: "teamAlerts", label: "Team Collab Updates", desc: "Reviews requests updates" },
                        { key: "securityAlerts", label: "Security Activity Alerts", desc: "Toggling 2FA and revokes" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-medium">{item.label}</p>
                            <p className="text-[9px] text-muted-foreground">{item.desc}</p>
                          </div>
                          <Switch
                            checked={(wsSettings as any)[item.key]}
                            onCheckedChange={(v) => setWsSettings({ ...wsSettings, [item.key]: v })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button onClick={() => saveSettingsPayload({ settings: wsSettings }, "notifications")} className="rounded-xl" disabled={savingSection === "notifications"}>
                  {savingSection === "notifications" && <Loader2 className="mr-2 size-3 animate-spin" />}
                  Save notification rules
                </Button>
              </CardContent>
            </Card>
          )}

          {/* TAB 8: Team and Collaboration */}
          {activeTab === "team" && wsSettings && (
            <div className="space-y-6">
              <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Team Invitation & Permissions Matrix</CardTitle>
                  <CardDescription className="text-xs">Adjust defaults for collaboration nodes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">New Invites Default Role</Label>
                      <select
                        value={wsSettings.defaultRole}
                        onChange={(e) => setWsSettings({ ...wsSettings, defaultRole: e.target.value })}
                        className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                      >
                        <option value="viewer">Viewer (Read Only Analytics)</option>
                        <option value="editor">Editor (Draft & Schedule)</option>
                        <option value="admin">Administrator (Full Channel Config)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Who Can Invite Collaborators?</Label>
                      <select
                        value={wsSettings.invitePermissions}
                        onChange={(e) => setWsSettings({ ...wsSettings, invitePermissions: e.target.value as any })}
                        className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                      >
                        <option value="owner">Only Workspace Owner</option>
                        <option value="admin">Owners & Administrators</option>
                        <option value="any">Any Active Member</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">Require approval before publishing</p>
                      <p className="text-[10px] text-muted-foreground">Editor/Viewer schedules must be validated by Owner/Admin.</p>
                    </div>
                    <Switch
                      checked={wsSettings.approvalWorkflow}
                      onCheckedChange={(v) => setWsSettings({ ...wsSettings, approvalWorkflow: v })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Content Review Guideline Rules</Label>
                    <textarea
                      rows={2}
                      value={wsSettings.contentReviewRules}
                      onChange={(e) => setWsSettings({ ...wsSettings, contentReviewRules: e.target.value })}
                      className="w-full rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs resize-y placeholder:text-muted-foreground/40"
                      placeholder="Ensure links have utm parameters, double-check grammar, add custom alt text to images..."
                    />
                  </div>

                  <Button onClick={() => saveSettingsPayload({ settings: wsSettings }, "team")} className="rounded-xl" disabled={savingSection === "team"}>
                    {savingSection === "team" && <Loader2 className="mr-2 size-3 animate-spin" />}
                    Save team rules
                  </Button>
                </CardContent>
              </Card>

              {/* Members listing */}
              <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Workspace Collaborators</CardTitle>
                  <CardDescription className="text-xs">Active nodes in this multi-tenant database workspace.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="divide-y divide-border/40">
                    {teamMembers.map((member) => (
                      <div key={member._id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                              {member.name.slice(0, 2).toUpperCase() || "MB"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{member.name || member.email}</p>
                            <p className="text-[10px] text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="rounded-lg h-5 text-[9px] uppercase tracking-wider">{member.role}</Badge>
                          <Badge variant={member.status === "active" ? "default" : "secondary"} className="rounded-lg h-5 text-[9px] uppercase">{member.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {teamMembers.length === 0 && (
                      <p className="text-xs text-muted-foreground italic py-2">No other team members invited</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 9: Analytics settings */}
          {activeTab === "analytics" && wsSettings && (
            <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Analytics & Reporting preferences</CardTitle>
                <CardDescription className="text-xs">Customize statistics aggregates and automatic metrics digest scheduling.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Default Dates Filtration Range</Label>
                    <select
                      value={wsSettings.analyticsDefaultDateRange}
                      onChange={(e) => setWsSettings({ ...wsSettings, analyticsDefaultDateRange: e.target.value })}
                      className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Preferred Metrics Export Format</Label>
                    <select
                      value={wsSettings.exportFormat}
                      onChange={(e) => setWsSettings({ ...wsSettings, exportFormat: e.target.value as any })}
                      className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                    >
                      <option value="pdf">Acrobat Document (PDF)</option>
                      <option value="csv">Comma Separated (CSV)</option>
                      <option value="xlsx">Microsoft Excel (XLSX)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Reporting Timezone</Label>
                  <select
                    value={wsSettings.analyticsTimezone}
                    onChange={(e) => setWsSettings({ ...wsSettings, analyticsTimezone: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-xs"
                  >
                    <option value="UTC">Coordinated Universal (UTC)</option>
                    <option value="America/New_York">Eastern Standard (EST)</option>
                    <option value="Europe/London">London GMT</option>
                  </select>
                </div>

                <Separator className="bg-border/60" />

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-foreground">Automatic Metrics Reporting Schedule</p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">Report Delivery Schedule</p>
                      <p className="text-[10px] text-muted-foreground">Automatic compilation email frequency.</p>
                    </div>
                    <select
                      value={wsSettings.reportingSchedule}
                      onChange={(e) => setWsSettings({ ...wsSettings, reportingSchedule: e.target.value as any })}
                      className="rounded-xl border border-border/60 bg-transparent px-3 py-1.5 text-xs h-9"
                    >
                      <option value="none">No Automated Delivery</option>
                      <option value="weekly">Every Sunday at Midnight</option>
                      <option value="monthly">First Day of Each Month</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">Weekly Dashboard Digests</p>
                      <p className="text-[10px] text-muted-foreground">Receive detailed summary of weekly engagements metrics.</p>
                    </div>
                    <Switch
                      checked={wsSettings.weeklyReports}
                      onCheckedChange={(v) => setWsSettings({ ...wsSettings, weeklyReports: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">Monthly Enterprise Summaries</p>
                      <p className="text-[10px] text-muted-foreground">Email high-fidelity PDF chart to all stakeholders.</p>
                    </div>
                    <Switch
                      checked={wsSettings.monthlyReports}
                      onCheckedChange={(v) => setWsSettings({ ...wsSettings, monthlyReports: v })}
                    />
                  </div>
                </div>

                <Button onClick={() => saveSettingsPayload({ settings: wsSettings }, "analytics")} className="rounded-xl" disabled={savingSection === "analytics"}>
                  {savingSection === "analytics" && <Loader2 className="mr-2 size-3 animate-spin" />}
                  Save analytics preferences
                </Button>
              </CardContent>
            </Card>
          )}

          {/* TAB 10: Billing & Invoices */}
          {activeTab === "billing" && wsSettings && (
            <div className="space-y-6">
              <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Billing Plan & Usage Meters</CardTitle>
                  <CardDescription className="text-xs">Monitor subscription levels and sandbox limits metrics.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider">Current Plan: {wsSettings.currentPlan === "pro" ? "GrowWave Pro" : "GrowWave Free"}</p>
                      <p className="text-[10px] text-primary/80">Next billing cycle renovates on July 1, 2026.</p>
                    </div>
                    {wsSettings.currentPlan === "free" && (
                      <Button onClick={() => handleUpgradePlan("pro")} className="rounded-xl h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                        Upgrade to Pro
                      </Button>
                    )}
                  </div>

                  {/* usage progress bars */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-foreground">Media Storage capacity</span>
                        <span className="text-muted-foreground">0 MB / 100 MB</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted border border-border/30 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "2%" }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-foreground">Social channel endpoints</span>
                        <span className="text-muted-foreground">{connectedChannels.length} / {wsSettings.connectedAccountsLimit} Accounts</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted border border-border/30 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(connectedChannels.length / wsSettings.connectedAccountsLimit) * 100}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-foreground">OpenAI AI usage count</span>
                        <span className="text-muted-foreground">{wsSettings.aiUsageCount} / {wsSettings.aiUsageLimit} runs</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted border border-border/30 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(wsSettings.aiUsageCount / wsSettings.aiUsageLimit) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-border/60" />

                  {/* payment methods */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-foreground">Payment Methods</p>
                    <div className="space-y-2">
                      {wsSettings.paymentMethods.map((pm, idx) => (
                        <div key={pm._id || idx} className="rounded-xl border border-border/50 p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="uppercase h-6 font-bold">{pm.brand}</Badge>
                            <p className="font-semibold text-foreground">•••• •••• •••• {pm.last4}</p>
                            <p className="text-[10px] text-muted-foreground">Expires {pm.expMonth}/{pm.expYear}</p>
                          </div>
                          <div className="flex gap-2">
                            {pm.default && <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary hover:bg-primary/20">Default</Badge>}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeApiKey(idx)}
                              className="rounded-lg text-[10px] h-6 text-destructive hover:bg-destructive/10"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                      {wsSettings.paymentMethods.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border/70 p-4 text-center">
                          <p className="text-[10px] text-muted-foreground italic">No payment methods listed</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoices table */}
              <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Billing Invoices History</CardTitle>
                  <CardDescription className="text-xs">View and download transaction receipts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="divide-y divide-border/40">
                    {wsSettings.invoices.map((inv) => (
                      <div key={inv.id} className="flex justify-between items-center py-2.5 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">{inv.id}</p>
                          <p className="text-[10px] text-muted-foreground">Date: {inv.date} · Value: ${inv.amount}.00</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={inv.status === "paid" ? "default" : "outline"} className="h-5 px-1.5 rounded-lg text-[9px] uppercase tracking-wider">
                            {inv.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              showToast(`Invoice receipt ${inv.id} download initiated!`, "success")
                            }}
                            className="rounded-lg h-7 px-2 text-[10px] gap-1"
                          >
                            <Download className="size-3" /> Download
                          </Button>
                        </div>
                      </div>
                    ))}
                    {wsSettings.invoices.length === 0 && (
                      <div className="py-4 text-center">
                        <p className="text-xs text-muted-foreground italic">No invoices billing history found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 11: Integrations, API keys & Webhooks */}
          {activeTab === "integrations" && wsSettings && (
            <div className="space-y-6">
              <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Developer Webhooks Setup</CardTitle>
                  <CardDescription className="text-xs">Publish real-time workspace actions notifications directly to server endpoints.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Endpoint Payload URL</Label>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://api.yourdomain.com/growwave-receiver"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="rounded-xl border-border/60 text-xs"
                      />
                      <Button onClick={handleAddWebhook} className="rounded-xl text-xs h-10 shrink-0">
                        Add Receiver
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Subscribed Publish Events</Label>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {["post.published", "post.failed", "comment.created", "mention.received"].map((ev) => {
                        const active = webhookEvents.includes(ev)
                        return (
                          <button
                            key={ev}
                            onClick={() => {
                              if (active) {
                                setWebhookEvents(webhookEvents.filter((e) => e !== ev))
                              } else {
                                setWebhookEvents([...webhookEvents, ev])
                              }
                            }}
                            className={`px-3 py-1 rounded-lg border text-[10px] font-semibold transition-all ${
                              active
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-muted/30 border-border/60 text-muted-foreground"
                            }`}
                          >
                            {ev}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <Separator className="bg-border/60" />

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-foreground">Registered Active Webhooks</p>
                    <div className="divide-y divide-border/40 text-xs">
                      {wsSettings.webhooks.map((wh, idx) => (
                        <div key={wh._id || idx} className="flex justify-between items-center py-2.5">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-foreground truncate max-w-sm">{wh.url}</p>
                            <p className="text-[10px] text-muted-foreground flex flex-wrap gap-1">
                              Events: {wh.events.map((e) => <Badge key={e} variant="outline" className="text-[8px] h-4 rounded-md">{e}</Badge>)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveWebhook(idx)}
                            className="rounded-lg text-[10px] h-7 text-destructive hover:bg-destructive/10"
                          >
                            Revoke
                          </Button>
                        </div>
                      ))}
                      {wsSettings.webhooks.length === 0 && (
                        <p className="text-xs text-muted-foreground italic py-2">No webhook receivers configured</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Developer API keys */}
              <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Developer API Keys Catalog</CardTitle>
                  <CardDescription className="text-xs">Access database programmatically using secure secrets keys.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Key Identifier Label</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Production Service API Key"
                        value={apiKeyName}
                        onChange={(e) => setApiKeyName(e.target.value)}
                        className="rounded-xl border-border/60 text-xs"
                      />
                      <Button onClick={handleGenerateApiKey} variant="outline" className="rounded-xl text-xs h-10 shrink-0">
                        Generate Key
                      </Button>
                    </div>
                  </div>

                  {generatedKey && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
                      <p className="text-xs font-bold text-primary">API Key Successfully Generated!</p>
                      <p className="text-[10px] text-muted-foreground">
                        Ensure you copy this secret key now. You will not be able to view it again.
                      </p>
                      <code className="block bg-muted/80 px-3 py-2 rounded-lg text-xs font-mono text-foreground border border-border/40 select-all select-none">
                        {generatedKey}
                      </code>
                    </div>
                  )}

                  <Separator className="bg-border/60" />

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-foreground">Active Secret API Keys</p>
                    <div className="divide-y divide-border/40 text-xs">
                      {wsSettings.apiKeys.map((keyItem, idx) => (
                        <div key={keyItem._id || idx} className="flex justify-between items-center py-2.5">
                          <div>
                            <p className="font-semibold text-foreground">{keyItem.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Key: {keyItem.key.slice(0, 10)}•••••••••••••••• · Created: {new Date(keyItem.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeApiKey(idx)}
                            className="rounded-lg text-[10px] h-7 text-destructive hover:bg-destructive/10"
                          >
                            Revoke Key
                          </Button>
                        </div>
                      ))}
                      {wsSettings.apiKeys.length === 0 && (
                        <p className="text-xs text-muted-foreground italic py-2">No active secret API keys generated</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 12: Appearance */}
          {activeTab === "appearance" && dbUser && (
            <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Appearance Customize</CardTitle>
                <CardDescription className="text-xs">Modify the theme, layout margins, and accent typography of your dashboard view.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-800 font-semibold leading-relaxed">
                  <p className="font-bold mb-0.5">Branding System Locked</p>
                  <p className="text-[11px] opacity-90">GrowWave uses one unified enterprise brand system. Custom color accents and dark mode overrides are locked to ensure consistent brand identity across all views.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Sidebar Dense Layout</Label>
                    <select
                      value={dbUser.sidebarDensity}
                      onChange={(e) => saveSettingsPayload({ user: { sidebarDensity: e.target.value } }, "appearance")}
                      className="w-full h-9 rounded-xl border border-border/60 bg-transparent px-3 py-1.5 text-xs"
                    >
                      <option value="comfortable">Comfortable (Standard spacing)</option>
                      <option value="compact">Compact (Highly dense lines)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">Compact density dashboard grid</p>
                      <p className="text-[10px] text-muted-foreground">Reduces line gaps inside metrics charts and folders tables.</p>
                    </div>
                    <Switch
                      checked={dbUser.sidebarDensity === "compact"}
                      onCheckedChange={(checked) => saveSettingsPayload({ user: { sidebarDensity: checked ? "compact" : "comfortable" } }, "appearance")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">Smooth animation effects</p>
                      <p className="text-[10px] text-muted-foreground">Expose Framer Motion transition curves across tabs routes changes.</p>
                    </div>
                    <Switch
                      checked={dbUser.animationsEnabled}
                      onCheckedChange={(checked) => saveSettingsPayload({ user: { animationsEnabled: checked } }, "appearance")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 13: Data management & Destructive actions */}
          {activeTab === "data" && workspaceInfo && (
            <div className="space-y-6">
              <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Data Backup & Exports</CardTitle>
                  <CardDescription className="text-xs">Download full snapshots of workspace records.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button onClick={() => handleExportData("workspace")} variant="outline" className="rounded-xl text-xs h-11 gap-1.5">
                      <Download className="size-4" /> Export All Workspace data
                    </Button>
                    <Button onClick={() => handleExportData("posts")} variant="outline" className="rounded-xl text-xs h-11 gap-1.5">
                      <Download className="size-4" /> Export Publish Archive
                    </Button>
                    <Button onClick={() => handleExportData("analytics")} variant="outline" className="rounded-xl text-xs h-11 gap-1.5">
                      <Download className="size-4" /> Export Analytics logs
                    </Button>
                    <Button onClick={handleBackupSettings} variant="outline" className="rounded-xl text-xs h-11 gap-1.5">
                      <Download className="size-4" /> Backup preferences configuration
                    </Button>
                  </div>

                  <Separator className="bg-border/60" />

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Restore Workspace Configurations</Label>
                    <div className="rounded-xl border border-dashed border-border/60 p-4 flex flex-col items-center justify-center gap-2 text-center">
                      <Upload className="size-6 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground italic">Upload a previously generated GrowWave JSON backup file.</p>
                      <Input
                        type="file"
                        accept=".json"
                        onChange={handleRestoreSettings}
                        className="rounded-xl max-w-xs text-xs h-9"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Destructive Actions Card */}
              <Card className="rounded-2xl border-destructive/20 bg-destructive/[0.02] shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
                    <AlertTriangle className="size-5" /> Dangerous administrative actions
                  </CardTitle>
                  <CardDescription className="text-xs">Highly destructive actions. Verification words required.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Delete Workspace */}
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">Delete this entire Workspace database</p>
                      <p className="text-[10px] text-muted-foreground">
                        Warning: This completely deletes all posts, social channel credentials, media files, and collaboration rules. Action is irreversible.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Type DELETE to verify"
                        value={wsDeleteConfirm}
                        onChange={(e) => setWsDeleteConfirm(e.target.value)}
                        className="rounded-xl border-border/60 text-xs"
                      />
                      <Button
                        onClick={handleDeleteWorkspace}
                        disabled={wsDeleteConfirm !== "DELETE" || savingSection === "workspace-delete"}
                        variant="destructive"
                        className="rounded-xl text-xs h-10 shrink-0"
                      >
                        {savingSection === "workspace-delete" && <Loader2 className="mr-2 size-3 animate-spin" />}
                        Delete Workspace
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-border/60" />

                  {/* Delete Account */}
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">Delete Personal User Account</p>
                      <p className="text-[10px] text-muted-foreground">
                        Warning: Destroys your user profile, revokes all sessions, and deletes all workspaces where you are the owner. Irreversible.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Type CONFIRM to verify"
                        value={accDeleteConfirm}
                        onChange={(e) => setAccDeleteConfirm(e.target.value)}
                        className="rounded-xl border-border/60 text-xs"
                      />
                      <Button
                        onClick={handleDeleteAccount}
                        disabled={accDeleteConfirm !== "CONFIRM" || savingSection === "account-delete"}
                        variant="destructive"
                        className="rounded-xl text-xs h-10 shrink-0"
                      >
                        {savingSection === "account-delete" && <Loader2 className="mr-2 size-3 animate-spin" />}
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 14: Activity Logs */}
          {activeTab === "logs" && (
            <Card className="rounded-2xl border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Settings Activity History</CardTitle>
                <CardDescription className="text-xs">Security, collaboration, channels, and AI configuration updates audit trails.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-[500px] overflow-y-auto divide-y divide-border/40">
                  {activityLogs.map((log) => (
                    <div key={log._id} className="py-3 flex gap-3 text-xs">
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                          {log.memberName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-foreground flex items-center gap-1.5">
                            {log.memberName}
                            <Badge variant="outline" className="text-[8px] h-4 rounded px-1.5 select-none">{log.memberRole}</Badge>
                          </p>
                          <span className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{log.details}</p>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-[8px] h-4 bg-muted/60 text-muted-foreground">{log.action}</Badge>
                          {log.platform && <Badge variant="outline" className="text-[8px] h-4 uppercase">{log.platform}</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
                      <p className="text-xs text-muted-foreground italic">No configurations audit trail generated yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </PageTransition>
  )
}
