"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import * as Icons from "lucide-react"
import {
  Plus,
  MoreHorizontal,
  User,
  Building,
  LifeBuoy,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { useWorkspace } from "@/components/dashboard/workspace-provider"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// Safe Lucide Icon Resolver
const resolveIcon = (name: string) => {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle
  return IconComponent
}

interface SidebarProps {
  open: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

interface SidebarLink {
  id: string
  href: string
  label: string
  icon: string
  badgeType?: string
  isAI?: boolean
}

const navigationItems: SidebarLink[] = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { id: "create", href: "/dashboard/create", label: "Create Post", icon: "PenSquare" },
  { id: "bulk", href: "/dashboard/bulk", label: "Bulk Scheduler", icon: "Layers" },
  { id: "scheduled", href: "/dashboard/scheduled", label: "Scheduled Posts", icon: "Calendar", badgeType: "failed" },
  { id: "calendar", href: "/dashboard/calendar", label: "Calendar", icon: "Calendar" },
  { id: "analytics", href: "/dashboard/analytics", label: "Analytics", icon: "BarChart3" },
  { id: "ai_assistant", href: "/dashboard/ai-assistant", label: "AI Assistant", icon: "Sparkles", isAI: true },
  { id: "media", href: "/dashboard/media", label: "Media Library", icon: "Image" },
  { id: "channels", href: "/dashboard/channels", label: "Channels", icon: "Link2" },
  { id: "inbox", href: "/dashboard/inbox", label: "Inbox", icon: "MessageSquare", badgeType: "inbox" },
  { id: "notifications", href: "/dashboard/notifications", label: "Notifications", icon: "Megaphone", badgeType: "notifications" },
]

export function Sidebar({ open, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { activeWorkspace, workspaces, switchWorkspace, createWorkspace } = useWorkspace()
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return
    try {
      await createWorkspace(newWorkspaceName.trim())
      setNewWorkspaceName("")
      setIsCreateWorkspaceOpen(false)
    } catch (e) {
      console.error(e)
    }
  }

  // Real-time API counts for dynamic labels
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [failedPostsCount, setFailedPostsCount] = useState(0)

  const fetchDynamicMetrics = async () => {
    try {
      const [summaryRes, notificationsRes] = await Promise.all([
        fetch("/api/dashboard/summary"),
        fetch("/api/notifications"),
      ])
      if (summaryRes.ok) {
        const sum = await summaryRes.json()
        setFailedPostsCount(sum?.posts?.filter((p: any) => p.status === "failed").length || 0)
      }
      if (notificationsRes.ok) {
        const notifs = await notificationsRes.json()
        setUnreadNotifications(notifs?.notifications?.filter((n: any) => !n.read).length || 0)
      }
    } catch (e) {
      console.error("Failed to fetch sidebar indicators:", e)
    }
  }

  useEffect(() => {
    fetchDynamicMetrics()
    const interval = setInterval(fetchDynamicMetrics, 15000)
    return () => clearInterval(interval)
  }, [])

  // Profile metadata
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
        {/* Mobile Backdrop Overlay */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-xs lg:hidden"
            onClick={onClose}
          />
        )}

        <aside
          style={{ backgroundColor: '#FCFAF6', borderRight: '1px solid #F1F5F9' }}
          className={cn(
            "fixed top-0 left-0 z-50 flex h-full flex-col transition-all duration-300 lg:translate-x-0 ease-in-out select-none",
            isCollapsed ? "lg:w-20 w-[260px]" : "w-[260px]",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Top Section — Workspace switcher */}
          <div className="flex h-16 items-center justify-between border-b border-border-light/60 dark:border-zinc-800/40 px-4">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-green text-[#0F172A] font-black text-xs shadow-sm">
                G
              </div>
              {!isCollapsed && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <span className="font-display text-sm font-extrabold text-text-primary dark:text-foreground tracking-tight flex items-center gap-1 cursor-pointer hover:opacity-80 leading-none truncate max-w-[150px]">
                      {activeWorkspace ? activeWorkspace.name : "GrowWave Pro"}
                      <span className="text-[9px] text-text-secondary shrink-0">▼</span>
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 rounded-xl border border-border-light shadow-lg bg-card p-1">
                    <div className="px-2.5 py-1.5 text-[9px] uppercase tracking-wider text-text-secondary font-black">
                      Switch Workspace
                    </div>
                    <DropdownMenuSeparator className="bg-border-light/60 my-1" />
                    {workspaces.map((w) => (
                      <DropdownMenuItem
                        key={w._id}
                        onClick={() => switchWorkspace(w._id)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg cursor-pointer hover:bg-muted text-foreground transition-all",
                          activeWorkspace?._id === w._id ? "bg-muted font-bold text-brand-green-dark dark:text-brand-green" : ""
                        )}
                      >
                        <span className="truncate">{w.name}</span>
                        {activeWorkspace?._id === w._id && <span className="text-[10px]">✓</span>}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="bg-border-light/60 my-1" />
                    <DropdownMenuItem
                      onClick={() => setIsCreateWorkspaceOpen(true)}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer text-brand-green-dark dark:text-brand-green font-bold hover:bg-brand-green/10"
                    >
                      <Plus className="size-3.5 shrink-0" />
                      Create Workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Create Workspace Dialog (Triggered from dropdown) */}
            <Dialog open={isCreateWorkspaceOpen} onOpenChange={setIsCreateWorkspaceOpen}>
              <DialogContent className="max-w-sm rounded-2xl bg-card border border-border-light shadow-xl backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground">
                    <Icons.Building className="size-4 text-brand-green-dark dark:text-brand-green" />
                    Create Workspace
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs">
                    Create a new shared team workspace for campaigns, channels, and members.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 my-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="wsName" className="text-xs font-bold text-text-primary">
                      Workspace Name
                    </Label>
                    <Input
                      id="wsName"
                      placeholder="e.g. Acme Marketing, Personal Scheduler"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      className="h-9 text-xs rounded-lg border-border"
                    />
                  </div>
                </div>
                <DialogFooter className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateWorkspaceOpen(false)}
                    className="rounded-lg text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWorkspace}
                    disabled={!newWorkspaceName.trim()}
                    className="bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-bold border-0 rounded-lg text-xs cursor-pointer"
                  >
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Collapse Trigger Button */}
            {!isCollapsed ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-6 rounded-md hover:bg-muted text-text-secondary transition-all"
                onClick={onToggleCollapse}
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="size-3.5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="size-6 rounded-md hover:bg-muted text-text-secondary mx-auto transition-all"
                onClick={onToggleCollapse}
                title="Expand Sidebar"
              >
                <PanelLeft className="size-4" />
              </Button>
            )}
          </div>

          {/* Sidebar Navigation Links */}
          <ScrollArea className="flex-1 py-4 px-3">
            <div className="flex flex-col gap-1 list-none outline-none">
              {navigationItems.map(({ id, href, label, icon, badgeType, isAI }) => {
                const active =
                  pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                
                const IconComp = resolveIcon(icon)

                // Minimal Severity Badges
                const renderBadge = () => {
                  if (isCollapsed) return null
                  if (badgeType === "failed" && failedPostsCount > 0) {
                    return (
                      <span className="ml-auto rounded bg-rose-500/10 px-1.5 py-0.5 text-[8.5px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse">
                        {failedPostsCount} Failed
                      </span>
                    )
                  }
                  if (badgeType === "inbox") {
                    return (
                      <span className="ml-auto rounded bg-emerald-500/10 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        4
                      </span>
                    )
                  }
                  if (badgeType === "notifications" && unreadNotifications > 0) {
                    return (
                      <span className="ml-auto rounded bg-amber-500/10 px-1.5 py-0.5 text-[8.5px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                        {unreadNotifications}
                      </span>
                    )
                  }
                  if (isAI) {
                    return (
                      <span className="ml-auto rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 px-1.5 py-0.5 text-[8px] font-bold text-violet-600 dark:text-violet-300 border border-violet-500/20 tracking-wider animate-pulse">
                        AI
                      </span>
                    )
                  }
                  return null
                }

                // Collapsed Indicators
                const renderCollapsedIndicator = () => {
                  if (!isCollapsed) return null
                  if (badgeType === "failed" && failedPostsCount > 0) {
                    return <span className="absolute top-1.5 right-1.5 flex size-1.5 rounded-full bg-rose-500 animate-pulse" />
                  }
                  if (badgeType === "inbox") {
                    return <span className="absolute top-1.5 right-1.5 flex size-1.5 rounded-full bg-emerald-500" />
                  }
                  if (badgeType === "notifications" && unreadNotifications > 0) {
                    return <span className="absolute top-1.5 right-1.5 flex size-1.5 rounded-full bg-amber-500" />
                  }
                  if (isAI) {
                    return <span className="absolute top-1.5 right-1.5 flex size-1.5 rounded-full bg-violet-500 animate-pulse" />
                  }
                  return null
                }

                const linkContent = (
                  <div className="group relative flex items-center select-none w-full">
                    <Link
                      href={href}
                      onClick={onClose}
                      className={cn(
                        "relative flex-1 flex items-center transition-all duration-300 ease-in-out select-none outline-none",
                        isCollapsed
                          ? "size-10 justify-center rounded-xl mx-auto"
                          : "gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold",
                        active
                          ? isAI
                            ? "bg-violet-500/[0.08] dark:bg-violet-500/[0.06] text-violet-600 dark:text-violet-400 border border-violet-500/20 dark:border-violet-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                            : "bg-brand-green/10 text-brand-green-dark dark:text-brand-green border border-brand-green/20 dark:border-brand-green/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                          : "text-text-secondary dark:text-muted-foreground hover:bg-muted/50 hover:text-text-primary border border-transparent"
                      )}
                    >
                      {/* Left glowing vertical bar */}
                      {active && !isCollapsed && (
                        <div
                          className={cn(
                            "absolute left-0 top-1/4 h-1/2 w-0.5 rounded-r",
                            isAI ? "bg-violet-500" : "bg-brand-green"
                          )}
                        />
                      )}

                      <IconComp
                        className={cn(
                          "size-3.5 shrink-0 transition-transform duration-300",
                          active
                            ? isAI
                              ? "text-violet-500 dark:text-violet-400 scale-105"
                              : "text-brand-green-dark dark:text-brand-green scale-105"
                            : "text-text-secondary/70 dark:text-muted-foreground/75",
                          isAI && "animate-pulse"
                        )}
                      />

                      {!isCollapsed && <span className="truncate leading-none">{label}</span>}
                      {renderBadge()}
                      {renderCollapsedIndicator()}
                    </Link>
                  </div>
                )

                return isCollapsed ? (
                  <Tooltip key={id}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-bold text-xs py-1.5 px-3">
                      {label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={id} className="w-full">
                    {linkContent}
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          {/* User Section (Minimalist bottom fixed area) */}
          <div className="mt-auto border-t border-border-light dark:border-zinc-800/40 pt-2 pb-3">
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
                  className="w-54 rounded-xl border border-border-light dark:border-zinc-800/40 p-1.5 shadow-lg backdrop-blur-xl bg-card"
                >
                  <DropdownMenuLabel className="px-2.5 py-2 text-[10px] font-extrabold text-text-secondary uppercase tracking-widest leading-none">
                    Account & Workspace
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
