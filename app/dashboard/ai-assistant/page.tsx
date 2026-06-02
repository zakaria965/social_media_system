"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  Lightbulb,
  Hash,
  ArrowRight,
  Send,
  Compass,
  FileText,
  Clock,
  TrendingUp,
  Brain,
  Activity,
  User,
  Bot,
  Settings2,
  Trash2,
  Terminal,
  HelpCircle,
  Download,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageTransition } from "@/components/dashboard/page-transition"
import { useToast } from "@/components/toast-provider"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AnalyticsData {
  reach: string
  engagement: string
  followers: string
  clicks: string
  publishedCount: number
  scheduledCount: number
  bestDay: string
  bestHour: string
  topPostTitle: string
  topPostReach: number
  hasPublished: boolean
}

const tones = [
  { id: "professional", label: "Professional" },
  { id: "corporate", label: "Corporate" },
  { id: "startup", label: "Startup" },
  { id: "funny", label: "Funny" },
  { id: "friendly", label: "Friendly" },
  { id: "luxury", label: "Luxury" },
  { id: "technical", label: "Technical" }
]

const suggestedPrompts = [
  {
    title: "How is my workspace performing?",
    desc: "Get an executive daily summary based on real analytics.",
    prompt: "How is my system today?"
  },
  {
    title: "Analyze last 30 days performance",
    desc: "Identify top/worst posts and platform engagement trends.",
    prompt: "Analyze my last 30 days."
  },
  {
    title: "Generate a content calendar",
    desc: "Create a structured posting schedule and topics calendar.",
    prompt: "Generate a 30-day content calendar."
  },
  {
    title: "Best posting times advisor",
    desc: "Discover peak audience engagement times for connected accounts.",
    prompt: "Suggest my best posting times, platforms, and content mix."
  }
]

const commandCenterActions = [
  { cmd: "/caption", label: "Generate Caption", desc: "Write tone-tailored caption drafts", placeholder: "Generate a caption about..." },
  { cmd: "/analytics", label: "Analyze Performance", desc: "Extract current engagement KPIs", placeholder: "Analyze my performance..." },
  { cmd: "/calendar", label: "Create Calendar", desc: "Build a structured posting calendar", placeholder: "Generate a content calendar..." },
  { cmd: "/hashtags", label: "Suggest Hashtags", desc: "Suggest niche tags and hooks", placeholder: "Suggest hashtags for..." },
  { cmd: "/report", label: "Generate Report", desc: "Build weekly or monthly analytics reports", placeholder: "Generate a weekly report..." },
  { cmd: "/growth", label: "Growth Strategy", desc: "Conduct SWOT analysis and opportunities", placeholder: "Generate a growth strategy..." }
]

export default function AIAssistantPage() {
  const { showToast } = useToast()
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [inputVal, setInputVal] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [currentResponse, setCurrentResponse] = useState("")
  
  // Quick tools/UI controls
  const [showCommands, setShowCommands] = useState(false)
  const [activeTab, setActiveTab] = useState<"chat" | "templates">("chat")
  
  // Settings & Memory
  const [selectedTone, setSelectedTone] = useState("professional")
  const [brandVoiceText, setBrandVoiceText] = useState("")
  const [savingSettings, setSavingSettings] = useState(false)
  const [aiUsageCount, setAiUsageCount] = useState(0)
  const [aiUsageLimit, setAiUsageLimit] = useState(100)

  // Real Database Analytics Metrics
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    reach: "0",
    engagement: "0",
    followers: "0",
    clicks: "0",
    publishedCount: 0,
    scheduledCount: 0,
    bestDay: "Tuesday",
    bestHour: "10:00 AM",
    topPostTitle: "No published posts yet",
    topPostReach: 0,
    hasPublished: false
  })
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)

  // Message scrolling references
  const chatEndRef = useRef<HTMLDivElement>(null)

  // 1. Fetch real workspace settings and analytics on mount
  useEffect(() => {
    async function loadWorkspaceData() {
      try {
        setLoadingAnalytics(true)
        
        // A. Load Settings
        const settingsRes = await fetch("/api/settings")
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          const s = settingsData.settings
          if (s) {
            setSelectedTone(s.contentTone || "professional")
            setBrandVoiceText(s.brandVoice || "")
            setAiUsageCount(s.aiUsageCount || 0)
            setAiUsageLimit(s.aiUsageLimit || 100)
          }
        }

        // B. Load Live Analytics metrics
        const analyticsRes = await fetch("/api/analytics?timeframe=30d")
        if (analyticsRes.ok) {
          const a = await analyticsRes.json()
          if (a.hasPublishedPosts) {
            // Find top performing post
            const topPost = a.topPerformingContent?.[0]
            setAnalytics({
              reach: a.overview?.reach?.value || "0",
              engagement: a.overview?.engagement?.value || "0",
              followers: a.overview?.followers?.value || "0",
              clicks: a.overview?.clicks?.value || "0",
              publishedCount: a.overview?.publishedCount || 0,
              scheduledCount: a.overview?.scheduledCount || 0,
              bestDay: a.publishingInsights?.bestDay || "Tuesday",
              bestHour: a.publishingInsights?.bestHour || "10:00 AM",
              topPostTitle: topPost ? topPost.title || topPost.content?.slice(0, 45) + "..." : "Sandbox Post",
              topPostReach: topPost ? topPost.reach : 0,
              hasPublished: true
            })
          }
        }
      } catch (err) {
        console.error("Failed to load workspace data:", err)
      } finally {
        setLoadingAnalytics(false)
      }
    }

    loadWorkspaceData()
  }, [])

  // Auto-scroll logic
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentResponse, scrollToBottom])

  // 2. Save settings callback (Tone & Brand voice updating in real-time)
  const handleSaveSettings = async (tone = selectedTone, voice = brandVoiceText) => {
    setSavingSettings(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            contentTone: tone,
            brandVoice: voice
          }
        })
      })
      if (!res.ok) throw new Error("Failed to save settings")
      showToast("Workspace Brand Voice updated", "success")
    } catch (err) {
      showToast("Failed to save AI configuration settings", "error")
    } finally {
      setSavingSettings(false)
    }
  }

  // 3. Streaming Chat Submission
  const handleSend = async (customPrompt = "") => {
    const activePrompt = (customPrompt || inputVal).trim()
    if (!activePrompt) return

    // Limit Check
    if (aiUsageCount >= aiUsageLimit) {
      showToast("Workspace AI usage limit exceeded. Upgrade plan in Settings.", "error")
      return
    }

    setInputVal("")
    setShowCommands(false)

    const userMsg: Message = {
      role: "user",
      content: activePrompt,
      timestamp: new Date()
    }

    const updatedHistory = [...messages, userMsg]
    setMessages(updatedHistory)
    setStreaming(true)
    setCurrentResponse("")

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
          action: activePrompt.startsWith("/") ? activePrompt.split(" ")[0] : ""
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to generate AI response")
      }

      const reader = res.body?.getReader()
      const decoder = new TextEncoder()
      let answerText = ""

      if (reader) {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunk = new TextDecoder().decode(value)
          answerText += chunk
          setCurrentResponse(answerText)
        }
      }

      // Finalize message appending
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answerText,
          timestamp: new Date()
        }
      ])
      setCurrentResponse("")
      
      // Increment client-side count
      setAiUsageCount((prev) => Math.min(prev + 1, aiUsageLimit))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error establishing connection"
      showToast(msg, "error")
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Failed to get AI response: ${msg}. Please ensure your OpenAI API Key is valid and try again.`,
          timestamp: new Date()
        }
      ])
    } finally {
      setStreaming(false)
    }
  }

  // Handle keypresses (Command Center '/' trigger)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === "/") {
      if (inputVal.length === 0) {
        setShowCommands(true)
      }
    } else if (e.key === "Escape") {
      setShowCommands(false)
    }
  }

  const handleSelectCommand = (cmd: typeof commandCenterActions[0]) => {
    setInputVal(cmd.cmd + " ")
    setShowCommands(false)
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast("Copied to clipboard", "success")
  }

  // Custom visual markdown parser (bold, list items, code blocks, structured tables!)
  const renderMessageContent = (text: string) => {
    if (!text) return null

    const lines = text.split("\n")
    return (
      <div className="space-y-2.5 text-sm leading-relaxed text-foreground">
        {lines.map((line, idx) => {
          const trimmed = line.trim()

          // 1. Code blocks (Start & end)
          if (trimmed.startsWith("```")) {
            return null // Skip direct raw display
          }

          // 2. Tables parsing (Render elegant visual table component!)
          if (trimmed.startsWith("|") && idx < lines.length - 1) {
            // Check if this is a header separator (e.g. |---|---|)
            if (trimmed.includes("---")) return null

            const cells = trimmed
              .split("|")
              .map((c) => c.trim())
              .filter((_, i) => i > 0 && i < trimmed.split("|").length - 1)

            const isHeader = idx > 0 && lines[idx - 1].trim().startsWith("```") === false && 
                             (lines[idx + 1]?.trim().includes("---") || idx === 0)

            return (
              <div key={idx} className="overflow-x-auto my-2 rounded-lg border border-border/50 bg-background/50">
                <table className="min-w-full divide-y divide-border/60 text-left text-xs font-normal">
                  <tbody className="divide-y divide-border/40">
                    <tr className={cn(isHeader ? "bg-muted/65 font-semibold text-primary" : "hover:bg-muted/30")}>
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 whitespace-normal break-words">
                          {parseInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          }

          // 3. Headers
          if (trimmed.startsWith("###")) {
            return <h4 key={idx} className="text-sm font-semibold text-primary mt-3 mb-1">{parseInlineMarkdown(trimmed.replace("###", ""))}</h4>
          }
          if (trimmed.startsWith("##")) {
            return <h3 key={idx} className="text-base font-semibold text-foreground mt-4 mb-2 border-b border-border/30 pb-1">{parseInlineMarkdown(trimmed.replace("##", ""))}</h3>
          }
          if (trimmed.startsWith("#")) {
            return <h2 key={idx} className="text-lg font-bold text-foreground mt-5 mb-2">{parseInlineMarkdown(trimmed.replace("#", ""))}</h2>
          }

          // 4. Unordered Lists
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <ul key={idx} className="list-disc pl-5 space-y-1 my-1">
                <li>{parseInlineMarkdown(trimmed.substring(2))}</li>
              </ul>
            )
          }

          // 5. Ordered Lists
          const orderMatch = trimmed.match(/^(\d+)\.\s(.*)/)
          if (orderMatch) {
            return (
              <ol key={idx} className="list-decimal pl-5 space-y-1 my-1">
                <li value={parseInt(orderMatch[1])}>{parseInlineMarkdown(orderMatch[2])}</li>
              </ol>
            )
          }

          // 6. Alert tags or general empty line spacer
          if (trimmed === "") {
            return <div key={idx} className="h-2" />
          }

          // General paragraphs
          return <p key={idx}>{parseInlineMarkdown(line)}</p>
        })}
      </div>
    )
  }

  // Regex-based Inline Markdown Parser helper (supports bold and codes)
  const parseInlineMarkdown = (text: string) => {
    let result: React.ReactNode[] = [text]

    // A. Bold parser (**text**)
    const boldRegex = /\*\*(.*?)\*\*/g
    let boldMatch
    if (text.includes("**")) {
      const temp: React.ReactNode[] = []
      let lastIndex = 0
      while ((boldMatch = boldRegex.exec(text)) !== null) {
        temp.push(text.substring(lastIndex, boldMatch.index))
        temp.push(<strong key={boldMatch.index} className="font-semibold text-foreground">{boldMatch[1]}</strong>)
        lastIndex = boldRegex.lastIndex
      }
      temp.push(text.substring(lastIndex))
      result = temp
    }

    // B. Inline code blocks (`code`)
    // Simple mapping for text nodes
    const finalResult = result.map((node, nIdx) => {
      if (typeof node !== "string") return node
      if (!node.includes("`")) return node

      const codeRegex = /`(.*?)`/g
      let codeMatch
      const subTemp: React.ReactNode[] = []
      let lastIndex = 0
      while ((codeMatch = codeRegex.exec(node)) !== null) {
        subTemp.push(node.substring(lastIndex, codeMatch.index))
        subTemp.push(
          <code key={codeMatch.index} className="font-mono bg-muted/70 px-1 py-0.5 rounded text-xs border border-border/40 text-primary-foreground font-semibold">
            {codeMatch[1]}
          </code>
        )
        lastIndex = codeRegex.lastIndex
      }
      subTemp.push(node.substring(lastIndex))
      return <span key={nIdx}>{subTemp}</span>
    })

    return finalResult
  }

  const exportReport = (content: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `GrowWave_AI_Report_${new Date().toISOString().split("T")[0]}.md`
    link.click()
    showToast("Downloaded report as Markdown", "success")
  }

  return (
    <PageTransition>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Brain className="size-6 text-primary animate-pulse" />
            AI Intelligence Copilot & Strategist
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            SaaS Strategist, marketing advisor, and predictive analytics engine connected to live database items.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs flex items-center gap-1.5 py-1 px-3">
            <Bot className="size-3.5" />
            OpenAI GPT-4o-mini active
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-9 text-xs gap-1.5 border-border/60 hover:bg-muted/40"
            onClick={() => {
              setMessages([])
              showToast("Chat cleared", "info")
            }}
            disabled={streaming}
          >
            <Trash2 className="size-3.5" /> Clear History
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* SIDE BAR PANEL: Brand Voice & Workspace Memory */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="rounded-xl border border-border/65 bg-muted/15 shadow-sm overflow-hidden">
            <CardHeader className="py-4 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings2 className="size-4 text-primary" />
                AI Brand Voice & Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Writing Tone Selection</label>
                <div className="flex flex-wrap gap-1.5">
                  {tones.map((tone) => (
                    <Badge
                      key={tone.id}
                      variant={selectedTone === tone.id ? "default" : "outline"}
                      className="cursor-pointer px-2.5 py-1 text-xs transition-all border-border/70 hover:border-primary/50"
                      onClick={() => {
                        setSelectedTone(tone.id)
                        handleSaveSettings(tone.id, brandVoiceText)
                      }}
                    >
                      {tone.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">Brand Voice Description</label>
                  {savingSettings && <Loader2 className="size-3 animate-spin text-primary" />}
                </div>
                <Textarea
                  placeholder="Define goals, tone instructions, and audience characteristics (e.g. 'Funny startup builder targeting tech students...')"
                  value={brandVoiceText}
                  onChange={(e) => setBrandVoiceText(e.target.value)}
                  onBlur={() => handleSaveSettings(selectedTone, brandVoiceText)}
                  className="min-h-24 resize-none rounded-xl border border-border/60 bg-background/50 text-xs focus:ring-primary/45"
                />
                <span className="text-[10px] text-muted-foreground block text-right">
                  Autosaves on focus change
                </span>
              </div>
            </CardContent>
          </Card>

          {/* AI Memory Indicator */}
          <Card className="rounded-xl border border-border/65 bg-muted/15 shadow-sm">
            <CardHeader className="py-3.5 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <Brain className="size-3.5 text-primary" />
                AI Persistent Memory Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="py-3.5 space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Active Memory Blocks</span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-foreground py-0.5 px-2">Voice: {selectedTone.toUpperCase()}</Badge>
                  <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-foreground py-0.5 px-2">Goals: Engagement Max</Badge>
                  <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-foreground py-0.5 px-2">Style: Structured Visual</Badge>
                  <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-foreground py-0.5 px-2">Audience: SaaS Tech Creators</Badge>
                </div>
              </div>

              <div className="pt-2.5 border-t border-border/30">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Usage Allowance</span>
                  <span className="font-semibold text-foreground">{aiUsageCount} / {aiUsageLimit} runs</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted border border-border/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500"
                    style={{ width: `${(aiUsageCount / aiUsageLimit) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Resets with subscription billing period</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Dynamic Summary Widgets */}
          <Card className="rounded-xl border border-border/65 bg-muted/15 shadow-sm">
            <CardHeader className="py-3.5 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <Activity className="size-3.5 text-primary" />
                Workspace Performance Analytics Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 space-y-3.5">
              {loadingAnalytics ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <span className="text-xs">Aggregating database statistics...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/40 bg-background/50 p-2.5">
                      <span className="text-[10px] text-muted-foreground font-medium block">Total reach</span>
                      <span className="text-sm font-bold text-foreground mt-0.5 block">{analytics.reach}</span>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-background/50 p-2.5">
                      <span className="text-[10px] text-muted-foreground font-medium block">Followers</span>
                      <span className="text-sm font-bold text-foreground mt-0.5 block">{analytics.followers}</span>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-background/50 p-2.5">
                      <span className="text-[10px] text-muted-foreground font-medium block">Engagement</span>
                      <span className="text-sm font-bold text-foreground mt-0.5 block">{analytics.engagement}</span>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-background/50 p-2.5">
                      <span className="text-[10px] text-muted-foreground font-medium block">Link Clicks</span>
                      <span className="text-sm font-bold text-foreground mt-0.5 block">{analytics.clicks}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-border/30">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Workspace opportunities</span>
                    
                    <div className="flex items-start gap-2 text-xs p-2 rounded-lg border border-primary/20 bg-primary/5">
                      <Clock className="size-3.5 text-primary shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <span className="font-semibold block text-primary">Prime Posting Time Opportunity</span>
                        <p className="text-[11px] text-foreground mt-0.5">
                          Publish visual articles on <strong className="text-primary">{analytics.bestDay}</strong> at <strong className="text-primary">{analytics.bestHour}</strong> to amplify organic reach.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs p-2 rounded-lg border border-violet-500/20 bg-violet-500/5 mt-2">
                      <TrendingUp className="size-3.5 text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-violet-400">Content Type Recommendation</span>
                        <p className="text-[11px] text-foreground mt-0.5">
                          Visual images performance beats raw articles by 38%. Inject illustrations in LinkedIn posts.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CENTRAL PANEL: AI Chat Console */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-xl border border-border/65 bg-muted/10 shadow-sm flex flex-col min-h-[580px] lg:h-[630px] overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-semibold text-foreground">SaaS Intelligence Console</span>
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <span>Model: GPT-4o-mini</span>
                <span>•</span>
                <span>Context: Fully Synced</span>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[380px]">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
                  <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-primary animate-bounce">
                    <Sparkles className="size-8" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-base font-bold text-foreground">Welcome to GrowWave Intelligence Center</h3>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Your workspace social metrics, posts schedule, team workflows, and inbox queues are fully mapped. Pick an executive action below or chat naturally.
                    </p>
                  </div>

                  {/* Suggested prompts grid */}
                  <div className="grid gap-3 sm:grid-cols-2 max-w-2xl w-full pt-4">
                    {suggestedPrompts.map((p, idx) => (
                      <div
                        key={idx}
                        className="group flex flex-col text-left p-3.5 rounded-xl border border-border/50 bg-background/50 cursor-pointer transition-all hover:bg-muted/40 hover:border-primary/40 hover:shadow-sm"
                        onClick={() => handleSend(p.prompt)}
                      >
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                          {p.title}
                          <ArrowRight className="size-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1 leading-normal">{p.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-3 max-w-[85%] rounded-xl p-3.5 border text-sm leading-relaxed",
                        msg.role === "user"
                          ? "ml-auto bg-primary/10 border-primary/25 text-foreground rounded-br-none"
                          : "mr-auto bg-muted/40 border-border/50 text-foreground rounded-bl-none"
                      )}
                    >
                      <div className="shrink-0 mt-0.5">
                        {msg.role === "user" ? (
                          <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                            <User className="size-3.5" />
                          </div>
                        ) : (
                          <div className="size-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                            <Bot className="size-3.5 animate-pulse" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden space-y-2">
                        <div className="flex items-center justify-between mb-1 text-[10px] text-muted-foreground">
                          <span className="font-semibold uppercase tracking-wider">{msg.role === "user" ? "You" : "GrowWave Strategist"}</span>
                          <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {renderMessageContent(msg.content)}

                        {/* Quick tools on AI reports */}
                        {msg.role === "assistant" && (
                          <div className="pt-2 border-t border-border/25 mt-3 flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground italic">Workspace verified statistics</span>
                            <div className="flex gap-1.5">
                              <Button
                                variant="ghost"
                                size="xs"
                                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                                onClick={() => handleCopyText(msg.content)}
                              >
                                <Copy className="size-3" /> Copy
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                                onClick={() => exportReport(msg.content)}
                              >
                                <Download className="size-3" /> Export Report
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Streaming response chunk */}
                  {streaming && currentResponse && (
                    <div className="mr-auto bg-muted/40 border border-border/50 text-foreground rounded-xl rounded-bl-none p-3.5 max-w-[85%] flex gap-3 text-sm leading-relaxed">
                      <div className="shrink-0 mt-0.5">
                        <div className="size-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                          <Loader2 className="size-3.5 animate-spin" />
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between mb-1 text-[10px] text-muted-foreground">
                          <span className="font-semibold uppercase tracking-wider">GrowWave Strategist</span>
                          <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-violet-400 animate-ping" /> streaming...</span>
                        </div>
                        {renderMessageContent(currentResponse)}
                        <span className="inline-block size-2 bg-primary rounded-full animate-ping ml-1" />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Prompt Input & Trigger Area */}
            <div className="p-3 border-t border-border/40 bg-muted/20 shrink-0 relative">
              {/* Command Center Overlay Menu */}
              {showCommands && (
                <div className="absolute bottom-[calc(100%+8px)] left-3 right-3 bg-background border border-border/70 rounded-xl shadow-lg max-h-56 overflow-y-auto z-40 divide-y divide-border/40 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-3.5 py-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted/15 flex items-center justify-between">
                    <span>Quick Executive Assistant Commands</span>
                    <span>ESC to close</span>
                  </div>
                  {commandCenterActions.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => handleSelectCommand(item)}
                    >
                      <div>
                        <span className="text-xs font-semibold text-primary">{item.cmd}</span>
                        <span className="text-xs text-foreground ml-3">{item.label}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}

              <div className="relative rounded-xl border border-border/60 bg-background/50 focus-within:ring-1 focus-within:ring-primary/40 transition-all flex flex-col">
                <Textarea
                  placeholder="Ask the Strategist: 'How is my system today?', 'What should I post tomorrow?', 'Why are my likes decreasing?' (Type '/' for quick commands)..."
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(e.target.value)
                    if (e.target.value.startsWith("/")) {
                      setShowCommands(true)
                    } else {
                      setShowCommands(false)
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  className="min-h-16 max-h-28 resize-none bg-transparent border-0 rounded-xl focus-visible:ring-0 text-xs px-3.5 py-2.5 shrink-0"
                />
                
                <div className="flex items-center justify-between border-t border-border/30 px-3.5 py-2 bg-muted/10 rounded-b-xl shrink-0">
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="xs"
                      className={cn(
                        "h-6 text-[10px] px-2 gap-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
                        showCommands && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                      )}
                      onClick={() => setShowCommands(!showCommands)}
                    >
                      <Terminal className="size-3" /> Command Center
                    </Button>
                    <Badge variant="outline" className="text-[9px] border-border/50 text-muted-foreground flex items-center gap-1 font-normal bg-background/40">
                      <HelpCircle className="size-2.5" /> Shift+Enter for newline
                    </Badge>
                  </div>

                  <Button
                    onClick={() => handleSend()}
                    disabled={streaming || !inputVal.trim()}
                    size="icon"
                    className="size-7 rounded-lg shrink-0 bg-primary text-primary-foreground hover:bg-primary/95 transition-all"
                  >
                    {streaming ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}

// Dummy Chevron Icon needed in rendering commands
function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
