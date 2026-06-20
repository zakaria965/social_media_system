"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, Menu, Moon, Search, Sun, ShieldAlert, X, AlertCircle } from "lucide-react"
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/dashboard/theme-provider"
import { cn } from "@/lib/utils"

interface TopNavbarProps {
  onMenuClick: () => void
}

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

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
      console.error(err)
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
      console.error(err)
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
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
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

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[rgba(15,23,42,0.05)] dark:border-[rgba(255,255,255,0.06)] bg-background px-4 md:px-6 transition-colors duration-200">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu trigger */}
        <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={onMenuClick}>
          <Menu className="size-5" />
        </Button>

        {/* Theme Toggle Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full size-9 border border-border bg-[#F8FAFC] dark:bg-[#1F2937]/50 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="size-4 text-amber-500 transition-all duration-300 hover:rotate-45" />
          ) : (
            <Moon className="size-4 text-slate-700 dark:text-slate-350 transition-all duration-300 hover:-rotate-12" />
          )}
        </Button>

        {/* Global Search on the left */}
        <div className="relative w-full max-w-xs shrink-0 sm:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts, accounts..."
            className="h-9 rounded-full border border-[rgba(15,23,42,0.08)] dark:border-[rgba(255,255,255,0.06)] bg-[#F8FAFC] dark:bg-[#1F2937]/50 pl-9 text-sm placeholder:text-muted-foreground/60 shadow-xs focus-visible:border-brand-green/30 focus-visible:ring-2 focus-visible:ring-brand-green/20"
          />
        </div>
      </div>

      {/* Action buttons and profile on the right */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
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
                  <Link
                    key={n._id}
                    href="/dashboard/notifications"
                    className={cn(
                      "flex flex-col gap-0.5 px-3.5 py-2 hover:bg-muted/30 transition-colors text-left block",
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
                  </Link>
                ))
              )}
            </div>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-2 text-center bg-muted/10">
              <Link
                href="/dashboard/notifications"
                className="text-[10.5px] font-bold text-primary hover:underline block w-full"
              >
                See all notifications
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="size-7">
                {session?.user?.image ? (
                  <AvatarImage src={session.user.image} alt={session.user.name ?? ""} />
                ) : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium text-foreground md:inline">
                {session?.user?.name ?? "User"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card text-foreground border border-border">
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard/settings">Settings</Link>
            </DropdownMenuItem>

            {/* Submenu for Theme selector */}
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs font-bold cursor-pointer rounded-lg text-foreground hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Moon className="size-3.5 text-muted-foreground" />
                  ) : (
                    <Sun className="size-3.5 text-muted-foreground" />
                  )}
                  <span>Theme</span>
                </div>
                <span className="text-[10px] font-normal text-muted-foreground capitalize">{theme}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="bg-card text-foreground border border-border p-1">
                  <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold cursor-pointer rounded-lg text-foreground hover:bg-muted transition-colors",
                      theme === "light" && "bg-muted"
                    )}
                  >
                    <Sun className="size-3.5 text-muted-foreground" />
                    <span>Light</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold cursor-pointer rounded-lg text-foreground hover:bg-muted transition-colors",
                      theme === "dark" && "bg-muted"
                    )}
                  >
                    <Moon className="size-3.5 text-muted-foreground" />
                    <span>Dark</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="cursor-pointer text-rose-600 dark:text-rose-450 hover:bg-rose-500/10">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    </>
  )
}
