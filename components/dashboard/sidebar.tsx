"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  BarChart3,
  Calendar,
  Home,
  Image,
  LayoutDashboard,
  Link2,
  LogOut,
  Megaphone,
  MessageSquare,
  PenSquare,
  Settings,
  Sparkles,
  Users,
  Activity,
  Layers,
  PanelLeftClose,
  PanelLeft,
  Plus,
  MoreHorizontal,
  User,
  CreditCard,
  Building,
  ChevronDown,
  LifeBuoy,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"

interface SidebarProps {
  open: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

interface SidebarLink {
  href: string
  label: string
  icon: any
  badgeType?: string
  isAI?: boolean
}

interface NavGroup {
  title: string
  links: SidebarLink[]
}

const navGroups: NavGroup[] = [
  {
    title: "Workspace",
    links: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/create", label: "Create Post", icon: PenSquare },
      { href: "/dashboard/bulk", label: "Bulk Post Scheduler", icon: Layers },
      { href: "/dashboard/scheduled", label: "Scheduled Posts", icon: Calendar, badgeType: "failed" },
      { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
      { href: "/dashboard/queue", label: "Queue Monitoring", icon: Activity },
    ],
  },
  {
    title: "Channels",
    links: [
      { href: "/dashboard/channels", label: "Channels Manager", icon: Link2 },
      { href: "/dashboard/inbox", label: "Inbox", icon: MessageSquare, badgeType: "inbox" },
      { href: "/dashboard/notifications", label: "Notifications", icon: Megaphone, badgeType: "notifications" },
      { href: "/dashboard/channels", label: "Connection Health", icon: Activity, badgeType: "health" },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/ai-assistant", label: "AI Assistant", icon: Sparkles, isAI: true },
      { href: "/dashboard/media", label: "Media Library", icon: Image },
    ],
  },
  {
    title: "Collaboration",
    links: [
      { href: "/dashboard/team", label: "Team", icon: Users },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
]

export function Sidebar({ open, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Collapsible Accordion sections state
  const [sectionsExpanded, setSectionsExpanded] = useState<Record<string, boolean>>({
    Workspace: true,
    Channels: true,
    Intelligence: true,
    Collaboration: true,
  })

  // Real-time API States
  const [summary, setSummary] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [summaryRes, notificationsRes] = await Promise.all([
        fetch("/api/dashboard/summary"),
        fetch("/api/notifications"),
      ])

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        setSummary(summaryData)
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json()
        setNotifications(notificationsData.notifications || [])
      }
    } catch (error) {
      console.error("Failed to fetch sidebar metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000) // Poll every 15s

    // Load folder expansions
    const savedFolders = localStorage.getItem("growwave-sidebar-sections")
    if (savedFolders !== null) {
      try {
        setSectionsExpanded(JSON.parse(savedFolders))
      } catch (e) {
        console.error(e)
      }
    }

    return () => clearInterval(interval)
  }, [])

  const toggleSection = (section: string) => {
    const nextValue = {
      ...sectionsExpanded,
      [section]: !sectionsExpanded[section],
    }
    setSectionsExpanded(nextValue)
    localStorage.setItem("growwave-sidebar-sections", JSON.stringify(nextValue))
  }

  // Live Metric Calcs
  const unreadNotifications = notifications.filter((n) => !n.read).length
  const failedPostsCount = summary?.posts?.filter((p: any) => p.status === "failed").length || 0
  const connectedChannelsCount = summary?.accounts?.filter((a: any) => a.status === "connected").length || 0

  const scheduledTodayCount =
    summary?.posts?.filter((p: any) => {
      if (p.status !== "scheduled" || !p.scheduledAt) return false
      const d = new Date(p.scheduledAt)
      const today = new Date()
      return d.toDateString() === today.toDateString()
    }).length || 0

  const totalScheduledCount =
    summary?.posts?.filter((p: any) => p.status === "scheduled").length || 0

  // Connection Health diagnostics
  let healthText = "All Systems Operational"
  let healthDotClass = "bg-emerald-500 animate-pulse shadow-[0_0_8px_#22C55E]"
  let healthTextClass = "text-emerald-600 dark:text-emerald-400"
  let healthBadgeClass = "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"

  const expiredAccount = summary?.accounts?.find((a: any) => a.status === "expired")
  const errorAccount = summary?.accounts?.find((a: any) => a.status === "permission_error" || a.status === "sync_error")

  if (expiredAccount) {
    healthText = `${expiredAccount.platform.toUpperCase()} Token Expired`
    healthDotClass = "bg-amber-500 shadow-[0_0_8px_#F59E0B]"
    healthTextClass = "text-amber-600 dark:text-amber-400"
    healthBadgeClass = "bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse"
  } else if (errorAccount) {
    healthText = `${errorAccount.platform.toUpperCase()} Reconnect Needed`
    healthDotClass = "bg-rose-500 shadow-[0_0_8px_#EF4444]"
    healthTextClass = "text-rose-600 dark:text-rose-400"
    healthBadgeClass = "bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-pulse"
  } else if (summary?.accounts && connectedChannelsCount === 0) {
    healthText = "No Channels Connected"
    healthDotClass = "bg-zinc-400"
    healthTextClass = "text-muted-foreground"
    healthBadgeClass = "bg-zinc-100 text-zinc-500 border border-zinc-200"
  }

  // Profile data
  const userName = session?.user?.name || "User Workspace"
  const userImage = session?.user?.image
  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "GW"

  return (
    <TooltipProvider delayDuration={100}>
      <>
        {/* Mobile Overlay */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}

        <aside
          className={cn(
            "fixed top-0 left-0 z-50 flex h-full flex-col border-r border-border-light dark:border-zinc-800/40 bg-sidebar-bg dark:bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 lg:translate-x-0 ease-in-out select-none",
            isCollapsed ? "lg:w-20 w-64" : "w-64",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Header Workspace Card */}
          <div className="p-4 border-b border-border-light dark:border-zinc-800/40">
            {!isCollapsed ? (
              <div className="relative rounded-2xl border border-brand-green/20 dark:border-emerald-500/10 bg-gradient-to-br from-brand-green/[0.04] to-teal-500/[0.04] p-4 shadow-sm shadow-brand-green/[0.02] backdrop-blur-md overflow-hidden group">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 overflow-hidden"
                    onClick={onClose}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-green text-[#0F172A] font-black shadow-md shadow-brand-green/25">
                      G
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="font-display text-sm font-extrabold text-text-primary dark:text-foreground tracking-tight">
                        GrowWave Pro
                      </span>
                      <span className="text-[9.5px] text-text-secondary dark:text-muted-foreground font-semibold mt-0.5">
                        Pro Workspace
                      </span>
                    </div>
                  </Link>

                  {/* Desktop Collapse Trigger */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 rounded-md border border-border-light dark:border-zinc-800/40 bg-background/50 hover:bg-muted text-text-secondary transition-all"
                    onClick={onToggleCollapse}
                    title="Collapse Sidebar"
                  >
                    <PanelLeftClose className="size-3.5" />
                  </Button>
                </div>

                {/* Card Visual Metrics */}
                <div className="space-y-1.5 border-t border-border-light/60 dark:border-zinc-800/20 pt-2.5">
                  <div className="flex items-center gap-1.5 text-[10.5px] text-text-secondary dark:text-muted-foreground font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />
                    <span>{connectedChannelsCount} Connected Channels</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-text-secondary dark:text-muted-foreground font-bold">
                    <span className="text-violet-500 dark:text-violet-400">⚡</span>
                    <span>AI Active</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-text-secondary dark:text-muted-foreground font-bold">
                    <span className="text-emerald-500">📈</span>
                    <span>{totalScheduledCount} Posts Scheduled</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="flex size-9 items-center justify-center rounded-xl bg-brand-green text-[#0F172A] font-black shadow-md shadow-brand-green/25 hover:scale-105 transition-transform"
                >
                  G
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg border border-border-light dark:border-zinc-800/40 bg-background/50 hover:bg-muted text-text-secondary transition-all"
                  onClick={onToggleCollapse}
                  title="Expand Sidebar"
                >
                  <PanelLeft className="size-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Quick Create CTA Floating Area */}
          <div className="px-4 py-3">
            {!isCollapsed ? (
              <Link href="/dashboard/create" onClick={onClose} className="block w-full">
                <Button className="w-full justify-start gap-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-extrabold shadow-md shadow-brand-green/10 hover:shadow-brand-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group py-6 px-5 border-0 select-none">
                  <PenSquare className="size-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span className="truncate text-xs tracking-wider uppercase font-black">Create Post</span>
                </Button>
              </Link>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/dashboard/create" onClick={onClose} className="mx-auto block">
                    <Button
                      size="icon"
                      className="size-11 mx-auto flex items-center justify-center rounded-xl bg-brand-green hover:bg-brand-green-hover text-[#0F172A] shadow-md shadow-brand-green/10 hover:shadow-brand-green/20 hover:scale-[1.05] transition-all duration-300 group border-0"
                    >
                      <Plus className="size-5 shrink-0 transition-transform group-hover:scale-110" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-black text-xs">
                  Create Post
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Collapsible Accordion Navigation Tree */}
          <ScrollArea className="flex-1 py-1">
            <nav className="flex flex-col gap-4.5 px-3">
              {navGroups.map((group) => {
                const isExpanded = sectionsExpanded[group.title] !== false

                return (
                  <div key={group.title} className="flex flex-col gap-1">
                    {/* Accordion Folder Trigger Header */}
                    {!isCollapsed ? (
                      <button
                        onClick={() => toggleSection(group.title)}
                        className="flex w-full items-center justify-between px-3.5 py-1.5 text-[9.5px] font-extrabold uppercase tracking-widest text-text-secondary/70 hover:text-text-primary transition-colors text-left select-none outline-none"
                      >
                        <span>{group.title}</span>
                        <ChevronDown
                          className={cn(
                            "size-3 text-text-muted transition-transform duration-300",
                            isExpanded ? "transform rotate-0" : "transform -rotate-90"
                          )}
                        />
                      </button>
                    ) : (
                      <div className="px-2">
                        <Separator className="bg-border-light/60 dark:bg-zinc-800/40 opacity-70" />
                      </div>
                    )}

                    {/* Accordion Folder Sublinks */}
                    <div
                      className={cn(
                        "flex flex-col gap-0.5 overflow-hidden transition-all duration-300 ease-in-out",
                        !isCollapsed && !isExpanded ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[500px] opacity-100"
                      )}
                    >
                      {group.links.map(({ href, label, icon: Icon, badgeType, isAI }) => {
                        const active =
                          pathname === href || (href !== "/dashboard" && pathname.startsWith(href))

                        // Dynamic Severity badge helper
                        const renderBadge = () => {
                          if (isCollapsed) return null
                          if (badgeType === "failed" && failedPostsCount > 0) {
                            return (
                              <span className="ml-auto rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse">
                                {failedPostsCount} Failed
                              </span>
                            )
                          }
                          if (badgeType === "inbox") {
                            return (
                              <span className="ml-auto rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                4
                              </span>
                            )
                          }
                          if (badgeType === "notifications" && unreadNotifications > 0) {
                            return (
                              <span className="ml-auto rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {unreadNotifications}
                              </span>
                            )
                          }
                          if (badgeType === "health") {
                            return (
                              <span className={cn("ml-auto rounded-full px-1.5 py-0.5 text-[8.5px] font-bold", healthBadgeClass)}>
                                {expiredAccount || errorAccount ? "Alert" : "OK"}
                              </span>
                            )
                          }
                          if (isAI) {
                            return (
                              <span className="ml-auto rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 px-2 py-0.5 text-[8px] font-extrabold text-violet-600 dark:text-violet-300 border border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.15)] tracking-wider">
                                AI
                              </span>
                            )
                          }
                          return null
                        }

                        // Collapsed modes dynamic micro indicators
                        const renderCollapsedIndicator = () => {
                          if (!isCollapsed) return null
                          if (badgeType === "failed" && failedPostsCount > 0) {
                            return <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-rose-500 shadow-[0_0_6px_#EF4444] animate-pulse" />
                          }
                          if (badgeType === "inbox") {
                            return <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#22C55E]" />
                          }
                          if (badgeType === "notifications" && unreadNotifications > 0) {
                            return <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-amber-500 shadow-[0_0_6px_#F59E0B]" />
                          }
                          if (badgeType === "health" && (expiredAccount || errorAccount)) {
                            return <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-rose-500 animate-pulse" />
                          }
                          if (isAI) {
                            return <span className="absolute top-1.5 right-1.5 flex size-1.5 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.5)] animate-pulse" />
                          }
                          return null
                        }

                        const linkContent = (
                          <Link
                            href={href}
                            onClick={onClose}
                            className={cn(
                              "relative flex items-center transition-all duration-300 ease-in-out select-none outline-none",
                              isCollapsed
                                ? "size-10 justify-center rounded-xl mx-auto"
                                : "gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold",
                              active
                                ? isAI
                                  ? "bg-violet-500/[0.08] dark:bg-violet-500/[0.06] text-violet-600 dark:text-violet-400 border border-violet-500/20 dark:border-violet-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                                  : "bg-brand-green/10 dark:bg-brand-green/8 text-brand-green-dark dark:text-brand-green border border-brand-green/20 dark:border-brand-green/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_8px_rgba(48,252,71,0.05)]"
                                : "text-text-secondary dark:text-muted-foreground hover:bg-muted/50 hover:text-text-primary border border-transparent"
                            )}
                          >
                            {/* Accent Neon bar */}
                            {active && !isCollapsed && (
                              <div
                                className={cn(
                                  "absolute left-0 top-1/4 h-1/2 w-0.5 rounded-r",
                                  isAI ? "bg-violet-500" : "bg-brand-green"
                                )}
                              />
                            )}

                            <Icon
                              className={cn(
                                "size-4 shrink-0 transition-transform duration-300",
                                active
                                  ? isAI
                                    ? "text-violet-500 dark:text-violet-400 scale-105"
                                    : "text-brand-green-dark dark:text-brand-green scale-105"
                                  : "text-text-secondary dark:text-muted-foreground",
                                isAI && "animate-pulse"
                              )}
                            />

                            {!isCollapsed && <span className="truncate">{label}</span>}
                            {renderBadge()}
                            {renderCollapsedIndicator()}
                          </Link>
                        )

                        return isCollapsed ? (
                          <Tooltip key={href}>
                            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                            <TooltipContent side="right" className="font-bold text-xs py-1.5 px-3">
                              {label}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div key={href} className="group">
                            {linkContent}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </nav>

            {/* Embedded Live Workspace Health Widget */}
            {!isCollapsed && (
              <div className="mx-3.5 my-5 rounded-2xl border border-border-light dark:border-zinc-800/40 bg-zinc-500/[0.02] dark:bg-zinc-500/[0.01] p-4 backdrop-blur-md shadow-sm transition-all hover:bg-zinc-500/[0.03]">
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[9.5px] font-extrabold text-text-primary dark:text-foreground tracking-widest uppercase opacity-85">
                    Workspace Health
                  </span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse shadow-[0_0_6px_#30FC47]" />
                </div>
                <div className="space-y-2 text-[10.5px]">
                  <div className="flex justify-between items-center text-text-secondary dark:text-muted-foreground">
                    <span>Connected Accounts</span>
                    <span className="font-bold text-text-primary dark:text-foreground">{connectedChannelsCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary dark:text-muted-foreground">
                    <span>Scheduled Today</span>
                    <span className="font-bold text-text-primary dark:text-foreground">{scheduledTodayCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary dark:text-muted-foreground">
                    <span>Publishing Queue</span>
                    <span className="font-bold text-emerald-500 dark:text-emerald-400">Healthy</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary dark:text-muted-foreground">
                    <span>AI Status</span>
                    <span className="font-bold text-violet-500 dark:text-violet-400">Active</span>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Bottom Fixed Settings and User Section */}
          <div className="mt-auto border-t border-border-light dark:border-zinc-800/40 pt-2 pb-3">
            {/* Connection Diagnostics Banner */}
            {!isCollapsed ? (
              <div className="mx-3.5 mb-2.5 flex items-center gap-2 rounded-xl border border-border-light/60 dark:border-zinc-800/40 bg-muted/20 px-3.5 py-2 text-[10.5px] font-bold text-text-secondary transition-all duration-300 hover:bg-muted/40">
                <span className={cn("size-2 rounded-full shrink-0", healthDotClass)} />
                <span className={cn("truncate", healthTextClass)}>
                  {healthText}
                </span>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mx-auto mb-2.5 flex size-8 items-center justify-center rounded-xl bg-muted/20 hover:bg-muted/40 cursor-pointer">
                    <span className={cn("size-2 rounded-full shrink-0", healthDotClass)} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-bold text-xs py-1.5 px-3">
                  {healthText}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Profile trigger card with dropdown trigger menu */}
            <div className="px-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {isCollapsed ? (
                    <button className="mx-auto flex size-10 items-center justify-center rounded-xl hover:bg-muted/50 text-text-secondary transition-all outline-none border border-transparent hover:border-border-light/40 select-none">
                      <Avatar className="size-8 ring-1 ring-border-light">
                        {userImage ? <AvatarImage src={userImage} alt={userName} /> : null}
                        <AvatarFallback className="bg-brand-green/10 text-brand-green-dark text-xs font-black select-none">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  ) : (
                    <button className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-muted/50 border border-transparent hover:border-border-light/40 transition-all duration-300 text-left outline-none select-none">
                      <Avatar className="size-9 ring-1 ring-border-light">
                        {userImage ? <AvatarImage src={userImage} alt={userName} /> : null}
                        <AvatarFallback className="bg-brand-green/10 text-brand-green-dark text-xs font-black select-none">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-extrabold text-text-primary dark:text-foreground truncate leading-tight select-none">
                          {userName}
                        </p>
                        <p className="text-[9.5px] text-text-secondary dark:text-muted-foreground font-semibold truncate leading-none mt-1.5 select-none">
                          Pro Workspace
                        </p>
                      </div>
                      <MoreHorizontal className="size-3.5 text-text-secondary shrink-0" />
                    </button>
                  )}
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align={isCollapsed ? "start" : "end"}
                  side="top"
                  className="w-54 rounded-xl border border-border-light dark:border-zinc-800/40 p-1.5 shadow-lg backdrop-blur-xl bg-card/95"
                >
                  <DropdownMenuLabel className="px-2.5 py-2 text-[10px] font-extrabold text-text-secondary uppercase tracking-widest leading-none">
                    Settings & Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border-light/60 dark:bg-zinc-800/40 my-1" />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 px-2.5 py-2 text-xs font-bold cursor-pointer rounded-lg text-text-primary dark:text-foreground hover:bg-muted/70 transition-colors"
                    >
                      <User className="size-3.5 text-text-secondary" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 px-2.5 py-2 text-xs font-bold cursor-pointer rounded-lg text-text-primary dark:text-foreground hover:bg-muted/70 transition-colors"
                    >
                      <Building className="size-3.5 text-text-secondary" />
                      <span>Workspace Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href="mailto:support@growwave.ai?subject=GrowWave%20Support%20Request"
                      className="flex items-center gap-2 px-2.5 py-2 text-xs font-bold cursor-pointer rounded-lg text-text-primary dark:text-foreground hover:bg-muted/70 transition-colors"
                    >
                      <LifeBuoy className="size-3.5 text-text-secondary" />
                      <span>Support & Help</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-light/60 dark:bg-zinc-800/40 my-1" />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-2 px-2.5 py-2 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer rounded-lg transition-colors"
                  >
                    <LogOut className="size-3.5" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>
      </>
    </TooltipProvider>
  )
}
