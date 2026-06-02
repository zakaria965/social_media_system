"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  MessageSquare,
  Search,
  MoreHorizontal,
  Send,
  Sparkles,
  User,
  Heart,
  TrendingUp,
  AlertTriangle,
  Clock,
  Inbox,
  Filter,
  Check,
  ChevronRight,
  Menu,
  X,
  RefreshCw,
  Tag,
  Loader2,
  HelpCircle,
  ShieldCheck,
  Volume2,
  Trash2,
  Calendar,
  ThumbsUp,
  Share2,
  ArrowLeft,
  Info,
  CheckCircle2,
  Brain,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/dashboard/page-transition"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/toast-provider"

// Brands SVG icons
function IconFacebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} style={props.style}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function IconInstagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} style={props.style}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function IconLinkedin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} style={props.style}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} style={props.style}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function IconTiktok(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} style={props.style}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.18 1.02 1.22 2.44 2.01 3.98 2.23V10.3c-1.8-.08-3.5-.88-4.68-2.22-.09-.1-.17-.21-.25-.32v7.14c-.03 2.1-.88 4.16-2.4 5.56-1.74 1.6-4.22 2.37-6.57 2.02-2.73-.41-5.11-2.42-5.91-5.1-.89-3-.07-6.38 2.1-8.5 1.76-1.72 4.25-2.45 6.64-1.92v3.91c-1.3-.43-2.77-.14-3.8.74-.98.83-1.42 2.14-1.2 3.4.22 1.3 1.1 2.4 2.33 2.8 1.28.4 2.7.07 3.6-.85.83-.87 1.21-2.07 1.15-3.26l.01-13.88z" />
    </svg>
  )
}

const platformConfig: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  facebook: { label: "Facebook", color: "text-[#1877F2]", bg: "bg-[#1877F2]/10", icon: IconFacebook },
  instagram: { label: "Instagram", color: "text-pink-500", bg: "bg-pink-500/10", icon: IconInstagram },
  linkedin: { label: "LinkedIn", color: "text-[#0A66C2]", bg: "bg-[#0A66C2]/10", icon: IconLinkedin },
  twitter: { label: "X (Twitter)", color: "text-zinc-900 dark:text-white", bg: "bg-zinc-950/10 dark:bg-white/10", icon: IconX },
  tiktok: { label: "TikTok", color: "text-rose-500", bg: "bg-rose-500/10", icon: IconTiktok },
}

interface SocialActivityData {
  _id: string
  platform: string
  postId: string | null
  type: "comment" | "like" | "share" | "mention" | "reaction" | "retweet" | "message"
  profileName: string
  profileAvatar: string
  text: string
  timestamp: string
  postTitle: string
  postContent: string
  replies: Array<{
    senderName: string
    senderAvatar: string
    text: string
    timestamp: string
  }>
  sentiment: "positive" | "neutral" | "negative"
  isComplaint: boolean
  isOpportunity: boolean
  faqQuestion?: string
  read: boolean
}

interface ActivityMetrics {
  comments: number
  likes: number
  shares: number
  mentions: number
  messages: number
  reactions: number
  followers: number
  engagementRate: number
  responseRate: number
  growth: string
}

export default function InboxPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { showToast } = useToast()

  // App Core States
  const [loading, setLoading] = useState(true)
  const [hasAccounts, setHasAccounts] = useState(false)
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  
  // Platform Manual Selection Step
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null) // null = Splash selector open

  // Social activities states
  const [activities, setActivities] = useState<SocialActivityData[]>([])
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null)

  // Filters State
  const [filterType, setFilterType] = useState<string>("all") // all, comments, likes, shares, mentions, messages, reactions
  const [filterDate, setFilterDate] = useState<string>("7d") // today, 7d, 30d
  const [searchQuery, setSearchQuery] = useState("")

  // Engagement Inspector Panel State
  const [activeActivity, setActiveActivity] = useState<SocialActivityData | null>(null)
  const [replyText, setReplyText] = useState("")
  const [submittingReply, setSubmittingReply] = useState(false)

  // AI Intelligence Panel state
  const [showAiInsights, setShowAiInsights] = useState(false)
  const [loadingAiSummary, setLoadingAiSummary] = useState(false)
  const [aiSummary, setAiSummary] = useState("")
  const [aiSentimentStats, setAiSentimentStats] = useState({ positive: 0, neutral: 0, negative: 0 })
  const [aiFaqs, setAiFaqs] = useState<Array<{ q: string; a: string }>>([])
  const [aiTrends, setAiTrends] = useState<Array<{ topic: string; percentage: number }>>([])
  
  // AI Suggestions draft state
  const [generatingDraft, setGeneratingDraft] = useState(false)
  const [aiTone, setAiTone] = useState<"professional" | "friendly" | "sales" | "support">("professional")

  const [refreshing, setRefreshing] = useState(false)

  // Check connected account connections
  const verifyChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts")
      if (res.ok) {
        const data = await res.json()
        const activeAccounts = data.accounts || []
        const hasActive = activeAccounts.some((a: any) => a.status === "connected")
        setHasAccounts(hasActive)
        return hasActive
      }
    } catch (err) {
      console.error("verifyChannels error:", err)
    }
    return false
  }, [])

  // Fetch Social Activities & Metrics
  const fetchActivityData = useCallback(async (isPolling = false) => {
    if (!selectedPlatform) return
    try {
      if (!isPolling && !refreshing) setLoading(true)
      
      const queryParams = new URLSearchParams()
      queryParams.set("platform", selectedPlatform)
      if (filterType !== "all") queryParams.set("type", filterType)
      if (filterDate) queryParams.set("dateRange", filterDate)
      if (searchQuery) queryParams.set("search", searchQuery)

      const res = await fetch(`/api/inbox/activity?${queryParams.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const newActs = data.activities || []
        
        setConnectedPlatforms(data.connectedPlatforms || [])
        setMetrics(data.metrics || null)

        // Polling check for new activities
        if (isPolling && activities.length > 0) {
          const prevMaxTime = Math.max(...activities.map(a => new Date(a.timestamp).getTime()))
          const newMaxTime = Math.max(...newActs.map((a: any) => new Date(a.timestamp).getTime()))

          if (newMaxTime > prevMaxTime) {
            const latest = newActs.reduce((latest: any, cur: any) => {
              return !latest || new Date(cur.timestamp) > new Date(latest.timestamp) ? cur : latest
            }, null)

            if (latest && !latest.read) {
              const typeLabel = latest.type === "comment" ? "comment" : latest.type === "like" ? "like" : "interaction"
              showToast(`New ${typeLabel} from ${latest.profileName} received!`, "info")
            }
          }
        }

        setActivities(newActs)

        // Keep inspector aligned on state updates
        if (activeActivity) {
          const matched = newActs.find((a: any) => a._id === activeActivity._id)
          if (matched) {
            setActiveActivity(matched)
          }
        }
      }
    } catch (err) {
      console.error("fetchActivityData error:", err)
    } finally {
      setLoading(false)
    }
  }, [selectedPlatform, filterType, filterDate, searchQuery, activeActivity, activities, showToast])

  // Trigger load when platform is chosen
  useEffect(() => {
    if (selectedPlatform) {
      fetchActivityData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlatform, filterType, filterDate, searchQuery])

  // Initial load checks
  useEffect(() => {
    if (session) {
      verifyChannels().then(() => setLoading(false))
    }
  }, [session, verifyChannels])

  // Real-Time Background polling (every 7 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (session && hasAccounts && selectedPlatform) {
      interval = setInterval(() => {
        fetchActivityData(true)
      }, 7000)
    }
    return () => clearInterval(interval)
  }, [session, hasAccounts, selectedPlatform, fetchActivityData])

  // Mark status helper
  const handleMarkStatus = async (activityId: string, action: string) => {
    try {
      const res = await fetch("/api/inbox/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, action }),
      })

      if (res.ok) {
        await fetchActivityData(true)
        if (activeActivity && activeActivity._id === activityId) {
          if (action === "delete") {
            setActiveActivity(null)
          }
        }
      }
    } catch (err) {
      console.error("handleMarkStatus error:", err)
    }
  }

  // Reply Compose submit
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !activeActivity || submittingReply) return

    setSubmittingReply(true)
    try {
      const res = await fetch("/api/inbox/activity/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: activeActivity._id,
          text: replyText.trim(),
        }),
      })

      if (res.ok) {
        setReplyText("")
        showToast("Outbound reply posted successfully.", "success")
        await fetchActivityData(true)
      } else {
        showToast("Failed to post reply.", "error")
      }
    } catch {
      showToast("Connection failed.", "error")
    } finally {
      setSubmittingReply(false)
    }
  }

  // AI Reply Draft suggestion
  const handleGenerateAiReply = async () => {
    if (!activeActivity || generatingDraft) return
    setGeneratingDraft(true)

    try {
      const res = await fetch("/api/inbox/activity/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suggest_reply",
          activityId: activeActivity._id,
          tone: aiTone,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setReplyText(data.result || "")
        showToast(`AI Reply drafted in ${aiTone} tone.`, "success")
      } else {
        showToast("AI suggestion failed to generate.", "error")
      }
    } catch {
      showToast("Failed to connect to AI engine.", "error")
    } finally {
      setGeneratingDraft(false)
    }
  }

  // AI Feed Insights Aggregator (Drawer)
  const handleLoadAiInsights = async () => {
    if (!selectedPlatform || loadingAiSummary) return
    
    // Read the active post referenced, or aggregate generally
    const targetPostId = activeActivity?.postId || (activities.length > 0 ? activities[0].postId : null)
    if (!targetPostId) {
      showToast("No active post available to analyze.", "error")
      return
    }

    setLoadingAiSummary(true)
    setShowAiInsights(true)

    try {
      // 1. Fetch Summary & Sentiment stats
      const sumRes = await fetch("/api/inbox/activity/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "summarize", postId: targetPostId }),
      })

      // 2. Fetch FAQs & Trends
      const faqRes = await fetch("/api/inbox/activity/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "faq", platform: selectedPlatform }),
      })

      const trendRes = await fetch("/api/inbox/activity/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trends", platform: selectedPlatform }),
      })

      if (sumRes.ok) {
        const d = await sumRes.json()
        setAiSummary(d.summary)
        setAiSentimentStats(d.sentimentStats)
      }
      if (faqRes.ok) {
        const d = await faqRes.json()
        setAiFaqs(d.faqs || [])
      }
      if (trendRes.ok) {
        const d = await trendRes.json()
        setAiTrends(d.trends || [])
      }
    } catch {
      showToast("Insights failed to load completely.", "error")
    } finally {
      setLoadingAiSummary(false)
    }
  }

  const handleFullSync = async () => {
    setRefreshing(true)
    await verifyChannels()
    if (selectedPlatform) {
      await fetchActivityData()
    }
    setRefreshing(false)
    showToast("Inbox activity synchronized with platforms.", "success")
  }

  // Main loading
  if (loading) {
    return (
      <PageTransition>
        <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
          <Loader2 className="size-9 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Syncing Social Activity feeds...</p>
        </div>
      </PageTransition>
    )
  }

  // EMPTY STATE: If no social channels connected
  if (!hasAccounts) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-4xl py-12 px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Social Activity Center</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor, explore, and reply to real platform activities from your connected social channels.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border/60 rounded-2xl bg-card/40 backdrop-blur-xl space-y-6 shadow-sm">
            <div className="p-4 bg-primary/10 rounded-full ring-8 ring-primary/5">
              <Inbox className="size-10 text-primary animate-pulse" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-bold text-foreground">Connect a social platform</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect a social platform to view engagement activity. You will be able to choose platform-specific activities, monitor comments, likes, and reply instantly.
              </p>
            </div>
            <Button onClick={() => router.push("/dashboard/channels")} className="rounded-xl bg-primary text-primary-foreground font-semibold px-6 py-2.5">
              Connect Channels
            </Button>
          </div>
        </div>
      </PageTransition>
    )
  }

  // STEP 1: Plataform manual selection splash selector
  if (selectedPlatform === null) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-4xl py-12 px-4 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h1 className="text-3xl font-extrabold text-foreground font-display">Inbox Activity Center</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Explore engagement metrics, likes, comments, and mentions. Select an active social channel below to begin auditing platform activity.
            </p>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-3xl mx-auto">
            {/* All Platforms card selector */}
            <Button
              onClick={() => setSelectedPlatform("all")}
              className="flex flex-col items-center gap-4 py-8 px-6 h-auto rounded-2xl bg-card border border-border/60 hover:border-primary hover:bg-muted/10 text-foreground transition-all duration-300 group hover:shadow-lg shadow-sm"
            >
              <div className="size-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary shrink-0 shadow-sm transition-transform group-hover:scale-105">
                <Inbox className="size-6" />
              </div>
              <div className="text-center space-y-1">
                <span className="text-sm font-extrabold block">All Connected Channels</span>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Unified Activity Center</p>
              </div>
            </Button>

            {Object.entries(platformConfig).map(([id, config]) => {
              // Check if platform is connected in data
              const isConnected = connectedPlatforms.length > 0 ? connectedPlatforms.includes(id) : true
              
              return (
                <Button
                  key={id}
                  onClick={() => isConnected && setSelectedPlatform(id)}
                  disabled={!isConnected}
                  className={cn(
                    "flex flex-col items-center gap-4 py-8 px-6 h-auto rounded-2xl bg-card border transition-all duration-300 group shadow-sm text-foreground",
                    isConnected 
                      ? "border-border/60 hover:border-primary hover:bg-muted/10 hover:shadow-lg" 
                      : "opacity-40 cursor-not-allowed border-border/30 bg-muted/20"
                  )}
                >
                  <div className={cn(
                    "size-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105", 
                    isConnected ? (id === "facebook" ? "bg-[#1877F2]" : id === "instagram" ? "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600" : id === "linkedin" ? "bg-[#0A66C2]" : "bg-zinc-950") : "bg-muted-foreground"
                  )}>
                    <config.icon className="size-5.5" />
                  </div>
                  
                  <div className="text-center space-y-1">
                    <span className="text-sm font-extrabold block">{config.label}</span>
                    <Badge variant="outline" className={cn("text-[9px] font-bold py-0.5 rounded-md", isConnected ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border/40")}>
                      {isConnected ? "API Active" : "Not Configured"}
                    </Badge>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>
      </PageTransition>
    )
  }

  // STEP 2: Main social activity dashboard feed
  return (
    <PageTransition>
      {/* HEADER BAR AND PLATFORM SWITCHER TABS */}
      <div className="mb-6 flex flex-col gap-4 border-b border-border/50 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setSelectedPlatform(null)}
              variant="outline"
              size="icon-sm"
              className="rounded-lg h-8 border-border/60 hover:bg-muted"
              title="Return to platform selector"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
                Social Activity Center
                <Badge variant="secondary" className="text-[10px] capitalize bg-primary/10 text-primary border-primary/20 font-bold">
                  {selectedPlatform === "all" ? "All Channels" : platformConfig[selectedPlatform]?.label}
                </Badge>
              </h1>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullSync}
              disabled={refreshing}
              className="rounded-xl border-border/60 hover:bg-muted font-bold text-xs h-9"
            >
              <RefreshCw className={cn("size-3 mr-2", refreshing && "animate-spin")} />
              Sync Platforms
            </Button>
            {activeActivity?.postId && (
              <Button
                size="sm"
                onClick={handleLoadAiInsights}
                disabled={loadingAiSummary}
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs h-9 shadow-md"
              >
                <Brain className="size-3.5 mr-1.5" />
                AI Content Insights
              </Button>
            )}
          </div>
        </div>

        {/* Dynamic horizontal platform selection tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none mt-2">
          <button
            onClick={() => setSelectedPlatform("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 border border-border/50 transition-all text-foreground",
              selectedPlatform === "all" ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card hover:bg-muted"
            )}
          >
            All Channels
          </button>
          {Object.entries(platformConfig).map(([id, config]) => {
            const isConnected = connectedPlatforms.includes(id)
            if (!isConnected) return null
            return (
              <button
                key={id}
                onClick={() => setSelectedPlatform(id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 border border-border/50 transition-all text-foreground",
                  selectedPlatform === id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card hover:bg-muted"
                )}
              >
                <config.icon className={cn("size-3.5", selectedPlatform === id ? "text-primary-foreground" : config.color)} />
                <span>{config.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* METRICS DASHBOARD BANNER */}
      {metrics && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 mb-6">
          <Card className="rounded-xl border-border/60 bg-card/40 backdrop-blur-xl shadow-sm">
            <CardContent className="p-3.5 text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Comments</span>
              <p className="text-xl font-extrabold text-foreground mt-1.5">{metrics.comments}</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/60 bg-card/40 backdrop-blur-xl shadow-sm">
            <CardContent className="p-3.5 text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Likes</span>
              <p className="text-xl font-extrabold text-foreground mt-1.5">{metrics.likes}</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/60 bg-card/40 backdrop-blur-xl shadow-sm">
            <CardContent className="p-3.5 text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Shares</span>
              <p className="text-xl font-extrabold text-foreground mt-1.5">{metrics.shares}</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/60 bg-card/40 backdrop-blur-xl shadow-sm">
            <CardContent className="p-3.5 text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Mentions</span>
              <p className="text-xl font-extrabold text-foreground mt-1.5">{metrics.mentions}</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/60 bg-card/40 backdrop-blur-xl shadow-sm">
            <CardContent className="p-3.5 text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">DMs</span>
              <p className="text-xl font-extrabold text-foreground mt-1.5">{metrics.messages}</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/60 bg-card/40 backdrop-blur-xl shadow-sm col-span-1">
            <CardContent className="p-3.5 text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Engagement</span>
              <p className="text-xl font-extrabold text-foreground mt-1.5">{metrics.engagementRate}%</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/60 bg-card/40 backdrop-blur-xl shadow-sm col-span-1">
            <CardContent className="p-3.5 text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Response Rate</span>
              <p className="text-xl font-extrabold text-foreground mt-1.5">{metrics.responseRate}%</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/60 bg-card/40 backdrop-blur-xl shadow-sm col-span-2 sm:col-span-1 border-emerald-500/20 bg-emerald-500/[0.005]">
            <CardContent className="p-3.5 text-center">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider block">Followers Growth</span>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-500 mt-2.5 leading-none">{metrics.growth}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CORE TWO-PANEL ACTIVITY CENTER GRID */}
      <div className="grid gap-6 lg:grid-cols-4 items-stretch h-[600px] border border-border/50 rounded-2xl overflow-hidden bg-card/30 backdrop-blur-xl shadow-md">
        
        {/* PANEL 1: INTERACTIVE FILTERS SIDEBAR */}
        <div className="hidden lg:flex lg:col-span-1 flex-col border-r border-border/50 bg-muted/20 p-4 space-y-6 overflow-y-auto">
          
          {/* Filter by Type */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-2 mb-2">Activity Type</span>
            {[
              { id: "all", label: "All Activity", icon: Inbox },
              { id: "comments", label: "Comments Feed", icon: MessageSquare },
              { id: "likes", label: "Likes & Reactions", icon: ThumbsUp },
              { id: "shares", label: "Shares & Retweets", icon: Share2 },
              { id: "mentions", label: "Brand Mentions", icon: Volume2 },
              { id: "messages", label: "Direct Messages", icon: MessageCircle },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all hover:bg-muted text-foreground",
                  filterType === t.id && "bg-primary text-primary-foreground hover:bg-primary"
                )}
              >
                <t.icon className="size-3.5 shrink-0" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Filter by Date */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-2 mb-2">Date Frame</span>
            {[
              { id: "today", label: "Today" },
              { id: "7d", label: "Last 7 Days" },
              { id: "30d", label: "Last 30 Days" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setFilterDate(d.id)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all hover:bg-muted text-foreground",
                  filterDate === d.id && "bg-primary text-primary-foreground hover:bg-primary"
                )}
              >
                <Calendar className="size-3.5 shrink-0" />
                <span>{d.label}</span>
              </button>
            ))}
          </div>

          {/* Connected Audit Info */}
          <div className="mt-auto p-3 border border-border/50 rounded-xl bg-card text-[10px] text-muted-foreground space-y-2">
            <div className="flex items-center gap-1.5 text-primary font-semibold">
              <ShieldCheck className="size-3.5 shrink-0" /> Verified Audit Engine
            </div>
            <p className="leading-relaxed">
              Real social metrics derived strictly from account databases. Engagement metrics represent published post performance statistics.
            </p>
          </div>
        </div>

        {/* PANEL 2: CHRONOLOGICAL ACTIVITY NOTIFICATIONS FEED */}
        <div className={cn(
          "col-span-4 lg:col-span-2 flex flex-col border-r border-border/50 bg-card/20 overflow-hidden",
          activeActivity && "hidden lg:flex"
        )}>
          {/* Search bar */}
          <div className="p-3 border-b border-border/50 flex flex-col gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search handles, post titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 rounded-lg border-border/60 bg-muted/40 pl-8 text-xs text-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Mobile Filter Badges */}
            <div className="flex lg:hidden gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {[
                { id: "all", label: "All" },
                { id: "comments", label: "Comments" },
                { id: "likes", label: "Likes" },
                { id: "mentions", label: "Mentions" },
              ].map(t => (
                <Badge
                  key={t.id}
                  onClick={() => setFilterType(t.id)}
                  className={cn(
                    "cursor-pointer text-[9px] font-bold px-2 py-0.5 rounded-full border-border/60",
                    filterType === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {t.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Chronological List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full gap-2">
                <Inbox className="size-7 text-muted-foreground opacity-60" />
                <p className="text-xs font-bold text-muted-foreground">No platform activities found matching filters.</p>
              </div>
            ) : (
              activities.map((act) => {
                const config = platformConfig[act.platform]
                
                // Color mapping for activities
                const activityColors = {
                  comment: "bg-pink-500",
                  like: "bg-blue-500",
                  share: "bg-emerald-500",
                  retweet: "bg-zinc-800 dark:bg-white text-white dark:text-zinc-950",
                  mention: "bg-amber-500",
                  message: "bg-[#1877F2]",
                  reaction: "bg-purple-500",
                }
                const activeColor = activityColors[act.type] || "bg-primary"

                const timeLabel = new Date(act.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })

                return (
                  <button
                    key={act._id}
                    onClick={() => setActiveActivity(act)}
                    className={cn(
                      "flex w-full flex-col gap-2 p-3 text-left transition-all hover:bg-muted/30 border-l-2 border-transparent relative",
                      activeActivity?._id === act._id ? "bg-muted border-l-primary shadow-sm" : "bg-card/[0.005]",
                      !act.read && "font-bold bg-primary/[0.01]"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative shrink-0">
                          <Avatar className="size-8.5 border border-border/50">
                            {act.profileAvatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={act.profileAvatar} alt={act.profileName} className="object-cover size-8.5 rounded-full" />
                            ) : (
                              <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">{act.profileName[0]}</AvatarFallback>
                            )}
                          </Avatar>
                          <div className={cn("absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full flex items-center justify-center text-white border-2 border-background", activeColor)}>
                            {act.type === "like" ? <ThumbsUp className="size-2 text-white" /> : act.type === "comment" ? <MessageSquare className="size-2 text-white" /> : act.type === "share" || act.type === "retweet" ? <Share2 className="size-2 text-white" /> : <Info className="size-2 text-white" />}
                          </div>
                        </div>

                        <div className="min-w-0 leading-tight">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-foreground truncate">{act.profileName}</span>
                            {act.isComplaint && (
                              <Badge variant="outline" className="text-[7.5px] py-0 px-1 font-bold text-rose-500 border-rose-500/20 bg-rose-500/5 select-none animate-pulse">Complaint</Badge>
                            )}
                            {act.isOpportunity && (
                              <Badge variant="outline" className="text-[7.5px] py-0 px-1 font-bold text-primary border-primary/20 bg-primary/5 select-none">Lead</Badge>
                            )}
                          </div>
                          
                          <span className="text-[9px] text-muted-foreground leading-none mt-0.5 block capitalize font-semibold">{act.platform} • {act.type}</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-muted-foreground font-mono shrink-0">{timeLabel}</span>
                    </div>

                    {/* Feed notification snippet */}
                    <div className="text-[11px] text-foreground leading-relaxed px-1 pl-10">
                      {act.type === "comment" || act.type === "message" || act.type === "mention" ? (
                        <p className="italic text-foreground/90 font-medium">"{act.text}"</p>
                      ) : (
                        <p className="text-muted-foreground">
                          {act.type === "like" ? "Liked your post" : act.type === "share" || act.type === "retweet" ? "Shared your post content" : act.text}
                        </p>
                      )}

                      {/* Post reference card */}
                      {act.postId && (
                        <div className="mt-2 text-[9.5px] text-muted-foreground font-semibold flex items-center gap-1 uppercase select-none">
                          <Tag className="size-2 shrink-0" />
                          Post: <span className="text-foreground max-w-[140px] truncate">{act.postTitle}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between w-full mt-1 pl-10 pr-1 select-none">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[8px] py-0 px-1 rounded bg-muted/40 uppercase font-extrabold tracking-wider">{act.sentiment}</Badge>
                        {act.replies && act.replies.length > 0 && (
                          <Badge variant="outline" className="text-[8px] py-0 px-1 rounded bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-0.5 font-bold">
                            <Check className="size-2" /> Answered
                          </Badge>
                        )}
                      </div>
                      {!act.read && (
                        <span className="size-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* PANEL 3: ENGAGEMENT INSPECTOR & TIMELINE DETAILS */}
        <div className={cn(
          "col-span-4 lg:col-span-2 flex flex-col overflow-hidden bg-card/10",
          !activeActivity && "hidden lg:flex"
        )}>
          {activeActivity ? (
            <>
              {/* Header details */}
              <div className="p-3 border-b border-border/50 flex items-center justify-between bg-muted/10 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Button
                    onClick={() => setActiveActivity(null)}
                    variant="ghost"
                    size="icon-sm"
                    className="lg:hidden mr-1.5"
                  >
                    <X className="size-4" />
                  </Button>

                  <Avatar className="size-9 border border-border/50">
                    {activeActivity.profileAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activeActivity.profileAvatar} alt={activeActivity.profileName} className="object-cover size-9 rounded-full" />
                    ) : (
                      <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">{activeActivity.profileName[0]}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground leading-tight truncate">{activeActivity.profileName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase mt-0.5 block font-semibold leading-none">
                      {activeActivity.platform} • {activeActivity.type}
                    </p>
                  </div>
                </div>

                {/* Audit marking controls */}
                <div className="flex gap-1.5">
                  <Button
                    onClick={() => handleMarkStatus(activeActivity._id, "toggle_unread")}
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-border/60 text-[10px] font-semibold hover:bg-muted"
                  >
                    {activeActivity.read ? "Mark Unread" : "Mark Resolved"}
                  </Button>
                  <Button
                    onClick={() => handleMarkStatus(activeActivity._id, "delete")}
                    variant="outline"
                    size="icon-sm"
                    className="h-8 rounded-lg border-border/60 hover:bg-muted hover:text-rose-500"
                    title="Delete activity record"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* INSPECTOR TIMELINE SCROLL */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
                
                {/* 1. ORIGINAL POST REFERENCE CARD */}
                {activeActivity.postId && (
                  <Card className="rounded-xl border-border/60 bg-muted/30 overflow-hidden shadow-none select-none">
                    <CardHeader className="p-3 border-b border-border/30 bg-muted/40 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground uppercase tracking-wide">
                        <Tag className="size-3 text-primary" /> Original Content Reference
                      </div>
                      <span className="text-[8px] font-bold font-mono text-muted-foreground bg-card border border-border/40 px-1 rounded">POST ID: {activeActivity.postId.slice(-8)}</span>
                    </CardHeader>
                    <CardContent className="p-3 text-xs leading-normal">
                      <h4 className="font-bold text-foreground mb-1 leading-snug">{activeActivity.postTitle}</h4>
                      <p className="text-muted-foreground line-clamp-3 italic text-[11px] leading-relaxed">"{activeActivity.postContent}"</p>
                    </CardContent>
                  </Card>
                )}

                {/* 2. ACTIVITY DETAILS MESSAGE */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] text-muted-foreground px-1">
                    <span className="font-bold text-foreground">{activeActivity.profileName}</span>
                    <span className="font-mono">{new Date(activeActivity.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="rounded-2xl px-3.5 py-3 border border-border/40 bg-muted/50 rounded-tl-none leading-relaxed text-xs">
                    {activeActivity.type === "comment" || activeActivity.type === "message" || activeActivity.type === "mention" ? (
                      <p className="font-medium">"{activeActivity.text}"</p>
                    ) : (
                      <p className="text-muted-foreground capitalize">
                        {activeActivity.type === "like" ? "Liked your published post." : activeActivity.type === "share" || activeActivity.type === "retweet" ? "Shared your social post content." : activeActivity.text}
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. RESPONSES TIMELINE */}
                {activeActivity.replies && activeActivity.replies.length > 0 && (
                  <div className="space-y-4 pt-2 border-t border-border/30">
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider block px-1 select-none">Brand Responses</span>
                    
                    {activeActivity.replies.map((rep, idx) => (
                      <div key={idx} className="flex gap-2 max-w-[85%] ml-auto flex-row-reverse items-start text-right">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-end gap-1.5 text-[9px] text-muted-foreground">
                            <span className="font-bold text-foreground">{rep.senderName}</span>
                            <span>•</span>
                            <span className="font-mono">{new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="rounded-2xl px-3.5 py-2 border border-primary bg-primary text-primary-foreground rounded-tr-none text-xs text-left shadow-sm">
                            <p className="whitespace-pre-wrap">{rep.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* REPLY SYSTEM INPUT - Only displayed if comments/messages are supported */}
              {(activeActivity.type === "comment" || activeActivity.type === "message") ? (
                <form onSubmit={handleSubmitReply} className="border-t border-border/50 p-3 bg-muted/10 space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider select-none">Reply Composer</span>
                    
                    {/* AI Tone select & sugget button */}
                    <div className="flex items-center gap-2">
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value as any)}
                        className="h-6 rounded border border-border/60 bg-card px-1 text-[9px] font-semibold text-foreground outline-none"
                      >
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="sales">Sales</option>
                        <option value="support">Support</option>
                      </select>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateAiReply}
                        disabled={generatingDraft}
                        className="rounded h-6 px-2 text-[9px] font-extrabold uppercase bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20"
                      >
                        {generatingDraft ? (
                          <>
                            <Loader2 className="size-2.5 mr-1 animate-spin" /> Drafting...
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-2.5 mr-1 animate-pulse" /> Suggest Reply
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Textarea
                      placeholder={`Draft reply on ${platformConfig[activeActivity.platform]?.label}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="min-h-0 flex-1 resize-none rounded-xl border border-border/60 bg-card text-xs px-3.5 py-2.5 outline-none pr-10"
                      rows={2}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!replyText.trim() || submittingReply}
                      className="absolute right-2 bottom-2 size-7.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {submittingReply ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="border-t border-border/50 p-4 text-center text-[10px] text-muted-foreground italic bg-muted/10 shrink-0 select-none">
                  Outbound replies are not supported by the platform API for reaction metrics like {activeActivity.type}s.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full gap-2">
              <Inbox className="size-8 text-muted-foreground opacity-60" />
              <p className="text-sm font-semibold text-muted-foreground">Select an activity card to audit details.</p>
            </div>
          )}
        </div>

      </div>

      {/* AI ENGAGEMENT INTELLIGENCE CENTER (DRAWER / OVERLAY) */}
      {showAiInsights && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md border-l border-border/60 bg-card shadow-2xl flex flex-col overflow-hidden animate-slide-in duration-300">
          <div className="p-4 border-b border-border/40 flex items-center justify-between bg-primary/[0.01]">
            <div className="flex items-center gap-2 font-bold text-xs text-foreground uppercase tracking-wider">
              <Brain className="size-4.5 text-primary animate-pulse" /> AI Engagement Insights Drawer
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setShowAiInsights(false)}>
              <X className="size-4" />
            </Button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-6 scrollbar-thin">
            {loadingAiSummary ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <Loader2 className="size-7 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Running semantic social feedback audits...</p>
              </div>
            ) : (
              <>
                {/* 1. Comment summary */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block">AI Comment Summary</span>
                  <Card className="rounded-xl border-border/50 bg-muted/20 shadow-none overflow-hidden select-none">
                    <CardContent className="p-3.5 text-xs leading-relaxed text-foreground/90 font-medium whitespace-pre-line leading-relaxed">
                      {aiSummary}
                    </CardContent>
                  </Card>
                </div>

                {/* 2. Sentiment distribution */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block">Sentiment Distribution Ratio</span>
                  <div className="space-y-2 bg-muted/10 p-3 rounded-xl border border-border/40 select-none">
                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mb-1">
                        <span>Positive Feedbacks</span>
                        <span>{aiSentimentStats.positive}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${aiSentimentStats.positive}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mb-1">
                        <span>Neutral / Queries</span>
                        <span>{aiSentimentStats.neutral}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-2 bg-gray-400 rounded-full" style={{ width: `${aiSentimentStats.neutral}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mb-1">
                        <span>Negative Alerts</span>
                        <span>{aiSentimentStats.negative}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-2 bg-rose-500 rounded-full animate-pulse" style={{ width: `${aiSentimentStats.negative}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Trend Keywords */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block">Discussed Trends Weights</span>
                  <div className="space-y-2 select-none">
                    {aiTrends.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 border border-border/40 rounded-xl bg-card">
                        <span className="text-xs font-bold text-foreground leading-tight truncate">{t.topic}</span>
                        <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-lg shrink-0">
                          {t.percentage}% Weight
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. FAQs matrix */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block">Identified Platform FAQs</span>
                  <div className="space-y-3 select-none">
                    {aiFaqs.map((faq, idx) => (
                      <div key={idx} className="p-3 border border-border/40 rounded-xl bg-muted/10 space-y-1.5 leading-normal">
                        <h5 className="text-[11px] font-extrabold text-foreground leading-snug">Q: {faq.q}</h5>
                        <p className="text-[10px] text-muted-foreground italic leading-relaxed">A: {faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-3 border-t border-border/40 bg-muted/10 select-none">
            <p className="text-[9px] text-muted-foreground text-center leading-normal">
              GrowWave social activity analytics runs secure local audits complying strictly with private credentials specifications.
            </p>
          </div>
        </div>
      )}
    </PageTransition>
  )
}
