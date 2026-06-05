"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Filter,
  Tag,
  ArrowUpDown,
  MoreVertical,
  X,
  PlusCircle,
  AlertCircle,
  Check,
  ChevronRight,
  ImageIcon,
  Loader2,
  ChevronDown,
  Clock,
  ExternalLink,
  Edit2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  platform: string
  column: "Ideas" | "Drafts" | "Ready To Publish" | "Published"
  createdAt: string
  mediaFile?: { name: string; size: number; url: string } | null
}

const generateMockIdeas = (topic: string, audience: string, goal: string, platform: string): IdeaItem[] => {
  const selectedPlatform = platform.toLowerCase() === "all" ? "instagram" : platform.toLowerCase()
  const list = [
    {
      title: `Top 3 common mistakes in ${topic}`,
      content: `Are you making these mistakes with ${topic}? Here's how to fix them easily to boost your results!`,
      notes: "Visual idea: Split graphic showing Right vs Wrong way.",
      tags: `${topic.toLowerCase().replace(/\s+/g, "")}, mistakes, tips`
    },
    {
      title: `How to reach your ${goal} goal`,
      content: `Fulfilling your goal of ${goal} doesn't have to be hard. Use this step-by-step strategy for ${audience || "beginners"}.`,
      notes: "Visual idea: Clean progress bar infographic.",
      tags: `goals, ${goal.toLowerCase().replace(/\s+/g, "")}, advice`
    },
    {
      title: `Behind the scenes: ${topic} workflows`,
      content: `A sneak peek into how we manage ${topic} every single day. Swipe to see our full workspace setup!`,
      notes: "Visual idea: High-quality photo of workspace or carousel.",
      tags: "workflow, workspace, behindthescenes"
    },
    {
      title: `My favorite hack for ${topic}`,
      content: `If you want to save hours on ${topic}, try this simple automation hack. Let us know if this helps!`,
      notes: "Visual idea: Quick screencast showing the tool setup.",
      tags: `${topic.toLowerCase().replace(/\s+/g, "")}, automation, timesaver`
    },
    {
      title: `Debunking 3 myths about ${topic}`,
      content: `Don't believe everything you hear. Here is the truth about ${topic} that will save you time and money.`,
      notes: "Visual idea: Bold text slide deck.",
      tags: "myths, truth, facts"
    },
    {
      title: `Why ${audience || "professionals"} love this tool`,
      content: `This single tool changed the way we handle ${topic}. Perfect for anyone focusing on ${goal}.`,
      notes: "Visual idea: Product screenshot with callouts.",
      tags: "tools, recommendations, reviews"
    },
    {
      title: `A quick checklist for ${topic}`,
      content: `Save this checklist for your next ${topic} session so you never miss a critical detail again.`,
      notes: "Visual idea: Clean checkmark list infographic.",
      tags: "checklist, guidance, study"
    },
    {
      title: `Case study: Achieving ${goal}`,
      content: `How we helped a client double their performance and reach their ${goal} milestone in 30 days.`,
      notes: "Visual idea: Growth chart graph.",
      tags: `casestudy, growth, ${goal.toLowerCase().replace(/\s+/g, "")}`
    },
    {
      title: `Q&A: Answering your ${topic} questions`,
      content: `Ask us anything about ${topic} and we'll reply directly in the comments. Let's learn together!`,
      notes: "Visual idea: Simple headshot of the team.",
      tags: "qa, askus, discussion"
    },
    {
      title: `The future of ${topic} in 2026`,
      content: `The industry is changing fast. Here are the top trends you must prepare for to stay ahead of the curve.`,
      notes: "Visual idea: Futuristic graphic with minimal typography.",
      tags: "trends, future, strategy"
    }
  ]

  return list.map((item, idx) => ({
    id: `idea_mock_${Date.now()}_${idx}`,
    title: item.title,
    content: item.content,
    contentNotes: item.notes,
    tags: item.tags,
    platform: selectedPlatform,
    column: "Ideas" as const,
    createdAt: new Date(Date.now() - idx * 3600000).toISOString()
  }))
}

function CreateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // State Management
  const [ideas, setIdeas] = useState<IdeaItem[]>([])
  const [ideaFormOpen, setIdeaFormOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<IdeaItem | null>(null)
  
  // AI Ideas Generator Modal State
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiTopic, setAiTopic] = useState("")
  const [aiAudience, setAiAudience] = useState("")
  const [aiGoal, setAiGoal] = useState("")
  const [aiPlatform, setAiPlatform] = useState("all")

  // Onboarding Card Visibility
  const [onboardVisible, setOnboardVisible] = useState(true)

  // Filters & Sorting
  const [filterPlatform, setFilterPlatform] = useState("all")
  const [filterTag, setFilterTag] = useState("")
  const [sortBy, setSortBy] = useState<"dateNewest" | "dateOldest" | "titleAsc" | "titleDesc">("dateNewest")

  // Quick Create Form states
  const [newIdeaTitle, setNewIdeaTitle] = useState("")
  const [newIdeaContent, setNewIdeaContent] = useState("")
  const [newIdeaNotes, setNewIdeaNotes] = useState("")
  const [newIdeaTags, setNewIdeaTags] = useState("")
  const [newIdeaPlatform, setNewIdeaPlatform] = useState("facebook")
  const [newIdeaStatus, setNewIdeaStatus] = useState<IdeaItem["column"]>("Ideas")
  const [newIdeaMedia, setNewIdeaMedia] = useState<{ name: string; size: number; url: string } | null>(null)
  const [aiGenerateToggle, setAiGenerateToggle] = useState(false)
  const [modalAiLoading, setModalAiLoading] = useState(false)

  // Redesigned Professional Composer states
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false)
  const [aiPromptInput, setAiPromptInput] = useState("")
  const [aiSidebarGenerating, setAiSidebarGenerating] = useState(false)
  const [emojiDropdownOpen, setEmojiDropdownOpen] = useState(false)
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false)
  const [extraSettingsOpen, setExtraSettingsOpen] = useState(false)

  // Drag and Drop Visual Feedback
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null)
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null)

  // Card Dropdown Active Menu
  const [openMenuCardId, setOpenMenuCardId] = useState<string | null>(null)

  // Upgrades
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"ai_quota" | "channels_limit" | "platform_locked" | "">("")

  // Onboarding Checklist Integration
  const [checklistOpen, setChecklistOpen] = useState(true)
  const [connectedCount, setConnectedCount] = useState(3) // mock connected count
  const [scheduledCount, setScheduledCount] = useState(0)

  // Load state
  useEffect(() => {
    // Check onboarding dismissed state
    const onboardingDismissed = localStorage.getItem("growwave-lite-create-onboard")
    if (onboardingDismissed === "dismissed") {
      setOnboardVisible(false)
    }

    // Load ideas
    const savedIdeas = localStorage.getItem("growwave-lite-ideas")
    if (savedIdeas) {
      setIdeas(JSON.parse(savedIdeas))
    } else {
      setIdeas([])
    }

    // Load scheduled posts count to update checklist
    const savedScheduled = localStorage.getItem("growwave-lite-scheduled")
    if (savedScheduled) {
      setScheduledCount(JSON.parse(savedScheduled).length)
    }
  }, [])

  // Sync back to growwave-lite-scheduled for Calendar and Scheduled list pages
  const syncIdeasToScheduledPosts = (updatedIdeas: IdeaItem[]) => {
    const savedScheduled = localStorage.getItem("growwave-lite-scheduled")
    let scheduledList: any[] = savedScheduled ? JSON.parse(savedScheduled) : []

    updatedIdeas.forEach((idea) => {
      const postId = `post_${idea.id}`
      const existingIndex = scheduledList.findIndex((p) => p.id === postId)

      let postStatus: "draft" | "ready" | "published" = "draft"
      if (idea.column === "Drafts") postStatus = "draft"
      else if (idea.column === "Ready To Publish") postStatus = "ready"
      else if (idea.column === "Published") postStatus = "published"

      if (idea.column === "Ideas") {
        // Remove if moved back to raw Ideas
        if (existingIndex > -1) {
          scheduledList.splice(existingIndex, 1)
        }
      } else {
        const postData = {
          id: postId,
          title: idea.title,
          content: idea.content || "",
          status: postStatus,
          platforms: [idea.platform || "facebook"],
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          publishedAt: postStatus === "published" ? new Date().toISOString() : undefined
        }

        if (existingIndex > -1) {
          scheduledList[existingIndex] = {
            ...scheduledList[existingIndex],
            title: postData.title,
            content: postData.content,
            status: postData.status,
            platforms: postData.platforms,
            publishedAt: postData.publishedAt ?? scheduledList[existingIndex].publishedAt
          }
        } else {
          scheduledList.push(postData)
        }
      }
    })

    // Remove posts belonging to deleted ideas
    scheduledList = scheduledList.filter((post) => {
      if (post.id.startsWith("post_")) {
        const ideaId = post.id.replace("post_", "")
        return updatedIdeas.some((i) => i.id === ideaId && i.column !== "Ideas")
      }
      return true
    })

    localStorage.setItem("growwave-lite-scheduled", JSON.stringify(scheduledList))
    setScheduledCount(scheduledList.length)
  }

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCardId(id)
    e.dataTransfer.setData("text/plain", id)
  }

  // Handle Drag End
  const handleDragEnd = () => {
    setDraggedCardId(null)
    setDraggedOverColumn(null)
  }

  // Handle Drag Over column dropzone
  const handleDragOver = (e: React.DragEvent, columnName: string) => {
    e.preventDefault()
    if (draggedOverColumn !== columnName) {
      setDraggedOverColumn(columnName)
    }
  }

  // Handle Drop card in column
  const handleDrop = (e: React.DragEvent, columnName: IdeaItem["column"]) => {
    e.preventDefault()
    const cardId = e.dataTransfer.getData("text/plain") || draggedCardId
    if (cardId) {
      const updated = ideas.map((i) => (i.id === cardId ? { ...i, column: columnName } : i))
      setIdeas(updated)
      localStorage.setItem("growwave-lite-ideas", JSON.stringify(updated))
      syncIdeasToScheduledPosts(updated)

      // Action completed, dismiss onboarding card
      setOnboardVisible(false)
      localStorage.setItem("growwave-lite-create-onboard", "dismissed")
    }
    setDraggedCardId(null)
    setDraggedOverColumn(null)
  }

  // Suggest description with AI in the quick create modal
  const handleModalAISuggest = async () => {
    if (!newIdeaTitle.trim()) {
      alert("Please enter a title first so AI can suggest content.")
      return
    }
    setModalAiLoading(true)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-caption",
          prompt: newIdeaTitle,
          tone: "friendly"
        })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.result) {
          setNewIdeaContent(data.result)
        }
      } else {
        throw new Error("API failed")
      }
    } catch (err) {
      console.warn("AI suggestion failed, using mock suggestion:", err)
      setNewIdeaContent(`🚀 Let's focus on ${newIdeaTitle} today! Here is our quick take on how this can streamline your workflows. Let us know if you agree! 👇`)
    } finally {
      setModalAiLoading(false)
    }
  }

  // AI Assistant Sidebar generation
  const handleSidebarAIGenerate = async () => {
    if (!aiPromptInput.trim()) {
      alert("Please enter a prompt first.")
      return
    }
    setAiSidebarGenerating(true)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-caption",
          prompt: aiPromptInput,
          tone: "friendly"
        })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.result) {
          setNewIdeaContent(data.result)
          setIsAiSidebarOpen(false)
        }
      } else {
        throw new Error("Failed to generate caption")
      }
    } catch (err) {
      console.warn("AI generation failed, using mock suggestion:", err)
      setNewIdeaContent(`📸 Let's share some updates about ${aiPromptInput}! Check out our full guide to learn more. Let us know your thoughts! 👇`)
      setIsAiSidebarOpen(false)
    } finally {
      setAiSidebarGenerating(false)
    }
  }

  // Render platform icons in toolbar circled button
  const renderToolbarPlatformIcon = (plat: string) => {
    const p = (plat || "").toLowerCase()
    if (p === "facebook") return <IconFacebook className="size-4 text-blue-600" />
    if (p === "instagram") return <IconInstagram className="size-4 text-pink-600" />
    if (p === "linkedin") return <IconLinkedin className="size-4 text-sky-700" />
    if (p === "twitter" || p === "x") return <IconX className="size-4 text-black dark:text-white" />
    if (p === "tiktok") return <IconTikTok className="size-4 text-fuchsia-600" />
    
    return (
      <div className="size-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px] uppercase dark:bg-slate-800 dark:text-slate-350 select-none">
        c
      </div>
    )
  }

  const handleEmojiClick = (emoji: string) => {
    setNewIdeaContent((prev) => prev + emoji)
    setEmojiDropdownOpen(false)
  }

  const emojis = ["😀", "🚀", "🔥", "✨", "💡", "🎉", "👍", "👏", "❤️", "👀", "📈", "🙌", "💥", "📅", "😊"]

  // Save or edit an idea
  const handleSaveIdea = () => {
    if (!newIdeaTitle.trim()) return

    let updated: IdeaItem[] = []
    if (editingIdea) {
      updated = ideas.map((i) =>
        i.id === editingIdea.id
          ? {
              ...i,
              title: newIdeaTitle,
              content: newIdeaContent,
              contentNotes: newIdeaNotes,
              tags: newIdeaTags,
              platform: newIdeaPlatform,
              column: newIdeaStatus,
              mediaFile: newIdeaMedia
            }
          : i
      )
      setEditingIdea(null)
    } else {
      const newIdea: IdeaItem = {
        id: "idea_" + Date.now(),
        title: newIdeaTitle,
        content: newIdeaContent,
        contentNotes: newIdeaNotes,
        tags: newIdeaTags,
        platform: newIdeaPlatform,
        column: newIdeaStatus,
        createdAt: new Date().toISOString(),
        mediaFile: newIdeaMedia
      }
      updated = [newIdea, ...ideas]
    }

    setIdeas(updated)
    localStorage.setItem("growwave-lite-ideas", JSON.stringify(updated))
    syncIdeasToScheduledPosts(updated)

    // Reset Form fields
    setNewIdeaTitle("")
    setNewIdeaContent("")
    setNewIdeaNotes("")
    setNewIdeaTags("")
    setNewIdeaPlatform("facebook")
    setNewIdeaStatus("Ideas")
    setNewIdeaMedia(null)
    setAiGenerateToggle(false)
    setIdeaFormOpen(false)

    // Dismiss onboarding card
    setOnboardVisible(false)
    localStorage.setItem("growwave-lite-create-onboard", "dismissed")
  }

  // Delete an idea
  const handleDeleteIdea = (id: string) => {
    if (confirm("Are you sure you want to delete this content idea?")) {
      const updated = ideas.filter((i) => i.id !== id)
      setIdeas(updated)
      localStorage.setItem("growwave-lite-ideas", JSON.stringify(updated))
      syncIdeasToScheduledPosts(updated)
    }
  }

  // Start Edit Mode
  const handleStartEdit = (idea: IdeaItem) => {
    setEditingIdea(idea)
    setNewIdeaTitle(idea.title)
    setNewIdeaContent(idea.content)
    setNewIdeaNotes(idea.contentNotes || "")
    setNewIdeaTags(idea.tags || "")
    setNewIdeaPlatform(idea.platform)
    setNewIdeaStatus(idea.column)
    setNewIdeaMedia(idea.mediaFile || null)
    setAiGenerateToggle(false)
    setIdeaFormOpen(true)
  }

  // Directly Move Column
  const handleMoveIdea = (id: string, col: IdeaItem["column"]) => {
    const updated = ideas.map((i) => (i.id === id ? { ...i, column: col } : i))
    setIdeas(updated)
    localStorage.setItem("growwave-lite-ideas", JSON.stringify(updated))
    syncIdeasToScheduledPosts(updated)
  }

  // Simulate Media Upload
  const handleSimulateMediaUpload = () => {
    const files = [
      { name: "inspiration_mockup.png", size: 3.4 },
      { name: "campaign_banner.jpg", size: 1.8 },
      { name: "reel_clip.mp4", size: 14.2 }
    ]
    const chosen = files[Math.floor(Math.random() * files.length)]
    setNewIdeaMedia({
      name: chosen.name,
      size: chosen.size,
      url: "/placeholder-media.png"
    })
  }

  // AI Generate 10 Content Ideas
  const handleGenerateIdeasAI = async () => {
    if (!aiTopic.trim()) {
      alert("Please enter a topic.")
      return
    }
    setAiGenerating(true)
    try {
      const userPrompt = `Generate exactly 10 content ideas for:
Topic: "${aiTopic}"
Audience: "${aiAudience || "followers"}"
Goal: "${aiGoal || "engagement"}"
Platform: "${aiPlatform}"

You MUST return the output as a valid JSON array of objects. Do not write any explanations, headers, markdown backticks or code blocks. Return ONLY the raw JSON array string.
Each object must contain these keys:
- "title": a short, catchy title (max 40 characters)
- "content": the actual social media post copy (1-3 sentences)
- "contentNotes": visual ideas or styling notes (1 sentence)
- "tags": 3 relevant comma-separated tags (no '#' symbol)
- "platform": the platform name (lowercase, e.g. "facebook", "instagram", "linkedin", "twitter")`

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "content-ideas",
          prompt: userPrompt,
          provider: "openai"
        })
      })

      if (!res.ok) {
        throw new Error("AI API failed")
      }

      const data = await res.json()
      let cleaned = (data.result || "").trim()
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim()
      }

      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) {
        const newIdeas: IdeaItem[] = parsed.map((item: any, idx: number) => ({
          id: `idea_ai_${Date.now()}_${idx}`,
          title: item.title || `Idea ${idx + 1}`,
          content: item.content || "",
          contentNotes: item.contentNotes || "",
          tags: item.tags || "",
          platform: item.platform || (aiPlatform === "all" ? "instagram" : aiPlatform.toLowerCase()),
          column: "Ideas",
          createdAt: new Date().toISOString()
        }))

        const updated = [...newIdeas, ...ideas]
        setIdeas(updated)
        localStorage.setItem("growwave-lite-ideas", JSON.stringify(updated))
        syncIdeasToScheduledPosts(updated)

        // Dismiss Onboarding
        setOnboardVisible(false)
        localStorage.setItem("growwave-lite-create-onboard", "dismissed")

        setAiGeneratorOpen(false)
        setAiTopic("")
        setAiAudience("")
        setAiGoal("")
      } else {
        throw new Error("Result is not an array")
      }
    } catch (err) {
      console.warn("AI generation error, using fallback content engine:", err)
      const fallbackIdeas = generateMockIdeas(aiTopic, aiAudience, aiGoal, aiPlatform)
      const updated = [...fallbackIdeas, ...ideas]
      setIdeas(updated)
      localStorage.setItem("growwave-lite-ideas", JSON.stringify(updated))
      syncIdeasToScheduledPosts(updated)

      setOnboardVisible(false)
      localStorage.setItem("growwave-lite-create-onboard", "dismissed")

      setAiGeneratorOpen(false)
      setAiTopic("")
      setAiAudience("")
      setAiGoal("")
      alert("AI content engine generated 10 ideas successfully!")
    } finally {
      setAiGenerating(false)
    }
  }

  // Dismiss Onboarding Card
  const handleDismissOnboard = () => {
    setOnboardVisible(false)
    localStorage.setItem("growwave-lite-create-onboard", "dismissed")
  }

  // Open modal preselected with AI generate
  const handleOpenAiGenerate = () => {
    setAiGeneratorOpen(true)
  }

  // Render Platform Social Icon
  const renderPlatformBadge = (plat?: string) => {
    if (!plat) return null
    const p = plat.toLowerCase()
    if (p === "facebook") return <IconFacebook className="size-3.5 text-blue-600 shrink-0" />
    if (p === "instagram") return <IconInstagram className="size-3.5 text-pink-600 shrink-0" />
    if (p === "linkedin") return <IconLinkedin className="size-3.5 text-sky-700 shrink-0" />
    if (p === "twitter" || p === "x") return <IconX className="size-3.5 text-black dark:text-white shrink-0" />
    if (p === "tiktok") return <IconTikTok className="size-3.5 text-fuchsia-600 shrink-0" />
    return null
  }

  // Filter and Sort ideas
  const filteredIdeas = ideas.filter((idea) => {
    // Search Query (Title or description match)
    // Filter by Tag
    const tagMatch = !filterTag.trim() || (idea.tags && idea.tags.toLowerCase().includes(filterTag.toLowerCase()))
    // Filter by Platform
    const platformMatch = filterPlatform === "all" || (idea.platform && idea.platform.toLowerCase() === filterPlatform.toLowerCase())
    return tagMatch && platformMatch
  })

  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    if (sortBy === "dateNewest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (sortBy === "dateOldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    if (sortBy === "titleAsc") {
      return a.title.localeCompare(b.title)
    }
    if (sortBy === "titleDesc") {
      return b.title.localeCompare(a.title)
    }
    return 0
  })

  // Setup Checklist Calculation
  const checklistSteps = [
    { label: "Create GrowWave account", checked: true },
    { label: "Connect account", checked: connectedCount > 0, href: "/free-user/settings?tab=accounts" },
    { label: "Create first content idea", checked: ideas.length > 0, action: () => setIdeaFormOpen(true) },
    { label: "Schedule or publish your post", checked: scheduledCount > 0, action: () => setIdeaFormOpen(true) }
  ]
  const completedStepsCount = checklistSteps.filter(s => s.checked).length

  return (
    <div className="space-y-6 bg-brand-page-bg dark:bg-slate-950 min-h-screen pb-12">
      {/* Header */}
      <div className="border-b border-[#D9F8DF] dark:border-slate-800 pb-5">
        <h1 className="text-3xl font-black tracking-tight text-[#111827] dark:text-white">
          Create
        </h1>
        <p className="text-sm text-[#6B7280] mt-1 dark:text-slate-400">
          Capture ideas and turn them into social content.
        </p>
      </div>

      {/* Onboarding Welcome Card */}
      {onboardVisible && (
        <div className="bg-gradient-to-r from-[#EFFFF1] to-white dark:from-slate-900 dark:to-slate-950 border border-[#D9F8DF] dark:border-slate-800 p-6 rounded-2xl shadow-xs relative flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            onClick={handleDismissOnboard}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            title="Dismiss Onboarding"
          >
            <X className="size-4" />
          </button>
          
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="inline-flex items-center gap-1.5 bg-[#30FC47]/20 text-emerald-800 dark:text-[#30FC47] dark:bg-emerald-950/40 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
              Onboarding
            </div>
            <h2 className="text-lg font-black text-[#111827] dark:text-white">
              Welcome to GrowWave Lite
            </h2>
            <p className="text-xs text-[#6B7280] dark:text-slate-400 max-w-xl leading-relaxed">
              Create your first content idea to start building your social media workflow. Track topics, generate captions with AI, drag items to drafts, and connect platforms.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              onClick={() => {
                setEditingIdea(null)
                setNewIdeaTitle("")
                setNewIdeaContent("")
                setNewIdeaNotes("")
                setNewIdeaTags("")
                setNewIdeaPlatform("facebook")
                setNewIdeaStatus("Ideas")
                setIdeaFormOpen(true)
              }}
              className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider shadow-sm transition-all"
            >
              Create First Idea
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenAiGenerate}
              className="border-[#D9F8DF] hover:bg-[#EFFFF1] text-emerald-700 font-extrabold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-[#30FC47]"
            >
              Generate With AI
            </Button>
            <Link href="/free-user/settings?tab=accounts">
              <Button
                variant="outline"
                className="border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-300"
              >
                Connect Account
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        {/* Left: Generate Ideas */}
        <div>
          <Button
            onClick={() => setAiGeneratorOpen(true)}
            className="bg-[#30FC47]/10 hover:bg-[#DDFBE3] border border-[#D9F8DF] text-emerald-800 dark:text-[#30FC47] dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 font-extrabold text-xs px-4.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Sparkles className="size-4 text-[#30FC47] fill-current animate-pulse" />
            Generate Ideas
          </Button>
        </div>

        {/* Right: Search, Filter, Sort, New Idea */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tag Filter */}
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by Tag..."
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="pl-8.5 pr-3 py-2 text-xs bg-[#FFFFFF] dark:bg-slate-900 border border-[#D9F8DF] dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#30FC47] w-36 font-semibold"
            />
          </div>

          {/* Platform Filter */}
          <div className="relative flex items-center">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="pl-8.5 pr-8 py-2 text-xs bg-[#FFFFFF] dark:bg-slate-900 border border-[#D9F8DF] dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#30FC47] appearance-none font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Channels</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter / X</option>
              <option value="tiktok">TikTok</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none text-slate-400" />
          </div>

          {/* Sorting */}
          <div className="relative flex items-center">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="pl-8.5 pr-8 py-2 text-xs bg-[#FFFFFF] dark:bg-slate-900 border border-[#D9F8DF] dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#30FC47] appearance-none font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="dateNewest">Newest First</option>
              <option value="dateOldest">Oldest First</option>
              <option value="titleAsc">Title A-Z</option>
              <option value="titleDesc">Title Z-A</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none text-slate-400" />
          </div>

          {/* New Idea Button */}
          <Button
            onClick={() => {
              setEditingIdea(null)
              setNewIdeaTitle("")
              setNewIdeaContent("")
              setNewIdeaNotes("")
              setNewIdeaTags("")
              setNewIdeaPlatform("facebook")
              setNewIdeaStatus("Ideas")
              setNewIdeaMedia(null)
              setAiGenerateToggle(false)
              setIdeaFormOpen(true)
            }}
            className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="size-4 text-slate-950" />
            New Idea
          </Button>
        </div>
      </div>

      {/* Main Kanban Board or Global Empty State */}
      {ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-[#D9F8DF] dark:border-slate-800 rounded-2xl bg-[#FFFFFF] dark:bg-slate-900/60 p-16 text-center max-w-2xl mx-auto shadow-sm mt-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#EFFFF1] dark:bg-slate-800 mb-6">
            <Sparkles className="size-7 text-[#30FC47] fill-current" />
          </div>
          <h2 className="text-xl font-black text-[#111827] dark:text-white">No items yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
            Create your first content idea or generate content pipelines using AI to start building your workflow.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Button
              onClick={() => {
                setEditingIdea(null)
                setNewIdeaTitle("")
                setNewIdeaContent("")
                setNewIdeaNotes("")
                setNewIdeaTags("")
                setNewIdeaPlatform("facebook")
                setNewIdeaStatus("Ideas")
                setNewIdeaMedia(null)
                setAiGenerateToggle(false)
                setIdeaFormOpen(true)
              }}
              className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-extrabold text-xs px-6 py-2.5 rounded-xl uppercase tracking-wider shadow-sm transition-all"
            >
              + New Idea
            </Button>
            <Button
              variant="outline"
              onClick={() => setAiGeneratorOpen(true)}
              className="border-[#D9F8DF] hover:bg-[#EFFFF1] text-emerald-700 font-extrabold text-xs px-6 py-2.5 rounded-xl uppercase tracking-wider bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-[#30FC47]"
            >
              🪄 Generate With AI
            </Button>
          </div>
        </div>
      ) : (
        /* Kanban Columns Grid */
        <div className="grid gap-6 lg:grid-cols-4 items-start mt-4">
          {(["Ideas", "Drafts", "Ready To Publish", "Published"] as const).map((columnName) => {
            const columnIdeas = sortedIdeas.filter((i) => i.column === columnName)
            return (
              <div
                key={columnName}
                className="bg-[#FFFFFF] dark:bg-slate-900 border border-[#D9F8DF] dark:border-slate-850 rounded-2xl shadow-xs flex flex-col min-h-[550px] transition-all"
                onDragOver={(e) => handleDragOver(e, columnName)}
                onDrop={(e) => handleDrop(e, columnName)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-slate-200 tracking-wider">
                      {columnName}
                    </span>
                    <span className="bg-[#EFFFF1] text-emerald-800 dark:bg-slate-800 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full select-none border border-[#D9F8DF]/60 dark:border-transparent">
                      {columnIdeas.length}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* Add button (+) preselected with status */}
                    <button
                      onClick={() => {
                        setEditingIdea(null)
                        setNewIdeaTitle("")
                        setNewIdeaContent("")
                        setNewIdeaNotes("")
                        setNewIdeaTags("")
                        setNewIdeaPlatform("facebook")
                        setNewIdeaStatus(columnName)
                        setNewIdeaMedia(null)
                        setAiGenerateToggle(false)
                        setIdeaFormOpen(true)
                      }}
                      className="size-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-white transition-all"
                      title={`Add idea to ${columnName}`}
                    >
                      <Plus className="size-4" />
                    </button>
                    {/* Menu button (...) */}
                    <button
                      onClick={() => {
                        if (columnIdeas.length > 0 && confirm(`Clear all ideas in ${columnName}?`)) {
                          const updated = ideas.filter((i) => i.column !== columnName)
                          setIdeas(updated)
                          localStorage.setItem("growwave-lite-ideas", JSON.stringify(updated))
                          syncIdeasToScheduledPosts(updated)
                        }
                      }}
                      className="size-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-white transition-all"
                      title="Clear Column"
                    >
                      <MoreVertical className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Column Dropzone */}
                <div
                  className={cn(
                    "flex-1 p-3.5 space-y-3 rounded-b-2xl transition-all duration-200 min-h-[450px]",
                    draggedOverColumn === columnName
                      ? "bg-[#EFFFF1]/45 dark:bg-emerald-950/10 border-2 border-dashed border-[#30FC47]/60"
                      : ""
                  )}
                >
                  {columnIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idea.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "bg-[#FFFFFF] p-4 rounded-xl border border-slate-150 shadow-xs space-y-3 dark:bg-slate-950 dark:border-slate-850 hover:border-[#30FC47]/50 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing relative group/card",
                        draggedCardId === idea.id ? "opacity-40 border-dashed border-[#30FC47]" : ""
                      )}
                    >
                      {/* Card Header Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {renderPlatformBadge(idea.platform)}
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            {new Date(idea.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>

                        {/* Card Context Action Dropdown Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuCardId(openMenuCardId === idea.id ? null : idea.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-all"
                            title="Options"
                          >
                            <MoreVertical className="size-3.5" />
                          </button>
                          {openMenuCardId === idea.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuCardId(null)}
                              />
                              <div className="absolute right-0 top-6 z-20 w-44 rounded-xl border border-slate-100 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={() => {
                                    handleStartEdit(idea)
                                    setOpenMenuCardId(null)
                                  }}
                                  className="w-full text-left text-[11px] font-bold px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-700 dark:text-slate-350 flex items-center gap-1.5"
                                >
                                  <Edit2 className="size-3 text-slate-450" />
                                  Edit Idea
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteIdea(idea.id)
                                    setOpenMenuCardId(null)
                                  }}
                                  className="w-full text-left text-[11px] font-bold px-2.5 py-1.5 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-450 rounded-lg transition-colors text-rose-500 flex items-center gap-1.5"
                                >
                                  <Trash2 className="size-3 text-rose-400" />
                                  Delete Idea
                                </button>
                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                <div className="px-2.5 py-1 text-[8px] font-black text-slate-450 uppercase tracking-wider">Move Column</div>
                                {(["Ideas", "Drafts", "Ready To Publish", "Published"] as const).map((col) => {
                                  if (col === idea.column) return null
                                  return (
                                    <button
                                      key={col}
                                      onClick={() => {
                                        handleMoveIdea(idea.id, col)
                                        setOpenMenuCardId(null)
                                      }}
                                      className="w-full text-left text-[10px] font-bold px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                                    >
                                      &rarr; {col}
                                    </button>
                                  )
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">
                          {idea.title}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-3 whitespace-pre-wrap font-medium">
                          {idea.content || "Draft content empty. Click edit to draft post."}
                        </p>
                        {idea.contentNotes && (
                          <div className="bg-[#FAFBFC] dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 rounded-lg text-[9.5px] text-slate-450 font-medium italic mt-2.5 leading-relaxed">
                            Notes: {idea.contentNotes}
                          </div>
                        )}
                        {idea.mediaFile && (
                          <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-emerald-700 bg-[#EFFFF1] dark:bg-emerald-950/20 dark:text-[#30FC47] p-1 px-2 rounded-md">
                            <ImageIcon className="size-3" />
                            <span className="truncate max-w-[120px]">{idea.mediaFile.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Tags & Status Badge */}
                      <div className="pt-2.5 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between gap-2">
                        {/* Tags list */}
                        <div className="flex flex-wrap gap-1 max-w-[70%]">
                          {idea.tags ? (
                            idea.tags.split(",").slice(0, 2).map((t, idx) => (
                              <span
                                key={idx}
                                className="bg-[#EFFFF1] text-emerald-800 dark:bg-slate-800 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.2 rounded"
                              >
                                #{t.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-[8px] font-bold text-slate-350">No tags</span>
                          )}
                        </div>
                        {/* Status Badge */}
                        <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none select-none">
                          {idea.column === "Ready To Publish" ? "Ready" : idea.column}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Empty state for single column */}
                  {columnIdeas.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-150 dark:border-slate-800 rounded-xl bg-[#FAFBFC]/30 dark:bg-slate-950/10 select-none">
                      <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wide">No items</span>
                      <button
                        onClick={() => {
                          setEditingIdea(null)
                          setNewIdeaTitle("")
                          setNewIdeaContent("")
                          setNewIdeaNotes("")
                          setNewIdeaTags("")
                          setNewIdeaPlatform("facebook")
                          setNewIdeaStatus(columnName)
                          setNewIdeaMedia(null)
                          setAiGenerateToggle(false)
                          setIdeaFormOpen(true)
                        }}
                        className="mt-2 text-[9px] font-black text-emerald-700 dark:text-[#30FC47] hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="size-3" />
                        Add Idea
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Onboarding Checklist Popover Widget */}
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
            {/* Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Progress</span>
                <span>{completedStepsCount} of 4</span>
              </div>
              <Progress value={(completedStepsCount / 4) * 100} className="h-1.5 bg-slate-100" />
            </div>

            {/* Checklist Tasks */}
            <div className="space-y-2.5 pt-1">
              {checklistSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-left">
                  {step.checked ? (
                    <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <div className="size-3.5 rounded-full border border-slate-350 shrink-0 mt-0.5 bg-slate-50/50" />
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
                      <span className={cn("text-[11px] font-semibold block leading-tight", step.checked ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-300")}>
                        {step.label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
       {/* Redesigned Quick Create / Edit Modal (Buffer-style) */}
      {ideaFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIdeaFormOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
          
          <div className="relative flex items-stretch gap-4 max-w-3xl w-full z-10 animate-in fade-in zoom-in-95 duration-200">
            
            {/* AI Assistant Sidebar (Left Panel) */}
            {isAiSidebarOpen && (
              <div className="w-80 rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between animate-in slide-in-from-left-4 duration-300 shrink-0">
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-black text-purple-655 dark:text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="size-4 text-purple-500 fill-current animate-pulse" />
                      AI Assistant
                    </span>
                    <button 
                      onClick={() => setIsAiSidebarOpen(false)}
                      className="text-slate-400 hover:text-slate-655 dark:hover:text-white p-1"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-355 uppercase tracking-wider block">
                      What do you want to write about?
                    </label>
                    <textarea
                      placeholder="Eg. Promote my photography course to get new signups. Registration closes in 3 days."
                      value={aiPromptInput}
                      onChange={(e) => setAiPromptInput(e.target.value)}
                      rows={6}
                      className="w-full text-xs font-semibold p-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none bg-slate-50/20 text-[#111827] dark:text-white placeholder:text-slate-350"
                    />
                    <p className="text-[10px] text-slate-455 dark:text-slate-500 leading-normal font-semibold">
                      <strong className="text-slate-500 dark:text-slate-455">Pro tip:</strong> Include key points, your target audience and your desired outcome for this post.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
                  <button
                    onClick={handleSidebarAIGenerate}
                    disabled={aiSidebarGenerating || !aiPromptInput.trim()}
                    className={cn(
                      "font-black text-[11px] px-4 py-2 rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5",
                      aiPromptInput.trim() 
                        ? "bg-purple-650 hover:bg-purple-700 text-white shadow-sm" 
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                    )}
                  >
                    {aiSidebarGenerating ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5 text-purple-400" />
                    )}
                    <span>Generate</span>
                  </button>
                </div>
              </div>
            )}

            {/* Main Create/Edit Modal Card (Right Panel) */}
            <div className="flex-1 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between min-h-[500px] relative">
              <button 
                onClick={() => setIdeaFormOpen(false)}
                className="absolute top-4 right-4 text-slate-455 hover:text-slate-655 dark:hover:text-white p-1 rounded"
              >
                <X className="size-4.5" />
              </button>

              <div className="flex-1 flex flex-col space-y-4">
                {/* Modal Title label */}
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider select-none">
                  {editingIdea ? "Edit Idea" : "Create Idea"}
                </div>

                {/* Title Input field - Borderless & large */}
                <input
                  type="text"
                  placeholder="Give your idea a title"
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  className="w-full text-lg font-black text-[#111827] dark:text-white border-0 border-b border-transparent focus:outline-none focus:ring-0 focus:border-transparent p-0 bg-transparent placeholder:text-slate-355"
                  autoFocus
                />

                {/* Content/Description text area */}
                <div className="relative flex-1 flex flex-col min-h-[160px]">
                  <textarea
                    placeholder="Wait... It's about to come to me... or "
                    value={newIdeaContent}
                    onChange={(e) => setNewIdeaContent(e.target.value)}
                    rows={6}
                    className="w-full text-xs font-semibold p-0 border-0 focus:outline-none focus:ring-0 resize-none bg-transparent text-[#111827] dark:text-white placeholder:text-slate-355"
                  />
                  {newIdeaContent === "" && (
                    <button
                      onClick={() => setIsAiSidebarOpen(true)}
                      className="absolute left-[200px] top-[1px] inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 border border-purple-200/60 text-purple-700 dark:bg-purple-950/40 dark:border-purple-900 dark:text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all shadow-xs"
                    >
                      <Sparkles className="size-3 text-purple-500 fill-current" />
                      Use the AI Assistant
                    </button>
                  )}
                </div>

                {/* Media Upload (dotted square block) */}
                <div className="flex items-center gap-4">
                  {newIdeaMedia ? (
                    <div className="relative w-28 h-28 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden group flex items-center justify-center bg-slate-50/50">
                      <div className="text-center p-2">
                        <ImageIcon className="size-6 text-emerald-655 mx-auto mb-1" />
                        <span className="text-[9px] font-bold block truncate max-w-[80px] text-slate-700 dark:text-slate-300">{newIdeaMedia.name}</span>
                        <span className="text-[8px] text-slate-455 block font-semibold">{newIdeaMedia.size}MB</span>
                      </div>
                      <button
                        onClick={() => setNewIdeaMedia(null)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={handleSimulateMediaUpload}
                      className="w-28 h-28 border border-dashed border-slate-355 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/10 dark:hover:bg-slate-850/30 transition-all gap-1 select-none"
                    >
                      <ImageIcon className="size-5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-655 dark:text-slate-400 leading-tight">Drag & drop</span>
                      <span className="text-[8.5px] font-semibold text-emerald-600 dark:text-emerald-400">or select a file</span>
                    </div>
                  )}

                  {/* Expandable Extra Settings for Notes/Tags */}
                  <div className="flex-1 space-y-1.5">
                    <button
                      onClick={() => setExtraSettingsOpen(!extraSettingsOpen)}
                      className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 flex items-center gap-1 transition-all"
                    >
                      <span>Settings & Tags</span>
                      <ChevronDown className={cn("size-3.5 transition-transform", extraSettingsOpen ? "rotate-180" : "")} />
                    </button>
                    {extraSettingsOpen && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="grid gap-2 grid-cols-2">
                          <div>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Tags</span>
                            <Input
                              placeholder="e.g. tips, news"
                              value={newIdeaTags}
                              onChange={(e) => setNewIdeaTags(e.target.value)}
                              className="h-7 text-[10px] font-semibold focus-visible:ring-[#30FC47]"
                            />
                          </div>
                          <div>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Status Column</span>
                            <select
                              value={newIdeaStatus}
                              onChange={(e) => setNewIdeaStatus(e.target.value as any)}
                              className="w-full text-[10px] font-bold text-slate-655 bg-white border border-slate-200 p-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#30FC47] h-7 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-355"
                            >
                              <option value="Ideas">Ideas</option>
                              <option value="Drafts">Drafts</option>
                              <option value="Ready To Publish">Ready To Publish</option>
                              <option value="Published">Published</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Content Notes</span>
                          <input
                            type="text"
                            placeholder="Visual instructions or links..."
                            value={newIdeaNotes}
                            onChange={(e) => setNewIdeaNotes(e.target.value)}
                            className="w-full h-7 text-[10px] font-semibold px-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#30FC47] bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Toolbar & Footer */}
              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between relative">
                {/* Left controls: Platform circle selector, divider, emoji, divider, AI sidebar trigger */}
                <div className="flex items-center gap-2">
                  {/* Circled C Platform Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setPlatformDropdownOpen(!platformDropdownOpen)}
                      className="flex items-center gap-1 hover:scale-105 active:scale-95 transition-all p-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700"
                      title="Select Platform"
                    >
                      <div className="size-6 rounded-full flex items-center justify-center shrink-0">
                        {renderToolbarPlatformIcon(newIdeaPlatform)}
                      </div>
                      <ChevronDown className="size-3 text-slate-400 mr-1" />
                    </button>

                    {platformDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setPlatformDropdownOpen(false)} />
                        <div className="absolute left-0 bottom-9 z-20 w-36 rounded-xl border border-slate-100 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-950 animate-in fade-in slide-in-from-bottom-2 duration-150">
                          {["Facebook", "Instagram", "LinkedIn", "Twitter", "TikTok"].map((plat) => (
                            <button
                              key={plat}
                              onClick={() => {
                                setNewIdeaPlatform(plat.toLowerCase())
                                setPlatformDropdownOpen(false)
                              }}
                              className="w-full text-left text-xs font-semibold px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors text-slate-700 dark:text-slate-355 flex items-center gap-2"
                            >
                              <span className="size-4 flex items-center justify-center">{renderToolbarPlatformIcon(plat)}</span>
                              <span>{plat}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="h-5 w-px bg-slate-100 dark:bg-slate-850" />

                  {/* Emoji Button */}
                  <div className="relative">
                    <button
                      onClick={() => setEmojiDropdownOpen(!emojiDropdownOpen)}
                      className="size-7 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all"
                      title="Insert Emoji"
                    >
                      <span className="text-base select-none">😊</span>
                    </button>

                    {emojiDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setEmojiDropdownOpen(false)} />
                        <div className="absolute left-0 bottom-9 z-20 grid grid-cols-5 gap-1 p-2 bg-white rounded-xl border border-slate-100 shadow-xl w-44 dark:bg-slate-900 dark:border-slate-800">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleEmojiClick(emoji)}
                              className="size-7 flex items-center justify-center text-base hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="h-5 w-px bg-slate-100 dark:bg-slate-850" />

                  {/* AI Assistant Button */}
                  <button
                    onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/50 dark:bg-purple-950/35 dark:border-purple-900/60 dark:text-purple-300 transition-all select-none"
                  >
                    <Sparkles className="size-3 text-purple-500 fill-current" />
                    <span>AI Assistant</span>
                  </button>
                </div>

                {/* Right controls: Create Post (Ready To Publish status), Save Idea */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNewIdeaStatus("Ready To Publish")
                      setTimeout(handleSaveIdea, 0)
                    }}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] px-4 py-2 rounded-xl uppercase tracking-wider transition-all"
                  >
                    Create Post
                  </button>
                  <button
                    onClick={handleSaveIdea}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] px-4 py-2 rounded-xl uppercase tracking-wider transition-all"
                  >
                    Save Idea
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Ideas Modal */}
      {aiGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setAiGeneratorOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
          
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-250 bg-white shadow-2xl p-6 dark:border-slate-800 dark:bg-slate-900 z-10 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-[#30FC47]" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider dark:text-white">
                  Generate Ideas with AI
                </h3>
              </div>
              <button onClick={() => setAiGeneratorOpen(false)} className="text-slate-400 hover:text-slate-600 rounded">
                <X className="size-4.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Topic / Keywords</span>
                <Input
                  placeholder="e.g. coffee brewing hacks, nextjs features"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="h-9 text-xs font-semibold focus-visible:ring-[#30FC47]"
                />
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Target Audience</span>
                <Input
                  placeholder="e.g. tech developers, home baristas"
                  value={aiAudience}
                  onChange={(e) => setAiAudience(e.target.value)}
                  className="h-9 text-xs font-semibold focus-visible:ring-[#30FC47]"
                />
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Primary Goal</span>
                <Input
                  placeholder="e.g. lead generation, brand education"
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  className="h-9 text-xs font-semibold focus-visible:ring-[#30FC47]"
                />
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Platform</span>
                <select
                  value={aiPlatform}
                  onChange={(e) => setAiPlatform(e.target.value)}
                  className="w-full text-xs font-bold text-slate-650 bg-white border border-slate-200 p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#30FC47] h-9 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350"
                >
                  <option value="all">All Channels</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
                </select>
              </div>

              <div className="bg-[#EFFFF1]/60 dark:bg-slate-850 p-3.5 rounded-xl border border-[#D9F8DF]/60 dark:border-slate-800 text-[11px] text-[#6B7280] dark:text-slate-450 leading-relaxed font-medium">
                💡 AI will return <strong>exactly 10 creative post ideas</strong> populated directly into your <strong>Ideas</strong> column as draft templates.
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiGeneratorOpen(false)}
                className="text-xs font-bold rounded-lg uppercase tracking-wider h-9"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateIdeasAI}
                disabled={aiGenerating}
                className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-extrabold text-xs px-5 rounded-lg uppercase tracking-wider h-9 flex items-center gap-1.5 disabled:opacity-60"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5 text-slate-950" />
                    <span>Generate 10 Ideas</span>
                  </>
                )}
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
        <Loader2 className="size-8 text-[#30FC47] animate-spin" />
      </div>
    }>
      <CreateContent />
    </Suspense>
  )
}
