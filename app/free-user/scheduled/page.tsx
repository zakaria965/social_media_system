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

interface ScheduledPost {
  id: string
  title: string
  content: string
  status: "scheduled"
  platforms: string[]
  scheduledAt: string
}

export default function FreeScheduledPage() {
  const router = useRouter()

  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [reschedulePostId, setReschedulePostId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("12:00")

  // Upgrade Modal
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"ai_quota" | "channels_limit" | "bulk_scheduling" | "analytics_pro" | "team_feature" | "inbox_feature" | "platform_locked" | "">("")

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

  useEffect(() => {
    loadPosts()
  }, [])

  const savePosts = (updatedList: ScheduledPost[]) => {
    setPosts(updatedList)
    localStorage.setItem("growwave-lite-scheduled", JSON.stringify(updatedList))
  }

  // Delete Post
  const handleDeletePost = (id: string) => {
    if (confirm("Are you sure you want to delete this scheduled post?")) {
      const updated = posts.filter(p => p.id !== id)
      savePosts(updated)
    }
  }

  // Duplicate Post (checking limit)
  const handleDuplicatePost = (post: ScheduledPost) => {
    if (posts.length >= 30) {
      setUpgradeReason("bulk_scheduling")
      setUpgradeOpen(true)
      return
    }

    const newPost: ScheduledPost = {
      ...post,
      id: "sp-dup-" + Date.now(),
      title: `${post.title} (Copy)`,
      scheduledAt: new Date(new Date(post.scheduledAt).getTime() + 86400000).toISOString() // Push 1 day forward
    }

    savePosts([...posts, newPost])
    alert("Post duplicated successfully for tomorrow!")
  }

  // Publish Now immediately
  const handlePublishNow = (id: string) => {
    const post = posts.find(p => p.id === id)
    if (post) {
      // Move to published logs in history (simulated by deleting from queue and alerting)
      const updated = posts.filter(p => p.id !== id)
      savePosts(updated)
      alert(`Published "${post.title}" immediately toconnected channels!`)
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
    alert("Post rescheduled successfully!")
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
          <Button className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-extrabold text-xs rounded-lg uppercase tracking-wider flex items-center gap-1">
            <Plus className="size-3.5" />
            Queue Post
          </Button>
        </Link>
      </div>

      {/* Quota Progress meter */}
      <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="p-0 space-y-3">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500">Scheduler limits tracker (30 Scheduled Posts)</span>
            <span className="text-slate-900 font-bold dark:text-white">
              {posts.length} / 30 Scheduled
            </span>
          </div>
          <Progress value={(posts.length / 30) * 100} className="h-2 rounded-full bg-slate-100" />
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Free Tier Queue</span>
            {posts.length >= 25 && (
              <span className="text-emerald-600 dark:text-emerald-400">Approaching limit. Consider upgrading.</span>
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
              <Card key={post.id} className="rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800 hover:border-slate-350 transition-all">
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
                            className="bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-extrabold text-[10px] uppercase rounded-md h-7 px-3.5"
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
                        className="p-2 rounded-lg border border-slate-200 hover:border-rose-500/30 hover:bg-rose-50/50 text-slate-400 hover:text-rose-500 transition-all bg-white"
                        title="Delete Post"
                      >
                        <Trash2 className="size-4" />
                      </button>

                      <button
                        onClick={() => handleDuplicatePost(post)}
                        className="p-2 rounded-lg border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all bg-white"
                        title="Duplicate Post"
                      >
                        <Copy className="size-4" />
                      </button>

                      <button
                        onClick={() => {
                          router.push(`/free-user/create?title=${encodeURIComponent(post.title)}&content=${encodeURIComponent(post.content)}`)
                        }}
                        className="p-2 rounded-lg border border-slate-200 hover:border-[#30FC47]/40 hover:bg-slate-50 text-slate-600 transition-all bg-white"
                        title="Edit Post"
                      >
                        <Edit className="size-4" />
                      </button>

                      <button
                        onClick={() => triggerReschedule(post)}
                        className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-[10px] py-2 px-3 border border-slate-200 rounded-lg uppercase tracking-wider transition-all"
                      >
                        Reschedule
                      </button>

                      <button
                        onClick={() => handlePublishNow(post.id)}
                        className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-[10px] py-2 px-3 rounded-lg uppercase tracking-wider transition-all"
                      >
                        Publish Now
                      </button>
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
              <Button size="xs" className="bg-[#30FC47] text-slate-900 font-extrabold uppercase text-[10px] hover:bg-[#24D93B]">
                Schedule First Post
              </Button>
            </Link>
          </div>
        )}
      </div>

      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason={upgradeReason} />
    </div>
  )
}
