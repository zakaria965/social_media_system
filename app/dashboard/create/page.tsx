"use client"

import { useCallback, useEffect, useRef, useState, Suspense } from "react"
import {
  Calendar,
  Globe,
  Image as ImageIcon,
  Loader2,
  Smile,
  X,
  Clock,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Plus,
  Monitor,
  Eye,
  CheckCircle2,
  FileCheck,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PageTransition } from "@/components/dashboard/page-transition"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/toast-provider"
import { useWorkspace } from "@/components/dashboard/workspace-provider"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

const platformMeta = [
  { id: "facebook", label: "Facebook", color: "bg-blue-600", border: "border-blue-600/30", text: "text-blue-600" },
  { id: "instagram", label: "Instagram", color: "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600", border: "border-pink-500/30", text: "text-pink-500" },
  { id: "linkedin", label: "LinkedIn", color: "bg-blue-700", border: "border-blue-700/30", text: "text-blue-700" },
  { id: "twitter", label: "Twitter / X", color: "bg-zinc-950", border: "border-zinc-950/30", text: "text-foreground" },
  { id: "tiktok", label: "TikTok", color: "bg-rose-500", border: "border-rose-500/30", text: "text-rose-500" },
]

const emojisList = ["🔥", "🚀", "✨", "🙌", "💡", "🎉", "📈", "❤️", "👍", "💻", "👀", "📣", "📅", "🌟", "🤩", "💯"]

const ALLOWED_TYPES = ["image/png", "image/jpg", "image/jpeg", "image/webp", "video/mp4", "video/webm", "video/quicktime"]
const MAX_SIZE = 50 * 1024 * 1024 // 50MB max

interface ConnectedAccount {
  _id: string
  platform: string
  username: string
  avatar?: string
  status: string
  tokenExpiresAt?: string
  platformAccountId?: string
}

function CreatePostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const { role: userRole, permissions: userPermissions } = useWorkspace()

  const { showToast } = useToast()
  const [caption, setCaption] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [saving, setSaving] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const [mediaNames, setMediaNames] = useState<string[]>([])
  const [mediaTypes, setMediaTypes] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [previewPlatform, setPreviewPlatform] = useState("facebook")

  const fetchSuggestions = useCallback(async () => {
    if (selectedPlatforms.length === 0) return
    setLoadingSuggestions(true)
    try {
      const fetched: any[] = []
      for (const platform of selectedPlatforms) {
        const res = await fetch(`/api/generate/best-time?platform=${platform}`)
        if (res.ok) {
          const data = await res.json()
          fetched.push(data)
        }
      }
      setAiSuggestions(fetched)
    } catch {
      // ignore
    } finally {
      setLoadingSuggestions(false)
    }
  }, [selectedPlatforms])

  useEffect(() => {
    if (scheduleOpen) {
      fetchSuggestions()
    }
  }, [scheduleOpen, fetchSuggestions])

  const applySuggestion = (suggestion: any) => {
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const targetDayIndex = daysOfWeek.indexOf(suggestion.bestDay.toLowerCase())
    if (targetDayIndex === -1) return

    const now = new Date()
    const resultDate = new Date()
    const currentDayIndex = now.getDay()

    let distance = targetDayIndex - currentDayIndex
    if (distance <= 0) {
      distance += 7 // next week's matching day
    }
    resultDate.setDate(now.getDate() + distance)

    // Set date input value: YYYY-MM-DD
    setScheduleDate(resultDate.toISOString().split("T")[0])

    // Convert 12-hour format "07:00 PM" to 24-hour format "19:00"
    const [time, modifier] = suggestion.bestHour.split(" ")
    let [hoursStr, minutes] = time.split(":")
    let hours = parseInt(hoursStr, 10)
    if (hours === 12) {
      hours = 0
    }
    if (modifier === "PM") {
      hours = hours + 12
    }
    setScheduleTime(`${String(hours).padStart(2, "0")}:${minutes}`)
    showToast(`Applied ${suggestion.platform.toUpperCase()} AI recommended slot!`, "success")
  }

  // Emoji Popover
  const [emojiOpen, setEmojiOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // AI Assistant Modal
  const [aiOpen, setAiOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState("")
  const [aiAction, setAiAction] = useState("generate-caption")
  const [aiTone, setAiTone] = useState("creative")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch connected accounts to check connections
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts")
      const data = await res.json()
      if (res.ok) {
        const accs = data.accounts || []
        setConnectedAccounts(accs)
        if (accs.length > 0) {
          setPreviewPlatform(accs[0].platform)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Fetch editing post details if ?edit is present
  const fetchEditPost = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/posts?id=${id}`)
      const data = await res.json()
      if (res.ok && data.post) {
        const post = data.post
        setCaption(post.content || "")
        setSelectedPlatforms(post.platforms || [])
        setMediaFiles(post.media || [])
        setMediaNames(post.media ? post.media.map((_: string, i: number) => `Asset ${i + 1}`) : [])
        setMediaTypes(post.media ? post.media.map((url: string) => url.startsWith("data:video/") ? "video" : "image") : [])
        if (post.scheduledAt) {
          const dateObj = new Date(post.scheduledAt)
          setScheduleDate(dateObj.toISOString().split("T")[0])
          setScheduleTime(dateObj.toTimeString().split(" ")[0].slice(0, 5))
        }
        showToast("Draft loaded for editing", "info")
      }
    } catch {
      showToast("Failed to load post details for editing", "error")
    }
  }, [showToast])

  useEffect(() => {
    fetchAccounts()
    if (editId) {
      fetchEditPost(editId)
    }
  }, [editId, fetchAccounts, fetchEditPost])

  const isConnected = (platformId: string) => {
    return connectedAccounts.some((acc) => acc.platform === platformId)
  }

  const getAccountInfo = (platformId: string) => {
    return connectedAccounts.find((acc) => acc.platform === platformId)
  }

  const togglePlatform = (id: string) => {
    if (!isConnected(id)) {
      showToast(`Please connect a ${id} page in Social Accounts settings first.`, "error")
      return
    }
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleMediaSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newUrls: string[] = []
    const newNames: string[] = []
    const newTypes: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast(`${file.name}: Only PNG, JPG, JPEG, WEBP, and MP4, WEBM, MOV are allowed`, "error")
        continue
      }
      if (file.size > MAX_SIZE) {
        showToast(`${file.name}: File must be under 50MB`, "error")
        continue
      }

      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (res.ok) {
          newUrls.push(data.url)
          newNames.push(data.name)
          newTypes.push(data.type)
        } else {
          showToast(data.error || "Upload failed", "error")
        }
      } catch {
        showToast("Upload failed", "error")
      }
    }

    if (newUrls.length > 0) {
      setMediaFiles((prev) => [...prev, ...newUrls])
      setMediaNames((prev) => [...prev, ...newNames])
      setMediaTypes((prev) => [...prev, ...newTypes])
    }
  }, [showToast])

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
    setMediaNames((prev) => prev.filter((_, i) => i !== index))
    setMediaTypes((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleMediaSelect(e.dataTransfer.files)
  }, [handleMediaSelect])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  // Inject emoji
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const nextCaption = caption.substring(0, start) + emoji + caption.substring(end)

    setCaption(nextCaption)
    setEmojiOpen(false)

    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 50)
  }

  // Trigger AI assistant API
  const handleAIGenerate = async () => {
    if (!aiTopic) {
      showToast("Please enter a topic or text prompt", "error")
      return
    }
    setAiLoading(true)
    setAiResult("")

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: aiAction,
          prompt: aiTopic,
          tone: aiTone,
          provider: "openai",
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setAiResult(data.result || "")
      } else {
        showToast(data.error || "Generation failed", "error")
      }
    } catch {
      showToast("Generation failed", "error")
    } finally {
      setAiLoading(false)
    }
  }

  const insertAIResult = () => {
    if (aiResult) {
      setCaption((prev) => (prev ? prev + "\n" + aiResult : aiResult))
      setAiOpen(false)
      setAiTopic("")
      setAiResult("")
      showToast("AI text appended successfully!", "success")
    }
  }

  const savePost = async (
    status: string,
    scheduledAt?: string
  ) => {
    setSaving(true)
    try {
      const payload = {
        title: caption.slice(0, 60),
        content: caption,
        platforms: selectedPlatforms,
        media: mediaFiles,
        status,
        scheduledAt: scheduledAt || null,
        type: mediaFiles.length > 0 ? (mediaTypes[0] === "video" ? "video" : "image") : "text",
      }

      let res
      if (editId) {
        // PATCH update
        res = await fetch("/api/posts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        })
      } else {
        // POST create
        res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")
      return data.post
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save post"
      showToast(message, "error")
      return null
    } finally {
      setSaving(false)
    }
  }

  const validateChannels = () => {
    for (const platformId of selectedPlatforms) {
      const acc = connectedAccounts.find((a) => a.platform === platformId)
      if (!acc) {
        showToast(`Account for ${platformId} is not connected. Connect it first under Channels.`, "error")
        return false
      }
      if (acc.status === "expired") {
        showToast(`Connection token for ${platformId} has expired. Please reconnect it under Channels.`, "error")
        return false
      }
      if (acc.status === "error" || acc.status === "permission_error") {
        showToast(`Permission error detected for ${platformId}. Please reconnect it under Channels.`, "error")
        return false
      }
      if (acc.status === "sync_error") {
        showToast(`Synchronization error for ${platformId}. Sync or reconnect it under Channels.`, "error")
        return false
      }
    }
    return true
  }

  const handlePublishNow = async () => {
    if (!caption || selectedPlatforms.length === 0) {
      showToast("Add content and select at least one platform", "error")
      return
    }
    if (!validateChannels()) return

    const isOwnerOrAdmin = ["owner", "admin"].includes(userRole || "")

    setSaving(true)
    try {
      if (!isOwnerOrAdmin) {
        // Save as draft and request review
        const post = await savePost("draft")
        if (post) {
          await fetch(`/api/posts/${post._id}/approve`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: "Requesting publishing approval." }),
          })
          showToast("Publishing review request successfully submitted to Admins!", "success")
          router.push("/dashboard/scheduled")
        }
        return
      }

      const post = await savePost("publishing")
      if (!post) return

      const publishRes = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post._id,
          content: caption,
          platforms: selectedPlatforms,
          media: mediaFiles,
        }),
      })

      const publishData = await publishRes.json()
      if (!publishRes.ok) throw new Error(publishData.error || "Publish failed")

      const results = publishData.results
      const values = Object.values(results) as { success: boolean; error?: string }[]
      const successCount = values.filter((r) => r.success).length
      const failCount = values.filter((r) => !r.success).length

      if (failCount > 0) {
        const errorDetails = Object.entries(results)
          .filter(([_, r]: any) => !r.success)
          .map(([p, r]: any) => {
            let errMsg = r.error || "Unknown error"
            try {
              if (errMsg.includes("failed: {")) {
                const rawJson = errMsg.substring(errMsg.indexOf("{"))
                const parsed = JSON.parse(rawJson)
                if (parsed.error && parsed.error.message) {
                  errMsg = `${parsed.error.message} (Code: ${parsed.error.code}, Subcode: ${parsed.error.error_subcode || "none"})`
                }
              }
            } catch {}
            return `${p.toUpperCase()}: ${errMsg}`
          })
          .join(" | ")

        showToast(`Publishing failed: ${errorDetails}`, "error")
      } else {
        showToast("Published successfully on all channels!", "success")
        router.push("/dashboard/scheduled")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Publish failed"
      showToast(message, "error")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!caption) {
      showToast("Add content before saving draft", "error")
      return
    }
    const post = await savePost("draft")
    if (post) {
      showToast(editId ? "Draft updated!" : "Draft saved successfully!", "success")
      router.push("/dashboard/scheduled")
    }
  }

  const handleSchedule = async () => {
    if (!caption || selectedPlatforms.length === 0) {
      showToast("Add content and select at least one platform", "error")
      return
    }
    if (!validateChannels()) return
    if (!scheduleDate || !scheduleTime) {
      showToast("Select publishing date and time", "error")
      return
    }
    const scheduledAt = `${scheduleDate}T${scheduleTime}:00`
    const isOwnerOrAdmin = ["owner", "admin"].includes(userRole || "")

    setSaving(true)
    try {
      if (!isOwnerOrAdmin) {
        // Save as draft and request review
        const post = await savePost("draft", scheduledAt)
        if (post) {
          await fetch(`/api/posts/${post._id}/approve`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: `Requesting scheduling review for ${scheduleDate} at ${scheduleTime}.` }),
          })
          showToast("Scheduling review request successfully submitted to Admins!", "success")
          router.push("/dashboard/scheduled")
        }
        return
      }

      const post = await savePost("scheduled", scheduledAt)
      if (post) {
        showToast(editId ? "Post rescheduled!" : "Post scheduled successfully!", "success")
        router.push("/dashboard/scheduled")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Schedule failed"
      showToast(message, "error")
    } finally {
      setSaving(false)
    }
  }

  const openScheduleDialog = () => {
    if (!caption || selectedPlatforms.length === 0) {
      showToast("Add content and select at least one platform", "error")
      return
    }
    if (!validateChannels()) return
    setScheduleOpen(true)
  }

  // Active validation warnings
  const isXLimitExceeded = selectedPlatforms.includes("twitter") && caption.length > 280
  const isTikTokVideoMissing = selectedPlatforms.includes("tiktok") && !mediaTypes.includes("video")
  const isInstagramMediaMissing = selectedPlatforms.includes("instagram") && mediaFiles.length === 0

  const hasWarnings = isXLimitExceeded || isTikTokVideoMissing || isInstagramMediaMissing

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {editId ? "Edit Post Draft" : "Create Post"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Craft beautiful social media posts, consult AI content engines, and schedule publishing.
          </p>
        </div>
        {editId && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 py-1 px-2.5 flex items-center gap-1.5 shrink-0 animate-pulse">
            <FileCheck className="size-4" /> Editing Mode
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5 items-start">
        {/* Post Form */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="rounded-xl border-border/60 shadow-sm bg-card/95 backdrop-blur-xl">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Compose Post</span>
                <Button
                  variant="outline"
                  size="xs"
                  className="rounded-lg text-xs font-semibold text-primary hover:bg-primary/5 flex items-center gap-1.5 border-primary/20"
                  onClick={() => setAiOpen(true)}
                >
                  <Sparkles className="size-3.5" /> AI Assistant
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">CAPTION / CONTENT</Label>
                <div className="relative border border-border/60 rounded-xl bg-muted/20 overflow-hidden focus-within:border-primary/50 transition-colors">
                  <Textarea
                    ref={textareaRef}
                    placeholder="What's on your mind? Introduce your campaign, drop ideas..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="min-h-36 resize-y border-0 bg-transparent rounded-none focus-visible:ring-0 p-3 text-sm leading-relaxed"
                  />
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-t border-border/30 text-xs">
                    <div className="flex items-center gap-1.5 relative">
                      <button
                        type="button"
                        onClick={() => setEmojiOpen(!emojiOpen)}
                        className={cn("p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0", emojiOpen && "bg-muted text-foreground")}
                      >
                        <Smile className="size-4.5" />
                      </button>
                      {emojiOpen && (
                        <Card className="absolute bottom-10 left-0 p-2.5 z-50 grid grid-cols-4 gap-1.5 border-border/60 rounded-xl shadow-lg bg-card w-44 animate-in slide-in-from-bottom-2 duration-150">
                          {emojisList.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="text-lg hover:bg-muted p-1 rounded transition-colors text-center"
                            >
                              {emoji}
                            </button>
                          ))}
                        </Card>
                      )}
                    </div>
                    <span className={cn("font-medium text-[11px] px-2 py-0.5 rounded-lg", isXLimitExceeded ? "bg-rose-50 text-rose-600 font-bold" : "text-muted-foreground bg-muted/80")}>
                      {caption.length} characters
                    </span>
                  </div>
                </div>
              </div>

              {/* Media Section */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">ATTACH MEDIA FILES</Label>
                <div
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 transition-all cursor-pointer",
                    dragOver
                      ? "border-primary bg-primary/[0.03] scale-[0.99]"
                      : "border-border/60 hover:border-primary/50 bg-muted/[0.02]"
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleMediaSelect(e.target.files)}
                  />
                  <ImageIcon className="size-8 text-muted-foreground opacity-60" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Drag & drop images/videos here or click to browse
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PNG, JPG, WEBP and MP4, WEBM, MOV up to 50MB
                    </p>
                  </div>
                </div>

                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 pt-2">
                    {mediaFiles.map((url, i) => (
                      <div key={i} className="group relative overflow-hidden rounded-xl border border-border/60 aspect-square bg-muted/20 flex flex-col justify-between">
                        <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
                          {mediaTypes[i] === "video" ? (
                            <video
                              src={url}
                              className="h-full w-full object-cover"
                              muted
                              preload="metadata"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt={mediaNames[i]}
                              className="h-full w-full object-cover"
                            />
                          )}
                          {mediaTypes[i] === "video" && (
                            <Video className="absolute size-6 text-white bg-black/40 p-1.5 rounded-full" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMedia(i)}
                          className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-destructive opacity-0 transition-opacity group-hover:opacity-100 shadow-sm"
                        >
                          <X className="size-3" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 p-1.5">
                          <p className="truncate text-[9px] font-medium text-white">{mediaNames[i]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validation Warnings Card */}
          {hasWarnings && (
            <Card className="rounded-xl border-rose-500/20 bg-rose-500/[0.02] shadow-sm overflow-hidden p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs">
                <AlertTriangle className="size-4 shrink-0" /> VALIDATION ALERT
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-rose-700">
                {isXLimitExceeded && (
                  <li><strong>X / Twitter:</strong> Content exceeds the 280-character post limit ({caption.length}/280).</li>
                )}
                {isTikTokVideoMissing && (
                  <li><strong>TikTok:</strong> Video is required to publish on TikTok. Image files or text-only are unsupported.</li>
                )}
                {isInstagramMediaMissing && (
                  <li><strong>Instagram:</strong> At least one image or video attachment is required to publish.</li>
                )}
              </ul>
            </Card>
          )}
        </div>

        {/* Side Panel: Platform Selector & Actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Platforms Selector */}
          <Card className="rounded-xl border-border/60 shadow-sm bg-card/95 backdrop-blur-xl">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Publishing Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-4">
              {connectedAccounts.length === 0 ? (
                <div className="text-center py-6 px-4 space-y-3">
                  <AlertCircle className="size-8 text-muted-foreground mx-auto opacity-75" />
                  <p className="text-xs font-semibold text-foreground">No channels connected yet</p>
                  <p className="text-[10px] text-muted-foreground">Connect a Facebook Page, Instagram Business, LinkedIn, X, or TikTok account to start publishing.</p>
                  <Button size="xs" className="w-full rounded-lg text-[10px] mt-1" onClick={() => router.push("/dashboard/channels")}>
                    <Plus className="size-3 mr-1" /> Connect Channels
                  </Button>
                </div>
              ) : (
                platformMeta
                  .filter((p) => isConnected(p.id))
                  .map((p) => {
                    const active = selectedPlatforms.includes(p.id)
                    const accInfo = getAccountInfo(p.id)

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={cn(
                          "flex w-full items-center gap-3.5 rounded-xl border p-3 text-left transition-all hover:bg-muted/10 relative",
                          active
                            ? cn("bg-primary/[0.02] shadow-sm", p.border)
                            : "border-border/60"
                        )}
                      >
                        <div className={cn("flex size-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm shrink-0", p.color)}>
                          {p.id[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">{p.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {accInfo?.username || "connected"}
                          </p>
                        </div>
                        {active ? (
                          <Badge variant="default" className="text-[9px] py-0 px-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] py-0 px-2 border-border/60 text-muted-foreground">Select</Badge>
                        )}
                      </button>
                    )
                  })
              )}
            </CardContent>
          </Card>

          {/* Social Previews Panel */}
          <Card className="rounded-xl border-border/60 shadow-sm bg-card/95 backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/40 bg-muted/10 flex flex-row items-center justify-between px-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Eye className="size-4 text-primary" /> Live Social Previews
              </CardTitle>
            </CardHeader>
            <div className="bg-muted/30 border-b border-border/30 px-3 py-1.5 flex gap-1.5 overflow-x-auto scrollbar-none">
              {platformMeta
                .filter((p) => isConnected(p.id))
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreviewPlatform(p.id)}
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors capitalize whitespace-nowrap",
                      previewPlatform === p.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
            </div>

            <div className="p-4 bg-muted/10 border-b border-border/20 min-h-[180px] flex items-center justify-center">
              {/* FACEBOOK PREVIEW */}
              {previewPlatform === "facebook" && (
                <div className="border border-border/40 rounded-xl bg-card shadow-sm p-4 w-full max-w-sm space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      F
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">GrowWave Sandbox Page</h4>
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1">Just now · <Globe className="size-2.5" /></p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{caption || "Your Facebook post caption goes here..."}</p>
                  {mediaFiles.length > 0 && (
                    <div className="overflow-hidden rounded-lg border border-border/40 aspect-video bg-muted relative flex items-center justify-center">
                      {mediaTypes[0] === "video" ? (
                        <video src={mediaFiles[0]} className="w-full h-full object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaFiles[0]} alt="FB Preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border/30 pt-2 text-[10px] text-muted-foreground font-semibold px-2">
                    <span>👍 Like</span>
                    <span>💬 Comment</span>
                    <span>🔗 Share</span>
                  </div>
                </div>
              )}

              {/* TWITTER PREVIEW */}
              {previewPlatform === "twitter" && (
                <div className="border border-border/40 rounded-xl bg-zinc-950 text-white shadow-sm p-4 w-full max-w-sm space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-white text-zinc-950 flex items-center justify-center font-bold text-sm shrink-0">
                      X
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100">GrowWave Brand</h4>
                      <p className="text-[9px] text-zinc-400">@growwave_twitter</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">{caption || "Your tweet content goes here..."}</p>
                  {mediaFiles.length > 0 && (
                    <div className="overflow-hidden rounded-lg border border-zinc-800 aspect-video bg-zinc-900 relative flex items-center justify-center">
                      {mediaTypes[0] === "video" ? (
                        <video src={mediaFiles[0]} className="w-full h-full object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaFiles[0]} alt="X Preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="flex justify-between border-t border-zinc-800 pt-2 text-[10px] text-zinc-400 px-2 font-medium">
                    <span>💬 0</span>
                    <span>🔁 0</span>
                    <span>❤️ 0</span>
                    <span>📊 0</span>
                  </div>
                </div>
              )}

              {/* LINKEDIN PREVIEW */}
              {previewPlatform === "linkedin" && (
                <div className="border border-border/40 rounded-xl bg-card shadow-sm p-4 w-full max-w-sm space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      L
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">GrowWave Workspace</h4>
                      <p className="text-[9px] text-muted-foreground">1st · Social Media Strategy</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{caption || "Your LinkedIn update content goes here..."}</p>
                  {mediaFiles.length > 0 && (
                    <div className="overflow-hidden rounded-lg border border-border/40 aspect-video bg-muted relative flex items-center justify-center">
                      {mediaTypes[0] === "video" ? (
                        <video src={mediaFiles[0]} className="w-full h-full object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaFiles[0]} alt="LinkedIn Preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border/30 pt-2 text-[10px] text-muted-foreground font-semibold px-2">
                    <span>👍 Like</span>
                    <span>💬 Comment</span>
                    <span>🔁 Repost</span>
                    <span>📤 Send</span>
                  </div>
                </div>
              )}

              {/* TIKTOK PREVIEW */}
              {previewPlatform === "tiktok" && (
                <div className="border border-border/60 rounded-2xl bg-zinc-950 text-white shadow-lg overflow-hidden h-[360px] w-[200px] relative text-left select-none">
                  {mediaFiles.length > 0 && mediaTypes[0] === "video" ? (
                    <video src={mediaFiles[0]} className="absolute inset-0 w-full h-full object-cover brightness-[0.8]" muted loop autoPlay />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-950 flex flex-col items-center justify-center gap-2 text-center p-3 text-zinc-500">
                      <Video className="size-6 text-zinc-600" />
                      <span className="text-[9px] font-medium leading-relaxed">Video asset needed for live mobile render preview</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 space-y-1 z-10 text-white">
                    <p className="text-[10px] font-bold">@growwave_tiktok</p>
                    <p className="text-[8px] line-clamp-2 text-zinc-300 leading-normal">{caption || "TikTok caption text goes here..."}</p>
                    <p className="text-[7px] text-zinc-400 font-medium">🎵 original sound - GrowWave</p>
                  </div>
                </div>
              )}

              {/* INSTAGRAM PREVIEW */}
              {previewPlatform === "instagram" && (
                <div className="border border-border/40 rounded-xl bg-card shadow-sm w-full max-w-sm overflow-hidden text-left">
                  <div className="flex items-center gap-3 p-3 border-b border-border/30">
                    <div className="size-8 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      I
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-foreground">growwave_brand</h4>
                      <p className="text-[8px] text-muted-foreground">Original Audio</p>
                    </div>
                  </div>
                  {mediaFiles.length > 0 ? (
                    <div className="aspect-square w-full bg-muted overflow-hidden flex items-center justify-center relative">
                      {mediaTypes[0] === "video" ? (
                        <video src={mediaFiles[0]} className="w-full h-full object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaFiles[0]} alt="Instagram Preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square w-full bg-muted flex items-center justify-center text-muted-foreground text-xs p-4 text-center">
                      At least one image or video attachment is required for Instagram layout preview.
                    </div>
                  )}
                  <div className="p-3 space-y-1.5">
                    <div className="flex gap-3 text-sm text-foreground">
                      <span>❤️</span>
                      <span>💬</span>
                      <span>📤</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-foreground">
                      <span className="font-bold mr-1">growwave_brand</span>
                      {caption || "Your Instagram caption goes here..."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Action triggers */}
          <Card className="rounded-xl border-border/60 shadow-sm bg-card/95 backdrop-blur-xl">
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Publishing Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <Button
                className="w-full rounded-xl flex items-center justify-center gap-1.5 text-xs py-5"
                onClick={openScheduleDialog}
                disabled={saving || !caption || selectedPlatforms.length === 0 || hasWarnings}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : ["owner", "admin"].includes(userRole || "") ? (
                  <><Calendar className="size-4" /> Schedule Post</>
                ) : (
                  <><Calendar className="size-4" /> Request Scheduling Approval</>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl flex items-center justify-center gap-1.5 text-xs py-5 border-border/60 hover:bg-muted"
                onClick={handlePublishNow}
                disabled={saving || !caption || selectedPlatforms.length === 0 || hasWarnings}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : ["owner", "admin"].includes(userRole || "") ? (
                  <><Globe className="size-4" /> Publish Now</>
                ) : (
                  <><Globe className="size-4" /> Request Publishing Approval</>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full rounded-xl text-xs py-5 text-muted-foreground hover:bg-muted/30"
                onClick={handleSaveDraft}
                disabled={saving || !caption}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  editId ? "Update Draft" : "Save as Draft"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Assistant Modal Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-5 border-border/60 shadow-xl bg-card">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="flex items-center gap-2 text-md font-bold">
              <Sparkles className="size-5 text-primary" /> AI Content Copilot
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Consult OpenAI to generate high-performing captions, rewrite posts, alter tones, or extract hashtags.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">PROMPT / TOPIC / EXPLAIN IDEA</Label>
              <Textarea
                placeholder="E.g. A product launch announcement for our new AI assistant called Wavey..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="min-h-20 rounded-xl border-border/60 bg-muted/20 text-sm leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">ACTION</Label>
                <select
                  value={aiAction}
                  onChange={(e) => setAiAction(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs font-medium text-foreground outline-none cursor-pointer h-9"
                >
                  <option value="generate-caption">Generate Caption</option>
                  <option value="rewrite-text">Rewrite Copy</option>
                  <option value="change-tone">Change Tone</option>
                  <option value="generate-hashtags">Generate Hashtags</option>
                  <option value="improve-grammar">Fix Grammar</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">TONE</Label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs font-medium text-foreground outline-none cursor-pointer h-9"
                >
                  <option value="creative">Creative ✨</option>
                  <option value="professional">Professional 💼</option>
                  <option value="casual">Casual ☕</option>
                  <option value="funny">Funny 😄</option>
                  <option value="exciting">Exciting 🔥</option>
                </select>
              </div>
            </div>

            {aiResult && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                <Label className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="size-4" /> AI RECOMMENDED COPY</Label>
                <div className="p-3.5 bg-emerald-500/[0.03] border border-emerald-500/25 rounded-xl text-sm leading-relaxed whitespace-pre-wrap text-foreground max-h-40 overflow-y-auto">
                  {aiResult}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border/40 pt-4 flex gap-2">
            <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setAiOpen(false)}>
              Cancel
            </Button>
            {aiResult ? (
              <Button size="sm" className="rounded-lg text-xs" onClick={insertAIResult}>
                Append to Caption
              </Button>
            ) : (
              <Button size="sm" className="rounded-lg text-xs" onClick={handleAIGenerate} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="size-4 animate-spin" /> : "Generate Content"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date & Time Scheduling Picker Modal */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5 border-border/60 shadow-xl bg-card">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="flex items-center gap-1.5 text-sm font-bold"><Clock className="size-4.5" /> Schedule Queue</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Specify the date and time this post should automatically publish across your selected active channels.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* AI Best Time Suggestions */}
            {loadingSuggestions ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border/40">
                <Loader2 className="size-3.5 animate-spin text-primary" /> Consulting GrowWave Audience AI...
              </div>
            ) : aiSuggestions.length > 0 ? (
              <div className="space-y-2 bg-primary/[0.02] border border-primary/10 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary tracking-wider uppercase">
                  <Sparkles className="size-3.5 animate-pulse" /> AI Best Time Suggestions
                </div>
                <div className="flex flex-col gap-2">
                  {aiSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="flex flex-col text-left p-2.5 border border-border/50 rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-all group bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-foreground capitalize flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-primary" />
                          {s.platform}
                        </span>
                        <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md group-hover:bg-primary group-hover:text-white transition-colors">
                          Apply Suggested
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-foreground mt-1">
                        {s.bestDay} at {s.bestHour} ({s.bestTimeWindow})
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">
                        {s.explanation}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">PUBLISHING DATE</Label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">PUBLISHING TIME</Label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none"
              />
            </div>
          </div>
          <DialogFooter className="border-t border-border/40 pt-4 flex gap-2">
            <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="rounded-lg text-xs" onClick={handleSchedule} disabled={saving || !scheduleDate || !scheduleTime}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Add to Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <CreatePostContent />
    </Suspense>
  )
}

