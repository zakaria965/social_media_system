"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  Send,
  Loader2,
  Brain,
  User,
  Bot,
  Trash2,
  Terminal,
  HelpCircle,
  Download,
  Copy,
  Plus,
  Search,
  Pin,
  Menu,
  X,
  Edit2,
  Check,
  ChevronRight,
  Settings,
  MessageSquare,
  Share2,
  Trash,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkle,
  Star,
  Archive,
  ChevronLeft,
  Calendar,
  Activity,
  Layers,
  Paperclip,
  Bookmark,
  ExternalLink,
  PlusCircle,
  FileText,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageTransition } from "@/components/dashboard/page-transition"
import { useToast } from "@/components/toast-provider"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
  pinnedInsight?: boolean
  errorType?: "QUOTA_EXCEEDED" | "CONFIG_INCOMPLETE" | "SERVICE_UNAVAILABLE"
  model?: "gemini" | "zai" | "openrouter"
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  pinned: boolean
  favorite: boolean
  archived: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

const chatTags = ["Analytics", "Content", "Growth", "Strategy", "Reports"]

const suggestedPrompts = [
  { text: "📈 Analyze my growth this week", category: "Analytics", prompt: "Analyze my growth this week." },
  { text: "📅 Build next week's content plan", category: "Content", prompt: "Build next week's content plan." },
  { text: "🚀 Find growth opportunities", category: "Growth", prompt: "Show growth opportunities." },
  { text: "📝 Create LinkedIn content", category: "Content", prompt: "Create LinkedIn content about social media automation." },
  { text: "🎯 Improve engagement", category: "Performance", prompt: "How can I improve my post engagement?" },
  { text: "📊 Generate performance report", category: "Reports", prompt: "How is my workspace performing today?" }
]

const quickActions = [
  { label: "Create Content", prompt: "Write an engaging social media post for my brand." },
  { label: "Generate Hashtags", prompt: "Suggest high-performing trending hashtags for social media." },
  { label: "30-Day Content Plan", prompt: "/calendar 30 days" },
  { label: "Analyze Performance", prompt: "/report today" }
]

const slashCommands = [
  { cmd: "/report", desc: "Generate workspace report", insert: "/report today" },
  { cmd: "/calendar", desc: "Build content calendar", insert: "/calendar 30 days" },
  { cmd: "/caption", desc: "Create captions", insert: "/caption " },
  { cmd: "/analyze", desc: "Analyze platform metrics", insert: "/analyze " },
  { cmd: "/growth", desc: "Growth advisor review", insert: "/growth " },
  { cmd: "/strategy", desc: "SWOT strategy blueprint", insert: "/strategy " },
  { cmd: "/hashtags", desc: "Suggest keywords hashtags", insert: "/hashtags " },
  { cmd: "/inbox", desc: "Inbox assistant priorities", insert: "/inbox summaries" },
  { cmd: "/channels", desc: "Channel performance overview", insert: "/channels sync" },
  { cmd: "/team", desc: "Summarize pending reviews", insert: "/team reviews" }
]

// Rotational thinking phase list
const thinkingPhases = [
  "Thinking...",
  "Generating Strategy...",
  "Analyzing Data..."
]

export default function AIAssistantPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { showToast } = useToast()

  // Panel layout toggles
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [threeDotMenuOpen, setThreeDotMenuOpen] = useState(false)
  const [aiToolsOpen, setAiToolsOpen] = useState(false)
  
  // Chats state & filter
  const [chats, setChats] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  // Editing state
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitleVal, setEditTitleVal] = useState("")
  const [newTagInput, setNewTagInput] = useState("")

  // Input states
  const [inputVal, setInputVal] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [currentResponse, setCurrentResponse] = useState("")
  const [selectedModel, setSelectedModel] = useState<"gemini" | "zai" | "openrouter">("gemini")
  const [showCommands, setShowCommands] = useState(false)

  // Thinking State Rotator
  const [thinkingIndex, setThinkingIndex] = useState(0)
  const [generatingText, setGeneratingText] = useState("Analyzing workspace...")

  // Dynamic Workspace Status counters (synced from DB /api/analytics)
  const [channelsCount, setChannelsCount] = useState(0)
  const [scheduledPostsCount, setScheduledPostsCount] = useState(0)
  const [connectedChannels, setConnectedChannels] = useState<{ platform: string; username: string }[]>([])
  const [savedCalendars, setSavedCalendars] = useState<string[]>([])
  const [recentReports, setRecentReports] = useState<string[]>([])
  const [pinnedInsights, setPinnedInsights] = useState<string[]>([])

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Greet user based on timezone hours
  const getGreeting = () => {
    const hrs = new Date().getHours()
    const name = session?.user?.name || session?.user?.email?.split("@")[0] || "Social Manager"
    if (hrs < 12) return `Good Morning, ${name}`
    if (hrs < 18) return `Good Afternoon, ${name}`
    return `Good Evening, ${name}`
  }

  // DB Sync helpers
  const saveChatToDB = async (chat: ChatSession) => {
    try {
      await fetch("/api/ai/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chat)
      })
    } catch (e) {
      console.error("Failed to sync chat to DB", e)
    }
  }

  const deleteChatFromDB = async (id: string) => {
    try {
      await fetch(`/api/ai/conversations?id=${id}`, {
        method: "DELETE"
      })
    } catch (e) {
      console.error("Failed to delete chat from DB", e)
    }
  }

  // 1. Initial Local Storage & Workspace Status loader
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load pinned insights
      const savedInsights = localStorage.getItem("growwave-pinned-insights")
      if (savedInsights) {
        setPinnedInsights(JSON.parse(savedInsights))
      }
    }

    async function loadChatsFromDB() {
      try {
        const res = await fetch("/api/ai/conversations")
        if (res.ok) {
          const data = await res.json()
          if (data.conversations && Array.isArray(data.conversations) && data.conversations.length > 0) {
            const sorted = [...data.conversations].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            setChats(sorted)
            setActiveChatId(sorted[0].id)
            return
          }
        }
      } catch (e) {
        console.error("Failed to load chats from DB", e)
      }

      // Fallback to localStorage if DB check is empty or fails
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("growwave-ai-chats")
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as ChatSession[]
            setChats(parsed)
            if (parsed.length > 0) {
              const sorted = [...parsed].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              setActiveChatId(sorted[0].id)
            }
          } catch (e) {
            console.error("Failed to parse local chats", e)
          }
        }
      }
    }

    loadChatsFromDB()

    // Load dynamic status parameters from /api/analytics
    async function loadWorkspaceStatus() {
      try {
        const res = await fetch("/api/analytics?timeframe=30d")
        if (res.ok) {
          const data = await res.json()
          if (data.hasPublishedPosts) {
            setChannelsCount(data.totalAccountsCount || 0)
            setScheduledPostsCount(data.overview?.scheduledCount || 0)
            
            // Populate right insights panel items
            if (data.platformDetails) {
              setConnectedChannels(data.platformDetails.filter((p: any) => p.status === "connected").map((p: any) => ({
                platform: p.platform,
                username: p.username || `@${p.platform}_user`
              })))
            }
          }
        }
      } catch (e) {
        console.error("Failed to load workspace status", e)
      }
    }
    loadWorkspaceStatus()
  }, [])

  // Sync to localStorage helper
  const saveChatsToStorage = (updatedChats: ChatSession[]) => {
    setChats(updatedChats)
    localStorage.setItem("growwave-ai-chats", JSON.stringify(updatedChats))
  }

  // Auto-scroll chat
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chats, currentResponse, activeChatId, scrollToBottom])

  // Thinking State Interval Rotator
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (streaming && !currentResponse) {
      interval = setInterval(() => {
        setThinkingIndex((prev) => (prev + 1) % thinkingPhases.length)
      }, 900)
    } else {
      setThinkingIndex(0)
    }
    return () => clearInterval(interval)
  }, [streaming, currentResponse])

  // Get active session
  const activeChat = chats.find((c) => c.id === activeChatId) || null
  const activeMessages = activeChat ? activeChat.messages : []

  // Create fresh chat
  const handleNewChat = (initialText = "") => {
    const newId = crypto.randomUUID()
    const newSession: ChatSession = {
      id: newId,
      title: initialText ? (initialText.length > 25 ? initialText.slice(0, 25) + "..." : initialText) : "New Conversation",
      messages: [],
      pinned: false,
      favorite: false,
      archived: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const updated = [newSession, ...chats]
    saveChatsToStorage(updated)
    saveChatToDB(newSession)
    setActiveChatId(newId)
    setLeftSidebarOpen(false)
    if (initialText) {
      setTimeout(() => handleSend(initialText, newId), 100)
    }
  }

  // Delete chat
  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = chats.filter((c) => c.id !== id)
    saveChatsToStorage(updated)
    deleteChatFromDB(id)
    if (activeChatId === id) {
      if (updated.length > 0) {
        setActiveChatId(updated[0].id)
      } else {
        setActiveChatId(null)
      }
    }
    showToast("Chat deleted", "info")
  }

  // Toggle Pinned
  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const target = chats.find(c => c.id === id)
    if (!target) return
    const updatedChat = { ...target, pinned: !target.pinned, updatedAt: new Date().toISOString() }
    const updated = chats.map((c) => (c.id === id ? updatedChat : c))
    saveChatsToStorage(updated)
    saveChatToDB(updatedChat)
  }

  // Toggle Favorite
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const target = chats.find(c => c.id === id)
    if (!target) return
    const updatedChat = { ...target, favorite: !target.favorite, updatedAt: new Date().toISOString() }
    const updated = chats.map((c) => (c.id === id ? updatedChat : c))
    saveChatsToStorage(updated)
    saveChatToDB(updatedChat)
    showToast(target.favorite ? "Removed from Favorites" : "Added to Favorites", "success")
  }

  // Toggle Archive
  const handleToggleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const target = chats.find(c => c.id === id)
    if (!target) return
    const updatedChat = { ...target, archived: !target.archived, updatedAt: new Date().toISOString() }
    const updated = chats.map((c) => (c.id === id ? updatedChat : c))
    saveChatsToStorage(updated)
    saveChatToDB(updatedChat)
    showToast(target.archived ? "Unarchived chat" : "Archived chat", "success")
  }

  // Rename chat
  const handleStartRename = (chat: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingChatId(chat.id)
    setEditTitleVal(chat.title)
  }

  const handleSaveRename = (id: string) => {
    if (!editTitleVal.trim()) return
    const target = chats.find(c => c.id === id)
    if (!target) return
    const updatedChat = { ...target, title: editTitleVal.trim(), updatedAt: new Date().toISOString() }
    const updated = chats.map((c) => (c.id === id ? updatedChat : c))
    saveChatsToStorage(updated)
    saveChatToDB(updatedChat)
    setEditingChatId(null)
  }

  // Add tag to active chat
  const handleAddTag = (tag: string) => {
    if (!activeChatId) return
    const target = chats.find(c => c.id === activeChatId)
    if (!target) return
    if (target.tags.includes(tag)) return
    
    const updatedChat = { ...target, tags: [...target.tags, tag], updatedAt: new Date().toISOString() }
    const updated = chats.map((c) => {
      if (c.id === activeChatId) {
        return updatedChat
      }
      return c
    })
    saveChatsToStorage(updated)
    saveChatToDB(updatedChat)
    showToast(`Added tag #${tag}`, "success")
  }

  // 3. Send Message Action
  const handleSend = async (customPrompt = "", forcedId: string | null = null) => {
    const promptText = (customPrompt || inputVal).trim()
    if (!promptText) return

    setInputVal("")
    setShowCommands(false)

    const isContentRequest = promptText.startsWith("/caption") ||
                            promptText.startsWith("/calendar") ||
                            promptText.toLowerCase().includes("write") ||
                            promptText.toLowerCase().includes("create") ||
                            promptText.toLowerCase().includes("generate") ||
                            promptText.toLowerCase().includes("ideas") ||
                            promptText.toLowerCase().includes("post")

    if (isContentRequest) {
      setGeneratingText("Generating content...")
    } else {
      setGeneratingText("Analyzing workspace...")
    }

    let currentId = forcedId || activeChatId
    if (!currentId) {
      const newId = crypto.randomUUID()
      const newSession: ChatSession = {
        id: newId,
        title: promptText.length > 25 ? promptText.slice(0, 25) + "..." : promptText,
        messages: [],
        pinned: false,
        favorite: false,
        archived: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      saveChatsToStorage([newSession, ...chats])
      setActiveChatId(newId)
      currentId = newId
    }

    const targetChat = chats.find((c) => c.id === currentId)
    if (!targetChat) return

    const userMsg: ChatMessage = {
      role: "user",
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    const updatedHistory = [...targetChat.messages, userMsg]
    const title = targetChat.messages.length === 0 ? (promptText.length > 25 ? promptText.slice(0, 25) + "..." : promptText) : targetChat.title

    // Auto classify tags if slash command matches
    let autoTags = [...targetChat.tags]
    if (promptText.startsWith("/report")) autoTags = Array.from(new Set([...autoTags, "Reports", "Analytics"]))
    if (promptText.startsWith("/calendar")) autoTags = Array.from(new Set([...autoTags, "Content"]))
    if (promptText.startsWith("/analyze") || promptText.startsWith("/growth")) autoTags = Array.from(new Set([...autoTags, "Analytics", "Growth"]))
    if (promptText.startsWith("/strategy")) autoTags = Array.from(new Set([...autoTags, "Strategy"]))

    const nextChats = chats.map((c) => {
      if (c.id === currentId) {
        return {
          ...c,
          title,
          messages: updatedHistory,
          tags: autoTags,
          updatedAt: new Date().toISOString()
        }
      }
      return c
    })
    saveChatsToStorage(nextChats)
    setStreaming(true)
    setCurrentResponse("")

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentId,
          messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
          action: promptText.startsWith("/") ? promptText.split(" ")[0] : "",
          model: selectedModel
        })
      })

      if (!res.ok) {
        let errCode: "QUOTA_EXCEEDED" | "CONFIG_INCOMPLETE" | "SERVICE_UNAVAILABLE" = "SERVICE_UNAVAILABLE"
        let errMsg = "AI Assistant is temporarily unavailable. Please try again in a few moments."

        try {
          const errJson = await res.json()
          errMsg = errJson.error || errMsg
          if (errJson.errorCode === "QUOTA_EXCEEDED") {
            errCode = "QUOTA_EXCEEDED"
            // Use the server-provided message which is plan-aware
          } else if (errJson.errorCode === "CONFIG_INCOMPLETE" || res.status === 400) {
            errCode = "CONFIG_INCOMPLETE"
            errMsg = errJson.error || "AI service configuration is incomplete."
          } else if (res.status === 429) {
            errCode = "QUOTA_EXCEEDED"
            // Use the server-provided message
          } else {
            errCode = "SERVICE_UNAVAILABLE"
            // Use the server-provided error message (provider-specific)
          }
        } catch (_) {
          if (res.status === 429) {
            errCode = "QUOTA_EXCEEDED"
            errMsg = "Your AI usage limit has been reached."
          }
        }

        const errorMsg: ChatMessage = {
          role: "assistant",
          content: errMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          errorType: errCode
        }

        const errorChats = nextChats.map((c) => {
          if (c.id === currentId) {
            return {
              ...c,
              messages: [...updatedHistory, errorMsg],
              updatedAt: new Date().toISOString()
            }
          }
          return c
        })
        saveChatsToStorage(errorChats)
        await saveChatToDB({
          ...targetChat,
          messages: [...updatedHistory, errorMsg],
          updatedAt: new Date().toISOString()
        })
        return
      }

      const reader = res.body?.getReader()
      let assistantText = ""

      if (reader) {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunk = new TextDecoder().decode(value)
          assistantText += chunk
          setCurrentResponse(assistantText)
        }
      }

      // Check if calendar or report was generated to cache it on right drawer
      if (promptText.includes("/calendar") || assistantText.includes("| Date |")) {
        setSavedCalendars(prev => Array.from(new Set([title, ...prev])))
      }
      if (promptText.includes("/report") || assistantText.toLowerCase().includes("executive summary")) {
        setRecentReports(prev => Array.from(new Set([title, ...prev])))
      }

      const finalAssistantMsg: ChatMessage = {
        role: "assistant",
        content: assistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: selectedModel
      }

      const finalChat = {
        ...targetChat,
        messages: [...updatedHistory, finalAssistantMsg],
        updatedAt: new Date().toISOString()
      }

      const finalChats = nextChats.map((c) => {
        if (c.id === currentId) {
          return finalChat
        }
        return c
      })
      saveChatsToStorage(finalChats)
      await saveChatToDB(finalChat)
      setCurrentResponse("")
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: "AI Assistant is temporarily unavailable. Please try again in a few moments.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        errorType: "SERVICE_UNAVAILABLE"
      }

      const errorChats = nextChats.map((c) => {
        if (c.id === currentId) {
          return {
            ...c,
            messages: [...updatedHistory, errorMsg],
            updatedAt: new Date().toISOString()
          }
        }
        return c
      })
      saveChatsToStorage(errorChats)
      await saveChatToDB({
        ...targetChat,
        messages: [...updatedHistory, errorMsg],
        updatedAt: new Date().toISOString()
      })
    } finally {
      setStreaming(false)
    }
  }

  // Keyboard events
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

  const handleSelectCommand = (cmd: typeof slashCommands[0]) => {
    setInputVal(cmd.insert)
    setShowCommands(false)
  }

  // Pin individual key insights from AI responses to the Right drawer
  const handlePinInsight = (text: string) => {
    const cleanText = text.length > 80 ? text.slice(0, 80) + "..." : text
    const updated = Array.from(new Set([...pinnedInsights, cleanText]))
    setPinnedInsights(updated)
    localStorage.setItem("growwave-pinned-insights", JSON.stringify(updated))
    showToast("Insight pinned to Workspace Drawer", "success")
  }

  // Export TXT
  const exportChatData = (chatObj: ChatSession) => {
    if (!chatObj.messages.length) return
    const textData = chatObj.messages
      .map((m) => `[${m.role.toUpperCase()} - ${m.timestamp}]\n${m.content}\n\n---\n`)
      .join("\n")
    const blob = new Blob([textData], { type: "text/plain;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${chatObj.title.replace(/\s+/g, "_")}_export.txt`
    link.click()
    showToast("Chat log downloaded", "success")
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast("Copied to clipboard", "success")
  }

  // Contextual action button clicks (Connects AI output directly to operating system)
  const handleAction = (type: string, content: string) => {
    if (type === "create" || type === "schedule") {
      // Save text content temporarily and route to create page
      localStorage.setItem("growwave-draft-caption", content)
      showToast("Caption saved to creator template", "success")
      router.push("/dashboard/create")
    } else if (type === "analytics") {
      router.push("/dashboard/analytics")
    } else if (type === "calendar") {
      router.push("/dashboard/calendar")
    } else if (type === "export_md") {
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `GrowWave_Copilot_Report_${new Date().toISOString().split("T")[0]}.md`
      link.click()
      showToast("Exported Markdown file", "success")
    }
  }

  // Custom visual markdown parser (renders table tags, lists, bold elements)
  const renderMessageContent = (text: string) => {
    if (!text) return null
    const lines = text.split("\n")
    return (
      <div className="space-y-2 text-sm leading-relaxed text-foreground/90 font-normal">
        {lines.map((line, idx) => {
          const trimmed = line.trim()

          if (trimmed.startsWith("```")) return null

          // Structured dynamic tables parser
          if (trimmed.startsWith("|") && idx < lines.length - 1) {
            if (trimmed.includes("---")) return null
            const cells = trimmed
              .split("|")
              .map((c) => c.trim())
              .filter((_, i) => i > 0 && i < trimmed.split("|").length - 1)

            const isHeader = idx > 0 && (lines[idx + 1]?.trim().includes("---") || idx === 0)

            return (
              <div key={idx} className="overflow-x-auto my-2.5 rounded-xl border border-border bg-background/55 shadow-sm">
                <table className="min-w-full divide-y divide-border text-left text-xs font-normal">
                  <tbody className="divide-y divide-border">
                    <tr className={cn(isHeader ? "bg-muted/75 font-semibold text-primary" : "hover:bg-muted/30")}>
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2.5 whitespace-normal break-words">
                          {parseInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          }

          // Headers
          if (trimmed.startsWith("###")) {
            return <h4 key={idx} className="text-xs font-bold uppercase tracking-wider text-primary mt-4 mb-1">{parseInlineMarkdown(trimmed.replace("###", ""))}</h4>
          }
          if (trimmed.startsWith("##")) {
            return <h3 key={idx} className="text-sm font-bold text-foreground mt-4 mb-1 border-b border-border/40 pb-0.5">{parseInlineMarkdown(trimmed.replace("##", ""))}</h3>
          }
          if (trimmed.startsWith("#")) {
            return <h2 key={idx} className="text-base font-bold text-foreground mt-4 mb-2">{parseInlineMarkdown(trimmed.replace("#", ""))}</h2>
          }

          // Lists
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <ul key={idx} className="list-disc pl-5 space-y-0.5 my-0.5">
                <li>{parseInlineMarkdown(trimmed.substring(2))}</li>
              </ul>
            )
          }

          const orderMatch = trimmed.match(/^(\d+)\.\s(.*)/)
          if (orderMatch) {
            return (
              <ol key={idx} className="list-decimal pl-5 space-y-0.5 my-0.5">
                <li value={parseInt(orderMatch[1])}>{parseInlineMarkdown(orderMatch[2])}</li>
              </ol>
            )
          }

          if (trimmed === "") {
            return <div key={idx} className="h-1.5" />
          }

          return <p key={idx}>{parseInlineMarkdown(line)}</p>
        })}
      </div>
    )
  }

  // Regex bold & codes inline translator
  const parseInlineMarkdown = (text: string) => {
    let result: React.ReactNode[] = [text]

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
          <code key={codeMatch.index} className="font-mono bg-muted/90 px-1 py-0.5 rounded text-[11px] border border-border/40 text-foreground font-medium">
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

  // Filter conversations list
  const filteredChats = chats.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesTag = activeTagFilter ? c.tags.includes(activeTagFilter) : true
    const matchesArchive = showArchived ? c.archived : !c.archived
    return matchesSearch && matchesTag && matchesArchive
  })

  // Context-aware AI action triggers helper
  const getContextualActions = (content: string) => {
    const actions = []
    const lower = content.toLowerCase()
    
    if (lower.includes("| date |") || lower.includes("calendar") || lower.includes("schedule")) {
      actions.push({ type: "calendar", label: "Open Calendar", icon: Calendar })
      actions.push({ type: "create", label: "Schedule Post", icon: PlusCircle })
    } else if (lower.includes("caption") || lower.includes("generate a caption") || content.length < 500) {
      actions.push({ type: "create", label: "Create Post", icon: PlusCircle })
    }
    
    if (lower.includes("report") || lower.includes("summary") || lower.includes("analytics") || lower.includes("reach")) {
      actions.push({ type: "analytics", label: "Open Analytics", icon: Activity })
      actions.push({ type: "export_md", label: "Export MD Report", icon: Download })
    }

    return actions
  }

  // Quick Action triggers
  const handleQuickAction = (label: string, promptText: string) => {
    if (promptText.startsWith("/")) {
      handleSend(promptText)
    } else {
      setInputVal(promptText)
    }
  }

  // AI Tool Selection trigger
  const handleToolClick = (toolPrompt: string) => {
    if (toolPrompt.startsWith("/")) {
      if (toolPrompt === "/calendar 30 days" || toolPrompt === "/report today") {
        handleSend(toolPrompt)
      } else {
        setInputVal(toolPrompt)
      }
    } else {
      setInputVal(toolPrompt)
    }
  }

  // History Drawer grouping helper
  const getGroupedChats = () => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000
    const startOf7DaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000
    const startOf30DaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000

    const groups: {
      today: ChatSession[]
      yesterday: ChatSession[]
      last7Days: ChatSession[]
      last30Days: ChatSession[]
      older: ChatSession[]
    } = {
      today: [],
      yesterday: [],
      last7Days: [],
      last30Days: [],
      older: []
    }

    filteredChats.forEach((c) => {
      const time = new Date(c.updatedAt).getTime()
      if (time >= startOfToday) {
        groups.today.push(c)
      } else if (time >= startOfYesterday) {
        groups.yesterday.push(c)
      } else if (time >= startOf7DaysAgo) {
        groups.last7Days.push(c)
      } else if (time >= startOf30DaysAgo) {
        groups.last30Days.push(c)
      } else {
        groups.older.push(c)
      }
    })

    return groups
  }

  return (
    <PageTransition>
      <div className="flex flex-col h-[calc(100vh-110px)] md:h-[calc(100vh-130px)] w-full overflow-hidden bg-[#FCFAF6] dark:bg-background relative">
        
        {/* FLOATING HEADER ROW */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-transparent z-30 select-none">
          <div className="flex items-center gap-2">
            {/* ☰ History Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#1F2937] hover:text-slate-800 dark:hover:text-slate-250 transition-colors cursor-pointer"
              onClick={() => setLeftSidebarOpen(true)}
              title="Open History"
            >
              <Menu className="size-4.5" />
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* AI Model Selector */}
            <Select value={selectedModel} onValueChange={(val: "gemini" | "zai" | "openrouter") => setSelectedModel(val)}>
              <SelectTrigger className="h-8 w-auto text-xs border-0 bg-transparent hover:bg-slate-200/50 dark:hover:bg-[#1F2937] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 focus:ring-0 focus:ring-offset-0 px-2.5 rounded-lg cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200 dark:border-[#374151] bg-[#FFFFFF] dark:bg-[#111827] shadow-lg text-foreground">
                <SelectItem value="gemini" className="text-xs focus:bg-emerald-50 dark:focus:bg-emerald-950 focus:text-emerald-900 dark:focus:text-emerald-300 rounded-lg">Gemini</SelectItem>
                <SelectItem value="zai" className="text-xs focus:bg-blue-50 dark:focus:bg-blue-950 focus:text-blue-900 dark:focus:text-blue-300 rounded-lg">Z.ai GLM</SelectItem>
                <SelectItem value="openrouter" className="text-xs focus:bg-purple-50 dark:focus:bg-purple-950 focus:text-purple-900 dark:focus:text-purple-300 rounded-lg">Nex N2 Pro</SelectItem>
              </SelectContent>
            </Select>

            {/* Three-dot Dropdown Menu Button */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "size-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#1F2937] hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer",
                  threeDotMenuOpen && "bg-slate-200/50 dark:bg-[#1F2937] text-slate-800 dark:text-slate-200"
                )}
                onClick={() => setThreeDotMenuOpen(!threeDotMenuOpen)}
              >
                <MoreVertical className="size-4" />
              </Button>

              {threeDotMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setThreeDotMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 dark:border-[#374151] bg-[#FFFFFF] dark:bg-[#111827] p-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-[#1F2937]/60 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      onClick={() => {
                        setThreeDotMenuOpen(false)
                        if (activeChat) exportChatData(activeChat)
                      }}
                      disabled={!activeChat || activeMessages.length === 0}
                    >
                      <Download className="size-3.5 text-slate-500" />
                      <span>Export Logs</span>
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-[#1F2937]/60 flex items-center gap-2 transition-colors cursor-pointer"
                      onClick={() => {
                        setThreeDotMenuOpen(false)
                        setRightSidebarOpen(true)
                      }}
                    >
                      <Layers className="size-3.5 text-slate-500" />
                      <span>Workspace Insights</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CHAT MESSAGES CANVAS (Centered) */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 bg-[#FCFAF6] dark:bg-background w-full">
          
          {/* EMPTY STATE / WELCOME HERO */}
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center space-y-8 py-12 max-w-2xl mx-auto">
              <div className="space-y-4">
                <div className="size-16 rounded-[24px] bg-[#FFFFFF] dark:bg-[#111827] shadow-md flex items-center justify-center mx-auto border border-slate-100 dark:border-[#374151] animate-bounce">
                  <span className="text-3xl">✨</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#111827] dark:text-[#F8FAFC]">
                  GrowWave AI Assistant
                </h1>
                <p className="text-sm text-[#64748B] dark:text-[#CBD5E1] leading-relaxed max-w-lg mx-auto font-medium">
                  Your intelligent social media strategist. Generate content, plan campaigns, analyze performance, and grow faster with AI.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid gap-3.5 sm:grid-cols-2 w-full pt-4">
                {quickActions.map((q, idx) => (
                  <div
                    key={idx}
                    className="group flex flex-col text-left p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#111827] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border border-slate-200/60 dark:border-[#374151] hover:border-primary/40"
                    onClick={() => handleQuickAction(q.label, q.prompt)}
                  >
                    <span className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] group-hover:text-primary transition-colors flex items-center justify-between">
                      {q.label}
                      <ChevronRight className="size-3.5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-bold uppercase tracking-wider">
                      {q.label === "Create Content" ? "Content Writer" : q.label === "Generate Hashtags" ? "Caption tool" : q.label === "30-Day Content Plan" ? "Calendar Builder" : "Analytics"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // MESSAGES TIMELINE Flow
            <div className="max-w-3xl mx-auto space-y-8">
              {activeMessages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col space-y-2 w-full",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  {/* User Message Bubble */}
                  {msg.role === "user" ? (
                    <div className="flex flex-col items-end space-y-1.5 max-w-[75%]">
                      <div className="bg-[#EBFEEB] dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] px-4.5 py-3 rounded-2xl rounded-tr-sm shadow-[0_2px_12px_rgba(48,252,71,0.03)] text-sm leading-relaxed border border-emerald-100/30 dark:border-[#374151]">
                        {renderMessageContent(msg.content)}
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-[#CBD5E1]/70 font-semibold px-1 select-none">{msg.timestamp}</span>
                    </div>
                  ) : (
                    /* Assistant Message: Floating layout (no box wrapper, no borders) */
                    <div className="flex flex-col items-start space-y-2 w-full max-w-[75%] group/msg">
                      {/* Model badge and timestamp for Assistant responses */}
                      <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400 dark:text-[#CBD5E1]/75 font-semibold select-none">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border",
                          msg.model === "zai"
                            ? "bg-blue-50/80 border-blue-100 text-blue-600 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-450"
                            : msg.model === "openrouter"
                            ? "bg-purple-50/80 border-purple-100 text-purple-600 dark:bg-purple-950/40 dark:border-purple-900 dark:text-purple-450"
                            : "bg-emerald-50/80 border-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-450"
                        )}>
                          {msg.model === "zai" ? "🔵 Z.ai GLM" : msg.model === "openrouter" ? "🟣 Nex N2 Pro" : "🟢 Gemini"}
                        </span>
                        <span>{msg.timestamp}</span>
                        <button
                          className="opacity-0 group-hover/msg:opacity-100 hover:text-primary transition-all p-0.5 cursor-pointer ml-1"
                          onClick={() => handlePinInsight(msg.content)}
                          title="Pin Insight to workspace drawer"
                        >
                          <Bookmark className="size-3" />
                        </button>
                      </div>

                      {/* Content Area - floating naturally, leading 1.7 */}
                      <div className="w-full text-slate-900 dark:text-[#CBD5E1] text-sm leading-[1.7] px-1 font-normal">
                        {msg.errorType ? (
                          <div className="p-4 rounded-xl border bg-destructive/5 border-destructive/20 text-foreground flex flex-col gap-3 w-full">
                            <div className="flex items-start gap-2.5">
                              <span className="text-destructive font-bold text-base mt-0.5">⚠️</span>
                              <div>
                                <h4 className="font-bold text-xs text-destructive">
                                  {msg.errorType === "QUOTA_EXCEEDED" && "AI Credit Limit Reached"}
                                  {msg.errorType === "CONFIG_INCOMPLETE" && "Configuration Incomplete"}
                                  {msg.errorType === "SERVICE_UNAVAILABLE" && "Temporarily Unavailable"}
                                </h4>
                                <p className="text-xs text-[#64748B] mt-1 leading-normal font-medium">
                                  {msg.content}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end mt-1">
                              {msg.errorType === "QUOTA_EXCEEDED" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    className="h-7 text-[10.5px] border-primary/20 hover:border-primary/40 text-primary hover:bg-primary/5 font-semibold bg-[#FFFFFF] dark:bg-[#111827]"
                                    onClick={() => router.push("/pricing")}
                                  >
                                    Upgrade Plan
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    className="h-7 text-[10.5px] border-slate-200 dark:border-[#374151] hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1F2937] font-semibold bg-[#FFFFFF] dark:bg-[#111827]"
                                    onClick={() => router.push("/contact")}
                                  >
                                    Contact Support
                                  </Button>
                                </>
                              )}
                              {msg.errorType === "SERVICE_UNAVAILABLE" && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  className="h-7 text-[10.5px] border-primary/20 hover:border-primary/40 text-primary hover:bg-primary/5 font-semibold bg-[#FFFFFF] dark:bg-[#111827]"
                                  onClick={() => {
                                    const lastUserMsg = activeMessages
                                      .slice(0, activeMessages.indexOf(msg))
                                      .reverse()
                                      .find((m) => m.role === "user")
                                    if (lastUserMsg) {
                                      handleSend(lastUserMsg.content)
                                    }
                                  }}
                                >
                                  Retry
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          renderMessageContent(msg.content)
                        )}
                      </div>

                      {/* Dynamic Context-Aware Action Cards */}
                      {!msg.errorType && (
                        <div className="pt-2 border-t border-slate-100 dark:border-[#374151] mt-2 flex flex-wrap gap-2 items-center justify-between w-full select-none">
                          <div className="flex flex-wrap gap-1.5">
                            {getContextualActions(msg.content).map((act, aIdx) => (
                              <Button
                                key={aIdx}
                                variant="outline"
                                size="xs"
                                className="h-6 px-2.5 text-[10px] rounded-lg gap-1 border-slate-200 dark:border-[#374151] hover:border-slate-300 dark:hover:border-slate-550 text-slate-600 dark:text-slate-350 hover:text-slate-800 dark:hover:text-slate-150 transition-all font-semibold bg-[#FFFFFF] dark:bg-[#111827]"
                                onClick={() => handleAction(act.type, msg.content)}
                              >
                                <act.icon className="size-3 text-slate-500" />
                                {act.label}
                              </Button>
                            ))}
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-700 font-semibold"
                              onClick={() => handleCopyText(msg.content)}
                            >
                              <Copy className="size-3 mr-1" /> Copy
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {!msg.errorType && (
                        <div className="text-[10px] text-slate-400 px-1 select-none font-semibold mt-1">
                          Generated by {msg.model === "zai" ? "Z.ai GLM" : msg.model === "openrouter" ? "Nex N2 Pro" : "Gemini 2.5 Flash"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming loading phase */}
              {streaming && (
                <div className="flex flex-col space-y-2 w-full items-start max-w-[75%]">
                  <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400 font-semibold select-none">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border",
                      selectedModel === "zai"
                        ? "bg-blue-50 border-blue-100 text-blue-600"
                        : selectedModel === "openrouter"
                        ? "bg-purple-50 border-purple-100 text-purple-600"
                        : "bg-emerald-50 border-emerald-100 text-emerald-600"
                    )}>
                      {selectedModel === "zai" ? "🔵 Z.ai" : selectedModel === "openrouter" ? "🟣 Nex N2 Pro" : "🟢 Gemini"}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-primary">
                      <span className="size-1 rounded-full bg-primary inline-block animate-ping" />
                      {currentResponse ? "streaming..." : generatingText}
                    </span>
                  </div>

                  <div className="w-full text-slate-900 text-sm leading-[1.7] px-1 font-normal">
                    {currentResponse ? (
                      renderMessageContent(currentResponse)
                    ) : (
                      <div className="flex items-center gap-2.5 py-1 text-slate-400">
                        <Loader2 className="size-4 animate-spin text-slate-400" />
                        <span className="italic font-semibold animate-pulse">{generatingText}</span>
                      </div>
                    )}
                    {currentResponse && (
                      <span className="inline-block size-2 bg-primary rounded-full animate-ping ml-1" />
                    )}
                  </div>
                  
                  {currentResponse && (
                    <div className="text-[10px] text-slate-400 px-1 select-none font-semibold mt-1">
                      Generating with {selectedModel === "zai" ? "Z.ai GLM" : selectedModel === "openrouter" ? "Nex N2 Pro" : "Gemini 2.5 Flash"}...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* INPUT CONTAINER (Centered & Floating) */}
        <div className="p-4 md:p-6 bg-transparent shrink-0">
          <div className="max-w-3xl mx-auto relative w-full flex flex-col bg-[#FFFFFF] dark:bg-[#111827] rounded-[24px] border border-slate-200/80 dark:border-[#374151] shadow-[0_8px_30px_rgba(0,0,0,0.03)] focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            
            {/* Expandable AI Tools Menu Panel */}
            {aiToolsOpen && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 border-b border-slate-100 dark:border-[#374151] bg-slate-50/50 dark:bg-[#1F2937]/50 rounded-t-[24px] animate-in fade-in duration-200">
                {[
                  { id: "writer", name: "Content Writer", prompt: "Write content about ", icon: FileText },
                  { id: "caption", name: "Caption Generator", prompt: "/caption ", icon: Sparkles },
                  { id: "calendar", name: "Calendar Builder", prompt: "/calendar 30 days", icon: Calendar },
                  { id: "analytics", name: "Analytics Review", prompt: "/analyze ", icon: Activity },
                  { id: "growth", name: "Growth Strategy", prompt: "/growth ", icon: TrendingUp },
                  { id: "reports", name: "Reports", prompt: "/report today", icon: FileText }
                ].map((tool, idx) => (
                  <button
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-100 dark:border-[#374151] hover:border-slate-200 dark:hover:border-slate-650 hover:shadow-xs text-left transition-all text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer"
                    onClick={() => {
                      handleToolClick(tool.prompt)
                      setAiToolsOpen(false)
                    }}
                  >
                    <tool.icon className="size-4 text-slate-500 shrink-0" />
                    <span className="truncate">{tool.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Slash Commands Dialog Overlay */}
            {showCommands && (
              <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 bg-background border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto z-40 divide-y divide-border/40 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="px-3.5 py-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted/10 flex items-center justify-between">
                  <span>Quick assistant commands</span>
                  <span>ESC to close</span>
                </div>
                {slashCommands.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-3.5 py-2 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => handleSelectCommand(item)}
                  >
                    <div>
                      <span className="text-xs font-bold text-primary">{item.cmd}</span>
                      <span className="text-xs text-foreground font-semibold ml-3">{item.desc}</span>
                    </div>
                    <ChevronRight className="size-3 text-muted-foreground/60" />
                  </div>
                ))}
              </div>
            )}

            {/* Input Textarea */}
            <textarea
              placeholder="Ask the Copilot... Type '/' for commands, click 'AI Tools' for helpers..."
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
              rows={2}
              className="w-full min-h-[60px] max-h-36 resize-none bg-transparent border-0 outline-none text-sm px-5 py-4 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 focus:ring-offset-0"
            />

            {/* Input Action Panel Row */}
            <div className="flex items-center justify-between px-5 pb-3.5 pt-1.5 bg-transparent rounded-b-[24px] select-none">
              <div className="flex items-center gap-2">
                {/* Attach File Button */}
                <button
                  className="size-8 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-[#1F2937] border border-slate-100 dark:border-[#374151] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors"
                  onClick={() => showToast("Select files to upload", "info")}
                  title="Attach file"
                >
                  <Paperclip className="size-3.5" />
                </button>

                {/* AI Tools Menu Toggle */}
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setAiToolsOpen(!aiToolsOpen)}
                  className={cn(
                    "h-8 text-[11px] px-3 rounded-full gap-1 border border-slate-200 dark:border-[#374151] font-semibold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-[#1F2937] hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer",
                    aiToolsOpen && "bg-slate-50 dark:bg-[#1F2937] text-slate-900 dark:text-slate-100 border-primary/20"
                  )}
                >
                  <Sparkles className="size-3 text-primary" />
                  <span>AI Tools</span>
                </Button>

                {/* Selected Model Indicator Badge */}
                <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-550 font-bold bg-slate-50/50 dark:bg-[#1F2937]/50 px-2.5 py-1 rounded-full border border-slate-200 dark:border-[#374151]">
                  {selectedModel === "gemini" ? "Gemini" : selectedModel === "zai" ? "Z.ai" : "Nex N2 Pro"}
                </span>
              </div>

              {/* Send / Stop Stream Button */}
              <Button
                onClick={() => handleSend()}
                disabled={streaming || !inputVal.trim()}
                size="icon"
                className={cn(
                  "size-8.5 rounded-full shrink-0 transition-all duration-200 border-0 flex items-center justify-center cursor-pointer",
                  inputVal.trim() && !streaming
                    ? "bg-primary text-black hover:bg-[#2ae43f]"
                    : "bg-slate-100 dark:bg-[#1F2937] text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#1F2937]"
                )}
              >
                {streaming ? (
                  <Loader2 className="size-4 animate-spin text-slate-400" />
                ) : (
                  <Send className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* LEFT SIDEBAR: Collapsible History Drawer */}
      {leftSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setLeftSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-[#FFFFFF] dark:bg-[#111827] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col border-r border-[#EEF2F7] dark:border-[#374151]",
          leftSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="p-4.5 border-b border-[#EEF2F7] dark:border-[#374151] flex items-center justify-between gap-2 shrink-0">
          <span className="font-bold text-sm text-[#111827] dark:text-[#F8FAFC]">History</span>
          <div className="flex items-center gap-1.5">
            <Button
              onClick={() => {
                handleNewChat()
                setLeftSidebarOpen(false)
              }}
              variant="outline"
              className="h-8 px-2.5 rounded-lg text-xs gap-1 border-slate-200 dark:border-[#374151] hover:bg-slate-50 dark:hover:bg-[#1F2937] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111827]"
            >
              <Plus className="size-3.5" /> New Chat
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
              onClick={() => setLeftSidebarOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Drawer Search Input */}
        <div className="px-4 py-3 relative shrink-0 border-b border-[#EEF2F7] dark:border-[#374151]">
          <Search className="size-4 absolute left-7 top-6 text-slate-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-lg pl-9 text-xs border-slate-200 dark:border-[#374151] bg-slate-50/50 dark:bg-[#1F2937]/50 text-slate-700 dark:text-slate-200"
          />
        </div>

        {/* Grouped conversations list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {(() => {
            const grouped = getGroupedChats()
            const sections: { key: keyof typeof grouped; label: string }[] = [
              { key: "today", label: "Today" },
              { key: "yesterday", label: "Yesterday" },
              { key: "last7Days", label: "Last 7 Days" },
              { key: "last30Days", label: "Last 30 Days" },
              { key: "older", label: "Older" }
            ]

            return sections.map(({ key, label }) => {
              const items = grouped[key]
              if (items.length === 0) return null

              return (
                <div key={key} className="space-y-1">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    {label}
                  </span>
                  {items.map((c) => (
                    <div
                      key={c.id}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-all duration-150",
                        c.id === activeChatId
                          ? "bg-[#EBFEEB] dark:bg-emerald-950/40 text-slate-900 dark:text-emerald-400 font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-[#1F2937] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                      onClick={() => {
                        setActiveChatId(c.id)
                        setLeftSidebarOpen(false)
                      }}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                        <MessageSquare className={cn("size-4 shrink-0", c.id === activeChatId ? "text-primary" : "text-slate-400 dark:text-slate-500")} />
                        {editingChatId === c.id ? (
                          <input
                            value={editTitleVal}
                            onChange={(e) => setEditTitleVal(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveRename(c.id)}
                            onBlur={() => handleSaveRename(c.id)}
                            className="bg-transparent border-b border-primary text-xs focus:outline-none w-full py-0.5 text-foreground"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <span className="truncate">{c.title}</span>
                        )}
                      </div>

                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 shrink-0 ml-1">
                        <Button variant="ghost" size="icon" className="size-6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1F2937] rounded-md" onClick={(e) => handleTogglePin(c.id, e)}>
                          <Pin className={cn("size-3", c.pinned && "fill-slate-500 text-slate-500")} />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1F2937] rounded-md" onClick={(e) => handleToggleFavorite(c.id, e)}>
                          <Star className={cn("size-3", c.favorite && "fill-amber-400 text-amber-400")} />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1F2937] rounded-md" onClick={(e) => handleToggleArchive(c.id, e)}>
                          <Archive className="size-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1F2937] rounded-md" onClick={(e) => handleStartRename(c, e)}>
                          <Edit2 className="size-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-md" onClick={(e) => handleDeleteChat(c.id, e)}>
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })
          })()}
          {filteredChats.length === 0 && (
            <p className="px-3 py-6 text-xs text-slate-400 italic text-center">No conversations found</p>
          )}
        </div>

        {/* Bottom Memory Settings */}
        <div className="p-4 border-t border-[#EEF2F7] dark:border-[#374151] bg-slate-50/50 dark:bg-[#1F2937]/30 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold">
              <Brain className="size-3.5 text-primary" /> Memory Settings
            </span>
            <Link href="/dashboard/settings" className="text-primary hover:underline font-semibold flex items-center gap-0.5">
              Configure <ChevronRight className="size-3" />
            </Link>
          </div>
          <p className="text-[10px] text-[#64748B]/85 dark:text-slate-400/85 leading-normal">
            AI remembers brand guidelines and content rules set inside Settings page tabs.
          </p>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Workspace Insights Slide-over */}
      {rightSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setRightSidebarOpen(false)}
        />
      )}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 w-80 bg-[#FFFFFF] dark:bg-[#111827] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col border-l border-[#EEF2F7] dark:border-[#374151]",
        rightSidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="px-4.5 py-4.5 border-b border-[#EEF2F7] dark:border-[#374151] flex items-center justify-between shrink-0 bg-white dark:bg-[#111827]">
          <span className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] flex items-center gap-1.5">
            <Layers className="size-4 text-primary" />
            Workspace Insights
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg"
            onClick={() => setRightSidebarOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Connected Channels status */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#CBD5E1] block">Connected Channels</span>
            <div className="space-y-1.5">
              {connectedChannels.map((ch, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50/50 dark:bg-[#1F2937]/50 border border-slate-100 dark:border-[#374151] shadow-2xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{ch.platform}</span>
                  <span className="text-[10px] text-[#64748B] dark:text-[#CBD5E1] max-w-[120px] truncate">{ch.username}</span>
                </div>
              ))}
              {connectedChannels.length === 0 && (
                <p className="text-[11px] text-[#64748B] italic">No channels synced. Connected profiles will list here.</p>
              )}
            </div>
          </div>

          {/* Saved Calendars */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#CBD5E1] block">Saved Calendars</span>
            <div className="space-y-1.5">
              {savedCalendars.map((cName, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50/50 dark:bg-[#1F2937]/50 border border-slate-100 dark:border-[#374151] shadow-2xs">
                  <span className="truncate flex-1 pr-2 text-slate-700 dark:text-slate-200 font-medium">{cName}</span>
                  <Button variant="ghost" size="icon" className="size-6 hover:bg-slate-100 dark:hover:bg-[#1F2937] rounded-md" onClick={() => router.push("/dashboard/calendar")}>
                    <ExternalLink className="size-3 text-slate-500 dark:text-slate-400" />
                  </Button>
                </div>
              ))}
              {savedCalendars.length === 0 && (
                <p className="text-[11px] text-[#64748B] italic">No calendars saved. Prompt `/calendar` to generate schedules.</p>
              )}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#CBD5E1] block">Recent Reports</span>
            <div className="space-y-1.5">
              {recentReports.map((rName, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50/50 dark:bg-[#1F2937]/50 border border-slate-100 dark:border-[#374151] shadow-2xs">
                  <span className="truncate flex-1 pr-2 text-slate-700 dark:text-slate-200 font-medium">{rName}</span>
                  <Button variant="ghost" size="icon" className="size-6 hover:bg-slate-100 dark:hover:bg-[#1F2937] rounded-md" onClick={() => handleAction("export_md", `## ${rName}\nExecutive Summary and KPI indicators.`)}>
                    <Download className="size-3 text-slate-500 dark:text-slate-400" />
                  </Button>
                </div>
              ))}
              {recentReports.length === 0 && (
                <p className="text-[11px] text-[#64748B] italic">No reports listed. Prompt `/report` to generate executive sheets.</p>
              )}
            </div>
          </div>

          {/* Pinned Insights */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#CBD5E1] block">Pinned Insights</span>
            <div className="space-y-1.5">
              {pinnedInsights.map((ins, idx) => (
                <div key={idx} className="relative group/ins p-3 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30 text-[11px] leading-relaxed text-slate-700 dark:text-emerald-300 flex flex-col gap-1.5 shadow-2xs">
                  <p>{ins}</p>
                  <button
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover/ins:opacity-100 text-slate-400 dark:text-slate-500 hover:text-destructive transition-all cursor-pointer"
                    onClick={() => {
                      const updated = pinnedInsights.filter((_, i) => i !== idx)
                      setPinnedInsights(updated)
                      localStorage.setItem("growwave-pinned-insights", JSON.stringify(updated))
                    }}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {pinnedInsights.length === 0 && (
                <p className="text-[11px] text-[#64748B] italic">Pin tips from Copilot responses to keep them visible here.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
