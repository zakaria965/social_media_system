"use client"

import { useState, useEffect, useRef, Suspense } from "react"
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
import { GrowWaveModal } from "@/components/growwave-modal"

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
  
  // AI Ideas Generator Modal State (for generating 10 ideas)
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
  const [sortBy, setSortBy] = useState<"dateNewest" | "dateOldest" | "titleAsc" | "titleDesc">("dateNewest")

  // Quick Create Form states (Removed unnecessary tags & notes configuration)
  const [newIdeaTitle, setNewIdeaTitle] = useState("")
  const [newIdeaContent, setNewIdeaContent] = useState("")
  const [newIdeaPlatform, setNewIdeaPlatform] = useState("facebook")
  const [newIdeaStatus, setNewIdeaStatus] = useState<IdeaItem["column"]>("Ideas")
  const [newIdeaMedia, setNewIdeaMedia] = useState<{ name: string; size: number; url: string } | null>(null)
  const [modalAiLoading, setModalAiLoading] = useState(false)

  // AI Assistant panel states
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false)
  const [aiPromptInput, setAiPromptInput] = useState("")
  const [aiSidebarGenerating, setAiSidebarGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string>("")
  const [emojiDropdownOpen, setEmojiDropdownOpen] = useState(false)
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false)
  const [showDiscardWarning, setShowDiscardWarning] = useState(false)

  // Premium Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  // Drag and Drop Visual Feedback
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null)
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null)

  // Card Dropdown Active Menu
  const [openMenuCardId, setOpenMenuCardId] = useState<string | null>(null)

  // Upgrades
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"ai_quota" | "channels_limit" | "platform_locked" | "">("")
  const [publishingIdea, setPublishingIdea] = useState<IdeaItem | null>(null)

  // Onboarding Checklist Integration
  const [checklistOpen, setChecklistOpen] = useState(true)
  const [channels, setChannels] = useState<any[]>([])
  const [connectedCount, setConnectedCount] = useState(0)
  const [scheduledCount, setScheduledCount] = useState(0)

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const isImageUrl = (url: string) => {
    if (!url) return false
    const cleanUrl = url.split("?")[0].toLowerCase()
    return cleanUrl.endsWith(".png") || cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg") || cleanUrl.endsWith(".webp") || cleanUrl.endsWith(".gif") || url.startsWith("data:image/")
  }

  // Parse AI assistant response structured as TITLE: ... CONTENT: ...
  const parseAiResponse = (text: string) => {
    let title = ""
    let content = ""
    
    const titleMatch = text.match(/TITLE:\s*(.*)/i)
    const contentMatch = text.match(/CONTENT:\s*([\s\S]*)/i)
    
    if (titleMatch) {
      title = titleMatch[1].trim()
    }
    if (contentMatch) {
      content = contentMatch[1].trim()
    }
    
    if (!title || !content) {
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean)
      if (lines.length > 0) {
        title = lines[0].replace(/^Title:\s*/i, "").replace(/[#*]/g, "").trim()
        content = lines.slice(1).join("\n\n").trim() || lines[0]
      } else {
        title = "AI Content Idea"
        content = text
      }
    }
    
    return { title, content }
  }

  // Load and Database sync helpers
  const mapDbStatusToUiColumn = (status: string): IdeaItem["column"] => {
    if (status === "draft") return "Drafts"
    if (status === "ready") return "Ready To Publish"
    if (status === "published") return "Published"
    return "Ideas"
  }

  const mapUiColumnToDbStatus = (column: IdeaItem["column"]) => {
    if (column === "Drafts") return "draft"
    if (column === "Ready To Publish") return "ready"
    if (column === "Published") return "published"
    return "idea"
  }

  const getFileNameFromUrl = (url: string): string => {
    if (!url) return ""
    if (url.startsWith("data:")) return "uploaded_media"
    const parts = url.split("/")
    return parts[parts.length - 1] || "media_file"
  }

  const fetchIdeas = async () => {
    try {
      const res = await fetch("/api/ideas")
      if (res.ok) {
        const data = await res.json()
        const mapped: IdeaItem[] = data.ideas.map((item: any) => ({
          id: item._id,
          title: item.title,
          content: item.content,
          platform: item.platform || "facebook",
          column: mapDbStatusToUiColumn(item.status),
          mediaFile: item.media ? { name: getFileNameFromUrl(item.media), url: item.media, size: 0 } : null,
          createdAt: item.createdAt
        }))
        setIdeas(mapped)
        syncIdeasToScheduledPosts(mapped)
      }
    } catch (err) {
      console.error("Failed to fetch ideas from database:", err)
    }
  }

  useEffect(() => {
    // Check onboarding dismissed state
    const onboardingDismissed = localStorage.getItem("growwave-lite-create-onboard")
    if (onboardingDismissed === "dismissed") {
      setOnboardVisible(false)
    }

    // Load channels
        // Fetch actual channels from MongoDB for Free users
    fetch("/api/accounts")
      .then(res => res.json())
      .then(data => {
        if (data.accounts) {
          const fbAccount = data.accounts.find((a: any) => a.platform === "facebook" && a.status === "connected")
          if (fbAccount) {
            const fbChannel = {
              id: "c-fb",
              name: "Facebook Page",
              platform: "facebook",
              username: fbAccount.username || "Facebook Page",
              connected: true,
              followers: fbAccount.followers || 0,
              locked: false
            }
            setChannels([fbChannel])
            setConnectedCount(1)
            localStorage.setItem("growwave-lite-channels", JSON.stringify([fbChannel]))
          } else {
            const fbChannel = {
              id: "c-fb",
              name: "Facebook Page",
              platform: "facebook",
              username: "",
              connected: false,
              followers: 0,
              locked: false
            }
            setChannels([fbChannel])
            setConnectedCount(0)
            localStorage.setItem("growwave-lite-channels", JSON.stringify([fbChannel]))
          }
        }
      })
      .catch(err => {
        console.error("Failed to load accounts in composer page:", err)
      })

    fetchIdeas()
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

  // Handle Drop card in column (updates status in MongoDB)
  const handleDrop = async (e: React.DragEvent, columnName: IdeaItem["column"]) => {
    e.preventDefault()
    const cardId = e.dataTransfer.getData("text/plain") || draggedCardId
    if (cardId) {
      // Optimistic update
      const updated = ideas.map((i) => (i.id === cardId ? { ...i, column: columnName } : i))
      setIdeas(updated)
      syncIdeasToScheduledPosts(updated)

      const dbStatus = mapUiColumnToDbStatus(columnName)
      try {
        const res = await fetch("/api/ideas", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: cardId,
            status: dbStatus
          })
        })
        if (res.ok) {
          showToast("Idea Saved")
          fetchIdeas()
        }
      } catch (err) {
        console.error("Failed to update drag drop status in MongoDB:", err)
      }

      // Dismiss onboarding card
      setOnboardVisible(false)
      localStorage.setItem("growwave-lite-create-onboard", "dismissed")
    }
    setDraggedCardId(null)
    setDraggedOverColumn(null)
  }

  // AI Assistant Sidebar generation
  const handleSidebarAIGenerate = async () => {
    if (!aiPromptInput.trim()) return
    setAiSidebarGenerating(true)
    setGeneratedContent("")
    try {
      const structuredPrompt = `Write engaging social media content.
Prompt request: "${aiPromptInput}"

Please structure your response exactly like this:
TITLE: [a short catchy title for the idea, max 50 chars]
CONTENT: [the engaging post description/copy itself]

Do not write any other headers or intro/outro text. Just return the TITLE and CONTENT fields.`

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-caption",
          prompt: structuredPrompt,
          tone: "friendly"
        })
      })
      if (res.status === 429) {
        setUpgradeReason("ai_quota")
        setUpgradeOpen(true)
        return
      }
      if (res.ok) {
        const data = await res.json()
        if (data.result) {
          setGeneratedContent(data.result)
          showToast("✓ Content Generated")
        }
      } else {
        throw new Error("API failed")
      }
    } catch (err) {
      console.warn("AI generation failed, using mock suggestion:", err)
      setGeneratedContent(`TITLE: GrowWave Marketing Campaign\n\nCONTENT: Streamline your social media scheduling and content creation pipelines with GrowWave's AI intelligence tool! 🚀`)
      showToast("✓ Content Generated")
    } finally {
      setAiSidebarGenerating(false)
    }
  }

  const handleCopyGeneratedContent = () => {
    if (!generatedContent) return
    navigator.clipboard.writeText(generatedContent)
    showToast("✓ Content Copied")
  }

  const handleInsertIntoIdea = () => {
    if (!generatedContent) return
    const { title, content } = parseAiResponse(generatedContent)
    setNewIdeaTitle(title)
    setNewIdeaContent(content)
    showToast("✓ Content Inserted")
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
      <div className="size-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px] uppercase dark:bg-slate-800 dark:text-slate-355 select-none">
        c
      </div>
    )
  }

  const handleEmojiClick = (emoji: string) => {
    setNewIdeaContent((prev) => prev + emoji)
    setEmojiDropdownOpen(false)
  }

  const emojis = ["😀", "🚀", "🔥", "✨", "💡", "🎉", "👍", "👏", "❤️", "👀", "📈", "🙌", "💥", "📅", "😊"]

  // File upload logic (PNG/JPG/JPEG/WEBP/GIF/MP4 up to 50MB) (Bug 3 & 8)
  const uploadFile = async (file: File) => {
    const allowedTypes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "video/mp4"
    ]
    if (!allowedTypes.includes(file.type)) {
      showToast("⚠️ Unsupported file! Use PNG, JPG, JPEG, WEBP, GIF, or MP4.", "error")
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast("⚠️ File exceeds 50MB limit!", "error")
      return
    }

    setModalAiLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setNewIdeaMedia({
          name: data.name,
          size: Math.round((data.size / (1024 * 1024)) * 10) / 10,
          url: data.url
        })
        showToast("✓ Media Uploaded")
      } else {
        const errData = await res.json()
        showToast(`⚠️ ${errData.error || "Upload failed"}`, "error")
      }
    } catch (err) {
      console.error("Upload error", err)
      showToast("⚠️ File upload connection failed", "error")
    } finally {
      setModalAiLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
  }

  const handleDragOverFile = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
  }

  const handleSimulateMediaUpload = () => {
    fileInputRef.current?.click()
  }

  // Save Idea to MongoDB (status: "idea" or "draft")
  const handleSaveIdea = async (customStatus?: IdeaItem["column"]) => {
    // Form Validations (Bug 8)
    if (!newIdeaTitle.trim()) {
      showToast("⚠️ Title is required!", "error")
      return
    }
    if (!newIdeaContent.trim()) {
      showToast("⚠️ Content description is required!", "error")
      return
    }

    const targetColumn = customStatus || newIdeaStatus
    const dbStatus = mapUiColumnToDbStatus(targetColumn)

    const payload = {
      id: editingIdea ? editingIdea.id : undefined,
      title: newIdeaTitle,
      content: newIdeaContent,
      platform: newIdeaPlatform,
      media: newIdeaMedia ? newIdeaMedia.url : null,
      status: dbStatus
    }

    try {
      const method = editingIdea ? "PUT" : "POST"
      const res = await fetch("/api/ideas", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        showToast(customStatus === "Drafts" ? "✓ Post Created" : "✓ Idea saved successfully")
        forceCloseModal()
        await fetchIdeas()
      } else {
        const err = await res.json()
        showToast(`⚠️ ${err.error || "Failed to save idea"}`, "error")
      }
    } catch (err) {
      console.error("MongoDB Save error", err)
      showToast("⚠️ Network save error", "error")
    }
  }

  // Custom state for single idea delete modal
  const [deleteIdeaModalOpen, setDeleteIdeaModalOpen] = useState(false)
  const [deleteIdeaId, setDeleteIdeaId] = useState<string | null>(null)
  const [deleteIdeaLoading, setDeleteIdeaLoading] = useState(false)

  // Custom state for clear column modal
  const [clearColumnModalOpen, setClearColumnModalOpen] = useState(false)
  const [clearColumnName, setClearColumnName] = useState<IdeaItem["column"] | null>(null)
  const [clearColumnLoading, setClearColumnLoading] = useState(false)

  // Delete an idea in MongoDB
  const handleDeleteIdea = async (id: string) => {
    try {
      const res = await fetch(`/api/ideas?id=${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        showToast("✓ Idea Deleted")
        await fetchIdeas()
      } else {
        showToast("⚠️ Failed to delete idea", "error")
      }
    } catch (err) {
      console.error("Delete error", err)
      showToast("⚠️ Failed to delete idea", "error")
    }
  }

  const handleDeleteIdeaTrigger = (id: string) => {
    setDeleteIdeaId(id)
    setDeleteIdeaModalOpen(true)
  }

  const handleConfirmDeleteIdea = async () => {
    if (!deleteIdeaId) return
    setDeleteIdeaLoading(true)
    await handleDeleteIdea(deleteIdeaId)
    setDeleteIdeaLoading(false)
    setDeleteIdeaModalOpen(false)
    setDeleteIdeaId(null)
  }

  const handleClearColumnTrigger = (columnName: IdeaItem["column"]) => {
    setClearColumnName(columnName)
    setClearColumnModalOpen(true)
  }

  const handleConfirmClearColumn = async () => {
    if (!clearColumnName) return
    setClearColumnLoading(true)
    const toDelete = ideas.filter((i) => i.column === clearColumnName)
    for (const item of toDelete) {
      try {
        await fetch(`/api/ideas?id=${item.id}`, {
          method: "DELETE"
        })
      } catch (err) {
        console.error("Bulk delete error for idea:", item.id, err)
      }
    }
    showToast(`✓ Ideas cleared successfully`)
    await fetchIdeas()
    setClearColumnLoading(false)
    setClearColumnModalOpen(false)
    setClearColumnName(null)
  }


  // Start Edit Mode
  const handleStartEdit = (idea: IdeaItem) => {
    setEditingIdea(idea)
    setNewIdeaTitle(idea.title)
    setNewIdeaContent(idea.content)
    setNewIdeaPlatform(idea.platform)
    setNewIdeaStatus(idea.column)
    setNewIdeaMedia(idea.mediaFile || null)
    setIdeaFormOpen(true)
  }

  // Directly Move Column in DB
  const handleMoveIdea = async (id: string, col: IdeaItem["column"]) => {
    const dbStatus = mapUiColumnToDbStatus(col)
    try {
      const res = await fetch("/api/ideas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: dbStatus
        })
      })
      if (res.ok) {
        showToast(col === "Drafts" ? "✓ Post Created" : "✓ Idea Saved")
        await fetchIdeas()
      }
    } catch (err) {
      console.error("Move error", err)
    }
  }

  // Close checking for changes (Bug 7 Discard warn)
  const handleCloseModalCheck = () => {
    if (newIdeaTitle.trim() || newIdeaContent.trim() || newIdeaMedia) {
      setShowDiscardWarning(true)
    } else {
      forceCloseModal()
    }
  }

  const forceCloseModal = () => {
    setIdeaFormOpen(false)
    setEditingIdea(null)
    setNewIdeaTitle("")
    setNewIdeaContent("")
    setNewIdeaPlatform("facebook")
    setNewIdeaStatus("Ideas")
    setNewIdeaMedia(null)
    setGeneratedContent("")
    setAiPromptInput("")
    setIsAiSidebarOpen(false)
    setShowDiscardWarning(false)
    setPlatformDropdownOpen(false)
    setEmojiDropdownOpen(false)
  }

  // AI Generate 10 Content Ideas
  const handleGenerateIdeasAI = async () => {
    if (!aiTopic.trim()) {
      showToast("⚠️ Topic is required!", "error")
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

      if (res.status === 429) {
        setUpgradeReason("ai_quota")
        setUpgradeOpen(true)
        return
      }

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
        for (let idx = 0; idx < parsed.length; idx++) {
          const item = parsed[idx]
          await fetch("/api/ideas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: item.title || `Idea ${idx + 1}`,
              content: item.content || "",
              platform: item.platform || (aiPlatform === "all" ? "instagram" : aiPlatform.toLowerCase()),
              media: null,
              status: "idea"
            })
          })
        }

        showToast("✓ Content Generated")
        setOnboardVisible(false)
        localStorage.setItem("growwave-lite-create-onboard", "dismissed")
        setAiGeneratorOpen(false)
        setAiTopic("")
        setAiAudience("")
        setAiGoal("")

        await fetchIdeas()
      } else {
        throw new Error("Result is not an array")
      }
    } catch (err) {
      console.warn("AI generation error, using fallback content engine:", err)
      const fallbackIdeas = generateMockIdeas(aiTopic, aiAudience, aiGoal, aiPlatform)
      
      for (const idea of fallbackIdeas) {
        await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: idea.title,
            content: idea.content,
            platform: idea.platform,
            media: null,
            status: "idea"
          })
        })
      }

      showToast("✓ Content Generated")
      setOnboardVisible(false)
      localStorage.setItem("growwave-lite-create-onboard", "dismissed")
      setAiGeneratorOpen(false)
      setAiTopic("")
      setAiAudience("")
      setAiGoal("")

      await fetchIdeas()
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
    let icon = null
    let badgeStyle = "bg-slate-55 text-slate-600"
    if (p === "facebook") {
      icon = <IconFacebook className="size-3 text-blue-600 shrink-0" />
      badgeStyle = "bg-blue-50 text-blue-700"
    } else if (p === "instagram") {
      icon = <IconInstagram className="size-3 text-pink-600 shrink-0" />
      badgeStyle = "bg-pink-50 text-pink-700"
    } else if (p === "linkedin") {
      icon = <IconLinkedin className="size-3 text-sky-700 shrink-0" />
      badgeStyle = "bg-sky-50 text-sky-700"
    } else if (p === "twitter" || p === "x") {
      icon = <IconX className="size-3 text-slate-800 shrink-0" />
      badgeStyle = "bg-slate-100 text-slate-800"
    } else if (p === "tiktok") {
      icon = <IconTikTok className="size-3 text-fuchsia-600 shrink-0" />
      badgeStyle = "bg-fuchsia-50 text-fuchsia-700"
    }
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", badgeStyle)}>
        {icon}
        <span>{p}</span>
      </span>
    )
  }

  // Filter and Sort ideas
  const filteredIdeas = ideas.filter((idea) => {
    return filterPlatform === "all" || (idea.platform && idea.platform.toLowerCase() === filterPlatform.toLowerCase())
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
    <div className="space-y-6 bg-brand-page-bg dark:bg-slate-950 min-h-screen pb-12 select-none relative">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, video/mp4"
      />

      {/* Toast Notification (Bug 10) */}
      {toast && (
        <div className={cn(
          "fixed top-5 left-1/2 -translate-x-1/2 z-50 text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200 select-none border",
          toast.type === "error" 
            ? "bg-rose-600 border-rose-500 text-white dark:bg-rose-950 dark:border-rose-900 dark:text-rose-200" 
            : "bg-slate-900 border-slate-950 text-white dark:bg-white dark:border-slate-200 dark:text-slate-950"
        )}>
          {toast.type === "error" ? (
            <AlertCircle className="size-3.5 text-white dark:text-rose-450 shrink-0" />
          ) : (
            <Check className="size-3.5 text-[var(--brand-primary)] shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EEF2F7] pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#111827] dark:text-white">
            Create
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 dark:text-slate-400">
            Capture ideas and turn them into social content.
          </p>
        </div>
        <div>
          {/* Top Right Connected Channel Badge */}
          {(() => {
            const activeChannel = channels.find((c) => c.connected)
            if (activeChannel) {
              return (
                <div className="inline-flex items-center gap-1.5 bg-[var(--brand-surface)] text-emerald-800 dark:text-[var(--brand-primary)] dark:bg-emerald-950/40 px-3 py-1.5 rounded-full text-xs font-black border-0">
                  {renderPlatformBadge(activeChannel.platform)}
                  <span>{activeChannel.name} Connected</span>
                </div>
              )
            }
            return (
              <Link href="/free-user/settings?tab=accounts">
                <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 dark:text-rose-450 dark:bg-rose-950/20 px-3 py-1.5 rounded-full text-xs font-black border-0 cursor-pointer hover:bg-rose-100 transition-all">
                  <span className="size-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span>No Channel Connected</span>
                </div>
              </Link>
            )
          })()}
        </div>
      </div>

      {/* Onboarding Welcome Card */}
      {onboardVisible && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-card relative flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            onClick={handleDismissOnboard}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-1"
            title="Dismiss Onboarding"
          >
            <X className="size-4" />
          </button>
          
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="inline-flex items-center gap-1.5 bg-[var(--brand-primary)]/20 text-emerald-800 dark:text-[var(--brand-primary)] dark:bg-emerald-950/40 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
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
                setNewIdeaPlatform("facebook")
                setNewIdeaStatus("Ideas")
                setNewIdeaMedia(null)
                setIdeaFormOpen(true)
              }}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider shadow-sm transition-all"
            >
              Create First Idea
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenAiGenerate}
              className="border-[var(--border)] hover:bg-[var(--brand-surface)] text-emerald-700 font-extrabold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-[var(--brand-primary)]"
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
            className="bg-[var(--brand-primary)]/10 hover:bg-[#DDFBE3] border border-[var(--border)] text-emerald-800 dark:text-[var(--brand-primary)] dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 font-extrabold text-xs px-4.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Sparkles className="size-4 text-[var(--brand-primary)] fill-current animate-pulse" />
            Generate Ideas
          </Button>
        </div>

        {/* Right: Search, Filter, Sort, New Idea */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Platform Filter */}
          <div className="relative flex items-center">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="pl-8.5 pr-8 py-2 text-xs bg-white border border-[#EEF2F7] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] appearance-none font-bold text-slate-700"
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
              className="pl-8.5 pr-8 py-2 text-xs bg-white border border-[#EEF2F7] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] appearance-none font-bold text-slate-700"
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
              setNewIdeaPlatform("facebook")
              setNewIdeaStatus("Ideas")
              setNewIdeaMedia(null)
              setIdeaFormOpen(true)
            }}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="size-4 text-white" />
            New Idea
          </Button>
        </div>
      </div>

      {/* Main Kanban Board or Global Empty State */}
      {ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-[#EEF2F7] rounded-2xl bg-[#FCFAF6] p-16 text-center max-w-2xl mx-auto shadow-xs mt-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--brand-surface)] dark:bg-slate-800 mb-6">
            <Sparkles className="size-7 text-[var(--brand-primary)] fill-current" />
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
                setNewIdeaPlatform("facebook")
                setNewIdeaStatus("Ideas")
                setNewIdeaMedia(null)
                setIdeaFormOpen(true)
              }}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl uppercase tracking-wider shadow-sm transition-all"
            >
              + New Idea
            </Button>
            <Button
              variant="outline"
              onClick={() => setAiGeneratorOpen(true)}
              className="border-[var(--border)] hover:bg-[var(--brand-surface)] text-emerald-700 font-extrabold text-xs px-6 py-2.5 rounded-xl uppercase tracking-wider bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-[var(--brand-primary)]"
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
                className="bg-[#F5F2EB]/65 border border-[#EEF2F7] rounded-2xl flex flex-col min-h-[580px] transition-all p-3 shadow-xs"
                onDragOver={(e) => handleDragOver(e, columnName)}
                onDrop={(e) => handleDrop(e, columnName)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-[#EEF2F7]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                      {columnName}
                    </span>
                    <span className="bg-[#22C55E]/10 text-[#22C55E] text-[10px] font-black px-2.5 py-0.5 rounded-full select-none">
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
                        setNewIdeaPlatform("facebook")
                        setNewIdeaStatus(columnName)
                        setNewIdeaMedia(null)
                        setIdeaFormOpen(true)
                      }}
                      className="size-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white/60 transition-all"
                      title={`Add idea to ${columnName}`}
                    >
                      <Plus className="size-4" />
                    </button>
                    {/* Menu button (...) */}
                    <button
                      onClick={() => {
                        if (columnIdeas.length > 0) {
                          handleClearColumnTrigger(columnName)
                        }
                      }}
                      className="size-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white/60 transition-all"
                      title="Clear Column"
                    >
                      <MoreVertical className="size-3.5" />
                    </button>

                  </div>
                </div>

                {/* Column Dropzone */}
                <div
                  className={cn(
                    "flex-1 space-y-3 rounded-b-2xl transition-all duration-200 min-h-[450px] flex flex-col",
                    draggedOverColumn === columnName
                      ? "bg-[#22C55E]/10 border-2 border-dashed border-[#22C55E]/30 rounded-xl"
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
                        "bg-white p-4 rounded-2xl border-0 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-3.5 cursor-grab active:cursor-grabbing relative group/card",
                        draggedCardId === idea.id ? "opacity-30 border-dashed border-[var(--brand-primary)]" : ""
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
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-all"
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
                                  className="w-full text-left text-[11px] font-bold px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-805 rounded-lg transition-colors text-slate-700 dark:text-slate-355 flex items-center gap-1.5"
                                >
                                  <Edit2 className="size-3 text-slate-450" />
                                  Edit Idea
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteIdeaTrigger(idea.id)
                                    setOpenMenuCardId(null)
                                  }}
                                  className="w-full text-left text-[11px] font-bold px-2.5 py-1.5 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-450 rounded-lg transition-colors text-rose-500 flex items-center gap-1.5"
                                >
                                  <Trash2 className="size-3 text-rose-400" />
                                  Delete Idea
                                </button>
                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                <div className="px-2.5 py-1 text-[8px] font-black text-slate-455 uppercase tracking-wider">Move Column</div>
                                {(["Ideas", "Drafts", "Ready To Publish", "Published"] as const).map((col) => {
                                  if (col === idea.column) return null
                                  return (
                                    <button
                                      key={col}
                                      onClick={() => {
                                        handleMoveIdea(idea.id, col)
                                        setOpenMenuCardId(null)
                                      }}
                                      className="w-full text-left text-[10px] font-bold px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-805 rounded-lg transition-colors text-slate-655 dark:text-slate-400"
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
                      <div className="space-y-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">
                          {idea.title}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-3 whitespace-pre-wrap font-medium">
                          {idea.content || "Draft content empty. Click edit to draft post."}
                        </p>
                        
                        {idea.mediaFile && (
                          <div className="rounded-xl overflow-hidden relative group/media max-h-36 bg-slate-55 flex items-center justify-center">
                            {isImageUrl(idea.mediaFile.url) ? (
                              <img src={idea.mediaFile.url} alt="media preview" className="w-full h-full object-cover max-h-32" />
                            ) : (
                              <div className="w-full p-2.5 flex items-center gap-2 bg-[var(--brand-surface)] dark:bg-emerald-950/20 text-emerald-700 dark:text-[var(--brand-primary)] text-[10px] font-bold">
                                <ImageIcon className="size-4 shrink-0" />
                                <span className="truncate max-w-[140px]">{idea.mediaFile.name}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Actions & Status (Bug 5) */}
                      <div className="pt-3 border-t border-[#EEF2F7] flex items-center justify-between gap-2">
                        {idea.column === "Ideas" ? (
                          <button
                            onClick={() => handleMoveIdea(idea.id, "Drafts")}
                            className="w-full text-center bg-[#F0FDF4] hover:bg-[#22C55E] text-[#22C55E] hover:text-white font-extrabold text-[9.5px] py-2 rounded-xl uppercase tracking-wider transition-all duration-300 select-none cursor-pointer"
                          >
                            Create Post
                          </button>
                        ) : idea.column === "Drafts" || idea.column === "Ready To Publish" ? (
                          <button
                            onClick={() => setPublishingIdea(idea)}
                            className="w-full text-center bg-[#22C55E] hover:bg-[#16A34A] text-white font-extrabold text-[9.5px] py-2 rounded-xl uppercase tracking-wider transition-all duration-300 select-none cursor-pointer"
                          >
                            Publish Now
                          </button>
                        ) : (
                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none select-none w-full text-center">
                            {idea.column}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty state for single column */}
                  {columnIdeas.length === 0 && (
                    <div 
                      onClick={() => {
                        setEditingIdea(null)
                        setNewIdeaTitle("")
                        setNewIdeaContent("")
                        setNewIdeaPlatform("facebook")
                        setNewIdeaStatus(columnName)
                        setNewIdeaMedia(null)
                        setIdeaFormOpen(true)
                      }}
                      className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-[#E5E2DA] hover:border-[#22C55E]/40 rounded-2xl bg-white/40 hover:bg-white/80 transition-all duration-300 cursor-pointer select-none group/empty"
                    >
                      <Plus className="size-5 text-slate-450 group-hover:text-[#22C55E] transition-colors mb-1.5" />
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider group-hover:text-slate-800 transition-colors">
                        Add Idea
                      </span>
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
              <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-[var(--brand-primary)] tracking-wider">Setup Checklist</span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white mt-0.5">Complete your setup</h4>
            </div>
            <button
              onClick={() => setChecklistOpen(false)}
              className="text-slate-400 hover:text-slate-655 rounded p-0.5 transition-colors"
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
                      <Link href={step.href} className="text-[11px] font-bold text-slate-700 hover:text-slate-950 hover:underline dark:text-slate-350 dark:hover:text-white block">
                        {step.label} &rarr;
                      </Link>
                    ) : step.action && !step.checked ? (
                      <button onClick={step.action} className="text-[11px] font-bold text-emerald-600 hover:underline text-left block">
                        {step.label}
                      </button>
                    ) : (
                      <span className={cn("text-[11px] font-semibold block leading-tight", step.checked ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-355")}>
                        {step.label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Quick Create / Edit Modal (Buffer-style) */}
      {ideaFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={handleCloseModalCheck} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
          
          <div className="relative flex items-stretch gap-4 max-w-3xl w-full z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* AI Assistant Sidebar (Left Panel) (Bug 1 & 9 & 6) */}
            {isAiSidebarOpen && (
              <div className="w-80 rounded-2xl border-0 bg-white p-5 shadow-card flex flex-col justify-between animate-in slide-in-from-left-4 duration-300 shrink-0">
                <div className="space-y-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EEF2F7]">
                    <span className="text-xs font-black text-purple-650 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="size-4 text-purple-500 fill-current animate-pulse" />
                      AI Assistant
                    </span>
                    <button 
                      onClick={() => setIsAiSidebarOpen(false)}
                      className="text-slate-400 hover:text-slate-655 p-1"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {generatedContent ? (
                    /* AI Result Panel (Bug 1) */
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2 flex-1 flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          Generated Content
                        </span>
                        <div className="flex-1 bg-[#FCFAF6] border border-[#EEF2F7] rounded-xl p-3 text-xs font-semibold text-slate-850 whitespace-pre-wrap overflow-y-auto max-h-[300px]">
                          {generatedContent}
                        </div>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-[#EEF2F7] shrink-0">
                        <Button
                          onClick={handleInsertIntoIdea}
                          className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-[11px] py-2.5 rounded-xl uppercase tracking-wider transition-all"
                        >
                          Insert Into Idea
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={handleCopyGeneratedContent}
                            className="border border-[#EEF2F7] hover:bg-[#FCFAF6] text-slate-700 font-bold text-[10px] py-2 rounded-xl uppercase tracking-wider bg-white"
                          >
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleSidebarAIGenerate}
                            className="border border-[#EEF2F7] hover:bg-[#FCFAF6] text-slate-700 font-bold text-[10px] py-2 rounded-xl uppercase tracking-wider bg-white"
                          >
                            Regenerate
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => setGeneratedContent("")}
                          className="w-full text-[10px] font-bold text-slate-400 hover:text-slate-600"
                        >
                          &larr; Write New Prompt
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* AI Prompt Area (Bug 1 & 9) */
                    <div className="space-y-3.5 flex-1 flex flex-col">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                          What do you want to write about?
                        </label>
                        <textarea
                          placeholder="Eg. Write a professional content about my software company"
                          value={aiPromptInput}
                          onChange={(e) => setAiPromptInput(e.target.value)}
                          rows={8}
                          className="w-full text-xs font-semibold p-3 border border-[#EEF2F7] rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none bg-[#FCFAF6]/50 text-[#111827] placeholder:text-slate-455"
                          disabled={aiSidebarGenerating}
                        />
                      </div>
                      <p className="text-[10px] text-slate-455 leading-normal font-semibold">
                        <strong className="text-slate-500">Pro tip:</strong> Include key points, your target audience, and platform context.
                      </p>
                    </div>
                  )}
                </div>

                {!generatedContent && (
                  <div className="pt-4 border-t border-[#EEF2F7]">
                    <button
                      onClick={handleSidebarAIGenerate}
                      disabled={aiSidebarGenerating || !aiPromptInput.trim()}
                      className={cn(
                        "w-full font-black text-[11.5px] py-2.5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                        aiPromptInput.trim() 
                          ? "bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white shadow-sm" 
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      {aiSidebarGenerating ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Generating content...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5 text-white" />
                          <span>Generate Content</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Main Create/Edit Modal Card (Right Panel) */}
            <div className="flex-1 rounded-2xl border-0 bg-white p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between min-h-[500px] relative">
              <button 
                onClick={handleCloseModalCheck}
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
                  className="w-full text-lg font-black text-[#111827] dark:text-white border-0 border-b border-transparent focus:outline-none focus:ring-0 focus:border-transparent p-0 bg-transparent placeholder:text-slate-350"
                  autoFocus
                />

                {/* Content/Description text area */}
                <div className="relative flex-1 flex flex-col min-h-[160px]">
                  <textarea
                    placeholder="Wait... It's about to come to me... or "
                    value={newIdeaContent}
                    onChange={(e) => setNewIdeaContent(e.target.value)}
                    rows={6}
                    className="w-full text-xs font-semibold p-0 border-0 focus:outline-none focus:ring-0 resize-none bg-transparent text-[#111827] dark:text-white placeholder:text-slate-350"
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

                {/* Media Upload and Platform Selector */}
                <div className="flex items-center gap-4">
                  {newIdeaMedia ? (
                    /* Upload Preview Card */
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl flex-1">
                      <div className="relative w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                        {isImageUrl(newIdeaMedia.url) ? (
                          <img src={newIdeaMedia.url} alt="media preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-slate-550 dark:text-slate-400 bg-slate-200 dark:bg-slate-800">
                            <ImageIcon className="size-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-[#111827] dark:text-white truncate">{newIdeaMedia.name}</p>
                        <p className="text-[10px] text-slate-455 dark:text-slate-500 font-semibold">{newIdeaMedia.size} MB</p>
                        <div className="flex gap-2.5 mt-1">
                          <button
                            type="button"
                            onClick={() => setNewIdeaMedia(null)}
                            className="text-[10px] font-black text-rose-600 hover:text-rose-700 dark:text-rose-450 dark:hover:text-rose-300 uppercase tracking-wider"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={handleSimulateMediaUpload}
                            className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 dark:text-[var(--brand-primary)] dark:hover:text-[var(--brand-hover)] uppercase tracking-wider"
                          >
                            Replace
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Dotted Square Drag & Drop area */
                    <div
                      onClick={handleSimulateMediaUpload}
                      onDragOver={handleDragOverFile}
                      onDrop={handleDropFile}
                      className="w-28 h-28 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/10 dark:hover:bg-slate-850/30 transition-all gap-1 select-none shrink-0"
                    >
                      <ImageIcon className="size-5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-tight">Drag & drop</span>
                      <span className="text-[8.5px] font-semibold text-emerald-600 dark:text-emerald-400">or select file</span>
                    </div>
                  )}

                  {/* Platform Selector (Facebook Only for Free Plan) */}
                  <div className="flex-1 space-y-1.5">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                      Target Channel
                    </span>
                    <div className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded-xl text-xs font-bold text-[#111827] dark:text-white">
                      <div className="flex items-center gap-2">
                        {renderToolbarPlatformIcon("facebook")}
                        <span>Facebook Page</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Toolbar & Footer */}
              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between relative">
                {/* Left controls: Emoji, AI assistant trigger */}
                <div className="flex items-center gap-2">
                  {/* Emoji Button */}
                  <div className="relative">
                    <button
                      onClick={() => setEmojiDropdownOpen(!emojiDropdownOpen)}
                      className="size-7 flex items-center justify-center text-slate-450 hover:text-slate-700 dark:hover:text-white hover:bg-slate-55 dark:hover:bg-slate-800 rounded-full transition-all"
                      title="Insert Emoji"
                    >
                      <span className="text-base select-none">😊</span>
                    </button>

                    {emojiDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setEmojiDropdownOpen(false)} />
                        <div className="absolute left-0 bottom-9 z-20 grid grid-cols-5 gap-1 p-2 bg-white rounded-xl border border-slate-150 shadow-xl w-44 dark:bg-slate-900 dark:border-slate-800">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleEmojiClick(emoji)}
                              className="size-7 flex items-center justify-center text-base hover:bg-slate-55 dark:hover:bg-slate-805 rounded transition-colors"
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
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/50 dark:bg-purple-955/35 dark:border-purple-900/60 dark:text-purple-300 transition-all select-none"
                  >
                    <Sparkles className="size-3 text-purple-500 fill-current" />
                    <span>AI Assistant</span>
                  </button>
                </div>

                {/* Right controls: Create Post (Ready To Publish status), Save Idea */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveIdea("Drafts")}
                    className="bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 font-extrabold text-[11px] px-4 py-2.5 rounded-xl uppercase tracking-wider transition-all"
                  >
                    Create Post
                  </button>
                  <button
                    onClick={() => handleSaveIdea()}
                    className="bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 font-extrabold text-[11px] px-4 py-2.5 rounded-xl uppercase tracking-wider transition-all"
                  >
                    Save Idea
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discard Warning Modal */}
      {showDiscardWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowDiscardWarning(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-150 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50 text-center space-y-4">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Discard Changes?</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Are you sure you want to discard your draft? Any entered content will be permanently lost.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setShowDiscardWarning(false)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 font-extrabold text-[10px] py-2 px-4 rounded-xl uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={forceCloseModal}
                className="bg-rose-500 hover:bg-rose-650 text-white font-extrabold text-[10px] py-2 px-4 rounded-xl uppercase tracking-wider"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Ideas Modal (for generating 10 ideas) */}
      {aiGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setAiGeneratorOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
          
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-250 bg-white shadow-2xl p-6 dark:border-slate-800 dark:bg-slate-900 z-10 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-[var(--brand-primary)]" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider dark:text-white">
                  Generate Ideas with AI
                </h3>
              </div>
              <button onClick={() => setAiGeneratorOpen(false)} className="text-slate-400 hover:text-slate-655 rounded">
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
                  className="h-9 text-xs font-semibold focus-visible:ring-[var(--brand-primary)]"
                />
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Target Audience</span>
                <Input
                  placeholder="e.g. tech developers, home baristas"
                  value={aiAudience}
                  onChange={(e) => setAiAudience(e.target.value)}
                  className="h-9 text-xs font-semibold focus-visible:ring-[var(--brand-primary)]"
                />
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Primary Goal</span>
                <Input
                  placeholder="e.g. lead generation, brand education"
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  className="h-9 text-xs font-semibold focus-visible:ring-[var(--brand-primary)]"
                />
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Platform</span>
                <select
                  value={aiPlatform}
                  onChange={(e) => setAiPlatform(e.target.value)}
                  className="w-full text-xs font-bold text-slate-650 bg-white border border-slate-200 p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] h-9 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350"
                >
                  <option value="all">All Channels</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
                </select>
              </div>

              <div className="bg-[var(--brand-surface)]/60 dark:bg-slate-850 p-3.5 rounded-xl border border-[var(--border)]/60 dark:border-slate-800 text-[11px] text-[#6B7280] dark:text-slate-455 leading-relaxed font-medium">
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
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs px-5 rounded-lg uppercase tracking-wider h-9 flex items-center gap-1.5 disabled:opacity-60"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5 text-white" />
                    <span>Generate 10 Ideas</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason={upgradeReason} />

            {publishingIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setPublishingIdea(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-background shadow-2xl p-6 dark:border-slate-800 dark:bg-slate-900 z-10 space-y-4">
            <h3 className="text-sm font-extrabold text-[#1F2937] dark:text-white">Publish Post</h3>
            {connectedCount === 0 ? (
              <div className="space-y-4 py-2">
                <p className="text-xs text-[#6B7280]">Connect a Facebook Page before publishing.</p>
                <Button 
                  onClick={() => {
                    router.push("/free-user/settings?tab=accounts")
                  }}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs py-2 rounded-lg uppercase tracking-wider transition-all"
                >
                  Connect Facebook
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 text-xs font-semibold text-slate-655 dark:text-slate-400">
                  <p>
                    This post will be published immediately to your connected Facebook Page:
                  </p>
                  <p className="font-extrabold text-slate-850 dark:text-slate-200 border p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    {channels.find(c => c.connected)?.username || "Your Connected Page"}
                  </p>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setPublishingIdea(null)}
                    className="text-xs font-bold text-[#6B7280]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      const activeChannel = channels.find(c => c.connected)
                      const targetPlatform = activeChannel ? activeChannel.platform : "facebook"
                      
                      try {
                        const publishRes = await fetch("/api/publish", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            content: publishingIdea.content,
                            platforms: [targetPlatform],
                            media: publishingIdea.mediaFile ? [publishingIdea.mediaFile.url] : []
                          })
                        })
                        const resData = await publishRes.json()
                        if (!publishRes.ok || !resData.results?.[targetPlatform]?.success) {
                          const err = resData.results?.[targetPlatform]?.error || resData.error || "Publishing failed"
                          showToast(`⚠️ Facebook Publish Failed: ${err}`, "error")
                          setPublishingIdea(null)
                          return
                        }

                        const res = await fetch("/api/ideas", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id: publishingIdea.id,
                            platform: targetPlatform,
                            status: "published"
                          })
                        })
                        if (res.ok) {
                          showToast("✓ Post published successfully")
                          setPublishingIdea(null)
                          await fetchIdeas()
                        } else {
                          showToast("⚠️ Failed to update post status in workspace", "error")
                        }
                      } catch (err) {
                        console.error("Publish error", err)
                        showToast("⚠️ Network error", "error")
                      }
                    }}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs px-4 rounded-lg uppercase tracking-wider"
                  >
                    Publish Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <GrowWaveModal
        isOpen={deleteIdeaModalOpen}
        onClose={() => {
          if (!deleteIdeaLoading) {
            setDeleteIdeaModalOpen(false)
            setDeleteIdeaId(null)
          }
        }}
        title="Delete Content Idea"
        message="Are you sure you want to permanently delete this content idea? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteIdea}
        variant="danger"
        loading={deleteIdeaLoading}
        loadingText="Deleting..."
      />

      <GrowWaveModal
        isOpen={clearColumnModalOpen}
        onClose={() => {
          if (!clearColumnLoading) {
            setClearColumnModalOpen(false)
            setClearColumnName(null)
          }
        }}
        title={`Clear Column: ${clearColumnName || ""}`}
        message={`Are you sure you want to permanently delete all content items inside the "${clearColumnName || ""}" column? This action cannot be undone.`}
        confirmText="Clear Column"
        cancelText="Cancel"
        onConfirm={handleConfirmClearColumn}
        variant="danger"
        loading={clearColumnLoading}
        loadingText="Clearing..."
      />
    </div>
  )

}

export default function FreeCreatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 text-[var(--brand-primary)] animate-spin" />
      </div>
    }>
      <CreateContent />
    </Suspense>
  )
}
