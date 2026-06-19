"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  Sparkle,
  RefreshCw,
  Copy,
  ArrowRight,
  ClipboardCheck,
  Zap,
  Bookmark
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { UpgradeModal } from "@/components/free-user/upgrade-modal"
import { useToast } from "@/components/toast-provider"

interface ChatMessage {
  role: "user" | "model"
  content: string
  timestamp?: string
}

interface GenerationLog {
  _id?: string
  id?: string
  prompt: string
  response: string
  model: string
  createdAt: string
}

const suggestionChips = [
  { label: "Facebook Post", preset: "Write a Facebook post about " },
  { label: "Instagram Caption", preset: "Write an Instagram caption for " },
  { label: "Product Launch", preset: "Create a launch campaign for a new product: " },
  { label: "Business Promotion", preset: "Create a business promotion for " },
  { label: "Content Ideas", preset: "Generate 5 content ideas about " },
  { label: "Hashtags", preset: "Generate 10 trending hashtags for " },
  { label: "CTA Generator", preset: "Write a high-converting call to action for " },
  { label: "Growth Strategy", preset: "Create a detailed social media growth strategy for " },
  { label: "Email Campaign", preset: "Draft an email marketing campaign promoting " },
  { label: "Content Calendar", preset: "Generate a 7-day content calendar for " }
]

const formatTime = (isoString?: string) => {
  if (!isoString) return ""
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch (e) {
    return ""
  }
}

export default function FreeAIAssistantPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  
  // Real DB state
  const [aiCredits, setAiCredits] = useState(5)
  const [aiUsedCredits, setAiUsedCredits] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Upgrade Modal triggers
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"ai_quota" | "">("")

  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on messages change
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Fetch initial profile & history on mount
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch user settings for quota
        const settingsRes = await fetch("/api/settings")
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          if (settingsData.user) {
            setAiCredits(settingsData.user.aiCredits !== undefined ? settingsData.user.aiCredits : 5)
            setAiUsedCredits(settingsData.user.aiUsedCredits !== undefined ? settingsData.user.aiUsedCredits : 0)
          }
        }

        // 2. Fetch past generations from database
        const genRes = await fetch("/api/ai/generations")
        if (genRes.ok) {
          const genData = await genRes.json()
          if (genData.generations && Array.isArray(genData.generations)) {
            const loadedMessages: ChatMessage[] = []
            genData.generations.forEach((gen: GenerationLog) => {
              loadedMessages.push({ role: "user", content: gen.prompt, timestamp: gen.createdAt })
              loadedMessages.push({ role: "model", content: gen.response, timestamp: gen.createdAt })
            })
            setMessages(loadedMessages)
          }
        }
      } catch (err) {
        console.error("Error loading user profile or generations:", err)
      }
    }

    loadData()
  }, [])

  const remaining = Math.max(0, aiCredits - aiUsedCredits)

  // Generate Action
  const handleGenerate = async (customPrompt?: string) => {
    const activePrompt = (customPrompt || prompt).trim()
    if (!activePrompt) {
      showToast("Please enter a prompt first.", "error")
      return
    }

    if (remaining <= 0) {
      setUpgradeReason("ai_quota")
      setUpgradeOpen(true)
      return
    }

    setLoading(true)
    setPrompt("")

    // Format current local message list for API call history
    const userMsg: ChatMessage = { 
      role: "user", 
      content: activePrompt, 
      timestamp: new Date().toISOString() 
    }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    try {
      // Map local messages to Gemini API format
      const historyParam = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }]
      }))

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePrompt,
          history: historyParam
        })
      })

      if (res.status === 429 || res.status === 403) {
        setUpgradeReason("ai_quota")
        setUpgradeOpen(true)
        // Revert user message because it wasn't successfully generated
        setMessages(messages)
        return
      }

      if (res.ok) {
        const data = await res.json()
        if (data.response) {
          setMessages([
            ...updatedMessages, 
            { 
              role: "model", 
              content: data.response, 
              timestamp: new Date().toISOString() 
            }
          ])
          setAiUsedCredits((prev) => prev + 1)
          showToast("AI Content generated successfully!", "success")
        } else {
          throw new Error("Invalid response format")
        }
      } else {
        throw new Error("Failed to generate content")
      }
    } catch (err) {
      console.error("AI generation failed:", err)
      setMessages([
        ...updatedMessages,
        { 
          role: "model", 
          content: "Unable to generate content right now. Please try again.", 
          timestamp: new Date().toISOString() 
        }
      ])
      showToast("Unable to generate content right now. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  // Copy to Clipboard
  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
    showToast("Content copied to clipboard", "success")
  }

  // Convert AI generated text to Composer Post
  const handleUseInComposer = (text: string) => {
    router.push(`/free-user/create?content=${encodeURIComponent(text)}`)
  }

  const handleSaveDraft = (text: string) => {
    localStorage.setItem("growwave-draft-caption", text)
    showToast("Draft saved successfully to Creator workspace!", "success")
  }

  const handleRegenerate = (originalPrompt: string) => {
    handleGenerate(originalPrompt)
  }

  const handleStartCreating = () => {
    setPrompt("Create a launch campaign for a new organic juice brand")
    textareaRef.current?.focus()
  }

  return (
    <div className="max-w-[700px] mx-auto w-full flex flex-col min-h-[calc(100vh-140px)] space-y-6 px-4 py-4">
      {/* Top Header Section */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-6 select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex flex-wrap items-baseline justify-between sm:justify-start gap-x-3 gap-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                GrowWave AI Assistant
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full shadow-xs ${
                remaining === 0
                  ? "bg-[#FEE2E2] dark:bg-red-950/40 text-[#EF4444]"
                  : remaining === 1
                  ? "bg-[#FEF3C7] dark:bg-amber-950/40 text-[#D97706]"
                  : "bg-[#E8FAD0] dark:bg-emerald-950/40 text-[#22C55E] dark:text-[var(--brand-primary)]"
              }`}>
                ✨ {remaining} AI Credit{remaining === 1 ? "" : "s"} Remaining
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 max-w-lg font-medium leading-relaxed mt-1">
              Create captions, content ideas, campaigns, hashtags and social media strategies powered by AI.
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-h-[350px] bg-transparent rounded-2xl overflow-hidden relative">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 py-12 select-none my-auto max-w-[500px] mx-auto">
            <div className="p-4 bg-white dark:bg-[#1F2937] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 text-[#22C55E]">
              <Sparkles className="size-10 fill-current animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-[#0F172A] dark:text-white">✨ Start Creating</h3>
              <p className="text-sm text-[#64748B] dark:text-slate-400 font-medium leading-relaxed">
                Ask GrowWave AI to generate captions, ideas, campaigns and content strategies.
              </p>
              <p className="text-xs text-[#94A3B8] dark:text-slate-500 font-bold">
                You have 5 free AI generations.
              </p>
            </div>
            <Button
              onClick={handleStartCreating}
              className="bg-[#22C55E] hover:bg-[#16a34a] text-white font-extrabold text-xs tracking-wider uppercase px-6 py-3 h-10 rounded-full flex items-center gap-2 shadow-md hover:shadow-lg transition-all border-0 cursor-pointer"
            >
              Generate Your First Response
            </Button>
          </div>
        ) : (
          /* Scrollable chat thread */
          <div className="flex-1 overflow-y-auto space-y-6 pr-1 max-h-[550px] pb-6">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user"
              const isError = msg.content === "Unable to generate content right now. Please try again."
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? "items-end text-right" : "items-start text-left"} w-full space-y-1`}
                >
                  <div
                    className={`max-w-[85%] px-4.5 py-3 text-sm font-medium leading-relaxed ${
                      isUser
                        ? "bg-[#DCFCE7] dark:bg-[rgba(48,252,71,0.15)] text-[#0F172A] dark:text-[#F8FAFC] rounded-2xl rounded-tr-none ml-auto shadow-xs font-semibold"
                        : isError
                        ? "bg-[#FEF2F2] dark:bg-rose-950/20 text-[#EF4444] rounded-2xl rounded-tl-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-red-100 dark:border-rose-900/30 font-semibold"
                        : "bg-white dark:bg-[#1F2937] text-[#0F172A] dark:text-[#F8FAFC] rounded-2xl rounded-tl-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-slate-100/50 dark:border-slate-800/50"
                    }`}
                  >
                    <p className="whitespace-pre-wrap select-text">{msg.content}</p>
                  </div>

                  {/* Actions & Timestamps */}
                  {!isUser && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full max-w-[85%] gap-2 pt-1 px-1 select-none">
                      <span className="text-[10px] text-[#94A3B8] font-bold">
                        {formatTime(msg.timestamp) || "Just now"} • Powered by Gemini
                      </span>
                      {!isError && (
                        <div className="flex flex-wrap items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(msg.content, idx)}
                            className="h-7 text-[10px] font-bold text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-white/50 dark:hover:bg-slate-800/50 px-2 rounded-lg gap-1 border-0"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <ClipboardCheck className="size-3 text-[#22C55E]" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                Copy
                              </>
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveDraft(msg.content)}
                            className="h-7 text-[10px] font-bold text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-white/50 dark:hover:bg-slate-800/50 px-2 rounded-lg gap-1 border-0"
                          >
                            <Bookmark className="size-3 text-[#22C55E]" />
                            Save Draft
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUseInComposer(msg.content)}
                            className="h-7 text-[10px] font-bold text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-white/50 dark:hover:bg-slate-800/50 px-2 rounded-lg gap-1 border-0"
                          >
                            Use in Post
                            <ArrowRight className="size-3 text-[#22C55E]" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegenerate(messages[idx - 1]?.content || "")}
                            disabled={loading || remaining <= 0}
                            className="h-7 text-[10px] font-bold text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-white/50 dark:hover:bg-slate-800/50 px-2 rounded-lg gap-1 border-0"
                          >
                            <RefreshCw className="size-3" />
                            Regenerate
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {isUser && (
                    <div className="pt-0.5 px-1 select-none">
                      <span className="text-[10px] text-[#94A3B8] font-bold">
                        {formatTime(msg.timestamp) || "Just now"}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Thinking state bubble */}
            {loading && (
              <div className="flex flex-col items-start w-full space-y-1 animate-pulse">
                <div className="max-w-[85%] px-4.5 py-3 bg-white dark:bg-[#1F2937] text-[#0F172A] dark:text-[#F8FAFC] rounded-2xl rounded-tl-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-slate-100/50 dark:border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="size-4 text-[#22C55E] animate-spin" />
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-white">Thinking...</span>
                  </div>
                  <p className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 font-bold">Powered by Gemini</p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {remaining > 0 ? (
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100/50 dark:border-slate-800/50 space-y-4">
          {remaining === 1 && (
            <div className="bg-[#FEF3C7] dark:bg-amber-950/40 border border-[#F59E0B]/20 rounded-2xl p-4 flex items-center gap-2.5 text-[#B45309] dark:text-amber-300 text-xs font-bold select-none">
              <span className="text-sm">⚠</span>
              <span>You have 1 free AI request remaining today.</span>
            </div>
          )}
          {/* Fixed Textarea */}
          <div className="space-y-1">
            <Textarea
              ref={textareaRef}
              placeholder="Describe what you want to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={remaining <= 0}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleGenerate()
                }
              }}
              className="text-sm border-0 bg-[#FCFAF6] dark:bg-[#1F2937]/50 rounded-2xl focus-visible:ring-[#22C55E] focus-visible:ring-offset-0 resize-none p-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[#0F172A] dark:text-[#F8FAFC] font-semibold w-full outline-hidden h-[140px] min-h-[140px] max-h-[140px] border border-transparent dark:border-slate-800"
            />
          </div>

          {/* Quick Actions Chip Grid (Responsive: 4/3/2 layout) */}
          <div className="space-y-2 select-none">
            <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider block">
              Quick Actions
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {suggestionChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setPrompt(chip.preset)}
                  disabled={remaining <= 0}
                  className="text-[11px] font-bold bg-[#FCFAF6] dark:bg-[#1F2937]/50 text-[#0F172A] dark:text-[#F8FAFC] px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-[#DCFCE7] dark:hover:bg-[rgba(48,252,71,0.10)] hover:text-[#22C55E] dark:hover:text-[#22C55E] transition-all text-center truncate disabled:opacity-40 cursor-pointer"
                  title={chip.label}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button always attached inside the card */}
          <div className="flex justify-end pt-2 select-none">
            <Button
              onClick={() => handleGenerate()}
              disabled={loading || !prompt.trim() || remaining <= 0}
              className="bg-[#22C55E] hover:bg-[#16a34a] text-white font-extrabold text-xs tracking-wider uppercase px-8 py-3.5 h-10 rounded-full flex items-center gap-2 shadow-md hover:shadow-lg transition-all border-0 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="size-3.5 text-white animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5 text-white fill-current" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Limit Reached Card replacing the Composer directly in the same location */
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 text-center space-y-6 select-none w-full">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-455">
            <Sparkles className="size-6 fill-current animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-[#0F172A] dark:text-white">AI Credit Limit Reached</h3>
            <p className="text-sm text-[#64748B] dark:text-slate-400 max-w-sm mx-auto font-medium">
              You have used all available AI credits. Upgrade your plan or contact your administrator.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => {
                setUpgradeReason("ai_quota")
                setUpgradeOpen(true)
              }}
              className="bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-xs uppercase tracking-wider px-8 py-3.5 rounded-full border-0 shadow-sm transition-all cursor-pointer"
            >
              Upgrade Plan
            </Button>
            <Button
              onClick={() => router.push("/contact")}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-black text-xs uppercase tracking-wider px-8 py-3.5 rounded-full border border-slate-200 dark:border-slate-750 shadow-sm transition-all cursor-pointer font-bold"
            >
              Contact Support
            </Button>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason={upgradeReason} />
    </div>
  )
}

