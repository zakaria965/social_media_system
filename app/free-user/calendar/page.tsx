"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Plus,
  Trash2,
  Edit,
  X
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  status: "scheduled"
  platforms: string[]
  scheduledAt: string
}

export default function FreeCalendarPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [currentDate, setCurrentDate] = useState(new Date("2026-06-05")) // Focus on local meta date June 2026
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")
  const [platformFilter, setPlatformFilter] = useState<string>("all")

  // Selected post dialog edit states
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)


  // Load scheduled posts from storage
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

  // Navigation handlers
  const handlePrev = () => {
    const nextDate = new Date(currentDate)
    if (viewMode === "month") {
      nextDate.setMonth(currentDate.getMonth() - 1)
    } else if (viewMode === "week") {
      nextDate.setDate(currentDate.getDate() - 7)
    } else {
      nextDate.setDate(currentDate.getDate() - 1)
    }
    setCurrentDate(nextDate)
  }

  const handleNext = () => {
    const nextDate = new Date(currentDate)
    if (viewMode === "month") {
      nextDate.setMonth(currentDate.getMonth() + 1)
    } else if (viewMode === "week") {
      nextDate.setDate(currentDate.getDate() + 7)
    } else {
      nextDate.setDate(currentDate.getDate() + 1)
    }
    setCurrentDate(nextDate)
  }

  // Get days of the month grid (including padding from previous month)
  const getMonthDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayIndex = new Date(year, month, 1).getDay()
    const lastDay = new Date(year, month + 1, 0).getDate()
    const prevLastDay = new Date(year, month, 0).getDate()

    const grid = []

    // Padding from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      grid.push({
        day: prevLastDay - i,
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false
      })
    }

    // Days of current month
    for (let i = 1; i <= lastDay; i++) {
      grid.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true
      })
    }

    // Padding for next month to complete 42 cells (6 rows)
    const remaining = 42 - grid.length
    for (let i = 1; i <= remaining; i++) {
      grid.push({
        day: i,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false
      })
    }

    return grid
  }

  // Filter posts based on selected platform
  const getFilteredPosts = () => {
    return posts.filter(post => {
      if (platformFilter === "all") return true
      return post.platforms.includes(platformFilter)
    })
  }

  // Get posts scheduled on a specific day
  const getPostsForDay = (day: number, month: number, year: number) => {
    return getFilteredPosts().filter(post => {
      const pDate = new Date(post.scheduledAt)
      return (
        pDate.getDate() === day &&
        pDate.getMonth() === month &&
        pDate.getFullYear() === year
      )
    })
  }

  // Open Edit post dialog
  const handleOpenEdit = (post: ScheduledPost) => {
    setSelectedPost(post)
    setEditTitle(post.title)
    setEditContent(post.content)
    const pDate = new Date(post.scheduledAt)
    setEditDate(pDate.toISOString().split("T")[0])
    setEditTime(pDate.toTimeString().split(" ")[0].substring(0, 5))
  }

  // Save edits
  const handleSaveEdit = () => {
    if (!selectedPost) return
    const updated = posts.map(p => {
      if (p.id === selectedPost.id) {
        return {
          ...p,
          title: editTitle,
          content: editContent,
          scheduledAt: `${editDate}T${editTime}:00.000Z`
        }
      }
      return p
    })
    savePosts(updated)
    setSelectedPost(null)
    showToast("✓ Post Updated", "success")
  }

  // Delete post from edit dialog
  const handleDeleteFromEdit = () => {
    if (!selectedPost) return
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedPost) return
    setDeleteLoading(true)
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    const updated = posts.filter(p => p.id !== selectedPost.id)
    savePosts(updated)
    setSelectedPost(null)
    setDeleteLoading(false)
    setDeleteModalOpen(false)
    showToast("✓ Post Scheduled", "success")
  }


  // Render platform icons helper
  const getPlatformColors = (plat: string) => {
    switch (plat) {
      case "facebook":
        return "bg-blue-500 text-white hover:bg-blue-600"
      case "instagram":
        return "bg-pink-500 text-white hover:bg-pink-600"
      case "linkedin":
        return "bg-sky-600 text-white hover:bg-sky-700"
      default:
        return "bg-slate-500 text-white"
    }
  }

  const renderPlatformIcon = (plat: string) => {
    switch (plat) {
      case "facebook":
        return <IconFacebook className="size-3 inline shrink-0 mr-0.5" />
      case "instagram":
        return <IconInstagram className="size-3 inline shrink-0 mr-0.5" />
      case "linkedin":
        return <IconLinkedin className="size-3 inline shrink-0 mr-0.5" />
      default:
        return null
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <Calendar className="size-6 text-emerald-600 dark:text-[var(--brand-primary)]" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Visual Calendar
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Check scheduled postings at a glance. Drag, reschedule, or filter platforms.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode switches */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                  viewMode === mode
                    ? "bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Link href="/free-user/create?action=schedule">
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs rounded-xl uppercase tracking-wider flex items-center gap-1">
              <Plus className="size-3.5" />
              Schedule Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Date navigation and Platform filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border-0 shadow-card">
        
        {/* Navigation arrow buttons */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={handlePrev} className="size-8 rounded-lg bg-background">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 min-w-[120px] text-center">
            {viewMode === "month" && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {viewMode === "week" && `Week of ${currentDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}`}
            {viewMode === "day" && currentDate.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <Button variant="outline" size="icon" onClick={handleNext} className="size-8 rounded-lg bg-background">
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Platform selection */}
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-slate-400 shrink-0" />
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-250 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] h-8 dark:bg-slate-800 dark:border-slate-700"
          >
            <option value="all">All Channels</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>
      </div>

      {/* Calendar Grid rendering */}
      {viewMode === "month" ? (
        /* ================= MONTH VIEW ================= */
        <Card className="rounded-2xl border-0 bg-white overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300">
          <div className="grid grid-cols-7 border-b border-[#EEF2F7] bg-transparent">
            {dayNames.map((d) => (
              <span key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center py-2 border-r border-[#EEF2F7]/30">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-[#EEF2F7]/30 border-l border-t border-[#EEF2F7]/30">
            {getMonthDays().map((cell, idx) => {
              const cellPosts = getPostsForDay(cell.day, cell.month, cell.year)
              const isToday =
                cell.day === 5 &&
                cell.month === 5 &&
                cell.year === 2026 // June 5, 2026 (Metadata Date)

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] p-2 flex flex-col justify-between transition-colors ${
                    cell.isCurrentMonth
                      ? "bg-background dark:bg-slate-900"
                      : "bg-slate-50/50 dark:bg-slate-950/20 opacity-60"
                  } ${isToday && "bg-emerald-500/5"}`}
                >
                  {/* Date digit */}
                  <span className={`text-[11px] font-bold self-start px-1.5 py-0.5 rounded-full ${
                    isToday ? "bg-[var(--brand-primary)] text-slate-950 font-black" : "text-slate-500 dark:text-slate-400"
                  }`}>
                    {cell.day}
                  </span>

                  {/* Cell scheduled posts */}
                  <div className="mt-1 flex-1 overflow-y-auto space-y-1">
                    {cellPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => handleOpenEdit(post)}
                        className={`text-[9px] font-bold p-1 rounded cursor-pointer truncate flex items-center shadow-xs transition-all hover:scale-102 ${getPlatformColors(post.platforms[0])}`}
                      >
                        {renderPlatformIcon(post.platforms[0])}
                        <span>{post.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : viewMode === "week" ? (
        /* ================= WEEK VIEW ================= */
        <Card className="rounded-2xl border-0 bg-white p-6 shadow-card hover:shadow-card-hover transition-all">
          <div className="grid grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, idx) => {
              const dayDate = new Date(currentDate)
              dayDate.setDate(currentDate.getDate() - currentDate.getDay() + idx)
              const cellPosts = getPostsForDay(dayDate.getDate(), dayDate.getMonth(), dayDate.getFullYear())
              const isToday =
                dayDate.getDate() === 5 &&
                dayDate.getMonth() === 5 &&
                dayDate.getFullYear() === 2026

              return (
                <div
                  key={idx}
                  className={`rounded-xl border-0 p-3 min-h-[200px] flex flex-col gap-3 transition-colors ${
                    isToday ? "bg-[var(--brand-primary)]/5" : "bg-[#FCFAF6]/60"
                  }`}
                >
                  <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{dayNames[idx]}</span>
                    <span className={`text-sm font-black mt-1 inline-block px-1.5 py-0.5 rounded-full ${isToday ? "bg-[var(--brand-primary)] text-slate-950" : "text-slate-700 dark:text-slate-300"}`}>
                      {dayDate.getDate()}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {cellPosts.map((post) => {
                      const timeStr = new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      return (
                        <div
                          key={post.id}
                          onClick={() => handleOpenEdit(post)}
                          className={`p-2 rounded-lg border text-left cursor-pointer space-y-1 hover:shadow-sm transition-all ${getPlatformColors(post.platforms[0])}`}
                        >
                          <span className="text-[8px] font-bold block opacity-90 uppercase tracking-wider">{timeStr}</span>
                          <span className="text-[10px] font-bold block truncate leading-tight">{post.title}</span>
                        </div>
                      )
                    })}
                    {cellPosts.length === 0 && (
                      <div className="text-center text-[9px] text-slate-400 font-medium py-12">
                        No posts
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : (
        /* ================= DAY VIEW ================= */
        <Card className="rounded-2xl border-0 bg-white p-6 shadow-card hover:shadow-card-hover transition-all">
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2">
              Scheduled for today ({currentDate.toLocaleDateString()})
            </span>
            
            {getPostsForDay(currentDate.getDate(), currentDate.getMonth(), currentDate.getFullYear()).length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">
                No postings scheduled for this day.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {getPostsForDay(currentDate.getDate(), currentDate.getMonth(), currentDate.getFullYear()).map((post) => {
                  const timeStr = new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div
                      key={post.id}
                      onClick={() => handleOpenEdit(post)}
                      className="py-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg flex items-center justify-center ${getPlatformColors(post.platforms[0])}`}>
                          {renderPlatformIcon(post.platforms[0])}
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-white block">{post.title}</span>
                          <p className="text-[10.5px] text-slate-500 truncate max-w-sm leading-normal mt-0.5">{post.content}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Clock className="size-3.5 text-emerald-600" />
                          {timeStr}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Edit Post details modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSelectedPost(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border-0 bg-white shadow-modal p-6 z-10 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider dark:text-white">
                Reschedule Post
              </h3>
              <button onClick={() => setSelectedPost(null)} className="text-slate-400 hover:text-slate-600 rounded">
                <X className="size-4.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Title</span>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-9 text-xs font-bold"
                />
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Content</span>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="text-xs font-medium resize-none"
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Date</span>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="h-8 text-xs font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Time</span>
                  <Input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="h-8 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteFromEdit}
                className="text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-250 bg-background"
              >
                <Trash2 className="size-4 mr-1 shrink-0" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPost(null)}
                  className="text-xs font-bold rounded-xl uppercase tracking-wider"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs px-4 rounded-xl uppercase tracking-wider"
                >
                  Save Edits
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <GrowWaveModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(false)
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
