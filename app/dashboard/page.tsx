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
  Info
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
        {/* SECTION 1: Personalized Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Welcome back, {data.user.name.split(" ")[0]} 🚀
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentDateStr} • Active Workspace: <span className="font-semibold text-foreground">Personal Workspace</span> • {accounts.filter((a: any) => a.status === "connected").length} connected accounts
            </p>
          </div>
          <Button onClick={fetchSummary} variant="outline" size="sm" className="gap-1.5 self-start md:self-auto rounded-lg text-xs font-semibold">
            <RefreshCw className="size-3.5" />
            Sync Dashboard
          </Button>
        </div>

        {/* Dynamic AI Summary Greeting strategist card */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/15 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-blue-500/5 p-4 shadow-sm shadow-emerald-500/5">
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Brain className="size-4.5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">AI Workspace Insights</span>
              <p className="text-sm text-foreground/90 font-medium leading-snug mt-0.5">{aiGreeting}</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Performance Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatsCard
            title="Total Published"
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
            title="Total Reach"
            value={stats.reach.value}
            change={stats.reach.change}
            trend={stats.reach.trend}
            icon={BarChart3}
            sparkline={stats.reach.sparkline}
          />
          <StatsCard
            title="Engagement Rate"
            value={stats.engagement.value}
            change={stats.engagement.change}
            trend={stats.engagement.trend}
            icon={TrendingUp}
            sparkline={stats.engagement.sparkline}
          />
          <StatsCard
            title="Followers Growth"
            value={stats.followers.value}
            change={stats.followers.change}
            trend={stats.followers.trend}
            icon={Users}
            sparkline={stats.followers.sparkline}
          />
          <StatsCard
            title="AI Generated"
            value={stats.aiGenerated.value}
            change={stats.aiGenerated.change}
            trend={stats.aiGenerated.trend}
            icon={Sparkles}
            sparkline={stats.aiGenerated.sparkline}
          />
        </div>

        {/* MAIN LAYOUT GRID */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* LEFT & CENTER LARGE AREA: Analytics, Connected Platforms, Activities */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SECTION 3: Performance Analytics Chart */}
            <PerformanceChart timeseries={timeseries} />

            {/* SECTION 6: Connected Platforms Cards */}
            <Card className="rounded-xl border border-border/50 bg-card/45 backdrop-blur-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">Connected Platforms</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Control platform synchronization and status badges.</p>
                </div>
                <Link href="/dashboard/settings">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold hover:bg-muted/80 rounded-lg">
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
                      className={cn(
                        "group relative flex flex-col justify-between p-3.5 rounded-xl border border-border/50 bg-gradient-to-b bg-card/30 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                        brand.bg
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className={cn("size-8 rounded-lg flex items-center justify-center bg-card shadow-sm border border-border/40 transition-transform duration-300 group-hover:scale-105", brand.text)}>
                          <BrandIcon className="size-4.5" />
                        </div>
                        <Badge
                          variant={account ? "outline" : "secondary"}
                          className={cn(
                            "text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 shrink-0 select-none",
                            account
                              ? account.status === "connected"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {account ? account.status : "Offline"}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{brand.label}</p>
                        <p className="text-xs font-bold text-foreground truncate max-w-full">
                          {account ? account.username : "Unconnected"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {account ? `${account.followers.toLocaleString()} followers` : "0 followers"}
                        </p>
                      </div>

                      <div className="mt-3.5 pt-3.5 border-t border-border/40 flex items-center justify-between">
                        <span className="text-[9px] text-muted-foreground">
                          {account ? "Sync active" : "Available"}
                        </span>
                        {account ? (
                          <button
                            onClick={() => handleSyncPlatform(plat)}
                            disabled={syncingPlatform === plat}
                            className="text-[9px] font-bold text-primary hover:underline flex items-center gap-0.5"
                          >
                            <RefreshCw className={cn("size-2.5 shrink-0", syncingPlatform === plat && "animate-spin")} />
                            Sync
                          </button>
                        ) : (
                          <Link href="/dashboard/settings" className="text-[9px] font-bold text-primary hover:underline flex items-center gap-0.5">
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

            {/* SECTION 7: Recent Activity Feed (Real activities only) */}
            <Card className="rounded-xl border border-border/50 bg-card/45 backdrop-blur-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">Recent Activities</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Audit log of system processes and recent interactions.</p>
                </div>
                <Link href="/dashboard/scheduled">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold hover:bg-muted/80 rounded-lg">
                    History log
                  </Button>
                </Link>
              </CardHeader>
              
              <CardContent className="p-0">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-card/10">
                    <Activity className="size-8 text-muted-foreground/50 mb-2" />
                    <p className="text-xs font-semibold text-muted-foreground">No recent activity detected.</p>
                    <p className="text-[10px] text-muted-foreground/80 max-w-[200px] mt-1">Activities are generated when you schedule or publish content.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {activities.map((act: any) => {
                      const brand = act.platform ? platformBranding[act.platform] : null
                      const timeAgo = new Date(act.time).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                        day: "numeric"
                      })

                      return (
                        <div key={act.id} className="flex items-center gap-3.5 px-4.5 py-3 transition-colors duration-200 hover:bg-muted/30">
                          <div className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full border shadow-sm",
                            act.status === "success" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                            act.status === "failed" && "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
                            act.status === "info" && "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                          )}>
                            {act.status === "success" ? <CheckCircle className="size-4" /> : act.status === "failed" ? <XCircle className="size-4" /> : <Info className="size-4" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground font-medium truncate">
                              {act.details}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {brand && (
                                <Badge variant="outline" className="text-[8px] tracking-wider font-semibold uppercase px-1 py-0 border-border/60 text-muted-foreground flex items-center gap-0.5">
                                  {brand.label}
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground font-semibold uppercase shrink-0">
                                {act.action.replace("_", " ")}
                              </span>
                            </div>
                          </div>

                          <span className="shrink-0 text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
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

          {/* RIGHT SIDE COLUMN: Calendar, AI Command, Workspace Health, Quick Actions */}
          <div className="space-y-6">
            
            {/* SECTION 8: Quick Actions */}
            <Card className="rounded-xl border border-border/50 bg-card/45 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  <PenSquare className="size-4.5 text-primary" />
                  Quick Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0">
                <Link href="/dashboard/create" className="group flex flex-col justify-between p-3.5 rounded-lg border border-border/50 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300">
                  <div className="size-7 rounded-md bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <PenSquare className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground mt-4 block">New Post</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">Design & share</span>
                </Link>

                <Link href="/dashboard/ai-assistant" className="group flex flex-col justify-between p-3.5 rounded-lg border border-border/50 bg-gradient-to-br from-pink-500/5 to-rose-500/5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300">
                  <div className="size-7 rounded-md bg-pink-500/10 text-pink-500 dark:text-pink-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <Sparkles className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground mt-4 block">AI Writer</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">Generate copy</span>
                </Link>

                <Link href="/dashboard/media" className="group flex flex-col justify-between p-3.5 rounded-lg border border-border/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300">
                  <div className="size-7 rounded-md bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <ImageIcon className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground mt-4 block">Media Lib</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">Upload assets</span>
                </Link>

                <Link href="/dashboard/analytics" className="group flex flex-col justify-between p-3.5 rounded-lg border border-border/50 bg-gradient-to-br from-amber-500/5 to-orange-500/5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300">
                  <div className="size-7 rounded-md bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <BarChart3 className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground mt-4 block">Analytics</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">Deep insights</span>
                </Link>
              </CardContent>
            </Card>

            {/* SECTION 4: Upcoming Content Calendar */}
            <Card className="rounded-xl border border-border/50 bg-card/45 backdrop-blur-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">Content Planning</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">Queue status</p>
                </div>
                <Link href="/dashboard/calendar">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold hover:bg-muted/80 rounded-lg">
                    Calendar
                  </Button>
                </Link>
              </CardHeader>
              
              <CardContent className="space-y-4 p-4 pt-0">
                {today.length === 0 && tomorrow.length === 0 && thisWeek.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border/60 rounded-xl bg-card/10">
                    <CalendarCheck className="size-7 text-muted-foreground/50 mb-2" />
                    <p className="text-xs font-semibold text-muted-foreground">Planning queue empty</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-1 mb-3">No scheduled posts scheduled for this week.</p>
                    <Link href="/dashboard/create">
                      <Button size="xs" className="rounded-lg gap-1 font-semibold text-xs">
                        <Plus className="size-3" />
                        Create Post
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* TODAY SECTION */}
                    {today.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Today</span>
                        <div className="space-y-2">
                          {today.map((post: any) => (
                            <div key={post.id} className="rounded-lg border border-border/60 bg-card/10 p-3 flex flex-col justify-between hover:bg-card/30 transition-all">
                              <p className="text-xs font-bold text-foreground leading-normal line-clamp-2">{post.title || post.content}</p>
                              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
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
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Tomorrow</span>
                        <div className="space-y-2">
                          {tomorrow.map((post: any) => (
                            <div key={post.id} className="rounded-lg border border-border/60 bg-card/10 p-3 flex flex-col justify-between hover:bg-card/30 transition-all">
                              <p className="text-xs font-bold text-foreground leading-normal line-clamp-2">{post.title || post.content}</p>
                              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
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
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Later This Week</span>
                        <div className="space-y-2">
                          {thisWeek.map((post: any) => (
                            <div key={post.id} className="rounded-lg border border-border/60 bg-card/10 p-3 flex flex-col justify-between hover:bg-card/30 transition-all">
                              <p className="text-xs font-bold text-foreground leading-normal line-clamp-2">{post.title || post.content}</p>
                              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
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

            {/* SECTION 5: AI Command Center (Strategist Widget) */}
            <Card className="rounded-xl border border-border/50 bg-card/45 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-4.5 text-primary animate-pulse" />
                  AI Strategist Command
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="rounded-lg border border-primary/10 bg-primary/5 p-3 text-xs leading-relaxed">
                  <span className="font-bold text-primary flex items-center gap-1 mb-1">
                    <Brain className="size-3.5" />
                    Posting Time Opportunity
                  </span>
                  Audience retention analytics indicate that <span className="font-semibold text-foreground">educational content</span> performs best on <span className="font-semibold text-foreground">Tuesdays at 11:30 AM</span>. Consider scheduling your next thread.
                </div>

                <div className="rounded-lg border border-border/60 bg-card/15 p-3 text-xs flex flex-col justify-between gap-2.5">
                  <div>
                    <span className="font-bold text-foreground block">Weekly Performance Spike</span>
                    Your LinkedIn engagement rate peaked up <span className="font-semibold text-primary">18%</span> compared to the average. Maintain momentum by posting another visual industry insight.
                  </div>
                  <Button
                    onClick={() => router.push("/dashboard/create")}
                    variant="outline"
                    size="xs"
                    className="w-full text-[10px] font-bold rounded-md bg-background py-1 flex items-center justify-center gap-1"
                  >
                    Draft Visual Post
                    <ChevronRight className="size-3" />
                  </Button>
                </div>

                <div className="rounded-lg border border-border/60 bg-card/15 p-3 text-xs flex flex-col justify-between gap-2.5">
                  <div>
                    <span className="font-bold text-foreground block">Generate Content Opportunities</span>
                    Would you like to build 5 high-converting post ideas derived from your best performing post?
                  </div>
                  <Button
                    onClick={() => router.push("/dashboard/ai-assistant")}
                    className="w-full text-[10px] font-bold rounded-md py-1 flex items-center justify-center gap-1"
                  >
                    Generate Post Ideas
                    <Sparkles className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 9: Workspace Health Indicator */}
            <Card className="rounded-xl border border-border/50 bg-card/45 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  <Activity className="size-4.5 text-primary" />
                  Workspace Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                {/* Connected Accounts limit */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Connected Accounts</span>
                    <span className="text-foreground font-semibold">
                      {workspaceHealth.connectedAccounts} / {workspaceHealth.maxAccounts}
                    </span>
                  </div>
                  <Progress value={(workspaceHealth.connectedAccounts / workspaceHealth.maxAccounts) * 100} className="h-1.5 rounded-full" />
                </div>

                {/* Monthly post quota */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Monthly Post Count</span>
                    <span className="text-foreground font-semibold">
                      {workspaceHealth.postsThisMonth} / {workspaceHealth.maxPostsMonth}
                    </span>
                  </div>
                  <Progress value={(workspaceHealth.postsThisMonth / workspaceHealth.maxPostsMonth) * 100} className="h-1.5 rounded-full" />
                </div>

                {/* Media storage */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <HardDrive className="size-3.5 text-muted-foreground" />
                      Media Storage Space
                    </span>
                    <span className="text-foreground font-semibold">
                      {workspaceHealth.mediaStorageUsed} / {workspaceHealth.mediaStorageLimit} MB
                    </span>
                  </div>
                  <Progress value={(workspaceHealth.mediaStorageUsed / workspaceHealth.mediaStorageLimit) * 100} className="h-1.5 rounded-full" />
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-medium border-t border-border/40 text-muted-foreground">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Team Quota</span>
                    <span className="text-xs text-foreground font-semibold mt-0.5">{workspaceHealth.teamMembers} Members active</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider border-emerald-500/20 text-emerald-600 bg-emerald-500/10 px-2 py-0.5 select-none">
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
