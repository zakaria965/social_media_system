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
  RefreshCw
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { UpgradeModal } from "@/components/free-user/upgrade-modal"
import {
  IconFacebook,
  IconInstagram,
  IconLinkedin,
  IconX
} from "@/components/social-brand-icons"

function IconTikTok(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.19.98 1.13 2.37 1.83 3.86 2v3.7c-1.39-.02-2.77-.38-3.95-1.12-.48-.3-.92-.66-1.31-1.07V15c.02 2.15-.7 4.29-2.07 5.92-1.74 2.05-4.47 3.19-7.14 3.06-2.92-.12-5.63-1.92-6.85-4.58-1.46-3.14-.79-7.13 1.63-9.53 1.84-1.84 4.54-2.58 7.02-1.98v3.83c-1.41-.45-3 .02-3.91 1.12-.99 1.16-1.09 2.97-.24 4.24.81 1.25 2.34 1.95 3.82 1.76 1.48-.15 2.74-1.32 2.92-2.8.06-.55.03-1.11.03-1.66V0h.69z" />
    </svg>
  )
}

interface ChannelConnection {
  id: string
  name: string
  platform: string
  username: string
  connected: boolean
  followers: number
  locked: boolean
}

function SettingsContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<string>("profile")

  // Profile Form
  const [profileName, setProfileName] = useState(session?.user?.name || "GrowWave Lite User")
  const [profileEmail, setProfileEmail] = useState(session?.user?.email || "user@growwave.com")
  const [profileBio, setProfileBio] = useState("Managing my social media workspace easily with GrowWave Lite.")

  // Channels state
  const [channels, setChannels] = useState<ChannelConnection[]>([])

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

  // Read tab parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam) {
      setActiveTab(tabParam)
    }

    const savedChannels = localStorage.getItem("growwave-lite-channels")
    if (savedChannels) {
      setChannels(JSON.parse(savedChannels))
    } else {
      const initialChannels = [
        { id: "c-fb", name: "Facebook", platform: "facebook", username: "", connected: false, followers: 0, locked: false },
        { id: "c-ig", name: "Instagram", platform: "instagram", username: "", connected: false, followers: 0, locked: false },
        { id: "c-li", name: "LinkedIn", platform: "linkedin", username: "", connected: false, followers: 0, locked: false },
        { id: "c-tw", name: "Twitter / X", platform: "twitter", username: "", connected: false, followers: 0, locked: true },
        { id: "c-tk", name: "TikTok", platform: "tiktok", username: "", connected: false, followers: 0, locked: true }
      ]
      setChannels(initialChannels)
      localStorage.setItem("growwave-lite-channels", JSON.stringify(initialChannels))
    }
  }, [searchParams])

  // Handle connection toggling
  const handleConnectChannel = (id: string, locked: boolean) => {
    if (locked) {
      setUpgradeReason("platform_locked")
      setUpgradeOpen(true)
      return
    }

    const target = channels.find(c => c.id === id)
    if (!target) return

    let nextChannels = [...channels]
    if (target.connected) {
      // Disconnect
      if (confirm(`Disconnect your ${target.name} account?`)) {
        nextChannels = channels.map(c => c.id === id ? { ...c, connected: false, username: "", followers: 0 } : c)
      }
    } else {
      // Connect: Check channel limit (max 3)
      const activeCount = channels.filter(c => c.connected).length
      if (activeCount >= 3) {
        setUpgradeReason("channels_limit")
        setUpgradeOpen(true)
        return
      } else {
        const handleName = prompt(`Enter your ${target.name} profile handle / username:`)
        if (handleName) {
          nextChannels = channels.map(c => c.id === id ? {
            ...c,
            connected: true,
            username: handleName,
            followers: Math.floor(Math.random() * 200) + 10
          } : c)
        }
      }
    }
    setChannels(nextChannels)
    localStorage.setItem("growwave-lite-channels", JSON.stringify(nextChannels))
  }

  // Simulated Save profile details
  const handleSaveProfile = () => {
    alert("Profile settings saved successfully!")
  }

  // Simulated Password update
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault()
    alert("Password updated successfully!")
  }

  // Simulated Delete Account
  const handleDeleteAccount = () => {
    if (deleteConfirmText.toLowerCase() === "delete my account") {
      alert("Simulating account deletion... Redirecting to home.")
      router.push("/")
    } else {
      alert("Verification text mismatch. Please type exactly 'delete my account'.")
    }
  }

  // Render platform icons
  const renderPlatformIcon = (plat: string) => {
    switch (plat) {
      case "facebook":
        return <IconFacebook className="size-5 text-blue-600 shrink-0" />
      case "instagram":
        return <IconInstagram className="size-5 text-pink-600 shrink-0" />
      case "linkedin":
        return <IconLinkedin className="size-5 text-sky-700 shrink-0" />
      case "twitter":
        return <IconX className="size-5 text-slate-800 dark:text-white shrink-0" />
      case "tiktok":
        return <IconTikTok className="size-5 text-fuchsia-600 shrink-0" />
      default:
        return null
    }
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
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
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
                    ? "bg-[#30FC47]/10 text-slate-950 dark:text-[#30FC47] font-extrabold"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? "text-emerald-600 dark:text-[#30FC47]" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="absolute right-3 size-1.5 rounded-full bg-[#30FC47]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Right Tab Content details */}
        <div className="lg:col-span-9">

          {/* PROFILE SETTINGS */}
          {activeTab === "profile" && (
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-4 border-b pb-4">
                  <div className="size-14 rounded-full bg-slate-100 flex items-center justify-center font-black text-lg text-slate-500 border border-slate-200">
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
                    className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-extrabold text-xs px-5 rounded-lg uppercase tracking-wider shadow-sm"
                  >
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PASSWORD SETTINGS */}
          {activeTab === "password" && (
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-3 border-b">
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
                      className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-extrabold text-xs px-5 rounded-lg uppercase tracking-wider shadow-sm"
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
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">Linked Channels</CardTitle>
                  <p className="text-[11px] text-slate-500 mt-0.5">Link or unlink social profiles. Max 3 accounts on Free Plan.</p>
                </div>
                <Badge variant="outline" className="text-[8px] font-bold uppercase border-slate-200">
                  {channels.filter(c => c.connected).length} / 3 Connected
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-850">
                  {channels.map((chan) => (
                    <div
                      key={chan.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-slate-50 border dark:bg-slate-800 dark:border-slate-700">
                          {renderPlatformIcon(chan.platform)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">{chan.name}</span>
                            {chan.locked && (
                              <Badge className="bg-[#30FC47]/20 hover:bg-[#30FC47]/30 text-emerald-700 text-[8px] font-black uppercase py-0.2 px-1">
                                Pro Link
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {chan.connected ? `@${chan.username} • ${chan.followers} followers` : chan.locked ? "Requires Pro Upgrade" : "Not Linked"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleConnectChannel(chan.id, chan.locked)}
                        className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all border select-none ${
                          chan.connected
                            ? "bg-slate-50 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-slate-500"
                            : chan.locked
                            ? "bg-[#30FC47]/10 hover:bg-[#30FC47]/20 border-emerald-500/20 text-emerald-700 flex items-center gap-0.5"
                            : "bg-slate-900 text-white border-slate-900 hover:bg-slate-950"
                        }`}
                      >
                        {chan.connected ? "Disconnect" : chan.locked ? (
                          <>
                            <Zap className="size-3 fill-emerald-600" />
                            Unlock
                          </>
                        ) : "Connect"}
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* NOTIFICATION SETTINGS */}
          {activeTab === "notifications" && (
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="p-5 md:p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between border-b pb-3.5">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Publish Success Alerts
                      </span>
                      <p className="text-[10.5px] text-slate-400">
                        Receive email alerts immediately when scheduled posts go live successfully.
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifyPublishSuccess(!notifyPublishSuccess)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifyPublishSuccess ? "bg-[#30FC47]" : "bg-slate-250 dark:bg-slate-800"
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
                      <p className="text-[10.5px] text-slate-400">
                        Receive high-priority email warnings if any scheduled posts fail to deliver.
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifyPublishFailed(!notifyPublishFailed)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifyPublishFailed ? "bg-[#30FC47]" : "bg-slate-250 dark:bg-slate-800"
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
                      <p className="text-[10.5px] text-slate-400">
                        Receive a weekly email recap showing your organic reach and engagement stats.
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifyWeeklySummary(!notifyWeeklySummary)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifyWeeklySummary ? "bg-[#30FC47]" : "bg-slate-250 dark:bg-slate-800"
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
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-3 border-b bg-slate-50 dark:bg-slate-850/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">Billing & Plan status</CardTitle>
                    <p className="text-[11px] text-slate-500 mt-0.5">Review subscription limits and compare packages.</p>
                  </div>
                  <Badge className="bg-[#30FC47]/20 text-emerald-700 border border-emerald-500/20 text-[9px] uppercase font-black py-0.5 px-2 select-none">
                    GrowWave Lite
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 md:p-6 space-y-6">
                
                {/* Free plan metrics check */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-850">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Storage quota</span>
                    <span className="text-sm font-black text-slate-800 block mt-1 dark:text-white">325MB / 500MB</span>
                    <Progress value={65} className="h-1 bg-slate-200 mt-2" />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-850">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">AI Credits</span>
                    <span className="text-sm font-black text-slate-800 block mt-1 dark:text-white">32 / 50 requests</span>
                    <Progress value={64} className="h-1 bg-slate-200 mt-2" />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-850">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Channels linked</span>
                    <span className="text-sm font-black text-slate-800 block mt-1 dark:text-white">3 / 3 maximum</span>
                    <Progress value={100} className="h-1 bg-slate-200 mt-2" />
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
                      <tbody className="divide-y font-medium text-slate-700 dark:text-slate-300">
                        <tr>
                          <td className="p-3 font-bold">Social Channels</td>
                          <td className="p-3 text-center">3 channels maximum</td>
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
                    className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-extrabold text-xs px-6 rounded-lg uppercase tracking-wider shrink-0"
                  >
                    Upgrade Now
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* DELETE ACCOUNT */}
          {activeTab === "delete" && (
            <Card className="rounded-xl border border-rose-500/20 bg-rose-50/5 dark:bg-rose-950/5 p-5 md:p-6 space-y-4">
              <div className="flex items-start gap-3 border-b border-rose-500/10 pb-4">
                <div className="p-2 rounded-lg bg-rose-500/15 text-rose-600 shrink-0">
                  <ShieldAlert className="size-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-rose-950 dark:text-rose-400">Danger Zone</h3>
                  <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5 leading-normal">
                    This action is permanent. Deleting your workspace deletes all connected metrics, scheduled content, and historical generations log.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal font-semibold">
                  To verify account deletion, please type <span className="font-black text-rose-600 select-all">delete my account</span> in the input below:
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

        </div>
      </div>

      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason={upgradeReason} />
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
