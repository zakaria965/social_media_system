"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Clock,
  Copy,
  Edit3,
  MoreHorizontal,
  Trash2,
  Globe,
  Image,
  Video,
  FileText,
  Loader2,
  Search,
  Filter,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Play,
  XCircle,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { PageTransition } from "@/components/dashboard/page-transition"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/toast-provider"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface PostData {
  _id: string
  title: string
  content: string
  platforms: string[]
  status: string
  type: string
  scheduledAt: string | null
  createdAt: string
  media: string[]
  hashtags: string[]
  engagement?: { likes: number; comments: number; shares: number }
  errorMessage?: string
  facebookPostId?: string | null
  facebookUrl?: string | null
  facebookPageName?: string | null
  facebookPublishedTime?: string | null
  retryCount: number
  lastAttempt?: string | null
  executionLogs?: any[]
  jobsCount?: number
  jobsStatus?: any[]
}

const platformColors: Record<string, string> = {
  instagram: "bg-pink-500",
  linkedin: "bg-blue-700",
  tiktok: "bg-foreground",
  facebook: "bg-blue-500",
  twitter: "bg-sky-500",
}

const platformLabels: Record<string, string> = {
  facebook: "Facebook",
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  tiktok: "TikTok",
  instagram: "Instagram",
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  image: Image,
  video: Video,
  text: FileText,
  carousel: Image,
}

const statusStyles: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  draft: "bg-muted text-muted-foreground border-border/60",
  published: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  publishing: "bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse",
  cancelled: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
}

export default function ScheduledPostsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { showToast } = useToast()
  const [tab, setTab] = useState("all")
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [reschedulePostId, setReschedulePostId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [performingAction, setPerformingAction] = useState<string | null>(null)
  const tabRef = useRef(tab)
  const initRef = useRef(false)

  const getCountdown = (scheduledAtStr: string | null) => {
    if (!scheduledAtStr) return null
    const diff = new Date(scheduledAtStr).getTime() - new Date().getTime()
    if (diff <= 0) return "Publishing now..."

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `Publishing in ${days} day${days > 1 ? "s" : ""}`
    }
    if (hours > 0) {
      return `Publishing in ${hours} hour${hours > 1 ? "s" : ""}`
    }
    return `Publishing in ${minutes} minute${minutes > 1 ? "s" : ""}`
  }

  const handleCancelSchedule = async (postId: string) => {
    setPerformingAction(postId)
    try {
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId, status: "cancelled" }),
      })
      if (res.ok) {
        showToast("Publishing schedule cancelled successfully", "success")
        fetchPosts()
      } else {
        showToast("Failed to cancel schedule", "error")
      }
    } catch {
      showToast("Failed to cancel schedule", "error")
    } finally {
      setPerformingAction(null)
    }
  }

  const handlePublishImmediately = async (post: any) => {
    setPerformingAction(post._id)
    try {
      // Set to publishing status first
      await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post._id, status: "publishing" }),
      })

      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post._id,
          content: post.content,
          platforms: post.platforms,
          media: post.media,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        showToast("Post published successfully immediately!", "success")
        fetchPosts()
      } else {
        showToast(`Failed to publish: ${data.error || "Unknown error"}`, "error")
        fetchPosts()
      }
    } catch {
      showToast("Failed to publish post", "error")
    } finally {
      setPerformingAction(null)
    }
  }

  const handleRescheduleSubmit = async () => {
    if (!reschedulePostId || !rescheduleDate || !rescheduleTime) return
    setPerformingAction(reschedulePostId)
    try {
      const scheduledAt = `${rescheduleDate}T${rescheduleTime}:00`
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reschedulePostId,
          scheduledAt,
          status: "scheduled",
          errorMessage: null, // Clear error message
        }),
      })
      if (res.ok) {
        showToast("Post rescheduled successfully!", "success")
        setRescheduleOpen(false)
        fetchPosts()
      } else {
        showToast("Failed to reschedule", "error")
      }
    } catch {
      showToast("Failed to reschedule", "error")
    } finally {
      setPerformingAction(null)
    }
  }

  const fetchPosts = useCallback(async (isInitial = false) => {
    try {
      const params = tabRef.current !== "all" ? `?status=${tabRef.current}` : ""
      const res = await fetch(`/api/posts${params}`)
      const data = await res.json()
      if (res.ok) {
        setPosts(data.posts || [])
      }
    } catch {
      showToast("Failed to load posts", "error")
    } finally {
      if (isInitial) setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    tabRef.current = tab
    if (session) {
      fetchPosts(initRef.current === false)
      initRef.current = true
    }
  }, [session, tab, fetchPosts])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/posts?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        showToast("Post deleted successfully", "success")
        fetchPosts()
      } else {
        showToast("Failed to delete post", "error")
      }
    } catch {
      showToast("Failed to delete post", "error")
    } finally {
      setDeleting(null)
    }
  }

  const handleDuplicate = async (post: PostData) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title + " (Copy)",
          content: post.content,
          platforms: post.platforms,
          media: post.media,
          hashtags: post.hashtags,
          status: "draft",
          type: post.type,
        }),
      })
      if (res.ok) {
        showToast("Post duplicated successfully", "success")
        fetchPosts()
      }
    } catch {
      showToast("Failed to duplicate post", "error")
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === d.toDateString()
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    if (isToday) return `Today, ${time}`
    if (isTomorrow) return `Tomorrow, ${time}`
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + `, ${time}`
  }

  // Frontend searching and platform filtering
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.content.toLowerCase().includes(search.toLowerCase())
    const matchesPlatform = platformFilter === "all" || post.platforms.includes(platformFilter)
    return matchesSearch && matchesPlatform
  })

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Scheduled & Drafts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage, edit, search, and monitor your publishing timeline and content drafts.
          </p>
        </div>
        <Button className="rounded-lg shadow-sm" onClick={() => router.push("/dashboard/create")}>
          Create New Post
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/40 pb-2">
          <TabsList className="bg-muted/65 p-0.5 rounded-xl border border-border/50 flex flex-wrap gap-1 md:flex-nowrap">
            <TabsTrigger value="all" className="rounded-lg px-3 py-1.5 text-[11px] font-medium">All</TabsTrigger>
            <TabsTrigger value="scheduled" className="rounded-lg px-3 py-1.5 text-[11px] font-medium">Scheduled</TabsTrigger>
            <TabsTrigger value="draft" className="rounded-lg px-3 py-1.5 text-[11px] font-medium">Drafts</TabsTrigger>
            <TabsTrigger value="publishing" className="rounded-lg px-3 py-1.5 text-[11px] font-medium">Publishing</TabsTrigger>
            <TabsTrigger value="published" className="rounded-lg px-3 py-1.5 text-[11px] font-medium">Published</TabsTrigger>
            <TabsTrigger value="failed" className="rounded-lg px-3 py-1.5 text-[11px] font-medium">Failed</TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-lg px-3 py-1.5 text-[11px] font-medium">Cancelled</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-48 md:w-56">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 rounded-lg border-border/60 bg-muted/40 pl-8 text-xs focus:bg-background"
              />
            </div>

            {/* Platform Filter */}
            <div className="relative flex items-center shrink-0">
              <Filter className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="h-8 pl-8 pr-3 rounded-lg border border-border/60 bg-muted/40 text-xs font-medium text-muted-foreground focus:text-foreground focus:bg-background outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Platforms</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter / X</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
          </div>
        </div>

        <TabsContent value={tab} className="mt-0 focus-visible:outline-none">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="rounded-xl border-border/60 p-5 h-44 animate-pulse bg-muted/10">
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-4 w-1/3 bg-muted rounded" />
                    <div className="h-4 w-10 bg-muted rounded" />
                  </div>
                  <div className="h-3 w-full bg-muted rounded mb-2" />
                  <div className="h-3 w-5/6 bg-muted rounded" />
                </Card>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center border border-dashed border-border/60 rounded-2xl bg-muted/[0.01]">
              <AlertCircle className="size-8 text-muted-foreground opacity-50" />
              <div>
                <p className="text-sm font-medium text-foreground">No posts found.</p>
                <p className="text-xs text-muted-foreground mt-0.5">Try widening your search terms, removing filters, or create a brand new post.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPosts.map((post) => {
                const TypeIcon = typeIcons[post.type] ?? FileText
                return (
                  <Card key={post._id} className="group rounded-xl border-border/60 hover:shadow-md transition-all hover:border-border overflow-hidden bg-card/95 flex flex-col justify-between">
                    <div>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-3 border-b border-border/30">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {post.platforms.map((plat) => (
                            <Badge key={plat} className={cn("text-[9px] font-semibold text-white tracking-wide shadow-sm py-0.5 px-1.5", platformColors[plat] || "bg-muted-foreground")}>
                              {platformLabels[plat] || plat}
                            </Badge>
                          ))}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-xs" className="opacity-70 group-hover:opacity-100 h-7 w-7 rounded-lg hover:bg-muted">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-border/60 rounded-xl">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/create?edit=${post._id}`)}>
                              <Edit3 className="size-3.5 mr-1.5 text-muted-foreground" /> Edit Post
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(post)}>
                              <Copy className="size-3.5 mr-1.5 text-muted-foreground" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/5"
                              onClick={() => handleDelete(post._id)}
                              disabled={deleting === post._id}
                            >
                              {deleting === post._id ? (
                                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                              ) : (
                                <Trash2 className="size-3.5 mr-1.5" />
                              )}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardHeader>

                      <CardContent className="p-4 space-y-3.5">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground truncate">{post.title || "Untitled draft"}</p>
                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                        </div>

                        {post.media && post.media.length > 0 && (
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                            {post.media.map((url, idx) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={idx}
                                src={url}
                                alt={`Media ${idx}`}
                                className="h-10 w-10 object-cover rounded-lg border border-border/40 shrink-0"
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </div>

                    <div className="p-4 pt-0">
                      {/* Countdown Timer */}
                      {post.status === "scheduled" && (
                        <div className="mb-2 bg-blue-500/5 text-blue-600 text-[10px] py-1 px-2.5 rounded-lg border border-blue-500/10 font-medium flex items-center gap-1">
                          <Clock className="size-3 animate-pulse" />
                          {getCountdown(post.scheduledAt)}
                        </div>
                      )}

                      {/* Publishing Progress Indicator */}
                      {post.status === "publishing" && (
                        <div className="mb-2 bg-amber-500/5 text-amber-600 text-[10px] py-1 px-2.5 rounded-lg border border-amber-500/10 font-medium flex items-center gap-1.5 animate-pulse">
                          <Loader2 className="size-3 animate-spin" />
                          Publishing to active platforms...
                        </div>
                      )}

                      {/* Retry Tracker for Failed attempts */}
                      {post.retryCount > 0 && post.status !== "published" && (
                        <div className="mb-2 bg-destructive/[0.03] text-destructive text-[10px] py-1 px-2.5 rounded-lg border border-destructive/10 font-medium flex items-center justify-between">
                          <span className="flex items-center gap-1"><RefreshCw className="size-3 animate-spin" /> Attempt {post.retryCount}/3 failed</span>
                          {post.lastAttempt && <span className="text-[9px] text-muted-foreground opacity-80">Last: {new Date(post.lastAttempt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-border/30 pt-3">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <TypeIcon className="size-3.5" />
                          <span className="capitalize font-medium">{post.type}</span>
                        </div>
                        <Badge className={cn("text-[10px] font-semibold py-0.5 px-2 tracking-wide border", statusStyles[post.status] || statusStyles.draft)}>
                          {post.status === "scheduled" ? (
                            <span className="flex items-center gap-1"><Clock className="size-3" /> {formatDate(post.scheduledAt)}</span>
                          ) : post.status === "published" ? (
                            post.facebookUrl ? (
                              <a
                                href={post.facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline font-semibold"
                              >
                                <Globe className="size-3" /> View on Facebook
                              </a>
                            ) : (
                              <span className="flex items-center gap-1"><Globe className="size-3" /> Published</span>
                            )
                          ) : post.status === "publishing" ? (
                            <span className="flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> Publishing</span>
                          ) : post.status === "cancelled" ? (
                            <span className="flex items-center gap-1"><XCircle className="size-3" /> Cancelled</span>
                          ) : post.status === "failed" ? (
                            <span>Failed</span>
                          ) : (
                            <span>Draft</span>
                          )}
                        </Badge>
                      </div>
                      
                      {post.status === "failed" && post.errorMessage && (
                        <p className="text-[10px] text-destructive bg-rose-500/[0.03] border border-destructive/10 rounded-lg p-2.5 mt-2 break-words leading-relaxed">
                          {post.errorMessage}
                        </p>
                      )}

                      {/* Quick Actions Footer Buttons for Scheduled/Failed/Cancelled posts */}
                      {(post.status === "scheduled" || post.status === "failed" || post.status === "cancelled") && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/25">
                          {post.status === "scheduled" && (
                            <>
                              <Button
                                variant="outline"
                                size="xs"
                                className="flex-1 rounded-lg text-[10px] gap-1 border-border/60"
                                onClick={() => handleCancelSchedule(post._id)}
                                disabled={performingAction === post._id}
                              >
                                <XCircle className="size-3 text-muted-foreground" /> Cancel
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                className="flex-1 rounded-lg text-[10px] gap-1 border-border/60"
                                onClick={() => {
                                  setReschedulePostId(post._id)
                                  if (post.scheduledAt) {
                                    const d = new Date(post.scheduledAt)
                                    setRescheduleDate(d.toISOString().split("T")[0])
                                    setRescheduleTime(d.toTimeString().split(" ")[0].slice(0, 5))
                                  }
                                  setRescheduleOpen(true)
                                }}
                                disabled={performingAction === post._id}
                              >
                                <Clock className="size-3 text-primary" /> Reschedule
                              </Button>
                            </>
                          )}
                          {(post.status === "failed" || post.status === "cancelled") && (
                            <Button
                              variant="outline"
                              size="xs"
                              className="flex-1 rounded-lg text-[10px] gap-1 border-primary/20 text-primary hover:bg-primary/5"
                              onClick={() => {
                                  setReschedulePostId(post._id)
                                  if (post.scheduledAt) {
                                    const d = new Date(post.scheduledAt)
                                    setRescheduleDate(d.toISOString().split("T")[0])
                                    setRescheduleTime(d.toTimeString().split(" ")[0].slice(0, 5))
                                  }
                                  setRescheduleOpen(true)
                              }}
                              disabled={performingAction === post._id}
                            >
                              <RefreshCw className="size-3" /> Reschedule & Retry
                            </Button>
                          )}
                          <Button
                            variant="default"
                            size="xs"
                            className="rounded-lg text-[10px] gap-1 shadow-sm px-2.5 shrink-0"
                            onClick={() => handlePublishImmediately(post)}
                            disabled={performingAction === post._id}
                          >
                            {performingAction === post._id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Play className="size-3" />
                            )}
                            Publish Now
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rescheduling Dialog Modal */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5 border-border/60 shadow-xl bg-card">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="flex items-center gap-1.5 text-sm font-bold"><Clock className="size-4.5" /> Reschedule Post</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Select a new date and time to automatically queue this post for publishing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">PUBLISHING DATE</Label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">PUBLISHING TIME</Label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none"
              />
            </div>
          </div>
          <DialogFooter className="border-t border-border/40 pt-4 flex gap-2">
            <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="rounded-lg text-xs" onClick={handleRescheduleSubmit} disabled={performingAction === reschedulePostId || !rescheduleDate || !rescheduleTime}>
              {performingAction === reschedulePostId ? <Loader2 className="size-4 animate-spin" /> : "Save Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
