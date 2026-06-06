"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  RefreshCw,
  Copy,
  Plus,
  PenSquare,
  History,
  AlertCircle,
  HelpCircle,
  Zap,
  ChevronRight,
  ArrowRight,
  ClipboardCheck
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { UpgradeModal } from "@/components/free-user/upgrade-modal"

interface GenerationLog {
  id: string
  prompt: string
  result: string
  timestamp: string
  templateName: string
}

export default function FreeAIAssistantPage() {
  const router = useRouter()

  const [prompt, setPrompt] = useState("")
  const [selectedAction, setSelectedAction] = useState<string>("generate-caption")
  const [selectedTone, setSelectedTone] = useState<string>("friendly")
  const [loading, setLoading] = useState(false)
  const [resultText, setResultText] = useState("")
  const [copied, setCopied] = useState(false)

  // Quotas
  const [aiUsage, setAiUsage] = useState(32) // credits used
  const [history, setHistory] = useState<GenerationLog[]>([])
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)

  // Upgrade triggers
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"ai_quota" | "channels_limit" | "bulk_scheduling" | "analytics_pro" | "team_feature" | "inbox_feature" | "platform_locked" | "">("")

  // Prepopulate history and sync
  useEffect(() => {
    const savedUsage = localStorage.getItem("growwave-lite-ai-usage")
    if (savedUsage) {
      setAiUsage(parseInt(savedUsage))
    }

    const savedHistory = localStorage.getItem("growwave-lite-ai-history")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    } else {
      const defaultHistory: GenerationLog[] = []
      setHistory(defaultHistory)
      localStorage.setItem("growwave-lite-ai-history", JSON.stringify(defaultHistory))
    }
  }, [])

  const saveHistory = (updatedHistory: GenerationLog[], updatedUsage: number) => {
    setHistory(updatedHistory)
    setAiUsage(updatedUsage)
    localStorage.setItem("growwave-lite-ai-history", JSON.stringify(updatedHistory))
    localStorage.setItem("growwave-lite-ai-usage", updatedUsage.toString())
  }

  // Templates list
  const templates = [
    { name: "Instagram Caption", icon: "📸", preset: "Write a catchy Instagram caption about: ", action: "generate-caption" },
    { name: "LinkedIn Post", icon: "💼", preset: "Draft an insightful LinkedIn update discussing: ", action: "generate-caption" },
    { name: "TikTok Script", icon: "🎬", preset: "Create a 30-second TikTok video hook and script outlining: ", action: "generate-caption" },
    { name: "Facebook Post", icon: "👥", preset: "Write an engaging Facebook post promoting: ", action: "generate-caption" },
    { name: "Twitter Thread", icon: "🧵", preset: "Draft a 4-tweet Twitter/X thread summarizing key tips for: ", action: "generate-caption" },
    { name: "Reel Hook", icon: "🎣", preset: "Write 3 scroll-stopping Reels video hooks about: ", action: "generate-caption" },
    { name: "CTA Generator", icon: "📣", preset: "Generate 5 high-converting call-to-actions asking readers to: ", action: "generate-caption" },
    { name: "Hashtag List", icon: "#️⃣", preset: "Generate 10 trending hashtags matching: ", action: "generate-hashtags" },
  ]

  const actions = [
    { id: "generate-caption", label: "Generate Caption" },
    { id: "rewrite-text", label: "Rewrite Caption" },
    { id: "generate-hashtags", label: "Generate Hashtags" },
    { id: "improve-grammar", label: "Improve Grammar" },
    { id: "shorten-text", label: "Shorten Text" },
    { id: "expand-text", label: "Expand Text" },
    { id: "change-tone", label: "Change Tone" },
    { id: "content-ideas", label: "Generate Content Ideas" },
    { id: "generate-cta", label: "Generate CTA" },
    { id: "generate-hooks", label: "Generate Hooks" },
    { id: "product-desc", label: "Product Description" }
  ]

  const tones = ["friendly", "professional", "witty", "bold", "educational", "persuasive"]

  const handleApplyTemplate = (temp: typeof templates[0]) => {
    setActiveTemplate(temp.name)
    setPrompt(temp.preset)
    setSelectedAction(temp.action)
  }

  // Generate Action
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt first.")
      return
    }

    // Free limit check: 50 AI requests limit
    if (aiUsage >= 50) {
      setUpgradeReason("ai_quota")
      setUpgradeOpen(true)
      return
    }

    setLoading(true)

    try {
      // Re-map actions for API compatibility
      let apiAction = selectedAction
      if (apiAction === "shorten-text") apiAction = "rewrite-text"
      if (apiAction === "expand-text") apiAction = "rewrite-text"
      if (apiAction === "generate-cta") apiAction = "rewrite-text"
      if (apiAction === "generate-hooks") apiAction = "rewrite-text"
      if (apiAction === "product-desc") apiAction = "generate-caption"

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: apiAction,
          prompt: `${selectedAction === "shorten-text" ? "Shorten this: " : selectedAction === "expand-text" ? "Expand this: " : ""}${prompt}`,
          tone: selectedTone
        })
      })

      if (res.ok) {
        const resultJson = await res.json()
        if (resultJson.result) {
          const finalResult = resultJson.result
          setResultText(finalResult)

          // Append to log history
          const newLog: GenerationLog = {
            id: "g_" + Date.now(),
            prompt: prompt.substring(0, 40) + (prompt.length > 40 ? "..." : ""),
            result: finalResult,
            timestamp: new Date().toISOString(),
            templateName: activeTemplate || "Custom AI Prompt"
          }

          const nextUsage = aiUsage + 1
          saveHistory([newLog, ...history], nextUsage)
        }
      } else {
        throw new Error("Failed")
      }
    } catch (err) {
      console.warn("AI Assistant generate failed, running smart fallback:", err)
      // Custom AI responses for Free plan UX simulation
      let fallbackText = ""
      if (selectedAction === "generate-hashtags") {
        fallbackText = `#GrowWave #SaaS #MarketingTips #Automation #FreelanceLife #GrowthMarketing`
      } else if (selectedAction === "improve-grammar") {
        fallbackText = prompt.replace(/\b(i)\b/g, "I").replace(/\b(wont)\b/g, "won't").trim()
      } else if (selectedAction === "content-ideas") {
        fallbackText = `💡 5 Content Ideas:\n1. Showcase your daily routine\n2. Share a critical industry tips check\n3. Do a Q&A session with audience\n4. Bust a popular niche myth\n5. Offer a free discount`
      } else {
        fallbackText = `✨ [AI Lite Response]: Here is your copy optimized for social media:\n\n"${prompt.replace("Write a catchy Instagram caption about: ", "").replace("Draft an insightful LinkedIn update discussing: ", "")}" is launching today! Don't miss out on streamlining your workspace. 📈🚀`
      }

      setResultText(fallbackText)
      const newLog: GenerationLog = {
        id: "g_" + Date.now(),
        prompt: prompt.substring(0, 40) + (prompt.length > 40 ? "..." : ""),
        result: fallbackText,
        timestamp: new Date().toISOString(),
        templateName: activeTemplate || "Custom AI Prompt"
      }
      const nextUsage = aiUsage + 1
      saveHistory([newLog, ...history], nextUsage)
    } finally {
      setLoading(false)
    }
  }

  // Copy to Clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(resultText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Convert AI generated text to Composer Post
  const handleUseInComposer = () => {
    router.push(`/free-user/create?content=${encodeURIComponent(resultText)}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <Sparkles className="size-6 text-[#30FC47] fill-current animate-pulse" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              GrowWave AI Lite
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your free content writing sidekick. Generate copies, optimize grammar, and brainstorm ideas.
            </p>
          </div>
        </div>

        {/* Upgrade CTA trigger banner */}
        <button
          onClick={() => {
            setUpgradeReason("ai_quota")
            setUpgradeOpen(true)
          }}
          className="flex items-center gap-1.5 bg-[#30FC47] hover:bg-[#24D93B] text-white font-extrabold text-xs px-4 py-2 rounded-lg uppercase tracking-wider transition-all self-start sm:self-auto shadow-sm"
        >
          <Zap className="size-3.5 fill-current" />
          Get Unlimited AI
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Recent Generations history log */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="rounded-xl border border-slate-200 bg-background shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center gap-2">
              <History className="size-4 text-slate-400" />
              <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Recent Outputs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[450px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
              {history.map((log) => (
                <div
                  key={log.id}
                  onClick={() => {
                    setPrompt(log.prompt)
                    setResultText(log.result)
                    setActiveTemplate(log.templateName)
                  }}
                  className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors text-left space-y-1.5 group"
                >
                  <span className="text-[9px] font-extrabold text-emerald-600 dark:text-[#30FC47] uppercase block tracking-wider">
                    {log.templateName}
                  </span>
                  <p className="text-[10.5px] font-bold text-slate-700 dark:text-slate-350 truncate">
                    {log.prompt}
                  </p>
                  <span className="text-[8px] text-slate-400 block font-semibold">
                    {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}

              {history.length === 0 && (
                <div className="py-8 text-center text-[10px] font-medium text-slate-400 select-none">
                  No previous runs
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center/Right Column: Prompt Strategist and Templates grid */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* AI limits meter */}
          <Card className="rounded-xl border border-slate-200 bg-background p-4 shadow-xs dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-500">AI Monthly Quota (50 Requests Per Month)</span>
              <span className="text-slate-900 font-bold dark:text-white">
                {aiUsage} / 50 Used
              </span>
            </div>
            <Progress value={(aiUsage / 50) * 100} className="h-1.5 rounded-full bg-slate-100 mt-2.5" />
            <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
              <span>Resets monthly</span>
              {aiUsage >= 40 && (
                <span className="text-rose-500">Low credits remaining.</span>
              )}
            </div>
          </Card>

          {/* Templates selection grid */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              1. Choose a Quick Template
            </span>
            <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4">
              {templates.map((temp) => (
                <div
                  key={temp.name}
                  onClick={() => handleApplyTemplate(temp)}
                  className={cn(
                    "p-3 rounded-xl border border-slate-200 bg-background text-center cursor-pointer hover:border-[#30FC47]/40 hover:shadow-xs transition-all dark:bg-slate-900 dark:border-slate-800",
                    activeTemplate === temp.name && "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                  )}
                >
                  <span className="text-lg block mb-1">{temp.icon}</span>
                  <span className="text-[11px] font-bold text-slate-850 dark:text-slate-250 leading-tight block truncate">
                    {temp.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt inputs card */}
          <Card className="rounded-xl border border-[#30FC47]/20 bg-background shadow-sm dark:bg-slate-900 dark:border-slate-800 relative">
            {loading && (
              <div className="absolute inset-0 bg-[#FCFAF6]/70 backdrop-blur-xs z-10 flex items-center justify-center flex-col gap-2 rounded-xl dark:bg-slate-900/70">
                <RefreshCw className="size-8 text-emerald-500 animate-spin" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Consulting AI Strategist...</span>
              </div>
            )}

            <CardContent className="p-5 space-y-4">
              {/* Actions & Tone selection */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">AI Action Target</span>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full text-xs font-bold text-slate-600 bg-slate-50 border border-slate-250 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#30FC47] h-8.5 dark:bg-slate-800 dark:border-slate-700"
                  >
                    {actions.map((act) => (
                      <option key={act.id} value={act.id}>{act.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 block mb-1 uppercase">Tone of Voice</span>
                  <select
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value)}
                    className="w-full text-xs font-bold text-slate-600 bg-slate-50 border border-slate-250 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#30FC47] h-8.5 dark:bg-slate-800 dark:border-slate-700"
                  >
                    {tones.map((tone) => (
                      <option key={tone} value={tone}>{tone.charAt(0).toUpperCase() + tone.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prompt textarea */}
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">What should AI write about?</span>
                <Textarea
                  placeholder="Enter keywords, outline, or describe the topic..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="text-xs font-medium border-slate-200 rounded-lg focus-visible:ring-[#30FC47] resize-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-[#30FC47] hover:bg-[#24D93B] text-white font-extrabold text-xs px-6 rounded-lg uppercase tracking-wider flex items-center gap-1"
                >
                  <Sparkles className="size-3.5 text-white fill-current" />
                  Generate Output
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results display box */}
          {resultText && (
            <Card className="rounded-xl border border-slate-250 bg-slate-50/50 p-5 space-y-4 dark:bg-slate-800/20 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2 mb-3">
                  AI Strategist output
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed select-text">
                  {resultText}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/40">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  className="rounded-lg text-xs font-bold gap-1 text-slate-600 border-slate-200 bg-background"
                >
                  {copied ? (
                    <>
                      <ClipboardCheck className="size-4 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copy Output
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleUseInComposer}
                  className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs rounded-lg uppercase tracking-wider flex items-center gap-1"
                  size="sm"
                >
                  Use in Composer
                  <ArrowRight className="size-3.5 text-[#30FC47]" />
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
