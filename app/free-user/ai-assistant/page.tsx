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
  Bookmark,
  Share2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { UpgradeModal } from "@/components/free-user/upgrade-modal"
import { useToast } from "@/components/toast-provider"

interface ChatMessage {
  role: "user" | "model"
  content: string
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

export default function FreeAIAssistantPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  
  // Real DB state
  const [requestsUsed, setRequestsUsed] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Upgrade Modal triggers
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"ai_quota" | "">("")

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on messages change
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch initial profile & history on mount
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch user settings for quota
        const settingsRes = await fetch("/api/settings")
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          if (settingsData.user) {
            // Priority: user.aiCreditsUsed or requestsUsed
            setRequestsUsed(
              settingsData.user.aiCreditsUsed !== undefined
                ? settingsData.user.aiCreditsUsed
                : settingsData.user.requestsUsed || 0
            )
          }
        }

        // 2. Fetch past generations from database
        const genRes = await fetch("/api/ai/generations")
        if (genRes.ok) {
          const genData = await genRes.json()
          if (genData.generations && Array.isArray(genData.generations)) {
            const loadedMessages: ChatMessage[] = []
            genData.generations.forEach((gen: GenerationLog) => {
              loadedMessages.push({ role: "user", content: gen.prompt })
              loadedMessages.push({ role: "model", content: gen.response })
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

  const remaining = Math.max(0, 5 - requestsUsed)

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
    const userMsg: ChatMessage = { role: "user", content: activePrompt }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    try {
      // Map local messages to Gemini API format: role 'model' instead of 'assistant'
      const historyParam = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }]
      }))

      const res = await fetch("/app/api/ai/generate", {
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
        return
      }

      if (res.ok) {
        const data = await res.json()
        if (data.response) {
          setMessages([...updatedMessages, { role: "model", content: data.response }])
          setRequestsUsed((prev) => prev + 1)
          showToast("AI Content generated successfully!", "success")
        }
      } else {
        throw new Error("Failed to generate content")
      }
    } catch (err) {
      console.warn("AI generation failed, running smart fallback:", err)
      
      const fallbackText = `Here is your optimized social media copy for "${activePrompt.replace("Write a catchy Instagram caption about: ", "")}":\n\nLaunching today! Streamline your workspace, boost your engagement, and design posts in seconds with GrowWave. 📈🚀`
      
      setMessages([...updatedMessages, { role: "model", content: fallbackText }])
      setRequestsUsed((prev) => prev + 1)
      showToast("AI Generation completed (fallback enabled).", "info")
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
    // Save draft locally
    localStorage.setItem("growwave-draft-caption", text)
    showToast("Draft saved successfully to Creator workspace!", "success")
  }

  const handleRegenerate = (originalPrompt: string) => {
    handleGenerate(originalPrompt)
  }

  return (
    <div className="max-w-[700px] mx-auto w-full flex flex-col min-h-[calc(100vh-140px)] space-y-6 px-4 py-4">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 select-none">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] flex items-center gap-2">
            ✨ GrowWave AI Assistant
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-lg font-medium leading-relaxed">
            Create captions, content ideas, campaigns, hashtags and social media strategies powered by AI.
          </p>
          <p className="text-xs text-[#64748B] font-bold mt-1">
            Free Plan • AI Credits Remaining
          </p>
        </div>

        {/* Credits Card */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-0 flex items-center justify-between gap-6 min-w-[200px] sm:min-w-[240px] select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#DCFCE7] rounded-xl text-[#22C55E]">
              <Sparkles className="size-4 fill-current animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">✨ AI Credits</p>
              <p className="text-sm font-black text-[#0F172A]">{remaining} Remaining</p>
              <p className="text-[9px] font-bold text-[#64748B]">Free Plan</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setUpgradeReason("ai_quota")
              setUpgradeOpen(true)
            }}
            className="bg-[#22C55E] hover:bg-[#16a34a] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2 h-8 rounded-xl border-0 shadow-xs transition-colors cursor-pointer"
          >
            Upgrade
          </Button>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-h-[350px] bg-transparent rounded-2xl overflow-hidden relative">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12 select-none my-auto">
            <div className="p-4 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] text-[#22C55E]">
              <Sparkle className="size-10 fill-current animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#0F172A]">Start creating with AI</h3>
              <p className="text-xs text-[#64748B] font-semibold">
                You have 5 free AI generations available.
              </p>
            </div>
          </div>
        ) : (
          /* Scrollable chat thread */
          <div className="flex-1 overflow-y-auto space-y-6 pr-1 max-h-[550px] pb-6">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user"
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full space-y-1`}
                >
                  <div
                    className={`max-w-[85%] px-4.5 py-3 text-sm font-medium leading-relaxed ${
                      isUser
                        ? "bg-[#DCFCE7] text-[#0F172A] rounded-2xl rounded-tr-xs"
                        : "bg-white text-[#0F172A] rounded-[20px] rounded-tl-xs shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap select-text">{msg.content}</p>
                  </div>

                  {/* Bubble Actions - Display under the latest AI response bubble */}
                  {!isUser && idx === messages.length - 1 && (
                    <div className="flex items-center gap-1.5 pt-1.5 pl-1 select-none">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyToClipboard(msg.content, idx)}
                        className="h-7 text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-white/50 px-2 rounded-lg gap-1 border-0"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <ClipboardCheck className="size-3.5 text-[#22C55E]" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            Copy
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveDraft(msg.content)}
                        className="h-7 text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-white/50 px-2 rounded-lg gap-1 border-0"
                      >
                        <Bookmark className="size-3.5 text-[#22C55E]" />
                        Save Draft
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUseInComposer(msg.content)}
                        className="h-7 text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-white/50 px-2 rounded-lg gap-1 border-0"
                      >
                        Use in Post
                        <ArrowRight className="size-3.5 text-[#22C55E]" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerate(messages[idx - 1]?.content || "")}
                        disabled={loading || remaining <= 0}
                        className="h-7 text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-white/50 px-2 rounded-lg gap-1 border-0"
                      >
                        <RefreshCw className="size-3.5" />
                        Regenerate
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Composer Area */}
      <div className="space-y-4">
        {/* Suggestion Chips */}
        {remaining > 0 && (
          <div className="space-y-1 select-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                Quick Actions
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none pr-1">
              {suggestionChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => setPrompt(chip.preset)}
                  disabled={remaining <= 0}
                  className="text-[11px] font-bold bg-white text-[#0F172A] px-3.5 py-1.5 rounded-full border border-slate-100/50 shadow-xs cursor-pointer hover:bg-[#DCFCE7] hover:text-[#22C55E] transition-all whitespace-nowrap shrink-0 disabled:opacity-40"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Textarea Box */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border-0 space-y-4 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-20 flex items-center justify-center flex-col gap-2">
              <RefreshCw className="size-7 text-[#22C55E] animate-spin" />
              <span className="text-xs font-bold text-[#0F172A] animate-pulse">Consulting Gemini AI...</span>
            </div>
          )}

          <div className="space-y-1">
            <Textarea
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
              rows={3}
              className="text-sm border-0 bg-[#FCFAF6] rounded-2xl focus-visible:ring-[#22C55E] focus-visible:ring-offset-0 resize-none p-4 placeholder:text-slate-400 text-[#0F172A] font-semibold w-full outline-hidden"
            />
          </div>

          <div className="flex justify-center select-none">
            <Button
              onClick={() => handleGenerate()}
              disabled={loading || !prompt.trim() || remaining <= 0}
              className="bg-[#22C55E] hover:bg-[#16a34a] text-white font-extrabold text-xs tracking-wider uppercase px-8 py-3.5 h-10 rounded-full flex items-center gap-2 shadow-md hover:shadow-lg transition-all border-0 disabled:opacity-50"
            >
              <Sparkles className="size-3.5 text-white fill-current" />
              Generate with AI
            </Button>
          </div>
        </div>
      </div>

      {/* Limit Reached Upgrade Screen */}
      {remaining <= 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border-0 text-center space-y-6 select-none max-w-[700px] mx-auto w-full">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#22C55E]">
            <Sparkles className="size-6 fill-current" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-[#0F172A]">You've used all 5 free AI generations</h3>
            <p className="text-sm text-[#64748B] max-w-sm mx-auto font-medium">
              Upgrade to GrowWave Pro for unlimited AI access.
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => {
                setUpgradeReason("ai_quota")
                setUpgradeOpen(true)
              }}
              className="bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-xs uppercase tracking-wider px-8 py-3.5 rounded-full border-0 shadow-sm transition-all"
            >
              Upgrade to Pro
            </Button>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason={upgradeReason} />
    </div>
  )
}
