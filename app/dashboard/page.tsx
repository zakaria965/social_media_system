"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  CalendarCheck,
  Image as ImageIcon,
  PenSquare,
  Sparkles,
  TrendingUp,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  HardDrive,
  Brain,
  Plus,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  MessageSquare
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/dashboard/page-transition"
import { StatsCard } from "@/components/dashboard/stats-card"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import {
  IconFacebook,
  IconInstagram,
  IconLinkedin,
  IconX
} from "@/components/social-brand-icons"

// Compact custom TikTok SVG icon
function IconTikTok(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.19.98 1.13 2.37 1.83 3.86 2v3.7c-1.39-.02-2.77-.38-3.95-1.12-.48-.3-.92-.66-1.31-1.07V15c.02 2.15-.7 4.29-2.07 5.92-1.74 2.05-4.47 3.19-7.14 3.06-2.92-.12-5.63-1.92-6.85-4.58-1.46-3.14-.79-7.13 1.63-9.53 1.84-1.84 4.54-2.58 7.02-1.98v3.83c-1.41-.45-3 .02-3.91 1.12-.99 1.16-1.09 2.97-.24 4.24.81 1.25 2.34 1.95 3.82 1.76 1.48-.15 2.74-1.32 2.92-2.8.06-.55.03-1.11.03-1.66V0h.69z" />
    </svg>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null)

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/dashboard/summary")
      if (!res.ok) throw new Error("Failed to fetch dashboard data")
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An unexpected error occurred while loading the dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  // Action: Triggering a real account status synchronization check
  const handleSyncPlatform = async (platform: string) => {
    setSyncingPlatform(platform)
    try {
      const res = await fetch("/api/accounts/health", { method: "POST" })
      if (res.ok) {
        await fetchSummary()
      }
    } catch (err) {
      console.error("Failed to sync platform connection health:", err)
    } finally {
      setSyncingPlatform(null)
    }
  }

  // Get current date string
  const currentDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Group scheduled posts into Today, Tomorrow, and This Week
  const getGroupedScheduledPosts = (postsList: any[]) => {
    if (!postsList) return { today: [], tomorrow: [], thisWeek: [] }
    const scheduled = postsList.filter(p => p.status === "scheduled" && p.scheduledAt)
    
    const now = new Date()
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    
    const tomorrowEnd = new Date()
    tomorrowEnd.setDate(now.getDate() + 1)
    tomorrowEnd.setHours(23, 59, 59, 999)

    const today: any[] = []
    const tomorrow: any[] = []
    const thisWeek: any[] = []

    scheduled.forEach(p => {
      const pDate = new Date(p.scheduledAt)
      if (pDate <= todayEnd && pDate >= now) {
        today.push(p)
      } else if (pDate <= tomorrowEnd && pDate > todayEnd) {
        tomorrow.push(p)
      } else if (pDate > tomorrowEnd) {
        thisWeek.push(p)
      }
    })

    return { today, tomorrow, thisWeek }
  }

  // Render Premium Skeleton Loading Screens
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-8 w-64 bg-muted/65 rounded-lg" />
          <div className="h-4 w-96 bg-muted/50 rounded-md" />
        </div>

        {/* AI strategist card skeleton */}
        <div className="h-16 w-full bg-muted/40 rounded-xl border border-muted/50" />

        {/* Stats card grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted/45 rounded-xl border border-muted/40" />
          ))}
        </div>

        {/* Main core layout grid skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-80 bg-muted/30 rounded-xl border border-muted/45" />
            <div className="h-60 bg-muted/35 rounded-xl border border-muted/45" />
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-muted/35 rounded-xl border border-muted/45" />
            <div className="h-48 bg-muted/35 rounded-xl border border-muted/45" />
            <div className="h-44 bg-muted/30 rounded-xl border border-muted/45" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-border/70 rounded-2xl bg-card/20 p-8 text-center max-w-xl mx-auto">
        <XCircle className="size-12 text-destructive/80 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-foreground">Failed to Load Dashboard</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          {error || "An error occurred while fetching database metrics. Please verify that your MongoDB server is active."}
        </p>
        <Button onClick={fetchSummary} className="mt-6 gap-2 rounded-lg" size="sm">
          <RefreshCw className="size-4" />
          Retry Connection
        </Button>
      </div>
    )
  }

  // Destructure real Aggregated Data
  const { stats, timeseries, accounts, posts, activities, workspaceHealth, aiGreeting } = data
  const { today, tomorrow, thisWeek } = getGroupedScheduledPosts(posts)

  // Map platform details
  const platformBranding: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    facebook: { label: "Facebook", bg: "from-blue-600/10 to-blue-700/5 hover:border-blue-500/30", text: "text-blue-600 dark:text-blue-400", icon: IconFacebook },
    instagram: { label: "Instagram", bg: "from-pink-600/10 to-orange-600/5 hover:border-pink-500/30", text: "text-pink-600 dark:text-pink-400", icon: IconInstagram },
    linkedin: { label: "LinkedIn", bg: "from-sky-700/10 to-sky-800/5 hover:border-sky-600/30", text: "text-sky-700 dark:text-sky-400", icon: IconLinkedin },
    twitter: { label: "Twitter / X", bg: "from-neutral-900/10 to-neutral-800/5 hover:border-neutral-700/40", text: "text-foreground", icon: IconX },
    tiktok: { label: "TikTok", bg: "from-purple-900/10 to-pink-900/5 hover:border-purple-500/30", text: "text-purple-500 dark:text-purple-400", icon: IconTikTok },
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Personalized Welcome Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFFFFF] rounded-2xl px-5 py-3.5 shadow-card">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#111827]">
              Welcome back, {data.user.name.split(" ")[0]} 🚀
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#22C55E]" />
              <span>Workspace Status: <strong className="text-[#111827] font-semibold">Active</strong></span>
            </div>
            <div className="h-4 w-px bg-[#EEF2F7]" />
            <div>
              Connected Channels: <strong className="text-[#111827] font-semibold">{accounts.filter((a: any) => a.status === "connected").length} Connected</strong>
            </div>
            <div className="h-4 w-px bg-[#EEF2F7]" />
            <div>
              Current Plan: <strong className="text-[#111827] font-semibold">GrowWave Pro</strong>
            </div>
          </div>
          <Button onClick={fetchSummary} variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs font-semibold px-2.5 border-[#EEF2F7] hover:bg-[#FCFAF6]">
            <RefreshCw className="size-3" />
            Sync Dashboard
          </Button>
        </div>

        {/* Small AI Insight Strip */}
        <div className="flex h-[72px] items-center justify-between rounded-2xl bg-[#FFFFFF] px-4 py-2 shadow-card">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#22C55E] shrink-0">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#22C55E] uppercase tracking-wider block leading-none">AI Insight</span>
              <p className="text-xs text-[#111827] font-medium truncate mt-1">
                {aiGreeting || "Facebook engagement increased 12% this week."}
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/dashboard/analytics")}
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-[#22C55E] hover:text-[#4ADE80] hover:bg-[#F0FDF4] shrink-0 h-8 px-3 rounded-lg"
          >
            View Analysis
            <ChevronRight className="size-3 ml-0.5" />
          </Button>
        </div>

        {/* Performance Overview KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatsCard
            title="Posts Published"
            value={stats.published.value}
            change={stats.published.change}
            trend={stats.published.trend}
            icon={CheckCircle}
            sparkline={stats.published.sparkline}
          />
          <StatsCard
            title="Scheduled Posts"
            value={stats.scheduled.value}
            change={stats.scheduled.change}
            trend={stats.scheduled.trend}
            icon={CalendarCheck}
            sparkline={stats.scheduled.sparkline}
          />
          <StatsCard
            title="Reach"
            value={stats.reach.value}
            change={stats.reach.change}
            trend={stats.reach.trend}
            icon={BarChart3}
            sparkline={stats.reach.sparkline}
          />
          <StatsCard
            title="Engagement"
            value={stats.engagement.value}
            change={stats.engagement.change}
            trend={stats.engagement.trend}
            icon={TrendingUp}
            sparkline={stats.engagement.sparkline}
          />
          <StatsCard
            title="Followers"
            value={stats.followers.value}
            change={stats.followers.change}
            trend={stats.followers.trend}
            icon={Users}
            sparkline={stats.followers.sparkline}
          />
          <StatsCard
            title="AI Generations"
            value={stats.aiGenerated.value}
            change={stats.aiGenerated.change}
            trend={stats.aiGenerated.trend}
            icon={Sparkles}
            sparkline={stats.aiGenerated.sparkline}
          />
        </div>

        {/* MAIN LAYOUT GRID */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-10">
          
          <div className="lg:col-span-7 space-y-6">
            <PerformanceChart timeseries={timeseries} />

            {/* Connected Platforms Section */}
            <Card className="rounded-2xl border-none bg-[#FFFFFF] shadow-card hover:shadow-card-hover transition-all duration-200">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#111827]">Connected Platforms</CardTitle>
                  <p className="text-xs text-[#64748B] mt-0.5">Control platform synchronization and status badges.</p>
                </div>
                <Link href="/dashboard/settings">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold hover:bg-muted/80 rounded-lg h-8 px-3">
                    Manage Accounts
                  </Button>
                </Link>
              </CardHeader>
              
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 p-4 pt-0">
                {Object.keys(platformBranding).map((plat) => {
                  const brand = platformBranding[plat]
                  const BrandIcon = brand.icon
                  const account = accounts.find((a: any) => a.platform === plat)

                  return (
                    <div
                      key={plat}
                      className="group relative flex flex-col justify-between p-3.5 rounded-2xl border border-[#EEF2F7] bg-[#FFFFFF] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className={cn("size-8 rounded-lg flex items-center justify-center bg-[#FCFAF6] border border-[#EEF2F7] transition-transform duration-200 group-hover:scale-105", brand.text)}>
                          <BrandIcon className="size-4" />
                        </div>
                        <Badge
                          variant={account ? "outline" : "secondary"}
                          className={cn(
                            "text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 shrink-0 select-none rounded-md",
                            account
                              ? account.status === "connected"
                                ? "bg-[#DCFCE7] text-[#22C55E] border-[#DCFCE7]"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          )}
                        >
                          {account ? account.status : "Offline"}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-0.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">{brand.label}</p>
                        <p className="text-xs font-semibold text-[#111827] truncate max-w-full">
                          {account ? account.username : "Unconnected"}
                        </p>
                        <p className="text-[10px] text-[#64748B]">
                          {account ? `${account.followers.toLocaleString()} followers` : "0 followers"}
                        </p>
                      </div>

                      <div className="mt-3.5 pt-3.5 border-t border-[#EEF2F7] flex items-center justify-between">
                        <span className="text-[10px] text-[#64748B]">
                          {account ? "Sync active" : "Available"}
                        </span>
                        {account ? (
                          <button
                            onClick={() => handleSyncPlatform(plat)}
                            disabled={syncingPlatform === plat}
                            className="text-[10px] font-semibold text-[#22C55E] hover:text-[#4ADE80] flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                          >
                            <RefreshCw className={cn("size-2.5 shrink-0", syncingPlatform === plat && "animate-spin")} />
                            Sync
                          </button>
                        ) : (
                          <Link href="/dashboard/settings" className="text-[10px] font-semibold text-[#22C55E] hover:text-[#4ADE80] flex items-center gap-0.5">
                            Connect
                            <ChevronRight className="size-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card className="rounded-2xl border-none bg-[#FFFFFF] shadow-card hover:shadow-card-hover transition-all duration-200">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#111827]">Recent Activities</CardTitle>
                  <p className="text-xs text-[#64748B] mt-0.5">Audit log of system processes and recent interactions.</p>
                </div>
                <Link href="/dashboard/scheduled">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold hover:bg-muted/80 rounded-lg h-8 px-3">
                    History log
                  </Button>
                </Link>
              </CardHeader>
              
              <CardContent className="p-0">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-[#FCFAF6] rounded-b-2xl">
                    <Activity className="size-8 text-[#64748B]/50 mb-2" />
                    <p className="text-xs font-semibold text-[#64748B]">No recent activity detected.</p>
                    <p className="text-[10px] text-[#64748B]/80 max-w-[200px] mt-1">Activities are generated when you schedule or publish content.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#EEF2F7]">
                    {activities.map((act: any) => {
                      const brand = act.platform ? platformBranding[act.platform] : null
                      const timeAgo = new Date(act.time).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                        day: "numeric"
                      })

                      return (
                        <div key={act.id} className="flex items-center gap-3.5 px-4.5 py-3 transition-colors duration-200 hover:bg-[#FCFAF6]/60">
                          <div className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full border shadow-sm",
                            act.status === "success" && "bg-[#DCFCE7] border-[#DCFCE7] text-[#22C55E]",
                            act.status === "failed" && "bg-rose-50 border-rose-100 text-rose-600",
                            act.status === "info" && "bg-blue-50 border-blue-100 text-blue-600"
                          )}>
                            {act.status === "success" ? <CheckCircle className="size-4" /> : act.status === "failed" ? <XCircle className="size-4" /> : <Info className="size-4" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#111827] font-medium truncate">
                              {act.details}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {brand && (
                                <Badge variant="outline" className="text-[8px] tracking-wider font-semibold uppercase px-1 py-0 border-[#EEF2F7] text-[#64748B] flex items-center gap-0.5 rounded-sm">
                                  {brand.label}
                                </Badge>
                              )}
                              <span className="text-[9px] text-[#64748B] font-semibold uppercase shrink-0">
                                {act.action.replace("_", " ")}
                              </span>
                            </div>
                          </div>

                          <span className="shrink-0 text-[10px] font-semibold text-[#64748B] uppercase flex items-center gap-1">
                            <Clock className="size-3" />
                            {timeAgo}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Quick Actions Card */}
            <Card className="rounded-2xl border-none bg-[#FFFFFF] shadow-card hover:shadow-card-hover transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#111827] flex items-center gap-1.5">
                  <PenSquare className="size-4 text-[#22C55E]" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0">
                <Link href="/dashboard/create" className="group flex flex-col justify-between p-3.5 rounded-xl border border-[#EEF2F7] bg-[#FFFFFF] hover:border-[#22C55E]/40 hover:-translate-y-0.5 hover:shadow-card-hover/20 transition-all duration-200">
                  <div className="size-7 rounded-lg bg-[#DCFCE7] text-[#22C55E] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <PenSquare className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-[#111827] mt-3.5 block">Create Post</span>
                  <span className="text-[10px] text-[#64748B] mt-0.5 block truncate">Design & share</span>
                </Link>

                <Link href="/dashboard/bulk" className="group flex flex-col justify-between p-3.5 rounded-xl border border-[#EEF2F7] bg-[#FFFFFF] hover:border-[#22C55E]/40 hover:-translate-y-0.5 hover:shadow-card-hover/20 transition-all duration-200">
                  <div className="size-7 rounded-lg bg-[#DCFCE7] text-[#22C55E] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <Clock className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-[#111827] mt-3.5 block">Schedule Content</span>
                  <span className="text-[10px] text-[#64748B] mt-0.5 block truncate">Queue posts</span>
                </Link>

                <Link href="/dashboard/ai-assistant" className="group flex flex-col justify-between p-3.5 rounded-xl border border-[#EEF2F7] bg-[#FFFFFF] hover:border-[#22C55E]/40 hover:-translate-y-0.5 hover:shadow-card-hover/20 transition-all duration-200">
                  <div className="size-7 rounded-lg bg-[#DCFCE7] text-[#22C55E] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <Sparkles className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-[#111827] mt-3.5 block">AI Writer</span>
                  <span className="text-[10px] text-[#64748B] mt-0.5 block truncate">Generate copy</span>
                </Link>

                <Link href="/dashboard/analytics" className="group flex flex-col justify-between p-3.5 rounded-xl border border-[#EEF2F7] bg-[#FFFFFF] hover:border-[#22C55E]/40 hover:-translate-y-0.5 hover:shadow-card-hover/20 transition-all duration-200">
                  <div className="size-7 rounded-lg bg-[#DCFCE7] text-[#22C55E] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <BarChart3 className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-[#111827] mt-3.5 block">Analytics</span>
                  <span className="text-[10px] text-[#64748B] mt-0.5 block truncate">Deep insights</span>
                </Link>

                <Link href="/dashboard/media" className="group flex flex-col justify-between p-3.5 rounded-xl border border-[#EEF2F7] bg-[#FFFFFF] hover:border-[#22C55E]/40 hover:-translate-y-0.5 hover:shadow-card-hover/20 transition-all duration-200">
                  <div className="size-7 rounded-lg bg-[#DCFCE7] text-[#22C55E] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <ImageIcon className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-[#111827] mt-3.5 block">Media Library</span>
                  <span className="text-[10px] text-[#64748B] mt-0.5 block truncate">Upload assets</span>
                </Link>

                <Link href="/dashboard/inbox" className="group flex flex-col justify-between p-3.5 rounded-xl border border-[#EEF2F7] bg-[#FFFFFF] hover:border-[#22C55E]/40 hover:-translate-y-0.5 hover:shadow-card-hover/20 transition-all duration-200">
                  <div className="size-7 rounded-lg bg-[#DCFCE7] text-[#22C55E] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <MessageSquare className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-[#111827] mt-3.5 block">Inbox</span>
                  <span className="text-[10px] text-[#64748B] mt-0.5 block truncate">View messages</span>
                </Link>
              </CardContent>
            </Card>

            {/* Upcoming Content Calendar */}
            <Card className="rounded-2xl border-none bg-[#FFFFFF] shadow-card hover:shadow-card-hover transition-all duration-200">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#111827]">Content Planning</CardTitle>
                  <p className="text-xs text-[#64748B] mt-0.5 font-medium uppercase tracking-wider">Queue status</p>
                </div>
                <Link href="/dashboard/calendar">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold hover:bg-muted/80 rounded-lg h-8 px-3">
                    Calendar
                  </Button>
                </Link>
              </CardHeader>
              
              <CardContent className="space-y-4 p-4 pt-0">
                {today.length === 0 && tomorrow.length === 0 && thisWeek.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-[#EEF2F7] rounded-2xl bg-[#FCFAF6]">
                    <CalendarCheck className="size-7 text-[#64748B]/55 mb-2" />
                    <p className="text-xs font-semibold text-[#111827]">Planning queue empty</p>
                    <p className="text-[10px] text-[#64748B] mt-1 mb-3">No scheduled posts scheduled for this week.</p>
                    <Link href="/dashboard/create">
                      <Button size="sm" className="rounded-lg gap-1 font-semibold text-xs bg-[#22C55E] hover:bg-[#4ADE80] text-[#FFFFFF] border-0 h-8 px-3 cursor-pointer shadow-[0_4px_14px_rgba(34,197,94,0.18)]">
                        <Plus className="size-3.5" />
                        Create Post
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* TODAY SECTION */}
                    {today.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-[#22C55E] uppercase tracking-wider">Today</span>
                        <div className="space-y-2">
                          {today.map((post: any) => (
                            <div key={post.id} className="rounded-xl border border-[#EEF2F7] bg-[#FCFAF6]/40 p-3 flex flex-col justify-between hover:bg-[#FCFAF6]/80 transition-all duration-200">
                              <p className="text-xs font-bold text-[#111827] leading-normal line-clamp-2">{post.title || post.content}</p>
                              <div className="mt-3 flex items-center justify-between border-t border-[#EEF2F7] pt-2 text-[10px] text-[#64748B]">
                                <span className="font-semibold uppercase tracking-wider">{post.platforms.join(" • ")}</span>
                                <span className="flex items-center gap-1 font-semibold">
                                  <Clock className="size-3" />
                                  {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TOMORROW SECTION */}
                    {tomorrow.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Tomorrow</span>
                        <div className="space-y-2">
                          {tomorrow.map((post: any) => (
                            <div key={post.id} className="rounded-xl border border-[#EEF2F7] bg-[#FCFAF6]/40 p-3 flex flex-col justify-between hover:bg-[#FCFAF6]/80 transition-all duration-200">
                              <p className="text-xs font-bold text-[#111827] leading-normal line-clamp-2">{post.title || post.content}</p>
                              <div className="mt-3 flex items-center justify-between border-t border-[#EEF2F7] pt-2 text-[10px] text-[#64748B]">
                                <span className="font-semibold uppercase tracking-wider">{post.platforms.join(" • ")}</span>
                                <span className="flex items-center gap-1 font-semibold">
                                  <Clock className="size-3" />
                                  {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* THIS WEEK SECTION */}
                    {thisWeek.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Later This Week</span>
                        <div className="space-y-2">
                          {thisWeek.map((post: any) => (
                            <div key={post.id} className="rounded-xl border border-[#EEF2F7] bg-[#FCFAF6]/40 p-3 flex flex-col justify-between hover:bg-[#FCFAF6]/80 transition-all duration-200">
                              <p className="text-xs font-bold text-[#111827] leading-normal line-clamp-2">{post.title || post.content}</p>
                              <div className="mt-3 flex items-center justify-between border-t border-[#EEF2F7] pt-2 text-[10px] text-[#64748B]">
                                <span className="font-semibold uppercase tracking-wider">{post.platforms.join(" • ")}</span>
                                <span className="flex items-center gap-1 font-semibold">
                                  <Clock className="size-3" />
                                  {new Date(post.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Strategist Command Center */}
            <Card className="rounded-2xl border-none bg-[#FFFFFF] shadow-card hover:shadow-card-hover transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#111827] flex items-center gap-1.5">
                  <Sparkles className="size-4 text-[#22C55E]" />
                  AI Strategist Command
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="rounded-xl border border-[#EEF2F7] bg-[#FCFAF6] p-3 text-xs leading-relaxed">
                  <span className="font-bold text-[#22C55E] flex items-center gap-1 mb-1">
                    <Brain className="size-3.5" />
                    Posting Time Opportunity
                  </span>
                  Audience retention analytics indicate that <span className="font-semibold text-[#111827]">educational content</span> performs best on <span className="font-semibold text-[#111827]">Tuesdays at 11:30 AM</span>. Consider scheduling your next thread.
                </div>

                <div className="rounded-xl border border-[#EEF2F7] bg-[#FFFFFF] p-3 text-xs flex flex-col justify-between gap-2.5">
                  <div>
                    <span className="font-bold text-[#111827] block">Weekly Performance Spike</span>
                    Your LinkedIn engagement rate peaked up <span className="font-semibold text-[#22C55E]">18%</span> compared to the average. Maintain momentum by posting another visual industry insight.
                  </div>
                  <Button
                    onClick={() => router.push("/dashboard/create")}
                    variant="outline"
                    size="sm"
                    className="w-full text-[10px] font-bold rounded-lg bg-[#FFFFFF] border border-[#EEF2F7] py-1 h-7 flex items-center justify-center gap-1 hover:bg-[#FCFAF6] text-[#111827]"
                  >
                    Draft Visual Post
                    <ChevronRight className="size-3" />
                  </Button>
                </div>

                <div className="rounded-xl border border-[#EEF2F7] bg-[#FFFFFF] p-3 text-xs flex flex-col justify-between gap-2.5">
                  <div>
                    <span className="font-bold text-[#111827] block">Generate Content Opportunities</span>
                    Would you like to build 5 high-converting post ideas derived from your best performing post?
                  </div>
                  <Button
                    onClick={() => router.push("/dashboard/ai-assistant")}
                    className="w-full text-[10px] font-bold rounded-lg py-1 h-7 flex items-center justify-center gap-1 bg-[#22C55E] hover:bg-[#4ADE80] text-[#FFFFFF] border-0 cursor-pointer shadow-[0_4px_14px_rgba(34,197,94,0.18)]"
                  >
                    Generate Post Ideas
                    <Sparkles className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Workspace Health Indicator */}
            <Card className="rounded-2xl border-none bg-[#FFFFFF] shadow-card hover:shadow-card-hover transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#111827] flex items-center gap-1.5">
                  <Activity className="size-4 text-[#22C55E]" />
                  Workspace Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                {/* Connected Accounts limit */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[#64748B]">Connected Accounts</span>
                    <span className="text-[#111827] font-semibold">
                      {workspaceHealth.connectedAccounts} / {workspaceHealth.maxAccounts}
                    </span>
                  </div>
                  <Progress value={(workspaceHealth.connectedAccounts / workspaceHealth.maxAccounts) * 100} className="h-1.5 rounded-full" />
                </div>

                {/* Monthly post quota */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[#64748B]">Monthly Post Count</span>
                    <span className="text-[#111827] font-semibold">
                      {workspaceHealth.postsThisMonth} / {workspaceHealth.maxPostsMonth}
                    </span>
                  </div>
                  <Progress value={(workspaceHealth.postsThisMonth / workspaceHealth.maxPostsMonth) * 100} className="h-1.5 rounded-full" />
                </div>

                {/* Media storage */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[#64748B] flex items-center gap-1">
                      <HardDrive className="size-3.5 text-[#64748B]" />
                      Media Storage Space
                    </span>
                    <span className="text-[#111827] font-semibold">
                      {workspaceHealth.mediaStorageUsed} / {workspaceHealth.mediaStorageLimit} MB
                    </span>
                  </div>
                  <Progress value={(workspaceHealth.mediaStorageUsed / workspaceHealth.mediaStorageLimit) * 100} className="h-1.5 rounded-full" />
                </div>

                <div className="pt-3 flex items-center justify-between text-xs font-medium border-t border-[#EEF2F7] text-[#64748B]">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-[#64748B]">Team Quota</span>
                    <span className="text-xs text-[#111827] font-semibold mt-0.5">{workspaceHealth.teamMembers} Members active</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider border-[#DCFCE7] text-[#22C55E] bg-[#DCFCE7] px-2 py-0.5 select-none rounded-md">
                    Pro Workspace
                  </Badge>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </PageTransition>
  )
}
