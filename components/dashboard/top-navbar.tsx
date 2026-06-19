"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, Menu, Moon, Search, Sun } from "lucide-react"
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
    if (session) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 10000) // Poll every 10 seconds
      return () => clearInterval(interval)
    }
  }, [session])

  const unreadCount = notifications.filter((n) => !n.read).length

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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6 transition-colors duration-200">
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
            className="h-9 rounded-full border border-border bg-[#F8FAFC] dark:bg-[#1F2937]/50 pl-9 text-sm placeholder:text-muted-foreground/60 shadow-xs focus-visible:ring-1 focus-visible:ring-[#22C55E]/40"
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
  )
}
