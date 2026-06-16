"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useWorkspace } from "@/components/dashboard/workspace-provider"
import { UpgradeModal } from "@/components/free-user/upgrade-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointerClick,
  BarChart3,
  Clock,
  RefreshCw,
  AlertCircle,
  Plus,
  Sparkles,
  Brain,
  CheckCircle2,
  ChevronRight,
  Users,
  Heart,
  Share2,
  MessageSquare,
  BookOpen,
  AlertTriangle,
  Calendar,
  Layers,
  Activity,
  ShieldCheck,
  HelpCircle,
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  FileText,
  Download,
  Mail
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { PageTransition } from "@/components/dashboard/page-transition"
import { useToast } from "@/components/toast-provider"
import { cn } from "@/lib/utils"
import {
  IconFacebook,
  IconInstagram,
  IconLinkedin,
  IconX,
} from "@/components/social-brand-icons"

// Compact custom TikTok SVG icon
function IconTikTok(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.19.98 1.13 2.37 1.83 3.86 2v3.7c-1.39-.02-2.77-.38-3.95-1.12-.48-.3-.92-.66-1.31-1.07V15c.02 2.15-.7 4.29-2.07 5.92-1.74 2.05-4.47 3.19-7.14 3.06-2.92-.12-5.63-1.92-6.85-4.58-1.46-3.14-.79-7.13 1.63-9.53 1.84-1.84 4.54-2.58 7.02-1.98v3.83c-1.41-.45-3 .02-3.91 1.12-.99 1.16-1.09 2.97-.24 4.24.81 1.25 2.34 1.95 3.82 1.76 1.48-.15 2.74-1.32 2.92-2.8.06-.55.03-1.11.03-1.66V0h.69z" />
    </svg>
  )
}

const platformConfig: Record<string, { label: string; color: string; bg: string; text: string; icon: any }> = {
  facebook: { label: "Facebook", color: "bg-[#1877F2]", bg: "bg-[#1877F2]/10", text: "text-[#1877F2]", icon: IconFacebook },
  instagram: { label: "Instagram", color: "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600", bg: "bg-pink-500/10", text: "text-pink-500", icon: IconInstagram },
  linkedin: { label: "LinkedIn", color: "bg-[#0A66C2]", bg: "bg-[#0A66C2]/10", text: "text-[#0A66C2]", icon: IconLinkedin },
  twitter: { label: "X (Twitter)", color: "bg-zinc-950 dark:bg-zinc-800", bg: "bg-zinc-500/10", text: "text-foreground", icon: IconX },
  tiktok: { label: "TikTok", color: "bg-zinc-950 dark:bg-zinc-800", bg: "bg-rose-500/10", text: "text-rose-500", icon: IconTikTok },
}

// Inline sparkline generator for executive metrics cards
function MiniSparkline({ data, color = "#10b981" }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 120
  const height = 30
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width
    const y = height - ((val - min) / range) * height
    return `${x},${y}`
  }).join(" ")

  return (
    <svg width={width} height={height} className="overflow-visible opacity-85">
      <polyline fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  )
}

// Executive overview card component
function AnalyticsStatsCard({ title, value, change, trend, icon: Icon, sparklineData, color = "text-primary" }: any) {
  const isUp = trend === "up"
  const strokeColor = isUp ? "#10b981" : "#f43f5e"

  return (
    <Card className="rounded-xl border border-border/50 bg-card/60 shadow-sm backdrop-blur-xl">
      <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">{value}</p>
          </div>
          <div className={cn("p-2 rounded-lg bg-primary/10", color)}>
            <Icon className="size-4.5" />
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 pt-1">
          <span className={cn(
            "inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5 ring-1 ring-inset",
            isUp 
              ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20" 
              : "bg-rose-500/10 text-rose-600 ring-rose-500/20"
          )}>
            {isUp ? <TrendingUp className="size-3 shrink-0" /> : <TrendingDown className="size-3 shrink-0" />}
            {change}
          </span>
          
          {sparklineData && sparklineData.length > 0 && (
            <div className="shrink-0">
              <MiniSparkline data={sparklineData} color={strokeColor} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { data: session } = useSession()
  const { activeWorkspace } = useWorkspace()
  
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "12m">("7d")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [rankingsTab, setRankingsTab] = useState<"mostReach" | "mostEngagement" | "mostClicks" | "mostShares" | "mostSaves" | "mostComments">("mostReach")

  // PDF Export States
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [emailing, setEmailing] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  // Interactive Chart state
  const [activeChartSeries, setActiveChartSeries] = useState<"reach" | "engagement" | "clicks">("reach")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [chartDimensions, setChartDimensions] = useState({ width: 600, height: 300 })

  const getChartImage = (): Promise<string | undefined> => {
    return new Promise((resolve) => {
      try {
        const svgElement = svgRef.current
        if (!svgElement) {
          resolve(undefined)
          return
        }

        const svgString = new XMLSerializer().serializeToString(svgElement)
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
        const url = URL.createObjectURL(svgBlob)
        
        const img = new Image()
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas")
            canvas.width = svgElement.clientWidth || 600
            canvas.height = svgElement.clientHeight || 280
            const ctx = canvas.getContext("2d")
            if (ctx) {
              ctx.fillStyle = "#ffffff"
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.drawImage(img, 0, 0)
              const dataUrl = canvas.toDataURL("image/png")
              URL.revokeObjectURL(url)
              resolve(dataUrl)
            } else {
              URL.revokeObjectURL(url)
              resolve(undefined)
            }
          } catch (e) {
            console.error(e)
            URL.revokeObjectURL(url)
            resolve(undefined)
          }
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          resolve(undefined)
        }
        img.src = url
      } catch (err) {
        console.error("Failed to capture chart SVG:", err)
        resolve(undefined)
      }
    })
  }

  const handleExportClick = () => {
    const isPro = session?.user?.plan === "PRO"
    const isAdmin = session?.user?.role === "ADMIN"

    if (!isPro && !isAdmin) {
      setUpgradeOpen(true)
    } else {
      setExportModalOpen(true)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setExporting(true)
      showToast("Generating PDF report...", "info")
      
      const chartImg = await getChartImage()
      
      const res = await fetch("/api/analytics/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeframe,
          deliveryMethod: "download",
          chartImage: chartImg,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || "Failed to download PDF report")
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `GrowWave_Report_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      showToast("PDF report downloaded successfully!", "success")
      setExportModalOpen(false)
    } catch (err: any) {
      console.error(err)
      showToast(err.message || "Could not generate PDF report", "error")
    } finally {
      setExporting(false)
    }
  }

  const handleEmailReport = async () => {
    try {
      setEmailing(true)
      showToast("Preparing and sending email report...", "info")
      
      const chartImg = await getChartImage()
      
      const res = await fetch("/api/analytics/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeframe,
          deliveryMethod: "email",
          chartImage: chartImg,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Failed to send email report")
      }

      showToast(`Report emailed to workspace owner: ${json.emailSentTo}`, "success")
      setExportModalOpen(false)
    } catch (err: any) {
      console.error(err)
      showToast(err.message || "Could not email PDF report", "error")
    } finally {
      setEmailing(false)
    }
  }

  const fetchAnalytics = async (frame = timeframe) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/analytics?timeframe=${frame}`)
      if (!res.ok) throw new Error("Failed to load analytics payload")
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      console.error(err)
      showToast(err.message || "Unable to reach database server", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  // Track resizing for SVG responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current && svgRef.current.parentElement) {
        setChartDimensions({
          width: svgRef.current.parentElement.clientWidth,
          height: 280
        })
      }
    }
    
    if (data?.hasPublishedPosts) {
      handleResize()
      window.addEventListener("resize", handleResize)
    }
    return () => window.removeEventListener("resize", handleResize)
  }, [data])

  const handleSyncAnalytics = async () => {
    setSyncing(true)
    try {
      const res = await fetch("/api/analytics", { method: "POST" })
      const json = await res.json()
      if (res.ok) {
        showToast("Analytics synchronized with platform feeds!", "success")
        fetchAnalytics()
      } else {
        showToast(json.error || "Sync audit failed", "error")
      }
    } catch {
      showToast("Synchronization request timed out", "error")
    } finally {
      setSyncing(false)
    }
  }

  // SKELETON LOADING UI
  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted/60 rounded-lg" />
            <div className="h-4 w-72 bg-muted/50 rounded-md" />
          </div>
          <div className="h-9 w-32 bg-muted/65 rounded-xl" />
        </div>
        
        <div className="h-16 w-full bg-muted/30 rounded-xl" />
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted/40 rounded-xl" />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-80 bg-muted/30 rounded-xl" />
            <div className="h-72 bg-muted/35 rounded-xl" />
          </div>
          <div className="space-y-6">
            <div className="h-[360px] bg-muted/30 rounded-xl" />
            <div className="h-48 bg-muted/30 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // EMPTY STATE UI
  if (data && !data.hasPublishedPosts) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/30 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time engagement metrics across connected channels.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono py-0.5 px-2 bg-amber-500/10 text-amber-600 border-amber-500/20">
                Awaiting First Index
              </Badge>
              <Button onClick={handleSyncAnalytics} disabled={syncing} size="sm" className="rounded-xl border border-border/60 hover:bg-muted bg-background text-foreground hover:text-foreground">
                <RefreshCw className={cn("size-3.5 mr-2", syncing && "animate-spin")} />
                Refresh Channels
              </Button>
            </div>
          </div>

          {/* Connect Accounts Health Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/20 border border-border/40 rounded-xl">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Credentials Heath check:</span>
            {data.accounts.length === 0 ? (
              <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                <AlertTriangle className="size-3" /> No channels connected yet. Configure endpoints to start publishing.
              </span>
            ) : (
              data.accounts.map((acc: any) => {
                const config = platformConfig[acc.platform]
                const Icon = config.icon
                return (
                  <Badge key={acc.platform} variant="outline" className="text-[9px] gap-1 py-0.5 px-1.5 border-border/60 text-muted-foreground bg-card/60">
                    <Icon className="size-2.5" />
                    {acc.username}
                    <span className="size-1.5 rounded-full bg-emerald-500 ml-0.5" />
                  </Badge>
                )
              })
            )}
          </div>

          {/* Premium Glassmorphic Empty State Frame */}
          <div className="flex flex-col items-center justify-center text-center p-12 py-16 border border-border/40 rounded-2xl bg-gradient-to-b from-card/80 to-card/20 backdrop-blur-xl shadow-lg space-y-6 max-w-4xl mx-auto">
            <div className="p-4 bg-primary/5 rounded-full ring-8 ring-primary/2 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-25" />
              <Activity className="size-10 text-primary" />
            </div>
            
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-bold text-foreground tracking-tight">Publish your first post to unlock analytics</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Before we can index unified statistics, perform period trends comparison, and generate customized OpenAI strategy observations, you need to publish at least one post through GrowWave.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg pt-2">
              <Link href="/dashboard/create" className="w-full">
                <Button size="sm" className="w-full rounded-xl gap-1.5 font-bold shadow-sm">
                  <Plus className="size-4" /> Create First Post
                </Button>
              </Link>
              <Link href="/dashboard/ai-assistant" className="w-full">
                <Button size="sm" variant="outline" className="w-full rounded-xl gap-1.5 font-bold border-border/60">
                  <Sparkles className="size-4 text-pink-500" /> Generate AI Ideas
                </Button>
              </Link>
            </div>

            <div className="border-t border-border/30 pt-6 w-full mt-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-4">Supported Social Architectures</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-2xl mx-auto">
                {Object.entries(platformConfig).map(([id, config]) => (
                  <div key={id} className="flex flex-col items-center p-3.5 border border-border/50 bg-card rounded-xl shadow-xs">
                    <div className={cn("size-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm", config.color)}>
                      <config.icon className="size-4" />
                    </div>
                    <span className="text-[10px] font-bold text-foreground mt-2">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  // MAIN ANALYTICS HUB DATA DESTRUCTURE
  const {
    overview,
    timeseries,
    platformDetails,
    topPerformingContent,
    rankings,
    audienceDetails,
    publishingInsights,
    aiIntelligence,
    contentRecommendations,
    audienceBehavior,
    syncSystem
  } = data

  // SVG Area Chart Coordinate math
  const count = timeseries.length
  const maxReach = Math.max(...timeseries.map((d: any) => d.reach)) || 100
  const maxEngagement = Math.max(...timeseries.map((d: any) => d.engagement)) || 10
  const maxClicks = Math.max(...timeseries.map((d: any) => d.clicks)) || 5

  const activeMaxVal = activeChartSeries === "reach" 
    ? maxReach 
    : activeChartSeries === "engagement"
      ? maxEngagement
      : maxClicks

  const maxVal = activeMaxVal * 1.15 || 100

  const paddingLeft = 55
  const paddingRight = 15
  const paddingTop = 25
  const paddingBottom = 35

  const chartWidth = chartDimensions.width - paddingLeft - paddingRight
  const chartHeight = chartDimensions.height - paddingTop - paddingBottom

  const getX = (index: number) => {
    if (count <= 1) return paddingLeft
    return paddingLeft + (index / (count - 1)) * chartWidth
  }

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / maxVal) * chartHeight
  }

  // Draw Area Paths
  let strokePath = ""
  let fillAreaPath = ""

  if (count > 1) {
    const points = timeseries.map((d: any, i: number) => {
      const val = activeChartSeries === "reach" 
        ? d.reach 
        : activeChartSeries === "engagement"
          ? d.engagement
          : d.clicks
      return { x: getX(i), y: getY(val) }
    })

    strokePath = points.map((p: any, i: number) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    fillAreaPath = `${strokePath} L ${getX(count - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${paddingTop + chartHeight} Z`
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current || count === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left

    let nearestIdx = 0
    let minDiff = Infinity

    for (let i = 0; i < count; i++) {
      const x = getX(i)
      const diff = Math.abs(x - mouseX)
      if (diff < minDiff) {
        minDiff = diff
        nearestIdx = i
      }
    }

    setHoveredIndex(nearestIdx)
    const activeVal = activeChartSeries === "reach"
      ? timeseries[nearestIdx].reach
      : activeChartSeries === "engagement"
        ? timeseries[nearestIdx].engagement
        : timeseries[nearestIdx].clicks

    const tooltipX = getX(nearestIdx)
    const tooltipY = getY(activeVal) - 95

    setTooltipPos({
      x: Math.max(paddingLeft - 10, Math.min(chartDimensions.width - 150, tooltipX - 70)),
      y: Math.max(10, tooltipY)
    })
  }

  const gridLinesCount = 5
  const gridLines = Array.from({ length: gridLinesCount }, (_, i) => {
    const ratio = i / (gridLinesCount - 1)
    const val = maxVal * ratio
    const y = getY(val)
    return { y, val }
  })

  const formatYValue = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return Math.round(num).toString()
  }

  const getLabelStep = () => {
    if (timeframe === "7d") return 1
    if (timeframe === "30d") return 5
    if (timeframe === "90d") return 15
    return 2
  }

  const labelStep = getLabelStep()
  const hoveredPoint = hoveredIndex !== null ? timeseries[hoveredIndex] : null

  return (
    <PageTransition>
      <div className="space-y-6">
        
        {/* HEADER & SYNC SYSTEM ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/30 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Intelligence Center</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Synced statistics aggregated on {new Date(syncSystem.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} via {syncSystem.source}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 self-start sm:self-auto">
            {/* Timeframe selector tabs */}
            <div className="flex bg-muted/65 p-0.5 rounded-xl border border-border/35">
              {[
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30d" },
                { id: "90d", label: "90d" },
                { id: "12m", label: "12 Months" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTimeframe(tab.id as any)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-semibold tracking-wide transition-all",
                    timeframe === tab.id
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Button onClick={handleSyncAnalytics} disabled={syncing} size="sm" className="rounded-xl font-bold shadow-sm shadow-primary/5">
              <RefreshCw className={cn("size-3.5 mr-1.5", syncing && "animate-spin")} />
              Sync Feeds
            </Button>

            <Button
              onClick={handleExportClick}
              variant="outline"
              size="sm"
              className="rounded-xl border border-border/70 bg-white text-slate-800 hover:bg-slate-50 shadow-sm shadow-primary/5 transition-all font-semibold"
            >
              <FileText className="size-3.5 mr-1.5 text-emerald-500 fill-emerald-500/10" />
              📄 Export PDF Report
            </Button>
          </div>
        </div>

        {/* SECTION 1: EXECUTIVE OVERVIEW */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnalyticsStatsCard
            title="Total Reach"
            value={overview.reach.value}
            change={overview.reach.change}
            trend={overview.reach.trend}
            icon={Eye}
            sparklineData={timeseries.map((d: any) => d.reach)}
            color="text-[#10b981]"
          />
          <AnalyticsStatsCard
            title="Total Engagement"
            value={overview.engagement.value}
            change={overview.engagement.change}
            trend={overview.engagement.trend}
            icon={TrendingUp}
            sparklineData={timeseries.map((d: any) => d.engagement)}
            color="text-[#6366f1]"
          />
          <AnalyticsStatsCard
            title="Followers Growth"
            value={overview.followers.value}
            change={overview.followers.change}
            trend={overview.followers.trend}
            icon={Users}
            sparklineData={timeseries.map((d: any) => d.followersGrowth)}
            color="text-[#0A66C2]"
          />
          <AnalyticsStatsCard
            title="Clicks"
            value={overview.clicks.value}
            change={overview.clicks.change}
            trend={overview.clicks.trend}
            icon={MousePointerClick}
            sparklineData={timeseries.map((d: any) => d.clicks)}
            color="text-[#f59e0b]"
          />
        </div>

        {/* INTEGRATION QUOTA METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 p-3.5 bg-muted/20 border border-border/40 rounded-xl text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary pointer-events-none hover:bg-primary/10">{overview.publishedCount}</Badge>
            <span className="text-muted-foreground">Published campaigns</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-500/10 text-indigo-500 pointer-events-none hover:bg-indigo-500/10">{overview.scheduledCount}</Badge>
            <span className="text-muted-foreground">Scheduled in calendar</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-600 pointer-events-none hover:bg-emerald-500/10">{overview.publishedCount + overview.scheduledCount + overview.draftPostsCount}</Badge>
            <span className="text-muted-foreground">Total database posts</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-pink-500/10 text-pink-500 pointer-events-none hover:bg-pink-500/10">{overview.aiPostsCount}</Badge>
            <span className="text-muted-foreground">AI Intelligence calls</span>
          </div>
        </div>

        {/* MIDDLE LARGE LAYOUT GRID */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* LEFT LARGE AREA: Timeseries SVG, rankings tables, platform cards */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SECTION 2: PERFORMANCE OVERVIEW AREA CHART */}
            <Card className="rounded-xl border border-border/50 bg-card/45 backdrop-blur-md">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">Performance Trends</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Chronological organic metrics comparison.</p>
                </div>
                
                {/* Series toggles */}
                <div className="flex bg-muted/65 p-0.5 rounded-lg border border-border/30 text-[10px] font-bold">
                  {[
                    { id: "reach", label: "Reach", dot: "bg-emerald-500" },
                    { id: "engagement", label: "Engagement", dot: "bg-indigo-500" },
                    { id: "clicks", label: "Clicks", dot: "bg-amber-500" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveChartSeries(s.id as any)
                        setHoveredIndex(null)
                      }}
                      className={cn(
                        "rounded-md px-2.5 py-1 flex items-center gap-1 cursor-pointer transition-all",
                        activeChartSeries === s.id
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", s.dot)} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              
              <CardContent className="relative p-0 sm:px-4 pb-4 overflow-visible">
                {/* SVG canvas */}
                <svg
                  ref={svgRef}
                  width={chartDimensions.width}
                  height={chartDimensions.height}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="overflow-visible select-none cursor-crosshair"
                >
                  <defs>
                    <linearGradient id="chartReachGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="chartEngGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="chartClickGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {gridLines.map((line, i) => (
                    <g key={i} className="opacity-40">
                      <line
                        x1={paddingLeft}
                        y1={line.y}
                        x2={chartDimensions.width - paddingRight}
                        y2={line.y}
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        className="text-border/60"
                      />
                      <text
                        x={paddingLeft - 10}
                        y={line.y + 4}
                        textAnchor="end"
                        className="fill-muted-foreground text-[10px] font-semibold"
                      >
                        {formatYValue(line.val)}
                      </text>
                    </g>
                  ))}

                  {/* Draw Lines */}
                  {count > 1 && (
                    <>
                      <path
                        d={fillAreaPath}
                        fill={
                          activeChartSeries === "reach"
                            ? "url(#chartReachGrad)"
                            : activeChartSeries === "engagement"
                              ? "url(#chartEngGrad)"
                              : "url(#chartClickGrad)"
                        }
                      />
                      <path
                        d={strokePath}
                        fill="none"
                        stroke={
                          activeChartSeries === "reach"
                            ? "#10b981"
                            : activeChartSeries === "engagement"
                              ? "#6366f1"
                              : "#f59e0b"
                        }
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* X Labels */}
                      {timeseries.map((d: any, i: number) => {
                        if (i % labelStep !== 0 && i !== count - 1) return null
                        return (
                          <text
                            key={i}
                            x={getX(i)}
                            y={chartDimensions.height - paddingBottom + 20}
                            textAnchor="middle"
                            className="fill-muted-foreground text-[10px] font-semibold"
                          >
                            {d.date}
                          </text>
                        )
                      })}

                      {/* Hover Node highlight */}
                      {hoveredIndex !== null && (
                        <g>
                          <line
                            x1={getX(hoveredIndex)}
                            y1={paddingTop}
                            x2={getX(hoveredIndex)}
                            y2={paddingTop + chartHeight}
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-muted-foreground/30"
                          />
                          <circle
                            cx={getX(hoveredIndex)}
                            cy={getY(
                              activeChartSeries === "reach"
                                ? timeseries[hoveredIndex].reach
                                : activeChartSeries === "engagement"
                                  ? timeseries[hoveredIndex].engagement
                                  : timeseries[hoveredIndex].clicks
                            )}
                            r="5"
                            fill={
                              activeChartSeries === "reach"
                                ? "#10b981"
                                : activeChartSeries === "engagement"
                                  ? "#6366f1"
                                  : "#f59e0b"
                            }
                            stroke="#fff"
                            strokeWidth="1.8"
                          />
                        </g>
                      )}
                    </>
                  )}
                </svg>

                {/* Floating Tooltip */}
                {hoveredIndex !== null && hoveredPoint && (
                  <div
                    className="absolute z-10 pointer-events-none rounded-lg border border-border bg-background/95 p-3 shadow-xl backdrop-blur-xs flex flex-col gap-1 w-[140px] text-xs font-semibold"
                    style={{
                      left: `${tooltipPos.x}px`,
                      top: `${tooltipPos.y}px`
                    }}
                  >
                    <span className="text-[10px] text-muted-foreground uppercase border-b border-border/40 pb-1 mb-1 block font-bold">
                      {hoveredPoint.date}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reach</span>
                      <span className="font-bold text-foreground">{hoveredPoint.reach.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Engagement</span>
                      <span className="font-bold text-foreground">{hoveredPoint.engagement.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Clicks</span>
                      <span className="font-bold text-foreground">{hoveredPoint.clicks.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SECTION 3: PLATFORM PERFORMANCE CARDS */}
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-3">Channel Analytics Distribution</span>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
                {platformDetails.map((pd: any) => {
                  const config = platformConfig[pd.platform]
                  const Icon = config.icon
                  const hasAccount = pd.status === "connected"

                  return (
                    <div
                      key={pd.platform}
                      className={cn(
                        "group flex flex-col justify-between p-3.5 rounded-xl border border-border/50 bg-card/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 relative",
                        hasAccount && "ring-1 ring-primary/5 hover:bg-primary/[0.005]"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className={cn("size-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm", config.color)}>
                          <Icon className="size-4.5" />
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] font-bold tracking-wide uppercase px-1.5 py-0.5 shrink-0 select-none",
                            hasAccount
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {hasAccount ? "Synced" : "Offline"}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{config.label}</p>
                        <p className="text-xs font-bold text-foreground leading-none truncate max-w-full">
                          {hasAccount ? `${(pd.followers || 0).toLocaleString()}` : "Unconnected"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {hasAccount ? "Followers" : "Available"}
                        </p>
                      </div>

                      <div className="mt-3.5 pt-3.5 border-t border-border/40 flex items-center justify-between text-[9px] font-semibold">
                        <span className="text-muted-foreground">
                          {hasAccount && pd.lastSync ? new Date(pd.lastSync).toLocaleDateString() : "No sync"}
                        </span>
                        {hasAccount ? (
                          <span className="text-primary hover:underline flex items-center gap-0.5">
                            Active
                          </span>
                        ) : (
                          <Link href="/dashboard/settings" className="text-primary hover:underline flex items-center gap-0.5">
                            Connect
                            <ChevronRight className="size-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* SECTION 4: TOP PERFORMING CONTENT */}
            <Card className="rounded-xl border border-border/50 bg-card/45 backdrop-blur-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border/30">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">Top Performing Content</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Your highest converting published campaigns ranked by reach.</p>
                </div>
                <Badge variant="outline" className="border-border/60 text-muted-foreground">Real-time Feed</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {topPerformingContent.slice(0, 5).map((post: any, idx: number) => (
                    <div key={post.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <span className="text-xs font-bold text-muted-foreground/80 font-mono w-5">#{idx + 1}</span>
                        {post.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.thumbnail} alt="" className="size-11 rounded-lg object-cover border border-border/50 shrink-0 shadow-sm" />
                        ) : (
                          <div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-border/50">
                            <BookOpen className="size-4.5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate max-w-sm sm:max-w-md">{post.title || post.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {post.platforms.map((plat: string) => {
                              const config = platformConfig[plat]
                              if (!config) return null
                              const Icon = config.icon
                              return (
                                <Badge key={plat} variant="outline" className="text-[8px] font-bold uppercase tracking-wider py-0 px-1 border-border/60 text-muted-foreground bg-card/60 flex items-center gap-0.5">
                                  <Icon className="size-2 shrink-0" />
                                  {config.label}
                                </Badge>
                              )
                            })}
                            <span className="text-[9px] text-muted-foreground font-semibold">
                              Published {new Date(post.publishDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 sm:gap-8 self-end sm:self-auto shrink-0 font-mono text-xs font-bold text-foreground">
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block font-sans">Reach</span>
                          {post.reach.toLocaleString()}
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block font-sans">Likes</span>
                          {post.likes.toLocaleString()}
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block font-sans">Clicks</span>
                          {post.clicks.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SECTION 5: CONTENT PERFORMANCE RANKINGS */}
            <Card className="rounded-xl border border-border/50 bg-card/45 backdrop-blur-md">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="text-base font-semibold text-foreground">Content Rankings Leaderboard</CardTitle>
                <CardDescription className="text-xs">
                  Inspect top 10 social campaigns indexed under key engagement series.
                </CardDescription>
                
                <div className="flex flex-wrap bg-muted/65 p-0.5 rounded-lg border border-border/35 mt-3 text-[10px] font-bold">
                  {[
                    { id: "mostReach", label: "Most Reach" },
                    { id: "mostEngagement", label: "Most Engagement" },
                    { id: "mostClicks", label: "Most Clicks" },
                    { id: "mostShares", label: "Most Shares" },
                    { id: "mostSaves", label: "Most Saves" },
                    { id: "mostComments", label: "Most Comments" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setRankingsTab(tab.id as any)}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 transition-all cursor-pointer",
                        rankingsTab === tab.id
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {rankings[rankingsTab].map((post: any, idx: number) => {
                    const renderRankVal = () => {
                      if (rankingsTab === "mostReach") return `${post.reach.toLocaleString()} reach`
                      if (rankingsTab === "mostEngagement") return `${post.engagement.toLocaleString()} engagement`
                      if (rankingsTab === "mostClicks") return `${post.clicks.toLocaleString()} clicks`
                      if (rankingsTab === "mostShares") return `${post.shares.toLocaleString()} shares`
                      if (rankingsTab === "mostSaves") return `${post.saves.toLocaleString()} saves`
                      return `${post.comments.toLocaleString()} comments`
                    }

                    return (
                      <div key={post.id} className="flex items-center justify-between gap-4 px-4.5 py-3 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <span className="text-xs font-bold text-muted-foreground/80 font-mono w-5">#{idx + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate max-w-md">{post.title || post.content}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wide">
                              {post.platforms.join(" • ")}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-primary font-mono bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
                          {renderRankVal()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: AI strategists, audience behaviors, calendar heat indices */}
          <div className="space-y-6">
            
            {/* SECTION 8 & 9: AI INTELLIGENCE CENTER */}
            <Card className="rounded-xl border border-indigo-500/15 bg-gradient-to-br from-indigo-500/5 via-purple-500/2 to-card/50 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <CardHeader className="pb-3 border-b border-border/30 relative">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-500 shrink-0 animate-pulse">
                    <Brain className="size-4 shrink-0" />
                  </div>
                  AI Insights & Recommendations
                </CardTitle>
                <CardDescription className="text-xs">
                  AI-generated recommendations and performance insights.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 relative">
                {/* Pulse glowing micro actions info */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">AI Insights</span>
                  {aiIntelligence.map((ins: string, idx: number) => (
                    <div key={idx} className="flex gap-2.5 p-3 rounded-lg border border-border/50 bg-card text-xs leading-relaxed font-semibold">
                      <div className="size-5 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 font-bold">
                        {idx + 1}
                      </div>
                      <span className="text-foreground/90">{ins}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/30 pt-4 space-y-3">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">AI Recommendations</span>
                  {contentRecommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg border border-border/60 bg-muted/10 space-y-1.5 text-xs font-semibold">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground flex items-center gap-1">
                          <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                          {rec.title}
                        </span>
                        <Badge variant="outline" className="text-[8px] uppercase tracking-wider font-semibold py-0 border-primary/20 text-primary">
                          {rec.type}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{rec.desc}</p>
                    </div>
                  ))}
                </div>

                <Link href="/dashboard/ai-assistant" className="block pt-1">
                  <Button size="xs" className="w-full rounded-lg font-bold text-xs">
                    Open AI Assistant Command
                    <Sparkles className="size-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* SECTION 7: PUBLISHING INSIGHTS */}
            <Card className="rounded-xl border border-border/50 bg-card/45 backdrop-blur-md">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="size-4 text-primary shrink-0" />
                  Publishing Insights
                </CardTitle>
                <CardDescription className="text-xs">
                  Derived from chronological database records.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs font-semibold">
                
                {/* Insights metrics row grid */}
                <div className="grid grid-cols-3 gap-2 text-center bg-muted/30 border border-border/40 py-2.5 rounded-xl">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Avg Reach</span>
                    <span className="text-sm font-bold text-foreground font-mono mt-0.5 block">{publishingInsights.avgReach.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Engagement</span>
                    <span className="text-sm font-bold text-foreground font-mono mt-0.5 block">{publishingInsights.avgEngagement}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Click Rate</span>
                    <span className="text-sm font-bold text-foreground font-mono mt-0.5 block">{publishingInsights.avgClickRate}%</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between p-2.5 border border-border/40 rounded-lg bg-card/30">
                    <span className="text-muted-foreground">Best Posting Day</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/10 rounded-lg font-bold">{publishingInsights.bestDay}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2.5 border border-border/40 rounded-lg bg-card/30">
                    <span className="text-muted-foreground">Best Posting Hour</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/10 rounded-lg font-bold">{publishingInsights.bestHour}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2.5 border border-border/40 rounded-lg bg-card/30">
                    <span className="text-muted-foreground">Worst Performing Day</span>
                    <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/10 rounded-lg font-bold">{publishingInsights.worstDay}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 6: AUDIENCE GROWTH & ACTIVITY */}
            <Card className="rounded-xl border border-border/50 bg-card/45 backdrop-blur-md">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="size-4 text-primary shrink-0" />
                  Audience Cohorts Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs font-semibold">
                
                {/* Growth Rates metrics */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Followers Growth Velocity</span>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs font-bold text-foreground">
                    <div className="bg-muted/20 border border-border/40 rounded-lg p-2 text-center">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans block">Daily</span>
                      +{audienceDetails.growthRate.daily}
                    </div>
                    <div className="bg-muted/20 border border-border/40 rounded-lg p-2 text-center">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans block">Weekly</span>
                      +{audienceDetails.growthRate.weekly}
                    </div>
                    <div className="bg-muted/20 border border-border/40 rounded-lg p-2 text-center">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans block">Monthly</span>
                      +{audienceDetails.growthRate.monthly}
                    </div>
                  </div>
                </div>

                {/* Audience active time grid visualization */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Audience Activity Density</span>
                  <div className="flex items-end gap-1 h-14 pt-2 bg-muted/10 border border-border/40 rounded-xl px-2">
                    {audienceDetails.activityByHour.filter((_: any, idx: number) => idx % 2 === 0).map((act: any, i: number) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full bg-primary/75 rounded-sm transition-all group-hover:bg-primary"
                          style={{ height: `${(act.activityPercentage / 100) * 40}px` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[8px] font-bold text-muted-foreground px-1 uppercase">
                    <span>12 AM</span>
                    <span>6 AM</span>
                    <span>12 PM</span>
                    <span>6 PM</span>
                    <span>11 PM</span>
                  </div>
                </div>

                {/* Audience retention progress bars */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Cohorts Retention</span>
                  <div className="space-y-2">
                    {audienceDetails.retention.slice(0, 3).map((ret: any) => (
                      <div key={ret.week} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground font-semibold">{ret.week} Retention</span>
                          <span className="text-foreground font-bold">{ret.retention}%</span>
                        </div>
                        <Progress value={ret.retention} className="h-1.5 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 10: AUDIENCE BEHAVIOR INTERACTIVES */}
            <Card className="rounded-xl border border-border/50 bg-card/45 backdrop-blur-md">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="size-4 text-primary shrink-0" />
                  Audience Behavior Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs font-semibold">
                
                {/* Interaction breakdown charts */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Engagement Shares Breakdown</span>
                  <div className="h-4 w-full flex overflow-hidden rounded-full border border-border/50 shadow-inner">
                    <div className="bg-emerald-500 h-full" style={{ width: `${audienceBehavior.interactionPattern.likesPercentage}%` }} title="Likes" />
                    <div className="bg-indigo-500 h-full" style={{ width: `${audienceBehavior.interactionPattern.commentsPercentage}%` }} title="Comments" />
                    <div className="bg-amber-500 h-full" style={{ width: `${audienceBehavior.interactionPattern.sharesPercentage}%` }} title="Shares" />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold uppercase">
                    <span className="text-emerald-500 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Likes {audienceBehavior.interactionPattern.likesPercentage}%
                    </span>
                    <span className="text-indigo-500 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-indigo-500" />
                      Comments {audienceBehavior.interactionPattern.commentsPercentage}%
                    </span>
                    <span className="text-amber-500 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      Shares {audienceBehavior.interactionPattern.sharesPercentage}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Audience Channel Sentiment</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-medium bg-muted/20 border border-border/40 p-2.5 rounded-lg">
                    {audienceBehavior.platformPreferences}
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

        {/* Export Modal & Upgrade Modal */}
        <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
          <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-card border border-border">
            <DialogHeader className="pb-3 border-b border-border/40">
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileText className="size-5 text-emerald-500" /> Export Analytics Report
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Choose your preferred delivery format for the workspace report.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="rounded-xl bg-muted/30 p-3.5 border border-border/40 space-y-1 text-xs">
                <span className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider block">Report Workspace</span>
                <p className="font-semibold text-foreground">{activeWorkspace?.name || "Social_media Workspace"}</p>
                
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/30 text-muted-foreground">
                  <span>Timeframe:</span>
                  <span className="font-bold text-foreground capitalize">
                    {timeframe === "7d" ? "Last 7 Days" : timeframe === "30d" ? "Last 30 Days" : timeframe === "90d" ? "Last 90 Days" : "Last 12 Months"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={exporting || emailing}
                  className="flex flex-col items-center justify-center p-4 border border-border/60 rounded-xl bg-card hover:bg-muted/40 hover:border-primary/45 transition-all text-center gap-2 group cursor-pointer disabled:opacity-50"
                >
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    {exporting ? <RefreshCw className="size-5 animate-spin" /> : <Download className="size-5" />}
                  </div>
                  <span className="font-bold text-xs text-foreground">Export PDF</span>
                  <span className="text-[10px] text-muted-foreground">Download to device</span>
                </button>

                <button
                  onClick={handleEmailReport}
                  disabled={exporting || emailing}
                  className="flex flex-col items-center justify-center p-4 border border-border/60 rounded-xl bg-card hover:bg-muted/40 hover:border-primary/45 transition-all text-center gap-2 group cursor-pointer disabled:opacity-50"
                >
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:scale-105 transition-transform">
                    {emailing ? <RefreshCw className="size-5 animate-spin" /> : <Mail className="size-5" />}
                  </div>
                  <span className="font-bold text-xs text-foreground">Send Report</span>
                  <span className="text-[10px] text-muted-foreground">Email Workspace Owner</span>
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason="analytics_pro" />

      </div>
    </PageTransition>
  )
}
