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
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageTransition } from "@/components/dashboard/page-transition"
import { useToast } from "@/components/toast-provider"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
  pinnedInsight?: boolean
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
  { label: "Generate Caption", prompt: "/caption Write a creative post caption about: " },
  { label: "Analyze Analytics", prompt: "/analyze facebook" },
  { label: "Create Calendar", prompt: "/calendar 30 days" },
  { label: "Growth Strategy", prompt: "/strategy Analyze growth metrics and suggest improvements." },
  { label: "Weekly Report", prompt: "/report today" },
  { label: "Content Ideas", prompt: "Give me 10 content ideas for " }
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
  "Analyzing Analytics...",
  "Reviewing Channels...",
  "Generating Strategy..."
]

export default function AIAssistantPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { showToast } = useToast()

  // Panel layout toggles
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  
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
  const [showCommands, setShowCommands] = useState(false)

  // Thinking State Rotator
  const [thinkingIndex, setThinkingIndex] = useState(0)

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

  // 1. Initial Local Storage & Workspace Status loader
  useEffect(() => {
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
          console.error("Failed to parse chats", e)
        }
      }

      // Load pinned insights
      const savedInsights = localStorage.getItem("growwave-pinned-insights")
      if (savedInsights) {
        setPinnedInsights(JSON.parse(savedInsights))
      }
    }

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
    const updated = chats.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    saveChatsToStorage(updated)
  }

  // Toggle Favorite
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = chats.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c))
    saveChatsToStorage(updated)
    showToast(chats.find(c => c.id === id)?.favorite ? "Removed from Favorites" : "Added to Favorites", "success")
  }

  // Toggle Archive
  const handleToggleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = chats.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c))
    saveChatsToStorage(updated)
    showToast(chats.find(c => c.id === id)?.archived ? "Unarchived chat" : "Archived chat", "success")
  }

  // Rename chat
  const handleStartRename = (chat: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingChatId(chat.id)
    setEditTitleVal(chat.title)
  }

  const handleSaveRename = (id: string) => {
    if (!editTitleVal.trim()) return
    const updated = chats.map((c) => (c.id === id ? { ...c, title: editTitleVal.trim(), updatedAt: new Date().toISOString() } : c))
    saveChatsToStorage(updated)
    setEditingChatId(null)
  }

  // Add tag to active chat
  const handleAddTag = (tag: string) => {
    if (!activeChatId) return
    const target = chats.find(c => c.id === activeChatId)
    if (!target) return
    if (target.tags.includes(tag)) return
    
    const updated = chats.map((c) => {
      if (c.id === activeChatId) {
        return { ...c, tags: [...c.tags, tag], updatedAt: new Date().toISOString() }
      }
      return c
    })
    saveChatsToStorage(updated)
    showToast(`Added tag #${tag}`, "success")
  }

  // 3. Send Message Action
  const handleSend = async (customPrompt = "", forcedId: string | null = null) => {
    const promptText = (customPrompt || inputVal).trim()
    if (!promptText) return

    setInputVal("")
    setShowCommands(false)

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
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
          action: promptText.startsWith("/") ? promptText.split(" ")[0] : ""
        })
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || "Failed to generate response")
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
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }

      const finalChats = nextChats.map((c) => {
        if (c.id === currentId) {
          return {
            ...c,
            messages: [...updatedHistory, finalAssistantMsg],
            updatedAt: new Date().toISOString()
          }
        }
        return c
      })
      saveChatsToStorage(finalChats)
      setCurrentResponse("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error establishing stream"
      showToast(msg, "error")

      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `⚠️ Error: ${msg}. Please ensure your API keys are valid.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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

  const pinnedChats = filteredChats.filter((c) => c.pinned)
  const recentChats = filteredChats.filter((c) => !c.pinned)

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

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden border border-border/55 rounded-2xl bg-card/10 shadow-sm relative">
        
        {/* PANEL 1: Collapsible History Sidebar (Left) */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 z-50 w-72 shrink-0 border-r border-border/60 bg-background/95 backdrop-blur-md transition-all duration-300 md:relative md:translate-x-0 md:bg-muted/10",
            leftSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header Area */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between gap-2 shrink-0">
              <Button
                onClick={() => handleNewChat()}
                variant="outline"
                className="flex-1 h-9 rounded-xl text-xs gap-1.5 border-border/70 hover:bg-muted/50 font-semibold"
              >
                <Plus className="size-3.5" /> New conversation
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden size-8 text-muted-foreground"
                onClick={() => setLeftSidebarOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Search Input */}
            <div className="px-4 py-2 relative shrink-0">
              <Search className="size-3.5 absolute left-7 top-4.5 text-muted-foreground/50" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-lg pl-8 text-xs border-border/60"
              />
            </div>

            {/* Tag Filters list */}
            <div className="px-4 py-1.5 flex flex-wrap gap-1 border-b border-border/40 shrink-0 pb-3">
              <Badge
                variant={activeTagFilter === null ? "default" : "outline"}
                className="cursor-pointer text-[9px] py-0 px-2 rounded-md font-semibold"
                onClick={() => setActiveTagFilter(null)}
              >
                All
              </Badge>
              {chatTags.map((t) => (
                <Badge
                  key={t}
                  variant={activeTagFilter === t ? "default" : "outline"}
                  className="cursor-pointer text-[9px] py-0 px-2 rounded-md font-semibold"
                  onClick={() => setActiveTagFilter(t)}
                >
                  #{t}
                </Badge>
              ))}
              <Badge
                variant={showArchived ? "secondary" : "outline"}
                className="cursor-pointer text-[9px] py-0 px-2 rounded-md font-semibold border-dashed ml-auto flex items-center gap-0.5"
                onClick={() => setShowArchived(!showArchived)}
              >
                <Archive className="size-2" /> Archived
              </Badge>
            </div>

            {/* Chats List */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
              {/* Pinned Section */}
              {pinnedChats.length > 0 && (
                <div className="space-y-1">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                    <Pin className="size-3" /> Pinned
                  </span>
                  {pinnedChats.map((c) => (
                    <div
                      key={c.id}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors",
                        c.id === activeChatId ? "bg-primary/10 text-foreground font-semibold" : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => {
                        setActiveChatId(c.id)
                        setLeftSidebarOpen(false)
                      }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <MessageSquare className="size-3.5 shrink-0 text-primary/75" />
                        {editingChatId === c.id ? (
                          <input
                            value={editTitleVal}
                            onChange={(e) => setEditTitleVal(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveRename(c.id)}
                            onBlur={() => handleSaveRename(c.id)}
                            className="bg-transparent border-b border-primary text-xs focus:outline-none w-full"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <span className="truncate">{c.title}</span>
                        )}
                      </div>

                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 shrink-0 ml-1">
                        <Button variant="ghost" size="icon" className="size-5 text-muted-foreground hover:text-foreground" onClick={(e) => handleTogglePin(c.id, e)}>
                          <Pin className="size-3 fill-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-5 text-muted-foreground hover:text-foreground" onClick={(e) => handleToggleFavorite(c.id, e)}>
                          <Star className={cn("size-3", c.favorite && "fill-amber-400 text-amber-400")} />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-5 text-muted-foreground hover:text-foreground" onClick={(e) => handleToggleArchive(c.id, e)}>
                          <Archive className="size-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-5 text-muted-foreground hover:text-foreground" onClick={(e) => handleStartRename(c, e)}>
                          <Edit2 className="size-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-5 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={(e) => handleDeleteChat(c.id, e)}>
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recents Section */}
              <div className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  {showArchived ? "Archived Logs" : "Recent Conversations"}
                </span>
                {recentChats.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors",
                      c.id === activeChatId ? "bg-primary/10 text-foreground font-semibold" : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => {
                      setActiveChatId(c.id)
                      setLeftSidebarOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <MessageSquare className="size-3.5 shrink-0 text-muted-foreground/75" />
                      {editingChatId === c.id ? (
                        <input
                          value={editTitleVal}
                          onChange={(e) => setEditTitleVal(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveRename(c.id)}
                          onBlur={() => handleSaveRename(c.id)}
                          className="bg-transparent border-b border-primary text-xs focus:outline-none w-full"
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <span className="truncate">{c.title}</span>
                      )}
                    </div>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 shrink-0 ml-1">
                      <Button variant="ghost" size="icon" className="size-5 text-muted-foreground hover:text-foreground" onClick={(e) => handleTogglePin(c.id, e)}>
                        <Pin className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-5 text-muted-foreground hover:text-foreground" onClick={(e) => handleToggleFavorite(c.id, e)}>
                        <Star className={cn("size-3", c.favorite && "fill-amber-400 text-amber-400")} />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-5 text-muted-foreground hover:text-foreground" onClick={(e) => handleToggleArchive(c.id, e)}>
                        <Archive className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-5 text-muted-foreground hover:text-foreground" onClick={(e) => handleStartRename(c, e)}>
                        <Edit2 className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-5 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={(e) => handleDeleteChat(c.id, e)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredChats.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground/60 italic">No conversations found</p>
                )}
              </div>
            </div>

            {/* Bottom link to Settings */}
            <div className="p-4 border-t border-border/50 bg-muted/5 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 font-semibold"><Brain className="size-3.5 text-primary" /> Memory Settings</span>
                <Link href="/dashboard/settings" className="text-primary hover:underline font-semibold flex items-center gap-0.5">
                  Configure <ChevronRight className="size-3" />
                </Link>
              </div>
              <p className="text-[10px] text-muted-foreground/85 leading-normal">
                AI remembers brand guidelines and content rules set inside Settings page tabs.
              </p>
            </div>
          </div>
        </div>

        {/* PANEL 2: Central Chat Canvas */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          
          {/* Header Panel */}
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between shrink-0 bg-background/50 backdrop-blur-md z-30">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden size-8 text-muted-foreground"
                onClick={() => setLeftSidebarOpen(true)}
              >
                <Menu className="size-4" />
              </Button>
              {activeChat && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground truncate max-w-[150px] sm:max-w-[280px]">
                    {activeChat.title}
                  </span>
                  {activeChat.pinned && <Pin className="size-3 text-primary" />}
                  {activeChat.favorite && <Star className="size-3 fill-amber-400 text-amber-400" />}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {activeChat && activeMessages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] text-muted-foreground hover:text-foreground gap-1.5"
                  onClick={() => exportChatData(activeChat)}
                >
                  <Download className="size-3.5" /> Export Logs
                </Button>
              )}
              {/* Toggle Right drawer */}
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 text-[11px] text-muted-foreground hover:text-foreground gap-1.5 border-border/60",
                  rightSidebarOpen && "bg-primary/10 text-primary border-primary/25"
                )}
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              >
                <Layers className="size-3.5" /> Workspace Insights
              </Button>
            </div>
          </div>

          {/* Conversation Main Screen */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
            
            {/* EMPTY STATE */}
            {activeMessages.length === 0 ? (
              <div className="max-w-2xl mx-auto h-full flex flex-col justify-center items-center text-center space-y-8 py-10">
                <div className="space-y-4">
                  <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary text-[10px] uppercase font-bold py-0.5 px-2.5 tracking-wider">
                    GrowWave AI Copilot active
                  </Badge>
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    {getGreeting()}
                  </h1>
                  
                  {/* Subtle status line */}
                  <p className="text-xs text-muted-foreground/80 flex items-center justify-center gap-2 font-medium">
                    <span>Connected to {channelsCount || 3} channels</span>
                    <span>•</span>
                    <span>{scheduledPostsCount || 8} scheduled posts</span>
                    <span>•</span>
                    <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                      <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                      Analytics synced
                    </span>
                  </p>
                </div>

                {/* Suggested AI action cards */}
                <div className="grid gap-3 sm:grid-cols-2 w-full pt-4">
                  {suggestedPrompts.map((q, idx) => (
                    <div
                      key={idx}
                      className="group flex flex-col text-left p-4 rounded-xl border border-border/55 bg-muted/10 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50 hover:bg-primary/[0.02]"
                      onClick={() => handleNewChat(q.prompt)}
                    >
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                        {q.text}
                        <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </span>
                      <span className="text-[10px] text-muted-foreground/65 mt-1 font-semibold uppercase tracking-wider">{q.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // MESSAGES FLOW
              <div className="max-w-3xl mx-auto space-y-6">
                {activeMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-4 p-4.5 rounded-2xl border text-sm leading-relaxed transition-all shadow-sm relative group/msg",
                      msg.role === "user"
                        ? "ml-auto bg-primary/10 border-primary/20 text-foreground max-w-[85%] rounded-br-none"
                        : "mr-auto bg-muted/40 border-border/55 text-foreground max-w-[92%] rounded-bl-none"
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

                    <div className="flex-1 overflow-hidden space-y-3">
                      <div className="flex items-center justify-between mb-1 text-[10px] text-muted-foreground/75 font-semibold">
                        <span className="uppercase tracking-wider">{msg.role === "user" ? "You" : "GrowWave Copilot"}</span>
                        <div className="flex items-center gap-1.5">
                          <span>{msg.timestamp}</span>
                          {msg.role === "assistant" && (
                            <button
                              className="opacity-0 group-hover/msg:opacity-100 hover:text-primary transition-all p-0.5"
                              onClick={() => handlePinInsight(msg.content)}
                              title="Pin Insight to workspace drawer"
                            >
                              <Bookmark className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2.5">
                        {renderMessageContent(msg.content)}
                      </div>

                      {/* Dynamic Context-Aware Action Cards */}
                      {msg.role === "assistant" && (
                        <div className="pt-3 border-t border-border/25 mt-4 flex flex-wrap gap-2 items-center justify-between">
                          <div className="flex flex-wrap gap-1.5">
                            {getContextualActions(msg.content).map((act, aIdx) => (
                              <Button
                                key={aIdx}
                                variant="outline"
                                size="xs"
                                className="h-6 px-2.5 text-[10.5px] rounded-lg gap-1 border-primary/20 hover:border-primary/40 text-primary hover:bg-primary/5 transition-all font-semibold"
                                onClick={() => handleAction(act.type, msg.content)}
                              >
                                <act.icon className="size-3" />
                                {act.label}
                              </Button>
                            ))}
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground font-semibold"
                              onClick={() => handleCopyText(msg.content)}
                            >
                              <Copy className="size-3" /> Copy
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* ROTATING THINKING / STREAM */}
                {streaming && (
                  <div className="mr-auto bg-muted/40 border border-border/55 text-foreground rounded-2xl rounded-bl-none p-4.5 max-w-[92%] flex gap-4 text-sm leading-relaxed shadow-sm w-full">
                    <div className="shrink-0 mt-0.5">
                      <div className="size-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                        <Loader2 className="size-3.5 animate-spin" />
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between mb-1 text-[10px] text-muted-foreground/75 font-semibold">
                        <span className="uppercase tracking-wider">GrowWave Copilot</span>
                        <span className="flex items-center gap-1 font-semibold text-primary">
                          <span className="size-1 rounded-full bg-primary inline-block animate-ping" />
                          {currentResponse ? "streaming..." : thinkingPhases[thinkingIndex]}
                        </span>
                      </div>
                      {currentResponse ? (
                        renderMessageContent(currentResponse)
                      ) : (
                        <p className="text-xs text-muted-foreground/70 italic py-1">Connecting to workspace database context...</p>
                      )}
                      <span className="inline-block size-2 bg-primary rounded-full animate-ping ml-1" />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Floating Actions Pills above textfield */}
          <div className="px-4 py-1.5 flex justify-center shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-3xl w-full no-scrollbar">
              {quickActions.map((pill, idx) => (
                <button
                  key={idx}
                  className="px-3 py-1 rounded-full border border-border/70 bg-card/75 hover:bg-muted/50 text-[10.5px] font-semibold text-muted-foreground hover:text-foreground shrink-0 transition-all hover:scale-102 hover:shadow-sm flex items-center gap-1.5"
                  onClick={() => {
                    if (activeChatId) {
                      setInputVal(pill.prompt)
                    } else {
                      handleNewChat(pill.prompt)
                    }
                  }}
                >
                  <Sparkle className="size-3 text-primary/75" />
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Inputs & Overlays */}
          <div className="p-4 border-t border-border/50 bg-background shrink-0 relative">
            <div className="max-w-3xl mx-auto relative">
              
              {/* Slash commands list */}
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

              {/* Textarea Container */}
              <div className="relative rounded-2xl border border-border bg-muted/5 focus-within:ring-1 focus-within:ring-primary/45 transition-all flex flex-col">
                <textarea
                  placeholder="Ask the Copilot: '/report today', '/calendar 30 days', 'Write a LinkedIn caption...' (Type '/' for commands)..."
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
                  className="min-h-16 max-h-32 resize-none bg-transparent border-0 rounded-2xl focus:outline-none focus:ring-0 text-xs px-3.5 py-3.5 shrink-0 text-foreground placeholder:text-muted-foreground/75"
                />

                <div className="flex items-center justify-between border-t border-border/40 px-3.5 py-2 bg-muted/10 rounded-b-2xl shrink-0">
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="ghost"
                      size="xs"
                      className={cn(
                        "h-6 text-[10px] px-2 gap-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground font-semibold",
                        showCommands && "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                      onClick={() => setShowCommands(!showCommands)}
                    >
                      <Terminal className="size-3" /> Commands
                    </Button>
                    
                    {/* Mock attachments clip */}
                    <button
                      className="size-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                      onClick={() => showToast("Attachment upload triggers. Select files option.", "info")}
                      title="Attach file / template image"
                    >
                      <Paperclip className="size-3.5" />
                    </button>

                    <Badge variant="outline" className="text-[9px] border-border/60 text-muted-foreground/75 font-normal bg-background/50 px-1.5 py-0.5 hidden sm:inline-block">
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
          </div>

        </div>

        {/* PANEL 3: Collapsible Workspace Insights Drawer (Right) */}
        {rightSidebarOpen && (
          <div className="w-72 shrink-0 border-l border-border/60 bg-background/95 backdrop-blur-md transition-all duration-300 md:bg-muted/10 h-full flex flex-col z-40">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                Workspace Insights
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground"
                onClick={() => setRightSidebarOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Connected channels status list */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block">Connected Channels</span>
                <div className="space-y-1.5">
                  {connectedChannels.map((ch, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/50 border border-border/40">
                      <span className="font-semibold text-foreground capitalize">{ch.platform}</span>
                      <span className="text-[10px] text-muted-foreground max-w-[120px] truncate">{ch.username}</span>
                    </div>
                  ))}
                  {connectedChannels.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic">No channels synced. Connected profiles will list here.</p>
                  )}
                </div>
              </div>

              {/* Saved Calendars list */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block">Saved Calendars</span>
                <div className="space-y-1.5">
                  {savedCalendars.map((cName, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/50 border border-border/40">
                      <span className="truncate flex-1 pr-2">{cName}</span>
                      <Button variant="ghost" size="icon" className="size-5 hover:bg-muted" onClick={() => router.push("/dashboard/calendar")}>
                        <ExternalLink className="size-3" />
                      </Button>
                    </div>
                  ))}
                  {savedCalendars.length === 0 && (
                    <p className="text-[11px] text-muted-foreground/60 italic">No calendars saved. Prompt `/calendar` to generate schedules.</p>
                  )}
                </div>
              </div>

              {/* Recent Reports list */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block">Recent Reports</span>
                <div className="space-y-1.5">
                  {recentReports.map((rName, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/50 border border-border/40">
                      <span className="truncate flex-1 pr-2">{rName}</span>
                      <Button variant="ghost" size="icon" className="size-5 hover:bg-muted" onClick={() => handleAction("export_md", `## ${rName}\nExecutive Summary and KPI indicators.`)}>
                        <Download className="size-3" />
                      </Button>
                    </div>
                  ))}
                  {recentReports.length === 0 && (
                    <p className="text-[11px] text-muted-foreground/60 italic">No reports listed. Prompt `/report` to generate executive sheets.</p>
                  )}
                </div>
              </div>

              {/* Pinned Insights board */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block">Pinned Insights</span>
                <div className="space-y-1.5">
                  {pinnedInsights.map((ins, idx) => (
                    <div key={idx} className="relative group/ins p-2.5 rounded-lg bg-primary/5 border border-primary/15 text-[11px] leading-relaxed text-foreground/80 flex flex-col gap-1.5">
                      <p>{ins}</p>
                      <button
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover/ins:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        onClick={() => {
                          const updated = pinnedInsights.filter((_, i) => i !== idx)
                          setPinnedInsights(updated)
                          localStorage.setItem("growwave-pinned-insights", JSON.stringify(updated))
                        }}
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  {pinnedInsights.length === 0 && (
                    <p className="text-[11px] text-muted-foreground/60 italic">Pin tips from Copilot responses to keep them visible here.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </PageTransition>
  )
}
