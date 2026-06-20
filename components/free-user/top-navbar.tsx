"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, Menu, Moon, Search, Sun, Zap, ShieldAlert, X, AlertCircle } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/dashboard/theme-provider"
import { cn } from "@/lib/utils"
import { UpgradeModal } from "./upgrade-modal"

interface TopNavbarProps {
  onMenuClick: () => void
}

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const { data: session } = useSession()
  const { theme, toggle } = useTheme()
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [showAllModal, setShowAllModal] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session) return

    fetchNotifications()

    // Establish Server-Sent Events stream for real-time notifications
    const eventSource = new EventSource("/api/notifications/stream")

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "notification") {
          setNotifications((prev) => [data.notification, ...prev])
        }
      } catch (err) {
        console.error("SSE parse error:", err)
      }
    }

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err)
    }

    return () => {
      eventSource.close()
    }
  }, [session])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })
      fetchNotifications()
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  const banners = notifications.filter((n) => !n.read && n.type === "BANNER")
  const currentBanner = banners[0]

  const criticalAlerts = notifications.filter((n) => !n.read && n.type === "CRITICAL")
  const currentCritical = criticalAlerts[0]

  return (
    <>
      {currentBanner && (
        <div className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white text-xs font-semibold py-2.5 px-4 flex justify-between items-center transition-all duration-300 shadow-md animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mx-auto">
            <AlertCircle className="size-4 shrink-0 animate-bounce" />
            <span>
              <strong>{currentBanner.title}</strong>: {currentBanner.message}
            </span>
          </div>
          <button
            onClick={() => handleMarkAsRead(currentBanner._id)}
            className="text-white hover:text-amber-100 p-1 rounded-full cursor-pointer hover:bg-white/10 shrink-0 transition-colors"
            title="Dismiss Announcement"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {currentCritical && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3 text-red-500">
              <ShieldAlert className="size-8 animate-pulse shrink-0" />
              <h3 className="text-lg font-bold text-foreground">Critical Security Alert</h3>
            </div>
            <div className="border-t border-b border-border/50 py-3 my-2">
              <h4 className="text-sm font-extrabold text-foreground">{currentCritical.title}</h4>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {currentCritical.message}
              </p>
            </div>
            <Button
              onClick={() => handleMarkAsRead(currentCritical._id)}
              className="w-full rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold py-2.5 cursor-pointer transition-colors"
            >
              Acknowledge and Close
            </Button>
          </div>
        </div>
      )}

      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-200 text-left">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1F2937] p-6 shadow-xl border border-slate-200/40 dark:border-white/5 space-y-4 max-h-[80vh] flex flex-col text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="size-5 text-[var(--brand-primary)]" />
                <span>Notification History</span>
              </h3>
              <button 
                onClick={() => setShowAllModal(false)}
                className="rounded-lg p-1 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 pr-1 space-y-0.5">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No notifications found.
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n._id} className="py-3 flex justify-between items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 px-2 rounded-xl transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-bold",
                          !n.read ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"
                        )}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="size-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1.5 font-medium">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!n.read && (
                        <button
                          onClick={() => handleMarkAsRead(n._id)}
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline bg-transparent border-0 cursor-pointer"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          await fetch(`/api/notifications?id=${n._id}`, { method: "DELETE" })
                          fetchNotifications()
                        }}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete Copy"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-slate-100 dark:border-white/5 pt-3 flex justify-between items-center text-xs">
                <button
                  onClick={async () => {
                    await fetch("/api/notifications", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ read: true }),
                    })
                    fetchNotifications()
                  }}
                  className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold cursor-pointer hover:underline"
                >
                  Mark all read
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Clear all notifications history?")) {
                      await fetch("/api/notifications", { method: "DELETE" })
                      fetchNotifications()
                    }
                  }}
                  className="text-rose-500 hover:text-rose-600 font-bold cursor-pointer hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200/30 dark:border-white/5 bg-[#FCFAF6] dark:bg-[#111827] px-4 md:px-6 transition-colors duration-200 shadow-xs">
        <Button variant="ghost" size="icon" className="lg:hidden text-slate-600 dark:text-slate-400" onClick={onMenuClick}>
          <Menu className="size-5" />
        </Button>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/free-user/create" className="flex items-center gap-2 lg:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-[var(--brand-primary)] text-xs font-bold text-slate-900">
              GW
            </div>
            <span className="font-display text-base font-semibold text-foreground">
              GrowWave
            </span>
          </Link>
        </div>

        {/* Global Search box */}
        <div className="relative ml-auto hidden max-w-xs flex-1 sm:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ideas, posts..."
            className="h-9 rounded-full border border-[rgba(15,23,42,0.08)] bg-white dark:bg-[#1F2937] dark:border-white/5 pl-9 text-sm placeholder:text-muted-foreground/60 shadow-xs focus-visible:ring-2 focus-visible:ring-[#22C55E]/20 focus-visible:border-[#22C55E]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="rounded-full size-9 bg-white dark:bg-[#1F2937] text-muted-foreground hover:text-[var(--brand-primary)] hover:bg-[#F0FDF4] dark:hover:bg-emerald-950/20 shrink-0 cursor-pointer border-0 shadow-sm transition-all duration-200"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="size-4 text-amber-500 transition-all duration-300 hover:rotate-45" />
            ) : (
              <Moon className="size-4 text-slate-700 dark:text-slate-350 transition-all duration-300 hover:-rotate-12" />
            )}
          </Button>

          {/* Quick Upgrade Button on Navbar */}
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="hidden sm:flex items-center gap-1 bg-[var(--brand-primary)]/10 hover:bg-[var(--brand-primary)]/20 border border-[var(--brand-primary)]/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all uppercase tracking-wider scale-95 cursor-pointer"
          >
            <Zap className="size-3.5 fill-[var(--brand-primary)]" />
            Upgrade
          </button>

          {/* Notification Bell Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full size-9 bg-white dark:bg-[#1F2937] text-muted-foreground hover:text-[var(--brand-primary)] hover:bg-[#F0FDF4] dark:hover:bg-emerald-950/20 shrink-0 cursor-pointer border-0 shadow-sm transition-all duration-200"
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl overflow-hidden border-border/60 bg-card text-foreground">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/15 border-b border-border/40">
                <span className="text-xs font-bold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-border/45 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 4).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleMarkAsRead(n._id)}
                      className={cn(
                        "flex flex-col gap-0.5 px-3.5 py-2 hover:bg-muted/30 transition-colors text-left block cursor-pointer",
                        !n.read && "bg-primary/[0.01]"
                      )}
                    >
                      <div className="flex justify-between items-baseline gap-2">
                        <span className={cn(
                          "text-[10.5px] font-bold truncate",
                          n.type === "success" ? "text-emerald-650" :
                          n.type === "error" ? "text-rose-650" : "text-foreground"
                        )}>
                          {n.title}
                        </span>
                        <span className="text-[8px] text-muted-foreground shrink-0 font-medium">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 leading-normal">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
              <DropdownMenuSeparator className="m-0" />
              <div className="p-2 text-center bg-muted/10">
                <button
                  onClick={() => setShowAllModal(true)}
                  className="text-[10.5px] font-bold text-primary hover:underline block w-full bg-transparent border-0 cursor-pointer"
                >
                  See all notifications
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 hover:bg-[var(--brand-surface)] dark:hover:bg-slate-800 rounded-lg">
                <Avatar className="size-7">
                  {session?.user?.image ? (
                    <AvatarImage src={session.user.image} alt={session.user.name ?? ""} />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-foreground md:inline">
                  {session?.user?.name ?? "GrowWave Lite User"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border/60">
              <div className="px-2.5 py-1.5 flex flex-col">
                <span className="text-xs font-bold text-foreground">{session?.user?.name ?? "Lite User"}</span>
                <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-0.5">Free Account</span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/free-user/settings" className="cursor-pointer">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUpgradeModalOpen(true)} className="cursor-pointer text-emerald-600 dark:text-emerald-400 font-semibold">
                Upgrade to Pro
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="cursor-pointer">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <UpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </>
  )
}
