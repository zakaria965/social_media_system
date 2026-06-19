"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarCheck,
  Clock,
  Trash2,
  Edit,
  Send,
  Copy,
  Calendar,
  AlertCircle,
  Plus,
  RefreshCw
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { UpgradeModal } from "@/components/free-user/upgrade-modal"
import {
  IconFacebook,
  IconInstagram,
  IconLinkedin
} from "@/components/social-brand-icons"
import { useToast } from "@/components/toast-provider"
import { GrowWaveModal } from "@/components/growwave-modal"


interface ScheduledPost {
  id: string
  title: string
  content: string
  status?: string
  platforms: string[]
  scheduledAt: string
  createdAt?: string
}

export default function FreeScheduledPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [reschedulePostId, setReschedulePostId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("12:00")

  // Upgrade Modal
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"ai_quota" | "channels_limit" | "bulk_scheduling" | "analytics_pro" | "team_feature" | "inbox_feature" | "platform_locked" | "scheduler_limit" | "publish_limit" | "">("")

  const [publishedTodayCount, setPublishedTodayCount] = useState(0)
  const [userPlan, setUserPlan] = useState("FREE")

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletePostId, setDeletePostId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Helper to count scheduled posts created today
  const getTodayScheduledCount = (postsList: any[]) => {
    const todayStr = new Date().toDateString()
    return postsList.filter(p => {
      const createdDate = p.createdAt ? new Date(p.createdAt) : new Date(p.id.includes("dup") ? parseInt(p.id.split("-").pop() || "") : Date.now())
      return createdDate.toDateString() === todayStr
    }).length
  }


  // Load scheduled posts from localStorage
  const loadPosts = () => {
    const saved = localStorage.getItem("growwave-lite-scheduled")
    if (saved) {
      setPosts(JSON.parse(saved))
    } else {
      const defaultScheduled: ScheduledPost[] = []
      setPosts(defaultScheduled)
      localStorage.setItem("growwave-lite-scheduled", JSON.stringify(defaultScheduled))
    }
  }

  const fetchPublishedCount = () => {
    fetch("/api/publish")
      .then(res => res.json())
      .then(data => {
        if (typeof data.count === "number") {
          setPublishedTodayCount(data.count)
        }
        if (data.plan) {
          setUserPlan(data.plan)
        }
      })
      .catch(err => console.error("Failed to load published count:", err))
  }

  useEffect(() => {
    fetchPublishedCount()
    loadPosts()
  }, [])

  const savePosts = (updatedList: ScheduledPost[]) => {
    setPosts(updatedList)
    localStorage.setItem("growwave-lite-scheduled", JSON.stringify(updatedList))
  }

  // Delete Post
  const handleDeletePost = (id: string) => {
    setDeletePostId(id)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletePostId) return
    setDeleteLoading(true)
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    const updated = posts.filter(p => p.id !== deletePostId)
    savePosts(updated)
    setDeleteLoading(false)
    setDeleteModalOpen(false)
    setDeletePostId(null)
    showToast("✓ Post Deleted", "success")
  }

  // Duplicate Post (checking limit)
  const handleDuplicatePost = (post: ScheduledPost) => {
    const todayCount = getTodayScheduledCount(posts)
    if (todayCount >= 5) {
      setUpgradeReason("scheduler_limit")
      setUpgradeOpen(true)
      
      // Track limit reached event
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scheduler_limit_reached",
          details: "Free user reached the daily scheduling limit of 5 posts."
        })
      }).catch(err => console.error(err))
      return
    }

    const newPost: ScheduledPost = {
      ...post,
      id: "sp-dup-" + Date.now(),
      title: `${post.title} (Copy)`,
      scheduledAt: new Date(new Date(post.scheduledAt).getTime() + 86400000).toISOString(), // Push 1 day forward
      createdAt: new Date().toISOString(),
      status: "scheduled"
    }

    savePosts([...posts, newPost])
    showToast("✓ Post Scheduled", "success")
  }

  // Publish Now immediately
  const handlePublishNow = (id: string) => {
    const post = posts.find(p => p.id === id)
    if (post) {
      fetch("/api/accounts")
        .then(res => res.json())
        .then(data => {
          const fbAccount = data.accounts?.find((a: any) => a.platform === "facebook" && a.status === "connected")
          const targetPlatform = fbAccount ? "facebook" : "facebook"
          
          fetch("/api/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: post.content,
              platforms: [targetPlatform],
              media: []
            })
          })
          .then(async (publishRes) => {
            const resData = await publishRes.json()
            if (publishRes.ok && resData.results?.[targetPlatform]?.success) {
              const updated = posts.filter(p => p.id !== id)
              savePosts(updated)
              showToast("✓ Post Published", "success")
              fetchPublishedCount()
            } else {
              if (publishRes.status === 403 || resData.error === "PUBLISH_LIMIT_REACHED" || resData.error?.includes("limit")) {
                setUpgradeReason("publish_limit")
                setUpgradeOpen(true)
              } else {
                const err = resData.results?.[targetPlatform]?.error || resData.error || "Publishing failed"
                showToast(`⚠️ Error publishing: ${err}`, "error")
              }
            }
          })
          .catch(err => {
            console.error("Publishing error:", err)
            showToast("⚠️ Network error: failed to publish", "error")
          })
        })
    }
  }

  // Trigger reschedule dialog
  const triggerReschedule = (post: ScheduledPost) => {
    setReschedulePostId(post.id)
    const pDate = new Date(post.scheduledAt)
    setRescheduleDate(pDate.toISOString().split("T")[0])
    setRescheduleTime(pDate.toTimeString().split(" ")[0].substring(0, 5))
  }

  // Save rescheduled date
  const handleSaveReschedule = (id: string) => {
    const updated = posts.map(p => {
      if (p.id === id) {
        return {
          ...p,
          scheduledAt: `${rescheduleDate}T${rescheduleTime}:00.000Z`
        }
      }
      return p
    })
    savePosts(updated)
    setReschedulePostId(null)
    showToast("✓ Post Scheduled", "success")
  }


  // Render platform icons
  const renderPlatformBadge = (plat: string) => {
    switch (plat) {
      case "facebook":
        return <IconFacebook className="size-3.5 text-blue-600 shrink-0" />
      case "instagram":
        return <IconInstagram className="size-3.5 text-pink-600 shrink-0" />
      case "linkedin":
        return <IconLinkedin className="size-3.5 text-sky-700 shrink-0" />
      default:
        return null
    }
  }

  const todayCount = getTodayScheduledCount(posts)

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Scheduled Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your upcoming posts queue. Tap items to reschedule or duplicate them.
          </p>
        </div>
        <Link href="/free-user/create?action=schedule">
          <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs rounded-xl uppercase tracking-wider flex items-center gap-1">
            <Plus className="size-3.5" />
            Queue Post
          </Button>
        </Link>
      </div>

      {/* Quota Progress meter */}
      <Card className="rounded-2xl border-0 bg-white dark:bg-[#1F2937] p-6 shadow-card hover:shadow-card-hover transition-all">
        <CardContent className="p-0 space-y-3">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">Scheduler limits tracker (5 Scheduled Posts Today)</span>
            <span className="text-slate-900 font-bold dark:text-white">
              {todayCount} / 5 Scheduled Today
            </span>
          </div>
          <Progress 
            value={(todayCount / 5) * 100} 
            className="h-2 rounded-full bg-slate-100 dark:bg-slate-800" 
            indicatorClassName={todayCount >= 4 ? "bg-amber-500" : "bg-[var(--brand-primary)]"}
          />
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Free Tier Queue</span>
            {todayCount >= 4 && (
              <span className="text-amber-600 dark:text-amber-500 flex items-center gap-1 normal-case font-extrabold">
                ⚠ You are close to today's scheduling limit.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Queue Listing */}
      <div className="space-y-4">
        {posts
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
          .map((post) => {
            const pDate = new Date(post.scheduledAt)
            const dateStr = pDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            const timeStr = pDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            const isReschedulingThis = reschedulePostId === post.id

            return (
              <Card key={post.id} className="rounded-2xl border-0 bg-white dark:bg-[#1F2937] shadow-card hover:shadow-card-hover transition-all duration-300">
                <CardContent className="p-4 md:p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  
                  {/* Left segment */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 bg-slate-50 p-1 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                        {post.platforms.map((plat) => (
                          <span key={plat} title={plat}>{renderPlatformBadge(plat)}</span>
                        ))}
                      </div>
                      <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.2 select-none border-emerald-500/20 text-emerald-600 bg-emerald-50/20">
                        Active Queue
                      </Badge>
                    </div>

                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white block">{post.title}</span>
                      <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mt-1">{post.content}</p>
                    </div>

                    {/* Rescheduling Form inline */}
                    {isReschedulingThis && (
                      <div className="grid gap-3 sm:grid-cols-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/50 mt-3 max-w-md">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block mb-1">New Date</span>
                          <Input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="h-8 text-[11px] font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block mb-1">New Time</span>
                          <Input
                            type="time"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            className="h-8 text-[11px] font-bold"
                          />
                        </div>
                        <div className="sm:col-span-2 flex justify-end gap-2 pt-1 border-t border-slate-200/40">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setReschedulePostId(null)}
                            className="text-[10px] font-bold uppercase rounded-md h-7"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => handleSaveReschedule(post.id)}
                            className="bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-[10px] uppercase rounded-md h-7 px-3.5"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right metadata and buttons */}
                  <div className="flex flex-col sm:flex-row md:flex-col sm:items-center md:items-end justify-between gap-3 shrink-0">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1">
                      <Clock className="size-3.5 text-emerald-600" />
                      <span>{dateStr} at {timeStr}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 rounded-xl border border-[#EEF2F7] hover:border-rose-500/30 hover:bg-rose-50/50 text-slate-400 hover:text-rose-500 transition-all bg-background"
                        title="Delete Post"
                      >
                        <Trash2 className="size-4" />
                      </button>

                      <button
                        onClick={() => handleDuplicatePost(post)}
                        className="p-2 rounded-xl border border-[#EEF2F7] hover:border-slate-355 hover:bg-slate-50 text-slate-400 hover:text-slate-655 transition-all bg-background"
                        title="Duplicate Post"
                      >
                        <Copy className="size-4" />
                      </button>

                      <button
                        onClick={() => {
                          router.push(`/free-user/create?title=${encodeURIComponent(post.title)}&content=${encodeURIComponent(post.content)}`)
                        }}
                        className="p-2 rounded-xl border border-[#EEF2F7] hover:border-[var(--brand-primary)]/40 hover:bg-slate-50 text-slate-600 transition-all bg-background"
                        title="Edit Post"
                      >
                        <Edit className="size-4" />
                      </button>

                      <button
                        onClick={() => triggerReschedule(post)}
                        className="bg-background hover:bg-slate-50 text-[#6B7280] font-bold text-[10px] py-2 px-3 border border-[#EEF2F7] rounded-xl uppercase tracking-wider transition-all"
                      >
                        Reschedule
                      </button>

                      {userPlan.toUpperCase() === "FREE" && publishedTodayCount >= 3 ? (
                        <>
                          <button
                            disabled
                            className="bg-slate-100 text-slate-400 font-extrabold text-[10px] py-2 px-3.5 rounded-xl uppercase tracking-wider select-none cursor-not-allowed border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                          >
                            Daily Limit Reached
                          </button>
                          <button
                            onClick={() => {
                              setUpgradeReason("publish_limit")
                              setUpgradeOpen(true)
                            }}
                            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-[10px] py-2 px-3.5 rounded-xl uppercase tracking-wider transition-all shadow-card"
                          >
                            Upgrade to Pro
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handlePublishNow(post.id)}
                          className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-[10px] py-2 px-3 rounded-xl uppercase tracking-wider transition-all"
                        >
                          Publish Now
                        </button>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>
            )
          })}

        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center border border-dashed border-slate-250 rounded-xl bg-slate-50/30 p-12 text-center max-w-md mx-auto">
            <CalendarCheck className="size-10 text-slate-300 mb-3" />
            <h4 className="text-sm font-bold text-slate-800">No scheduled posts</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
              You have no scheduled posts in your queue. Keep your channels active by scheduling some content.
            </p>
            <Link href="/free-user/create?action=schedule" className="mt-4">
              <Button size="xs" className="bg-[var(--brand-primary)] text-white font-extrabold uppercase text-[10px] hover:bg-[var(--brand-hover)] rounded-xl">
                Schedule First Post
              </Button>
            </Link>
          </div>
        )}
      </div>

      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason={upgradeReason} />
      <GrowWaveModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(false)
            setDeletePostId(null)
          }
        }}
        title="Delete Content Idea"
        message="Are you sure you want to permanently delete this content idea? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        variant="danger"
        loading={deleteLoading}
        loadingText="Deleting..."
      />
    </div>
  )

}
