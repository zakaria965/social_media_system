"use client"

import { useEffect, useState } from "react"
import {
  Bell,
  CheckCheck,
  Megaphone,
  AlertCircle,
  Clock,
  Trash2,
  Loader2,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/dashboard/page-transition"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/toast-provider"

interface NotificationData {
  _id: string
  title: string
  message: string
  type: "success" | "error" | "info"
  read: boolean
  createdAt: string
}

const typeIconMap = {
  success: Megaphone,
  error: AlertCircle,
  info: Calendar,
}

const typeColorMap = {
  success: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5",
  error: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/5",
  info: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/5",
}

export default function NotificationsPage() {
  const { showToast } = useToast()
  const [tab, setTab] = useState("all")
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {
      showToast("Failed to load notifications history", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = async () => {
    setActioning(true)
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })
      if (res.ok) {
        showToast("All notifications marked as read", "success")
        fetchNotifications()
      }
    } catch {
      showToast("Failed to mark all as read", "error")
    } finally {
      setActioning(false)
    }
  }

  const toggleRead = async (id: string, currentReadState: boolean) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: !currentReadState }),
      })
      if (res.ok) {
        fetchNotifications()
      }
    } catch {
      showToast("Failed to update notification status", "error")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        showToast("Notification deleted", "success")
        fetchNotifications()
      }
    } catch {
      showToast("Failed to delete notification", "error")
    }
  }

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear your notifications history?")) return
    setActioning(true)
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
      })
      if (res.ok) {
        showToast("Notifications history cleared successfully!", "success")
        fetchNotifications()
      }
    } catch {
      showToast("Failed to clear notifications", "error")
    } finally {
      setActioning(false)
    }
  }

  const filtered = tab === "all"
    ? notifications
    : notifications.filter((n) => !n.read)

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay updated on all your automatic scheduling results and connection health states.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1 h-8" onClick={markAllRead} disabled={actioning}>
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1 text-destructive hover:bg-destructive/5 h-8" onClick={handleClearAll} disabled={actioning}>
              <Trash2 className="size-3.5" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 bg-muted/65 p-0.5 rounded-xl border border-border/50">
          <TabsTrigger value="all" className="gap-2 rounded-lg px-4 py-1.5 text-xs font-medium">
            All
            <Badge variant="secondary" className="rounded-full px-1.5 text-[9px] font-bold">
              {notifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2 rounded-lg px-4 py-1.5 text-xs font-medium">
            Unread
            {unreadCount > 0 && (
              <Badge variant="default" className="rounded-full px-1.5 text-[9px] font-bold">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-0">
          <Card className="rounded-xl border-border/60 overflow-hidden bg-card/95 backdrop-blur-xl">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground mt-2">Loading alert logs...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center gap-3.5">
                  <Bell className="size-9 text-muted-foreground/40" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">No alerts matching filters</p>
                    <p className="text-xs text-muted-foreground mt-0.5">You are completely caught up!</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {filtered.map((n) => {
                    const Icon = typeIconMap[n.type] || Bell
                    return (
                      <div
                        key={n._id}
                        className={cn(
                          "flex items-start gap-4 px-4 py-3.5 transition-all hover:bg-muted/20 relative group",
                          !n.read && "bg-primary/[0.01]"
                        )}
                      >
                        <div
                          onClick={() => toggleRead(n._id, n.read)}
                          className={cn("flex size-9 shrink-0 items-center justify-center rounded-full cursor-pointer hover:scale-105 transition-transform", typeColorMap[n.type])}
                        >
                          <Icon className="size-4.5" />
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => toggleRead(n._id, n.read)}>
                          <div className="flex items-start justify-between gap-2 cursor-pointer">
                            <p className={cn("text-xs font-bold text-foreground", !n.read && "text-primary")}>{n.title}</p>
                            <span className="shrink-0 text-[9px] text-muted-foreground font-semibold flex items-center gap-1">
                              <Clock className="size-3" />
                              {new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed cursor-pointer pr-8">{n.message}</p>
                        </div>
                        <div className="absolute right-4 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDelete(n._id)}
                            className="text-muted-foreground hover:text-destructive text-[10px] p-1 rounded hover:bg-destructive/5 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        {!n.read && (
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageTransition>
  )
}
