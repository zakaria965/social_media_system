"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  PenSquare,
  Sparkles,
  Image as ImageIcon,
  Smile,
  Hash,
  Trash2,
  Plus,
  ArrowRight,
  RefreshCw,
  Lock,
  Check,
  Calendar,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Move,
  X,
  Zap,
  Loader2,
  CheckCircle2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
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

interface IdeaItem {
  id: string
  title: string
  content: string
  contentNotes?: string
  tags?: string
  platform?: string
  column: "Ideas" | "Drafts" | "Ready To Publish" | "Published"
}

function CreateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<"ideas" | "composer">("ideas")

  // Board ideas state (initialized empty)
  const [ideas, setIdeas] = useState<IdeaItem[]>([])
  const [newIdeaTitle, setNewIdeaTitle] = useState("")
  const [newIdeaContent, setNewIdeaContent] = useState("")
  const [newIdeaNotes, setNewIdeaNotes] = useState("")
  const [newIdeaTags, setNewIdeaTags] = useState("")
  const [newIdeaPlatform, setNewIdeaPlatform] = useState("facebook")
  const [newIdeaStatus, setNewIdeaStatus] = useState<IdeaItem["column"]>("Ideas")
  
  const [ideaFormOpen, setIdeaFormOpen] = useState(false)
  const [aiGeneratingIdea, setAiGeneratingIdea] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")

  // Composer Form states
  const [postTitle, setPostTitle] = useState("")
  const [postContent, setPostContent] = useState("")
  const [mediaFile, setMediaFile] = useState<{ name: string; size: number; url: string } | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["facebook"])
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("12:00")

  // Popover menus
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [aiAssistOpen, setAiAssistOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  // Upgrade modals
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"ai_quota" | "channels_limit" | "bulk_scheduling" | "analytics_pro" | "team_feature" | "inbox_feature" | "platform_locked" | "">("")

  // Onboarding Checklist
  const [checklistOpen, setChecklistOpen] = useState(true)
  const [connectedCount, setConnectedCount] = useState(0)
  const [scheduledCount, setScheduledCount] = useState(0)

  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Load state from local storage or set defaults
  useEffect(() => {
    // Check search params
    const action = searchParams.get("action")
    if (action === "schedule") {
      setIsScheduling(true)
      setActiveTab("composer")
    }

    // Load ideas - Empty by default
    const savedIdeas = localStorage.getItem("growwave-lite-ideas")
    if (savedIdeas) {
      setIdeas(JSON.parse(savedIdeas))
    } else {
      setIdeas([])
      localStorage.setItem("growwave-lite-ideas", JSON.stringify([]))
    }

    // Load connected channels
    const savedChannels = localStorage.getItem("growwave-lite-channels")
    if (savedChannels) {
      const parsed = JSON.parse(savedChannels)
      setConnectedCount(parsed.filter((c: any) => c.connected).length)
    } else {
      setConnectedCount(0)
    }

    // Load scheduled posts count
    const savedScheduled = localStorage.getItem("growwave-lite-scheduled")
    if (savedScheduled) {
      setScheduledCount(JSON.parse(savedScheduled).length)
    } else {
      setScheduledCount(0)
    }
  }, [searchParams])

  const saveIdeasToStorage = (updatedIdeas: IdeaItem[]) => {
    setIdeas(updatedIdeas)
    localStorage.setItem("growwave-lite-ideas", JSON.stringify(updatedIdeas))
  }

  // Emojis list
  const emojis = ["😀", "🚀", "🔥", "✨", "💡", "🎉", "👍", "👏", "❤️", "👀", "📈", "🙌", "💥", "📅", "😊"]

  const handleInsertEmoji = (emoji: string) => {
    setPostContent((prev) => prev + emoji)
    setEmojiOpen(false)
    if (contentTextareaRef.current) {
      contentTextareaRef.current.focus()
    }
  }

  // Platform details
  const platforms = [
    { id: "facebook", label: "Facebook", icon: IconFacebook, color: "text-blue-600", maxChars: 5000 },
    { id: "instagram", label: "Instagram", icon: IconInstagram, color: "text-pink-600", maxChars: 2200 },
    { id: "linkedin", label: "LinkedIn", icon: IconLinkedin, color: "text-sky-700", maxChars: 3000 },
    { id: "twitter", label: "Twitter / X", icon: IconX, color: "text-black dark:text-white", maxChars: 280, locked: true },
    { id: "tiktok", label: "TikTok", icon: IconTikTok, color: "text-fuchsia-600", maxChars: 150, locked: true },
  ]

  // Handle platform selection limits
  const handleTogglePlatform = (platformId: string, locked?: boolean) => {
    if (locked) {
      setUpgradeReason("platform_locked")
      setUpgradeOpen(true)
      return
    }

    if (selectedPlatforms.includes(platformId)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platformId))
      }
    } else {
      if (selectedPlatforms.length >= 3) {
        setUpgradeReason("channels_limit")
        setUpgradeOpen(true)
      } else {
        setSelectedPlatforms([...selectedPlatforms, platformId])
      }
    }
  }

  // Character limit based on selected platforms
  const getActiveCharacterLimit = () => {
    let minLimit = 5000
    selectedPlatforms.forEach((pId) => {
      const match = platforms.find((p) => p.id === pId)
      if (match && match.maxChars < minLimit) {
        minLimit = match.maxChars
      }
    })
    return minLimit
  }

  const activeCharLimit = getActiveCharacterLimit()

  // Handle simulated media upload
  const handleSimulatedMedia = () => {
    const mockFiles = [
      { name: "promo_graphic.png", size: 12.5 },
      { name: "product_demo.mp4", size: 45.2 },
      { name: "team_photo.jpg", size: 4.8 }
    ]
    const chosen = mockFiles[Math.floor(Math.random() * mockFiles.length)]

    setMediaFile({
      name: chosen.name,
      size: chosen.size,
      url: "/placeholder-media.png"
    })
  }

  // AI Assist Action calling real api/generate route
  const handleAIAssist = async (actionType: "generate-caption" | "rewrite-text" | "generate-hashtags" | "improve-grammar") => {
    setAiAssistOpen(false)
    setAiLoading(true)

    try {
      const promptText = actionType === "generate-caption" ? postTitle : postContent
      if (!promptText.trim()) {
        alert("Please enter a title or content first before using AI.")
        setAiLoading(false)
        return
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          prompt: promptText,
          tone: "friendly"
        })
      })

      if (res.ok) {
        const resultJson = await res.json()
        if (resultJson.result) {
          if (actionType === "generate-hashtags") {
            setPostContent((prev) => `${prev}\n\n#${resultJson.result.split(", ").join(" #")}`)
          } else {
            setPostContent(resultJson.result)
          }
        }
      } else {
        throw new Error("API failed")
      }
    } catch (err) {
      console.warn("AI Generation failed, using fallback:", err)
      let mockResult = ""
      if (actionType === "rewrite-text") {
        mockResult = `✨ Update: ${postContent} Check it out and let us know your thoughts! 👇`
      } else if (actionType === "improve-grammar") {
        mockResult = postContent.trim() ? postContent.replace(/\s+/g, " ") : "Draft content here..."
      } else if (actionType === "generate-hashtags") {
        mockResult = `${postContent}\n\n#SocialMedia #Marketing #GrowWave`
      } else {
        mockResult = `🚀 Introducing ${postTitle || "our project"}! Designed to make your workflow simple and powerful.`
      }
      setPostContent(mockResult)
    } finally {
      setAiLoading(false)
    }
  }

  // New Idea Creation
  const handleCreateIdea = () => {
    if (!newIdeaTitle.trim()) return
    const newIdea: IdeaItem = {
      id: "idea_" + Date.now(),
      title: newIdeaTitle,
      content: newIdeaContent,
      contentNotes: newIdeaNotes,
      tags: newIdeaTags,
      platform: newIdeaPlatform,
      column: newIdeaStatus,
    }
    saveIdeasToStorage([newIdea, ...ideas])
    
    // Clear inputs
    setNewIdeaTitle("")
    setNewIdeaContent("")
    setNewIdeaNotes("")
    setNewIdeaTags("")
    setNewIdeaPlatform("facebook")
    setNewIdeaStatus("Ideas")
    setIdeaFormOpen(false)
  }

  const handleDeleteIdea = (id: string) => {
    saveIdeasToStorage(ideas.filter((i) => i.id !== id))
  }

  const handleMoveIdea = (id: string, nextColumn: IdeaItem["column"]) => {
    saveIdeasToStorage(
      ideas.map((i) => (i.id === id ? { ...i, column: nextColumn } : i))
    )
  }

  const handleConvertIdeaToPost = (idea: IdeaItem) => {
    setPostTitle(idea.title)
    setPostContent(idea.content)
    setActiveTab("composer")
    handleMoveIdea(idea.id, "Published")
  }

  // AI Idea Generator Modal integration
  const handleGenerateIdeaAI = async () => {
    if (!aiPrompt.trim()) {
      alert("Please enter a topic or prompt for the AI.")
      return
    }
    setAiGeneratingIdea(true)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-caption",
          prompt: aiPrompt,
          tone: "friendly"
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.result) {
          setNewIdeaTitle(aiPrompt.slice(0, 30))
          setNewIdeaContent(data.result)
          setAiPrompt("")
        }
      } else {
        throw new Error("Failed")
      }
    } catch (err) {
      console.warn("AI Generation failed, using mock fallback:", err)
      setNewIdeaTitle(aiPrompt.slice(0, 30))
      setNewIdeaContent(`💡 Idea generated for "${aiPrompt}": Create a carousel post explaining the top 3 tricks of this concept. Make sure the visuals are super clean!`)
      setAiPrompt("")
    } finally {
      setAiGeneratingIdea(false)
    }
  }

  // Publish / Schedule Action
  const handlePublishOrSchedule = () => {
    if (!postContent.trim()) {
      alert("Post content cannot be empty.")
      return
    }

    if (isScheduling) {
      const newScheduledPost = {
        id: "post_" + Date.now(),
        title: postTitle || "Untitled Draft",
        content: postContent,
        status: "scheduled",
        platforms: selectedPlatforms,
        scheduledAt: `${scheduledDate || new Date().toISOString().split("T")[0]}T${scheduledTime}:00.000Z`
      }

      const existingPosts = JSON.parse(localStorage.getItem("growwave-lite-scheduled") || "[]")
      const updated = [...existingPosts, newScheduledPost]
      localStorage.setItem("growwave-lite-scheduled", JSON.stringify(updated))
      setScheduledCount(updated.length)

      alert("Post successfully scheduled!")
      router.push("/free-user/scheduled")
    } else {
      // Simulate publish now
      alert("Post successfully published!")
      setPostTitle("")
      setPostContent("")
      setMediaFile(null)
    }
  }

  // Checklist Calculations
  const checklistSteps = [
    { label: "Create your GrowWave account", checked: true },
    { label: "Connect your first channel", checked: connectedCount > 0, href: "/free-user/settings?tab=accounts" },
    { label: "Save an idea", checked: ideas.length > 0, action: () => setIdeaFormOpen(true) },
    { label: "Publish your first post", checked: scheduledCount > 0, action: () => setActiveTab("composer") }
  ]
  const completedStepsCount = checklistSteps.filter(s => s.checked).length

  return (
    <div className="space-y-6">
      {/* Top Banner and Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Create Content
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Brainstorm content board ideas or compose active posts.
          </p>
        </div>
        
        {/* Toggle between board view and composer */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("ideas")}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5",
              activeTab === "ideas"
                ? "bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <Sparkles className="size-3.5 text-emerald-600 dark:text-[#30FC47]" />
            Content Board
          </button>
          <button
            onClick={() => setActiveTab("composer")}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5",
              activeTab === "composer"
                ? "bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <PenSquare className="size-3.5 text-emerald-600 dark:text-[#30FC47]" />
            Post Composer
          </button>
        </div>
      </div>

      {activeTab === "composer" ? (
        /* ================= COMPOSER TAB ================= */
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800 relative">
              {aiLoading && (
                <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm z-10 flex items-center justify-center flex-col gap-2 rounded-xl">
                  <RefreshCw className="size-8 text-emerald-500 animate-spin" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Generating AI improvements...</span>
                </div>
              )}

              <CardContent className="p-5 md:p-6 space-y-5">
                {/* Platform Picker */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    1. Select Channels (Max 3)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((plat) => {
                      const BrandIcon = plat.icon
                      const isSelected = selectedPlatforms.includes(plat.id)
                      return (
                        <button
                          key={plat.id}
                          onClick={() => handleTogglePlatform(plat.id, plat.locked)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all hover:scale-102",
                            isSelected
                              ? "bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950"
                              : "bg-white text-slate-750 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
                            plat.locked && "opacity-60 border-dashed hover:border-emerald-500/30"
                          )}
                        >
                          <div className={cn("size-4 flex items-center justify-center shrink-0", isSelected ? "text-[#30FC47]" : plat.color)}>
                            <BrandIcon className="size-3.5" />
                          </div>
                          <span>{plat.label}</span>
                          {plat.locked && <Lock className="size-3 text-emerald-500 shrink-0 ml-0.5" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Composer Text Fields */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    2. Write Post
                  </span>
                  <Input
                    placeholder="Enter Post Title (Internal reference)"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="border-slate-200 rounded-lg text-xs font-bold bg-slate-50/30 focus-visible:ring-[#30FC47]"
                  />
                  <div className="relative">
                    <Textarea
                      ref={contentTextareaRef}
                      placeholder="What would you like to share? Start typing or use AI assist to generate copy..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      rows={6}
                      className="border-slate-200 rounded-lg text-xs font-medium pr-10 focus-visible:ring-[#30FC47] resize-none"
                    />

                    {/* Character limit overlay */}
                    <div className={cn(
                      "absolute bottom-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full select-none",
                      postContent.length > activeCharLimit
                        ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    )}>
                      {postContent.length} / {activeCharLimit}
                    </div>
                  </div>
                </div>

                {/* Composer Quick Tools (Emoji, Hashtag, AI Assist) */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2">
                    {/* Emoji Picker Popover */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEmojiOpen(!emojiOpen); setAiAssistOpen(false) }}
                        className="rounded-lg text-xs font-bold gap-1 text-slate-600 border-slate-200 bg-white"
                      >
                        <Smile className="size-4 text-slate-900" />
                        Emoji
                      </Button>
                      {emojiOpen && (
                        <div className="absolute top-10 left-0 z-20 grid grid-cols-5 gap-1.5 p-2 bg-white rounded-lg border border-slate-200 shadow-xl w-44 dark:bg-slate-850 dark:border-slate-700">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleInsertEmoji(emoji)}
                              className="size-7 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-750 rounded transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Hashtags generator */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIAssist("generate-hashtags")}
                      disabled={aiLoading}
                      className="rounded-lg text-xs font-bold gap-1 text-slate-600 border-slate-200 bg-white"
                    >
                      <Hash className="size-4 text-slate-900" />
                      Tags
                    </Button>

                    {/* AI Assist Action Options */}
                    <div className="relative">
                      <Button
                        onClick={() => { setAiAssistOpen(!aiAssistOpen); setEmojiOpen(false) }}
                        disabled={aiLoading}
                        className="rounded-lg text-xs font-bold gap-1.5 bg-slate-900 text-white hover:bg-slate-950"
                        size="sm"
                      >
                        <Sparkles className="size-3.5 text-[#30FC47]" />
                        AI Assist
                      </Button>
                      {aiAssistOpen && (
                        <div className="absolute top-10 left-0 z-20 flex flex-col p-1.5 bg-white rounded-lg border border-slate-200 shadow-xl w-48 dark:bg-slate-850 dark:border-slate-700">
                          <button
                            onClick={() => handleAIAssist("generate-caption")}
                            className="text-left text-xs font-bold px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-md transition-colors text-slate-750 dark:text-slate-300"
                          >
                            🪄 Generate Caption
                          </button>
                          <button
                            onClick={() => handleAIAssist("rewrite-text")}
                            className="text-left text-xs font-bold px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-md transition-colors text-slate-750 dark:text-slate-300"
                          >
                            🔄 Rewrite Content
                          </button>
                          <button
                            onClick={() => handleAIAssist("improve-grammar")}
                            className="text-left text-xs font-bold px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-md transition-colors text-slate-750 dark:text-slate-300"
                          >
                            ✍️ Fix Grammar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Media dropzone */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    3. Media Upload (Free limit: 500MB max)
                  </span>
                  {mediaFile ? (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-150 bg-slate-50 dark:bg-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#30FC47]/20 text-emerald-700 rounded">
                          <ImageIcon className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{mediaFile.name}</p>
                          <p className="text-[9px] text-slate-400 font-semibold">{mediaFile.size} MB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMediaFile(null)}
                        className="text-slate-400 hover:text-rose-500 rounded-lg size-8"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={handleSimulatedMedia}
                      className="border border-dashed border-slate-200 hover:border-[#30FC47] rounded-xl p-6 text-center cursor-pointer bg-slate-50/20 hover:bg-[#30FC47]/5 transition-all flex flex-col items-center justify-center gap-1.5"
                    >
                      <ImageIcon className="size-8 text-slate-400" />
                      <p className="text-xs font-bold text-slate-750 dark:text-slate-300">Click to upload media</p>
                      <p className="text-[10px] text-slate-400">Supports PNG, JPG, MP4 (Max 100MB per file)</p>
                    </div>
                  )}
                </div>

                {/* Scheduler block */}
                <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Schedule this post
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Choose a future publishing time for queue scheduling.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsScheduling(!isScheduling)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        isScheduling ? "bg-[#30FC47]" : "bg-slate-200 dark:bg-slate-700"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                          isScheduling ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  {isScheduling && (
                    <div className="grid gap-3 sm:grid-cols-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Date</span>
                        <Input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="h-9 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Time</span>
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="h-9 text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPostTitle("")
                  setPostContent("")
                  setMediaFile(null)
                  setIsScheduling(false)
                }}
                className="rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 border-slate-250 bg-white"
              >
                Clear Draft
              </Button>
              <Button
                onClick={handlePublishOrSchedule}
                className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-extrabold text-xs px-6 rounded-lg uppercase tracking-wider shadow-sm"
              >
                {isScheduling ? "Schedule Post" : "Publish Now"}
              </Button>
            </div>
          </div>

          {/* Right Live Preview Column */}
          <div className="lg:col-span-4">
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Live Feed Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="rounded-xl border border-slate-200 dark:border-slate-850 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs">
                      GW
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block dark:text-white">GrowWave User</span>
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">Preview Model</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-350 whitespace-pre-wrap leading-normal font-medium min-h-[50px]">
                    {postContent || "Your post content preview will appear here..."}
                  </p>

                  {mediaFile && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-8 text-center h-40">
                      <div className="text-center text-slate-400">
                        <ImageIcon className="size-8 mx-auto mb-1 text-emerald-500" />
                        <span className="text-[10px] font-bold block truncate max-w-[150px]">{mediaFile.name}</span>
                        <span className="text-[9px] font-semibold block">{mediaFile.size}MB</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>Active: {selectedPlatforms.join(", ")}</span>
                    <span>No Engagement yet</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ================= IDEAS & KANBAN BOARD TAB ================= */
        <div className="space-y-6">
          {/* Welcome Screen Empty State (No Mock Data) */}
          {ideas.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-white p-16 text-center max-w-2xl mx-auto shadow-sm dark:bg-slate-900/60 dark:border-slate-800">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#30FC47]/20 text-emerald-700 mb-6">
                <Sparkles className="size-7 text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Welcome to GrowWave</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
                Create your first content idea and start building your social media presence.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                <Button
                  onClick={() => setIdeaFormOpen(true)}
                  className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-950 font-black text-xs px-6 rounded-lg uppercase tracking-wider"
                >
                  Create First Idea
                </Button>
                <Link href="/free-user/settings?tab=accounts">
                  <Button
                    variant="outline"
                    className="border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 font-bold text-xs px-6 rounded-lg uppercase tracking-wider bg-white"
                  >
                    Connect Channel
                  </Button>
                </Link>
                <Link href="/free-user/ai-assistant">
                  <Button
                    variant="outline"
                    className="border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 font-bold text-xs px-6 rounded-lg uppercase tracking-wider bg-white"
                  >
                    Try AI Assistant
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Kanban Board list layout */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Content Ideas Board</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Brainstorm topics, track drafts, and schedule them to publish.</p>
                </div>
                <Button
                  onClick={() => setIdeaFormOpen(true)}
                  className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-black text-xs rounded-lg uppercase tracking-wider flex items-center gap-1"
                  size="sm"
                >
                  <Plus className="size-3.5" />
                  Add Custom Idea
                </Button>
              </div>

              {/* Kanban Columns Grid */}
              <div className="grid gap-4 sm:grid-cols-4">
                {(["Ideas", "Drafts", "Ready To Publish", "Published"] as const).map((columnName) => {
                  const columnIdeas = ideas.filter((i) => i.column === columnName)
                  return (
                    <div
                      key={columnName}
                      className="rounded-xl bg-slate-50/50 p-3.5 flex flex-col gap-3 min-h-[400px] dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850"
                    >
                      <div className="flex items-center justify-between px-1 border-b border-slate-150 pb-2">
                        <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
                          {columnName}
                        </span>
                        <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-slate-200/50">
                          {columnIdeas.length}
                        </span>
                      </div>

                      <div className="flex-1 space-y-2.5">
                        {columnIdeas.map((idea) => (
                          <div
                            key={idea.id}
                            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3 dark:bg-slate-900 dark:border-slate-800 relative group/card hover:border-[#30FC47]/50 transition-all"
                          >
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">{idea.title}</span>
                              <p className="text-[10.5px] text-slate-500 leading-relaxed mt-1.5 whitespace-pre-wrap">{idea.content}</p>
                              {idea.contentNotes && (
                                <p className="text-[9.5px] text-slate-400 font-medium italic mt-1 leading-normal">
                                  Notes: {idea.contentNotes}
                                </p>
                              )}
                              {idea.tags && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {idea.tags.split(",").map((t, idx) => (
                                    <span key={idx} className="bg-slate-50 text-slate-500 dark:bg-slate-800 text-[8px] font-bold py-0.2 px-1 rounded">
                                      #{t.trim()}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Column action controls */}
                            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                              <select
                                value={idea.column}
                                onChange={(e) => handleMoveIdea(idea.id, e.target.value as any)}
                                className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#30FC47] dark:bg-slate-800 dark:border-slate-700"
                              >
                                <option value="Ideas">Ideas</option>
                                <option value="Drafts">Drafts</option>
                                <option value="Ready To Publish">Ready To Publish</option>
                                <option value="Published">Published</option>
                              </select>

                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleDeleteIdea(idea.id)}
                                  className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors"
                                  title="Delete Idea"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                                {columnName !== "Published" && (
                                  <button
                                    onClick={() => handleConvertIdeaToPost(idea)}
                                    className="text-emerald-700 hover:text-emerald-800 font-black text-[9px] flex items-center gap-0.5 border border-emerald-500/20 bg-[#30FC47]/20 px-1.5 py-0.5 rounded-lg transition-all uppercase tracking-wider"
                                    title="Use in Composer"
                                  >
                                    Use
                                    <ArrowRight className="size-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {columnIdeas.length === 0 && (
                          <div className="text-center py-12 text-[10px] text-slate-400 font-medium border border-dashed border-slate-150 dark:border-slate-850 rounded-xl bg-card/10 select-none">
                            No items
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Onboarding Checklist Popover (Bottom-Right Widget) */}
      {checklistOpen && (
        <div className="fixed bottom-4 right-4 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between border-b pb-2 mb-3">
            <div>
              <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-[#30FC47] tracking-wider">Setup Checklist</span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white mt-0.5">Complete your setup</h4>
            </div>
            <button
              onClick={() => setChecklistOpen(false)}
              className="text-slate-400 hover:text-slate-600 rounded p-0.5 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Progress indicator */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Progress</span>
                <span>{completedStepsCount} of 4</span>
              </div>
              <Progress value={(completedStepsCount / 4) * 100} className="h-1.5 bg-slate-100" />
            </div>

            {/* Checklist tasks */}
            <div className="space-y-2.5 pt-1.5">
              {checklistSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-left">
                  {step.checked ? (
                    <CheckCircle2 className="size-4.5 text-emerald-500 shrink-0 mt-0.5 fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <div className="size-4.5 rounded-full border-2 border-slate-200 shrink-0 mt-0.5 bg-slate-50/50" />
                  )}
                  <div className="flex-1 min-w-0">
                    {step.href ? (
                      <Link href={step.href} className="text-[11px] font-bold text-slate-700 hover:text-slate-950 hover:underline dark:text-slate-300 dark:hover:text-white block">
                        {step.label} &rarr;
                      </Link>
                    ) : step.action && !step.checked ? (
                      <button onClick={step.action} className="text-[11px] font-bold text-emerald-600 hover:underline text-left block">
                        {step.label}
                      </button>
                    ) : (
                      <span className={cn("text-[11px] font-semibold block leading-tight", step.checked ? "text-slate-450 line-through" : "text-slate-700 dark:text-slate-300")}>
                        {step.label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9px] text-slate-400 font-bold">
              <span>Need help?</span>
              <a href="#" className="text-emerald-600 hover:underline font-black">Read our guide</a>
            </div>
          </div>
        </div>
      )}

      {/* New Idea Creation Modal */}
      {ideaFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIdeaFormOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
          
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-250 bg-white shadow-2xl p-6 dark:border-slate-800 dark:bg-slate-900 z-10 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider dark:text-white">
                Create First Idea
              </h3>
              <button onClick={() => setIdeaFormOpen(false)} className="text-slate-400 hover:text-slate-600 rounded">
                <X className="size-4.5" />
              </button>
            </div>

            {/* AI Generator Integration Block */}
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-550 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="size-3.5 text-emerald-600" />
                  AI Idea Generation
                </span>
                <span className="text-[9px] font-bold text-slate-400">Powered by OpenAI</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter topic (e.g. 5 coffee tricks)"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="h-8 text-xs font-semibold focus-visible:ring-[#30FC47] bg-white"
                />
                <Button
                  onClick={handleGenerateIdeaAI}
                  disabled={aiGeneratingIdea}
                  className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-extrabold text-[10px] px-3.5 h-8 rounded-lg uppercase tracking-wider shrink-0 flex items-center gap-1"
                >
                  {aiGeneratingIdea ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
            </div>

            {/* Form details */}
            <div className="space-y-3 pt-1">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Title</span>
                <Input
                  placeholder="Idea Title (e.g. Summer Promo)"
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  className="h-9 text-xs font-bold"
                />
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Description (Post text content)</span>
                <Textarea
                  placeholder="Draft your main social post copy here..."
                  value={newIdeaContent}
                  onChange={(e) => setNewIdeaContent(e.target.value)}
                  rows={3}
                  className="text-xs font-medium resize-none"
                />
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Content Notes</span>
                <Textarea
                  placeholder="Visual ideas, research notes, references..."
                  value={newIdeaNotes}
                  onChange={(e) => setNewIdeaNotes(e.target.value)}
                  rows={2}
                  className="text-xs font-medium resize-none bg-slate-50/50"
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Tags</span>
                  <Input
                    placeholder="e.g. promo, tips"
                    value={newIdeaTags}
                    onChange={(e) => setNewIdeaTags(e.target.value)}
                    className="h-9 text-xs font-bold"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Platform</span>
                  <select
                    value={newIdeaPlatform}
                    onChange={(e) => setNewIdeaPlatform(e.target.value)}
                    className="w-full text-xs font-bold text-slate-650 bg-white border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#30FC47] h-9"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter / X (Pro)</option>
                    <option value="tiktok">TikTok (Pro)</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Status Column</span>
                <select
                  value={newIdeaStatus}
                  onChange={(e) => setNewIdeaStatus(e.target.value as any)}
                  className="w-full text-xs font-bold text-slate-650 bg-white border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#30FC47] h-9"
                >
                  <option value="Ideas">Ideas</option>
                  <option value="Drafts">Drafts</option>
                  <option value="Ready To Publish">Ready To Publish</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIdeaFormOpen(false)}
                className="text-xs font-bold rounded-lg uppercase tracking-wider h-9"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateIdea}
                className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-extrabold text-xs px-5 rounded-lg uppercase tracking-wider h-9"
              >
                Save Idea
              </Button>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason={upgradeReason} />
    </div>
  )
}

export default function FreeCreatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="size-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <CreateContent />
    </Suspense>
  )
}
