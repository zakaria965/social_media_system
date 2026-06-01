"use client"

import { useEffect, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Image,
  Video,
  FileText,
  Clock,
  Plus,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageTransition } from "@/components/dashboard/page-transition"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

const platformColors: Record<string, string> = {
  instagram: "bg-pink-500",
  linkedin: "bg-blue-700",
  tiktok: "bg-foreground",
  facebook: "bg-blue-500",
  twitter: "bg-sky-500",
}

const statusColorDots: Record<string, string> = {
  scheduled: "bg-blue-500",
  published: "bg-emerald-500",
  failed: "bg-rose-500",
  draft: "bg-zinc-400",
  publishing: "bg-amber-500",
  cancelled: "bg-zinc-500",
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const typeIcons: Record<string, typeof FileText> = {
  image: Image,
  video: Video,
  text: FileText,
}

export default function CalendarPage() {
  const router = useRouter()
  const [view, setView] = useState("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDayPosts, setSelectedDayPosts] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    const fetchCalendarPosts = async () => {
      try {
        const res = await fetch("/api/posts")
        if (res.ok) {
          const data = await res.json()
          setPosts(data.posts || [])
        }
      } catch (err) {
        console.error("Calendar fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCalendarPosts()
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const setToday = () => {
    setCurrentDate(new Date())
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const currentMonthLabel = `${monthNames[month]} ${year}`

  const getPostsForDay = (day: number) => {
    return posts.filter((post) => {
      const dateStr = post.scheduledAt || post.publishedAt || post.createdAt
      if (!dateStr) return false
      const d = new Date(dateStr)
      return (
        d.getDate() === day &&
        d.getMonth() === month &&
        d.getFullYear() === year
      )
    })
  }

  const handleDayClick = (day: number) => {
    const dayPosts = getPostsForDay(day)
    setSelectedDay(day)
    setSelectedDayPosts(dayPosts)
    setDetailOpen(true)
  }

  const handleCreateNewFromCalendar = () => {
    if (selectedDay === null) return
    const scheduleDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    router.push(`/dashboard/create?scheduledDate=${scheduleDateStr}`)
  }

  const todayDate = new Date()
  const isCurrentMonthYear = todayDate.getMonth() === month && todayDate.getFullYear() === year

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Content Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visual interactive overview of your scheduled, drafted, and published campaigns.
          </p>
        </div>
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="rounded-xl border-border/60 overflow-hidden bg-card/95 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <CardTitle className="text-sm font-bold min-w-32 text-center">{currentMonthLabel}</CardTitle>
            <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={setToday}>
            Today
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-border/40 bg-muted/20">
            {daysOfWeek.map((d) => (
              <div key={d} className="px-3 py-2 text-[11px] font-semibold text-muted-foreground text-center border-r border-border/40 last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-7 divide-y divide-x divide-border/40">
              {/* Empty padding days */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-28 bg-muted/[0.02]" />
              ))}

              {/* Real Calendar Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayPosts = getPostsForDay(day)
                const isToday = isCurrentMonthYear && todayDate.getDate() === day

                return (
                  <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "min-h-28 p-2 flex flex-col justify-between transition-colors hover:bg-muted/40 cursor-pointer bg-card/90",
                      isToday && "bg-primary/[0.02]"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-bold transition-all",
                        isToday ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                      )}>
                        {day}
                      </span>
                      {dayPosts.length > 0 && (
                        <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0">
                          {dayPosts.length}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 mt-2 flex-1 overflow-y-auto max-h-20 scrollbar-none">
                      {dayPosts.slice(0, 3).map((post, idx) => {
                        const TypeIcon = typeIcons[post.type] ?? FileText
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] bg-muted/65 hover:bg-muted transition-all border border-border/30 group"
                          >
                            <span className={cn("size-1.5 shrink-0 rounded-full", statusColorDots[post.status] || "bg-muted-foreground")} />
                            <TypeIcon className="size-2.5 shrink-0 text-muted-foreground" />
                            <span className="truncate text-foreground font-medium flex-1">{post.title || post.content.slice(0, 15)}</span>
                          </div>
                        )
                      })}
                      {dayPosts.length > 3 && (
                        <p className="text-[8px] text-muted-foreground font-bold text-center mt-0.5">
                          + {dayPosts.length - 3} more posts
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dynamic Day Post details dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-5 border-border/60 shadow-xl bg-card">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <Calendar className="size-4.5 text-primary" /> Timeline: {monthNames[month]} {selectedDay}, {year}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review publications or add a scheduled post for this day.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 max-h-[300px] overflow-y-auto pr-1">
            {selectedDayPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <AlertCircle className="size-8 opacity-40" />
                <p className="text-xs font-semibold">No content scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDayPosts.map((post) => (
                  <div
                    key={post.id || post._id}
                    onClick={() => {
                      setDetailOpen(false)
                      router.push(`/dashboard/scheduled?id=${post.id || post._id}`)
                    }}
                    className="p-3 border border-border/60 rounded-xl hover:bg-muted/30 transition-all cursor-pointer flex justify-between items-start gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{post.title || "Untitled Post"}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{post.content}</p>
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {post.platforms.map((plat: string) => (
                          <Badge key={plat} className="text-[8px] bg-muted text-foreground py-0 hover:bg-muted font-bold capitalize">
                            {plat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge className={cn("text-[9px] font-bold py-0.5 px-2 tracking-wide border uppercase shrink-0", statusColorDots[post.status] || "bg-muted text-foreground")}>
                      {post.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border/40 pt-4 flex gap-2">
            <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
            <Button size="sm" className="rounded-lg text-xs flex items-center gap-1" onClick={handleCreateNewFromCalendar}>
              <Plus className="size-3.5" /> Schedule Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
