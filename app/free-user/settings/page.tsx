"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  User,
  Lock,
  Link as LinkIcon,
  Bell,
  CreditCard,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Info,
  ShieldAlert,
  RefreshCw,
  Check,
  Loader2,
  Sun,
  Moon,
  Paintbrush
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { UpgradeModal } from "@/components/free-user/upgrade-modal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { IconFacebook } from "@/components/social-brand-icons"
import { useTheme } from "@/components/dashboard/theme-provider"
import { useToast } from "@/components/toast-provider"
import { GrowWaveModal } from "@/components/growwave-modal"


interface ChannelConnection {
  id: string
  name: string
  platform: string
  username: string
  connected: boolean
  followers: number
  locked: boolean
  status?: string
}

interface MetaPage {
  id: string
  name: string
  username: string
  category: string
  followers: number
  accessToken: string
  picture: string
}

function SettingsContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<string>("profile")

  // Profile Form
  const [profileName, setProfileName] = useState(session?.user?.name || "GrowWave Lite User")
  const [profileEmail, setProfileEmail] = useState(session?.user?.email || "user@growwave.com")
  const [profileBio, setProfileBio] = useState("Managing my social media workspace easily with GrowWave Lite.")

  // Channels state
  const [channels, setChannels] = useState<ChannelConnection[]>([
    { id: "c-fb", name: "Facebook Page", platform: "facebook", username: "", connected: false, followers: 0, locked: false }
  ])

  // Facebook pages modal states
  const [fbPagesModalOpen, setFbPagesModalOpen] = useState(false)
  const [fbPages, setFbPages] = useState<MetaPage[]>([])
  const [selectedFbPageId, setSelectedFbPageId] = useState<string>("")
  const [loadingFbPages, setLoadingFbPages] = useState(false)
  const [fbUserToken, setFbUserToken] = useState<string>("")

  // Notifications
  const [notifyPublishSuccess, setNotifyPublishSuccess] = useState(true)
  const [notifyPublishFailed, setNotifyPublishFailed] = useState(true)
  const [notifyWeeklySummary, setNotifyWeeklySummary] = useState(false)

  // Upgrade Modals
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"ai_quota" | "channels_limit" | "bulk_scheduling" | "analytics_pro" | "team_feature" | "inbox_feature" | "platform_locked" | "">("")

  // Delete modal confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  // Custom disconnect channel confirmation modal states
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false)
  const [disconnectTarget, setDisconnectTarget] = useState<ChannelConnection | null>(null)
  const [disconnectLoading, setDisconnectLoading] = useState(false)

  // Custom delete account simulation states
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false)
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false)


  // Fetch connected channels from MongoDB
  const fetchDBChannels = async () => {
    try {
      const res = await fetch("/api/accounts")
      const data = await res.json()
      if (res.ok && data.accounts) {
        const fbAccount = data.accounts.find((a: any) => a.platform === "facebook")
        setChannels(prev => prev.map(c => {
          if (c.platform === "facebook") {
            if (fbAccount) {
              return {
                ...c,
                connected: fbAccount.status === "connected",
                username: fbAccount.username || "Facebook Page",
                followers: fbAccount.followers || 0,
                status: fbAccount.status
              }
            } else {
              return {
                ...c,
                connected: false,
                username: "",
                followers: 0,
                status: ""
              }
            }
          }
          return c
        }))
      }
    } catch (err) {
      console.error("Failed to fetch channels from DB:", err)
    }
  }

  // Read tab parameter and OAuth triggers
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam) {
      setActiveTab(tabParam)
    }

    fetchDBChannels()

    // Handle URL parameters for page selection or error callbacks
    const selectFb = searchParams.get("select_facebook_page")
    const token = searchParams.get("token")
    const err = searchParams.get("error")

    if (selectFb === "true" && token) {
      setFbUserToken(token)
      setFbPagesModalOpen(true)
      loadFacebookPages(token)
      // Clean parameters from history URL while keeping tab
      window.history.replaceState({}, document.title, window.location.pathname + "?tab=accounts")
    } else if (err) {
      showToast(err || "Connection failed", "error")
      window.history.replaceState({}, document.title, window.location.pathname + "?tab=accounts")
    }
  }, [searchParams])

  const loadFacebookPages = async (token: string) => {
    setLoadingFbPages(true)
    try {
      const res = await fetch(`/api/accounts/facebook-pages?token=${token}`)
      const data = await res.json()
      if (res.ok) {
        setFbPages(data.pages || [])
        if (data.pages && data.pages.length > 0) {
          setSelectedFbPageId(data.pages[0].id)
        }
      } else {
        showToast(data.error || "Failed to load Facebook Pages", "error")
      }
    } catch {
      showToast("Failed to connect to Graph API", "error")
    } finally {
      setLoadingFbPages(false)
    }
  }

  const handleConnectFacebookPage = async () => {
    const selectedPage = fbPages.find((p) => p.id === selectedFbPageId)
    if (!selectedPage) {
      showToast("Please select a Facebook Page", "error")
      return
    }

    setLoadingFbPages(true)
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "facebook",
          accessToken: selectedPage.accessToken,
          username: selectedPage.name,
          platformAccountId: selectedPage.id,
          avatar: selectedPage.picture,
          followers: selectedPage.followers,
          engagement: parseFloat((Math.random() * 4 + 1.2).toFixed(1)),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        showToast("✓ Facebook Connected", "success")
        setFbPagesModalOpen(false)
        await fetchDBChannels()
      } else {
        showToast(data.error || "Failed to save selected page", "error")
      }
    } catch {
      showToast("Failed to connect page", "error")
    } finally {
      setLoadingFbPages(false)
    }
  }

  // Handle connection toggling
  const handleConnectChannel = (id: string, locked: boolean) => {
    if (locked) {
      setUpgradeReason("platform_locked")
      setUpgradeOpen(true)
      return
    }

    const target = channels.find(c => c.id === id)
    if (!target) return

    if (target.connected || target.status === "expired") {
      setDisconnectTarget(target)
      setDisconnectModalOpen(true)
    } else {
      // Connect: Redirect to server-side Facebook OAuth endpoint
      window.location.assign("/api/auth/facebook")
    }
  }

  const handleConfirmDisconnectChannel = async () => {
    if (!disconnectTarget) return
    setDisconnectLoading(true)
    try {
      const res = await fetch("/api/accounts")
      const data = await res.json()
      const dbAcc = data.accounts?.find((a: any) => a.platform === disconnectTarget.platform)
      if (dbAcc?._id) {
        const deleteRes = await fetch(`/api/accounts?id=${dbAcc._id}`, { method: "DELETE" })
        if (deleteRes.ok) {
          setChannels(prev => prev.map(c => c.platform === disconnectTarget.platform ? { ...c, connected: false, username: "", followers: 0, status: "" } : c))
          showToast("✓ Channel disconnected successfully", "success")
        } else {
          showToast("Failed to delete account channel", "error")
        }
      }
    } catch (err) {
      console.error("Error deleting account from DB:", err)
      showToast("Failed to disconnect page channel", "error")
    } finally {
      setDisconnectLoading(false)
      setDisconnectModalOpen(false)
      setDisconnectTarget(null)
    }
  }

  // Simulated Save profile details
  const handleSaveProfile = () => {
    showToast("✓ Profile settings saved successfully!", "success")
  }

  // Simulated Password update
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault()
    showToast("✓ Password updated successfully!", "success")
  }

  // Simulated Delete Account
  const handleDeleteAccount = () => {
    if (deleteConfirmText.toLowerCase() === "delete my account") {
      setDeleteAccountModalOpen(true)
    } else {
      showToast("Verification text mismatch. Please type exactly 'delete my account'.", "error")
    }
  }

  const handleConfirmDeleteAccount = async () => {
    setDeleteAccountLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulation delay
    setDeleteAccountLoading(false)
    setDeleteAccountModalOpen(false)
    showToast("✓ Workspace deleted successfully", "success")
    router.push("/")
  }


  // Render platform icons
  const renderPlatformIcon = (plat: string) => {
    if (plat === "facebook") {
      return <IconFacebook className="size-5 text-blue-600 shrink-0" />
    }
    return null
  }

  const menuItems = [
    { id: "profile", label: "Profile Settings", icon: User },
    { id: "password", label: "Change Password", icon: Lock },
    { id: "accounts", label: "Linked Channels", icon: LinkIcon },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
    { id: "delete", label: "Delete Account", icon: Trash2 },
  ]


  return (
    <div className="space-y-6">
      <div className="border-b border-[#EEF2F7] pb-3">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Settings Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Control your user profile, channels connections, billing details, and notification rules.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Settings Tabs Menu */}
        <div className="lg:col-span-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                  isActive
                    ? "bg-[#F0FDF4] text-[var(--brand-primary)] font-extrabold"
                    : "text-slate-500 hover:bg-[#F0FDF4]/50 hover:text-slate-800"
                }`}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? "text-emerald-600 dark:text-[var(--brand-primary)]" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="absolute right-3 size-1.5 rounded-full bg-[var(--brand-primary)]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Right Tab Content details */}
        <div className="lg:col-span-9">

          {/* PROFILE SETTINGS */}
          {activeTab === "profile" && (
            <Card className="rounded-2xl border-0 bg-white dark:bg-[#1F2937] shadow-card hover:shadow-card-hover transition-all">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-4 border-b border-border pb-4">
                  <div className="size-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    GW
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-950 block dark:text-white">User Logo</span>
                    <button className="text-[10px] font-black text-emerald-600 hover:underline uppercase tracking-wide mt-1">
                      Upload Picture
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Full Name</span>
                    <Input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="h-9 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Email Address</span>
                    <Input
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="h-9 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Bio description</span>
                  <Textarea
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    rows={4}
                    className="text-xs font-medium resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <Button
                    onClick={handleSaveProfile}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs px-5 rounded-lg uppercase tracking-wider shadow-sm"
                  >
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PASSWORD SETTINGS */}
          {activeTab === "password" && (
            <Card className="rounded-2xl border-0 bg-white dark:bg-[#1F2937] shadow-card hover:shadow-card-hover transition-all">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">Update Password</CardTitle>
              </CardHeader>
              <CardContent className="p-5 md:p-6">
                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Current Password</span>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      required
                      className="h-9 text-xs font-bold"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">New Password</span>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        required
                        className="h-9 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Confirm Password</span>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        required
                        className="h-9 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t">
                    <Button
                      type="submit"
                      className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs px-5 rounded-lg uppercase tracking-wider shadow-sm"
                    >
                      Save Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ACCOUNTS / CHANNEL LIMITS */}
          {activeTab === "accounts" && (
            <div className="space-y-6">
              <Card className="rounded-2xl border-0 bg-white dark:bg-[#1F2937] shadow-card hover:shadow-card-hover transition-all">
                <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">Linked Channels</CardTitle>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">Link or unlink Facebook Pages. Max 1 active account on Free Plan.</p>
                  </div>
                  <Badge variant="outline" className="text-[8px] font-bold uppercase border-slate-200">
                    {channels.filter(c => c.connected).length} / 1 Connected
                  </Badge>
                </CardHeader>
                <CardContent className="p-5">
                  {channels.map((chan) => {
                    const isConnected = chan.connected
                    const isExpired = chan.status === "expired"

                    return (
                      <div
                        key={chan.id}
                        className="rounded-2xl border p-4 flex flex-col justify-between gap-4 border-border/60 bg-muted/10"
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-blue-50 border dark:bg-slate-800 dark:border-slate-700">
                              {renderPlatformIcon(chan.platform)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-extrabold text-[#1F2937] dark:text-white">{chan.name}</span>
                                <Badge variant={isConnected ? "default" : "outline"} className="h-5 px-1.5 text-[9px] rounded-lg">
                                  {isConnected ? "Connected" : isExpired ? "Expired" : "Not Connected"}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-[#9CA3AF] font-semibold mt-0.5">
                                {isConnected
                                  ? `@${chan.username} • ${chan.followers.toLocaleString()} followers`
                                  : isExpired
                                  ? `@${chan.username} • Session Expired`
                                  : "Not Linked"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isConnected || isExpired ? (
                              <button
                                onClick={() => handleConnectChannel(chan.id, chan.locked)}
                                className="text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all border bg-slate-50 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-slate-500 cursor-pointer"
                              >
                                Disconnect
                              </button>
                            ) : (
                              <button
                                onClick={() => handleConnectChannel(chan.id, chan.locked)}
                                className="text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white border-transparent hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                              >
                                Connect Facebook Account
                              </button>
                            )}
                          </div>
                        </div>

                        {isConnected && (
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-750 dark:text-[var(--brand-primary)] font-semibold space-y-0.5">
                            <p className="font-extrabold">Facebook Connected</p>
                            <p className="text-[10px] opacity-90">Free Plan Limit Reached: Only 1 channel allowed.</p>
                          </div>
                        )}

                        {isExpired && (
                          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-[11px] text-rose-700 dark:text-rose-455 font-semibold space-y-1">
                            <p className="font-extrabold">Facebook Session Expired</p>
                            <p className="text-[10px] opacity-90">Please reconnect your Facebook Account to authorize publishing.</p>
                            <button
                              onClick={() => handleConnectChannel(chan.id, chan.locked)}
                              className="text-[9px] font-black uppercase text-rose-800 dark:text-rose-400 hover:underline block mt-1 text-left"
                            >
                              Reconnect Account
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Upgrade To Pro Card */}
              <Card className="rounded-2xl border-0 bg-[#F0FDF4] dark:bg-emerald-950/20 shadow-card hover:shadow-card-hover transition-all p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-purple-950 dark:text-purple-300">Upgrade to GrowWave Pro</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                      Link additional accounts and unlock publishing to premium platforms.
                    </p>
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      {["Instagram", "LinkedIn", "TikTok", "Twitter / X", "Unlimited Channels"].map((feat) => (
                        <Badge key={feat} variant="outline" className="text-[9px] font-bold border-purple-500/20 text-purple-700 dark:text-purple-400 dark:border-purple-900/30">
                          {feat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setUpgradeReason("channels_limit")
                      setUpgradeOpen(true)
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-5 rounded-lg uppercase tracking-wider shrink-0 self-start sm:self-auto"
                  >
                    Upgrade To Pro
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* NOTIFICATION SETTINGS */}
          {activeTab === "notifications" && (
            <Card className="rounded-2xl border-0 bg-white dark:bg-[#1F2937] shadow-card hover:shadow-card-hover transition-all">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="p-5 md:p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between border-b pb-3.5">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Publish Success Alerts
                      </span>
                      <p className="text-[10.5px] text-slate-455">
                        Receive email alerts immediately when scheduled posts go live successfully.
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifyPublishSuccess(!notifyPublishSuccess)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifyPublishSuccess ? "bg-[var(--brand-primary)]" : "bg-slate-250 dark:bg-slate-800"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifyPublishSuccess ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-start justify-between border-b pb-3.5">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Publish Failure Alerts
                      </span>
                      <p className="text-[10.5px] text-slate-455">
                        Receive high-priority email warnings if any scheduled posts fail to deliver.
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifyPublishFailed(!notifyPublishFailed)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifyPublishFailed ? "bg-[var(--brand-primary)]" : "bg-slate-250 dark:bg-slate-800"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifyPublishFailed ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-start justify-between pb-1.5">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Weekly Growth Summary
                      </span>
                      <p className="text-[10.5px] text-slate-455">
                        Receive a weekly email recap showing your organic reach and engagement stats.
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifyWeeklySummary(!notifyWeeklySummary)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifyWeeklySummary ? "bg-[var(--brand-primary)]" : "bg-slate-250 dark:bg-slate-800"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifyWeeklySummary ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* BILLING & PLAN DETAILS */}
          {activeTab === "billing" && (
            <Card className="rounded-xl border border-border bg-card shadow-sm dark:bg-[#1F2937] overflow-hidden">
              <CardHeader className="pb-3 border-b border-border bg-slate-50 dark:bg-slate-850/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">Billing & Plan status</CardTitle>
                    <p className="text-[11px] text-slate-500 mt-0.5">Review subscription limits and compare packages.</p>
                  </div>
                  <Badge className="bg-[var(--brand-primary)]/20 text-emerald-700 border border-emerald-500/20 text-[9px] uppercase font-black py-0.5 px-2 select-none">
                    GrowWave Lite
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 md:p-6 space-y-6">
                
                {/* Free plan metrics check */}
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="p-3 bg-background rounded-xl border border-slate-200 dark:bg-slate-850">
                    <span className="text-[9px] font-black text-[#6B7280] uppercase tracking-wider block">Connected Channels</span>
                    <span className="text-sm font-black text-[#1F2937] block mt-1 dark:text-white">
                      {channels.filter(c => c.connected).length} / 1
                    </span>
                    <Progress value={(channels.filter(c => c.connected).length / 1) * 100} className="h-1 bg-slate-200 mt-2" />
                  </div>
                  <div className="p-3 bg-background rounded-xl border border-slate-200 dark:bg-slate-850">
                    <span className="text-[9px] font-black text-[#6B7280] uppercase tracking-wider block">AI Requests</span>
                    <span className="text-sm font-black text-[#1F2937] block mt-1 dark:text-white">12 / 50</span>
                    <Progress value={(12 / 50) * 100} className="h-1 bg-slate-200 mt-2" />
                  </div>
                  <div className="p-3 bg-background rounded-xl border border-slate-200 dark:bg-slate-850">
                    <span className="text-[9px] font-black text-[#6B7280] uppercase tracking-wider block">Scheduled Posts</span>
                    <span className="text-sm font-black text-[#1F2937] block mt-1 dark:text-white">3 / 30</span>
                    <Progress value={(3 / 30) * 100} className="h-1 bg-slate-200 mt-2" />
                  </div>
                  <div className="p-3 bg-background rounded-xl border border-slate-200 dark:bg-slate-850">
                    <span className="text-[9px] font-black text-[#6B7280] uppercase tracking-wider block">Storage</span>
                    <span className="text-sm font-black text-[#1F2937] block mt-1 dark:text-white">120MB / 500MB</span>
                    <Progress value={(120 / 500) * 100} className="h-1 bg-slate-200 mt-2" />
                  </div>
                </div>

                {/* Plan Comparison table */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Compare features
                  </span>
                  
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/50 border-b font-extrabold text-slate-500 dark:bg-slate-850">
                          <th className="p-3">Feature Option</th>
                          <th className="p-3 text-center">GrowWave Free</th>
                          <th className="p-3 text-center text-emerald-600">GrowWave Pro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-medium text-slate-700 dark:text-slate-350">
                        <tr>
                          <td className="p-3 font-bold">Social Channels</td>
                          <td className="p-3 text-center">1 channel maximum (Facebook Page)</td>
                          <td className="p-3 text-center text-emerald-600 font-bold">Unlimited channels</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">Scheduled queue</td>
                          <td className="p-3 text-center">30 posts limit</td>
                          <td className="p-3 text-center text-emerald-600 font-bold">Unlimited queue</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">AI Strategist Assistant</td>
                          <td className="p-3 text-center">50 credits/month</td>
                          <td className="p-3 text-center text-emerald-600 font-bold">Unlimited Copilot</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">Unified Social Inbox</td>
                          <td className="p-3 text-center">❌ Locked</td>
                          <td className="p-3 text-center text-emerald-600 font-bold">✅ Included</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">Analytics reporting</td>
                          <td className="p-3 text-center">Simple metrics</td>
                          <td className="p-3 text-center text-emerald-600 font-bold">Advanced PDF reports</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">Team Collaboration</td>
                          <td className="p-3 text-center">❌ Locked</td>
                          <td className="p-3 text-center text-emerald-600 font-bold">✅ Custom roles</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-2.5 max-w-md">
                    <Info className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[10.5px] text-slate-400 leading-normal">
                      Upgrade to Pro for <span className="font-bold text-slate-700 dark:text-slate-200">$19/month</span> to connect all channels and unlock bulk scheduling queues.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setUpgradeReason("")
                      setUpgradeOpen(true)
                    }}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs px-6 rounded-lg uppercase tracking-wider shrink-0"
                  >
                    Upgrade Now
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* DELETE ACCOUNT */}
          {activeTab === "delete" && (
            <Card className="rounded-2xl border-0 bg-red-50/50 p-6 space-y-4 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-start gap-3 border-b border-rose-500/10 pb-4">
                <div className="p-2 rounded-lg bg-rose-500/15 text-rose-600 shrink-0">
                  <ShieldAlert className="size-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-rose-950 dark:text-rose-400">Danger Zone</h3>
                  <p className="text-xs text-rose-650 dark:text-rose-500 mt-0.5 leading-normal">
                    This action is permanent. Deleting your workspace deletes all connected metrics, scheduled content, and historical generations log.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-650 dark:text-slate-400 leading-normal font-semibold">
                  To verify account deletion, please type <span className="font-black text-rose-650 select-all">delete my account</span> in the input below:
                </p>
                <Input
                  placeholder="delete my account"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="max-w-md border-rose-300 focus-visible:ring-rose-500 text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex justify-start">
                <Button
                  onClick={handleDeleteAccount}
                  className="bg-rose-650 hover:bg-rose-700 text-white font-extrabold text-xs px-5 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-sm"
                >
                  <Trash2 className="size-4 shrink-0" />
                  Confirm Deletion
                </Button>
              </div>
            </Card>
          )}

          {/* APPEARANCE SETTINGS */}
          {activeTab === "appearance" && (
            <Card className="rounded-2xl border-0 bg-white dark:bg-[#1F2937] shadow-card hover:shadow-card-hover transition-all">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">Appearance Settings</CardTitle>
                <p className="text-[11px] text-[#6B7280] dark:text-slate-400 mt-0.5">Customize how GrowWave Lite looks on your device.</p>
              </CardHeader>
              <CardContent className="p-5 md:p-6 space-y-6">
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Choose Theme
                  </span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all hover:bg-slate-50 dark:hover:bg-slate-800/20 ${
                        theme === "light"
                          ? "border-[var(--brand-primary)] bg-[var(--brand-surface)] text-slate-900 font-extrabold"
                          : "border-slate-200 dark:border-slate-800 text-slate-500"
                      }`}
                    >
                      <Sun className="size-6 mb-2 text-amber-500" />
                      <span className="text-xs font-bold">Light Theme</span>
                    </button>

                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all hover:bg-slate-50 dark:hover:bg-slate-800/20 ${
                        theme === "dark"
                          ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 text-[var(--brand-primary)] font-extrabold"
                          : "border-slate-200 dark:border-slate-800 text-slate-400"
                      }`}
                    >
                      <Moon className="size-6 mb-2 text-indigo-400" />
                      <span className="text-xs font-bold">Dark Theme</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* Facebook Page Selector Modal */}
      <Dialog open={fbPagesModalOpen} onOpenChange={setFbPagesModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5 border-border/60 shadow-xl bg-card">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="flex items-center gap-2 text-md font-bold">
              <IconFacebook className="size-5 text-[#1877F2]" /> Select Facebook Page
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select the managed Facebook Page you would like to set as your active publishing destination.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {loadingFbPages ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="size-6 animate-spin text-[#1877F2]" />
                <p className="text-xs text-muted-foreground">Querying Meta Graph API Pages...</p>
              </div>
            ) : fbPages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <XCircle className="size-7 text-rose-500" />
                <p className="text-xs font-bold text-foreground">No Facebook Pages Found</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Please create or manage a Facebook Page first.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {fbPages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => setSelectedFbPageId(page.id)}
                    className={cn(
                      "flex w-full items-center gap-3.5 rounded-xl border p-3 text-left transition-all hover:bg-muted/10 relative",
                      selectedFbPageId === page.id
                        ? "bg-[#1877F2]/5 border-[#1877F2]/40 shadow-sm"
                        : "border-slate-200 dark:border-slate-800"
                    )}
                  >
                    {page.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={page.picture} alt={page.name} className="size-10 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="size-10 rounded-full bg-[#1877F2]/10 text-[#1877F2] font-bold text-sm flex items-center justify-center">
                        F
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground leading-snug truncate">{page.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{page.category}</p>
                      <div className="flex items-center gap-3 text-[9px] text-muted-foreground/80 mt-1 font-mono">
                        <span>ID: {page.id}</span>
                        <span>•</span>
                        <span>{(page.followers || 0).toLocaleString()} followers</span>
                      </div>
                    </div>

                    {selectedFbPageId === page.id && (
                      <Check className="size-4.5 text-[#1877F2] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border/40 pt-4 flex gap-2">
            <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setFbPagesModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="rounded-lg text-xs bg-[#1877F2] text-white hover:bg-[#1877F2]/90" onClick={handleConnectFacebookPage} disabled={loadingFbPages || fbPages.length === 0}>
              Connect & Save Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason={upgradeReason} />

      <GrowWaveModal
        isOpen={disconnectModalOpen}
        onClose={() => {
          if (!disconnectLoading) {
            setDisconnectModalOpen(false)
            setDisconnectTarget(null)
          }
        }}
        title="Disconnect Facebook Page"
        message={`Are you sure you want to disconnect the Facebook Page "${disconnectTarget?.username || ""}"? This page will no longer be linked to your workspace.`}
        confirmText="Disconnect"
        cancelText="Cancel"
        onConfirm={handleConfirmDisconnectChannel}
        variant="danger"
        loading={disconnectLoading}
        loadingText="Disconnecting..."
      />

      <GrowWaveModal
        isOpen={deleteAccountModalOpen}
        onClose={() => {
          if (!deleteAccountLoading) {
            setDeleteAccountModalOpen(false)
          }
        }}
        title="Permanently Delete Workspace"
        message="Are you sure you want to permanently delete your workspace? All your content ideas, scheduled posts, and connections will be lost forever. This action cannot be undone."
        confirmText="Permanently Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteAccount}
        variant="danger"
        loading={deleteAccountLoading}
        loadingText="Deleting Workspace..."
      />
    </div>

  )
}

export default function FreeSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="size-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
