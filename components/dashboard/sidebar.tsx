"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Reorder } from "framer-motion"
import * as Icons from "lucide-react"
import {
  Plus,
  MoreHorizontal,
  ChevronDown,
  User,
  Building,
  LifeBuoy,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Settings2,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  RotateCcw,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
  originalSectionId: string
}

interface NavGroup {
  id: string
  title: string
  emoji: string
  icon?: string
  color: string
  visible: boolean
  isCustom?: boolean
  links: SidebarLink[]
}

const defaultStructure: NavGroup[] = [
  {
    id: "workspace",
    title: "Workspace",
    emoji: "💼",
    icon: "Briefcase",
    color: "green",
    visible: true,
    links: [
      { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", originalSectionId: "workspace" },
      { id: "create", href: "/dashboard/create", label: "Create Post", icon: "PenSquare", originalSectionId: "workspace" },
      { id: "bulk", href: "/dashboard/bulk", label: "Bulk Post Scheduler", icon: "Layers", originalSectionId: "workspace" },
      { id: "scheduled", href: "/dashboard/scheduled", label: "Scheduled Posts", icon: "Calendar", badgeType: "failed", originalSectionId: "workspace" },
      { id: "calendar", href: "/dashboard/calendar", label: "Calendar", icon: "Calendar", originalSectionId: "workspace" },
      { id: "queue", href: "/dashboard/queue", label: "Queue Monitoring", icon: "Activity", originalSectionId: "workspace" },
    ],
  },
  {
    id: "channels",
    title: "Channels",
    emoji: "📢",
    icon: "Megaphone",
    color: "blue",
    visible: true,
    links: [
      { id: "channels_mgr", href: "/dashboard/channels", label: "Channels Manager", icon: "Link2", originalSectionId: "channels" },
      { id: "inbox", href: "/dashboard/inbox", label: "Inbox", icon: "MessageSquare", badgeType: "inbox", originalSectionId: "channels" },
      { id: "notifications", href: "/dashboard/notifications", label: "Notifications", icon: "Megaphone", badgeType: "notifications", originalSectionId: "channels" },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence",
    emoji: "🤖",
    icon: "Sparkles",
    color: "purple",
    visible: true,
    links: [
      { id: "analytics", href: "/dashboard/analytics", label: "Analytics", icon: "BarChart3", originalSectionId: "intelligence" },
      { id: "ai_assistant", href: "/dashboard/ai-assistant", label: "AI Assistant", icon: "Sparkles", isAI: true, originalSectionId: "intelligence" },
      { id: "media", href: "/dashboard/media", label: "Media Library", icon: "Image", originalSectionId: "intelligence" },
    ],
  },
  {
    id: "collaboration",
    title: "Collaboration",
    emoji: "👥",
    icon: "Settings",
    color: "orange",
    visible: true,
    links: [
      { id: "team", href: "/dashboard/team", label: "Team", icon: "Users", originalSectionId: "collaboration" },
      { id: "settings", href: "/dashboard/settings", label: "Settings", icon: "Settings", originalSectionId: "collaboration" },
    ],
  },
]

const colorOptions = [
  { id: "green", name: "Green", cssClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 active:bg-emerald-500/15" },
  { id: "purple", name: "Purple", cssClass: "text-purple-500 bg-purple-500/10 border-purple-500/20 active:bg-purple-500/15" },
  { id: "blue", name: "Blue", cssClass: "text-blue-500 bg-blue-500/10 border-blue-500/20 active:bg-blue-500/15" },
  { id: "orange", name: "Orange", cssClass: "text-orange-500 bg-orange-500/10 border-orange-500/20 active:bg-orange-500/15" },
  { id: "red", name: "Red", cssClass: "text-rose-500 bg-rose-500/10 border-rose-500/20 active:bg-rose-500/15" },
  { id: "pink", name: "Pink", cssClass: "text-pink-500 bg-pink-500/10 border-pink-500/20 active:bg-pink-500/15" },
  { id: "yellow", name: "Yellow", cssClass: "text-amber-500 bg-amber-500/10 border-amber-500/20 active:bg-amber-500/15" },
  { id: "teal", name: "Teal", cssClass: "text-teal-500 bg-teal-500/10 border-teal-500/20 active:bg-teal-500/15" },
  { id: "indigo", name: "Indigo", cssClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20 active:bg-indigo-500/15" },
]

const emojiOptions = ["🚀", "📈", "🤖", "💡", "📢", "📅", "💼", "🎯", "🔥", "📊", "📚", "👥"]

const iconOptions = [
  { id: "Briefcase", label: "Briefcase" },
  { id: "BarChart3", label: "Chart" },
  { id: "Calendar", label: "Calendar" },
  { id: "Rocket", label: "Rocket" },
  { id: "Bot", label: "Robot" },
  { id: "Folder", label: "Folder" },
  { id: "Sparkles", label: "Sparkles" },
  { id: "Users", label: "Users" },
  { id: "Settings", label: "Settings" },
  { id: "Megaphone", label: "Megaphone" },
]

export function Sidebar({ open, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  // customizable workspace tree state
  const [structure, setStructure] = useState<NavGroup[]>([])
  const [sectionsExpanded, setSectionsExpanded] = useState<Record<string, boolean>>({})
  
  // Custom Section creation form state
  const [newSecName, setNewSecName] = useState("")
  const [newSecEmoji, setNewSecEmoji] = useState("🚀")
  const [newSecIcon, setNewSecIcon] = useState("")
  const [newSecColor, setNewSecColor] = useState("green")

  // Customize Dialog open trigger
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)

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

    // 1. Load initial localStorage state fast (to prevent page flash)
    const saved = localStorage.getItem("growwave-sidebar-structure-v3")
    if (saved !== null) {
      try {
        setStructure(JSON.parse(saved))
      } catch (e) {
        setStructure(defaultStructure)
      }
    } else {
      setStructure(defaultStructure)
    }

    const savedAccordions = localStorage.getItem("growwave-sidebar-sections-v3")
    if (savedAccordions !== null) {
      try {
        setSectionsExpanded(JSON.parse(savedAccordions))
      } catch (e) {}
    }

    // 2. Load synced database states (secure login synchronization)
    const loadDatabasePreferences = async () => {
      try {
        const res = await fetch("/api/user/sidebar-preferences")
        if (res.ok) {
          const data = await res.json()
          if (data.preferences) {
            if (data.preferences.structure) {
              setStructure(data.preferences.structure)
              localStorage.setItem("growwave-sidebar-structure-v3", JSON.stringify(data.preferences.structure))
            }
            if (data.preferences.sectionsExpanded) {
              setSectionsExpanded(data.preferences.sectionsExpanded)
              localStorage.setItem("growwave-sidebar-sections-v3", JSON.stringify(data.preferences.sectionsExpanded))
            }
          }
        }
      } catch (err) {
        console.error("Failed to restore sidebar preferences from database:", err)
      }
    }

    loadDatabasePreferences()
    return () => clearInterval(interval)
  }, [])

  // Sync state changes with localStorage and MongoDB
  const persistPreferences = async (newStructure: NavGroup[], newAccordions: Record<string, boolean>) => {
    setStructure(newStructure)
    setSectionsExpanded(newAccordions)
    localStorage.setItem("growwave-sidebar-structure-v3", JSON.stringify(newStructure))
    localStorage.setItem("growwave-sidebar-sections-v3", JSON.stringify(newAccordions))

    try {
      await fetch("/api/user/sidebar-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structure: newStructure,
          sectionsExpanded: newAccordions,
          isCollapsed,
        }),
      })
    } catch (error) {
      console.error("Failed to save customization preferences to MongoDB:", error)
    }
  }

  const toggleSection = (sectionId: string) => {
    const nextVal = {
      ...sectionsExpanded,
      [sectionId]: sectionsExpanded[sectionId] === false ? true : false,
    }
    persistPreferences(structure, nextVal)
  }

  // Create Section
  const handleAddSection = () => {
    if (!newSecName.trim()) return
    const newId = "custom_" + Date.now()
    const newGroup: NavGroup = {
      id: newId,
      title: newSecName.trim(),
      emoji: newSecEmoji,
      icon: newSecIcon,
      color: newSecColor,
      visible: true,
      isCustom: true,
      links: [],
    }
    persistPreferences([...structure, newGroup], sectionsExpanded)
    
    // reset form inputs
    setNewSecName("")
    setNewSecEmoji("🚀")
    setNewSecIcon("")
    setNewSecColor("green")
    setIsCustomizeOpen(false)
  }

  // Rename Section
  const handleRenameSection = (sectionId: string, nextTitle: string) => {
    if (!nextTitle.trim()) return
    const updated = structure.map((g) => (g.id === sectionId ? { ...g, title: nextTitle.trim() } : g))
    persistPreferences(updated, sectionsExpanded)
  }

  // Change Color
  const handleChangeColor = (sectionId: string, color: string) => {
    const updated = structure.map((g) => (g.id === sectionId ? { ...g, color } : g))
    persistPreferences(updated, sectionsExpanded)
  }

  // Change Emoji / Icon (Selecting one overrides the other)
  const handleChangeEmoji = (sectionId: string, emoji: string) => {
    const updated = structure.map((g) => (g.id === sectionId ? { ...g, emoji, icon: "" } : g))
    persistPreferences(updated, sectionsExpanded)
  }

  const handleChangeIcon = (sectionId: string, icon: string) => {
    const updated = structure.map((g) => (g.id === sectionId ? { ...g, icon, emoji: "" } : g))
    persistPreferences(updated, sectionsExpanded)
  }

  // Toggle Visibility
  const handleToggleVisibility = (sectionId: string, visible: boolean) => {
    const updated = structure.map((g) => (g.id === sectionId ? { ...g, visible } : g))
    persistPreferences(updated, sectionsExpanded)
  }

  // Delete Section and fallback links
  const handleDeleteSection = (sectionId: string) => {
    const section = structure.find((g) => g.id === sectionId)
    if (!section) return
    const linksToFallback = section.links

    const updated = structure
      .filter((g) => g.id !== sectionId)
      .map((g) => {
        const linksToRestore = linksToFallback.filter((l) => l.originalSectionId === g.id)
        if (linksToRestore.length > 0) {
          return { ...g, links: [...g.links, ...linksToRestore] }
        }
        return g
      })
    persistPreferences(updated, sectionsExpanded)
  }

  // Reordering folders manually via Context menu triggers
  const handleMoveSectionUp = (index: number) => {
    if (index === 0) return
    const nextStructure = [...structure]
    const temp = nextStructure[index]
    nextStructure[index] = nextStructure[index - 1]
    nextStructure[index - 1] = temp
    persistPreferences(nextStructure, sectionsExpanded)
  }

  const handleMoveSectionDown = (index: number) => {
    if (index === structure.length - 1) return
    const nextStructure = [...structure]
    const temp = nextStructure[index]
    nextStructure[index] = nextStructure[index + 1]
    nextStructure[index + 1] = temp
    persistPreferences(nextStructure, sectionsExpanded)
  }

  // Reordering folders via Drag and Drop
  const handleDragReorder = (newVisibleList: NavGroup[]) => {
    const hiddenItems = structure.filter((g) => !g.visible)
    const nextStructure = [...newVisibleList, ...hiddenItems]
    persistPreferences(nextStructure, sectionsExpanded)
  }

  // Link shifting options
  const handleMoveLinkToSection = (linkId: string, fromSectionId: string, targetSectionId: string) => {
    const sourceGroup = structure.find((g) => g.id === fromSectionId)
    const targetGroup = structure.find((g) => g.id === targetSectionId)
    if (!sourceGroup || !targetGroup) return

    const linkToMove = sourceGroup.links.find((l) => l.id === linkId)
    if (!linkToMove) return

    const updated = structure.map((g) => {
      if (g.id === fromSectionId) {
        return { ...g, links: g.links.filter((l) => l.id !== linkId) }
      }
      if (g.id === targetSectionId) {
        return { ...g, links: [...g.links, linkToMove] }
      }
      return g
    })
    persistPreferences(updated, sectionsExpanded)
  }

  const handleMoveLinkUp = (sectionId: string, linkIndex: number) => {
    if (linkIndex === 0) return
    const updated = structure.map((g) => {
      if (g.id === sectionId) {
        const nextLinks = [...g.links]
        const temp = nextLinks[linkIndex]
        nextLinks[linkIndex] = nextLinks[linkIndex - 1]
        nextLinks[linkIndex - 1] = temp
        return { ...g, links: nextLinks }
      }
      return g
    })
    persistPreferences(updated, sectionsExpanded)
  }

  const handleMoveLinkDown = (sectionId: string, linkIndex: number) => {
    const group = structure.find((g) => g.id === sectionId)
    if (!group || linkIndex === group.links.length - 1) return
    const updated = structure.map((g) => {
      if (g.id === sectionId) {
        const nextLinks = [...g.links]
        const temp = nextLinks[linkIndex]
        nextLinks[linkIndex] = nextLinks[linkIndex + 1]
        nextLinks[linkIndex + 1] = temp
        return { ...g, links: nextLinks }
      }
      return g
    })
    persistPreferences(updated, sectionsExpanded)
  }

  // Reset all customizations back to factory defaults
  const handleResetSidebar = async () => {
    setStructure(defaultStructure)
    setSectionsExpanded({})
    localStorage.removeItem("growwave-sidebar-structure-v3")
    localStorage.removeItem("growwave-sidebar-sections-v3")

    try {
      await fetch("/api/user/sidebar-preferences", {
        method: "DELETE",
      })
    } catch (e) {
      console.error("Failed to wipe database customization preferences:", e)
    }
    setIsCustomizeOpen(false)
  }

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
          className={cn(
            "fixed top-0 left-0 z-50 flex h-full flex-col border-r border-border-light dark:border-zinc-800/40 bg-sidebar-bg dark:bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 lg:translate-x-0 ease-in-out select-none",
            isCollapsed ? "lg:w-20 w-64" : "w-64",
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
                <span className="font-display text-sm font-extrabold text-text-primary dark:text-foreground tracking-tight flex items-center gap-1 cursor-pointer hover:opacity-80 leading-none">
                  GrowWave Pro
                  <span className="text-[9px] text-text-secondary">▼</span>
                </span>
              )}
            </div>

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

          {/* Customize Action Button (Global Plus) */}
          <div className="px-4 py-2 flex gap-1.5 border-b border-border-light/40 dark:border-zinc-800/20">
            <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
              <DialogTrigger asChild>
                {!isCollapsed ? (
                  <Button className="flex-1 gap-2 rounded-xl bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-extrabold shadow-sm hover:scale-[1.01] transition-all duration-200 py-5 text-xs border-0 cursor-pointer">
                    <Plus className="size-4 shrink-0" />
                    <span>Customize Workspace</span>
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" className="size-10 mx-auto flex items-center justify-center rounded-xl bg-brand-green hover:bg-brand-green-hover text-[#0F172A] shadow-sm border-0 cursor-pointer">
                        <Plus className="size-4 shrink-0" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-bold text-xs">
                      Customize Workspace
                    </TooltipContent>
                  </Tooltip>
                )}
              </DialogTrigger>

              <DialogContent className="max-w-md rounded-2xl bg-card border border-border-light shadow-xl backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings2 className="size-5 text-brand-green-dark" />
                    Workspace Customizer
                  </DialogTitle>
                  <DialogDescription>
                    Configure default layouts, build custom sections, or reset your workspace settings.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 my-4">
                  {/* Create New Section Card */}
                  <div className="rounded-xl border border-border-light bg-muted/20 p-4 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Create Custom Folder Section
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="secName" className="text-xs font-bold text-text-primary">
                          Section Name
                        </Label>
                        <Input
                          id="secName"
                          placeholder="e.g. Marketing, Clients, Personal"
                          value={newSecName}
                          onChange={(e) => setNewSecName(e.target.value)}
                          className="h-9 text-xs rounded-lg"
                        />
                      </div>

                      {/* Emoji Selector */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-text-primary">Section Emoji Icon</Label>
                        <div className="flex flex-wrap gap-2">
                          {emojiOptions.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setNewSecEmoji(emoji)
                                setNewSecIcon("") // clear icon
                              }}
                              className={cn(
                                "flex size-7 items-center justify-center rounded-lg border text-sm transition-all cursor-pointer",
                                newSecEmoji === emoji && !newSecIcon
                                  ? "border-brand-green-dark bg-brand-green/20 scale-105"
                                  : "border-border-light bg-card hover:bg-muted"
                              )}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Lucide Custom Icons Picker */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-text-primary">Or Select Lucide Custom Icon</Label>
                        <div className="flex flex-wrap gap-2">
                          {iconOptions.map((opt) => {
                            const ResolvedIconComp = resolveIcon(opt.id)
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setNewSecIcon(opt.id)
                                  setNewSecEmoji("") // clear emoji
                                }}
                                className={cn(
                                  "flex size-7 items-center justify-center rounded-lg border text-sm transition-all cursor-pointer",
                                  newSecIcon === opt.id && !newSecEmoji
                                    ? "border-brand-green-dark bg-brand-green/20 scale-105"
                                    : "border-border-light bg-card hover:bg-muted"
                                )}
                                title={opt.label}
                              >
                                <ResolvedIconComp className="size-4" />
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Color Selector */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-text-primary">Section Accent Color</Label>
                        <div className="flex flex-wrap gap-2">
                          {colorOptions.map((col) => (
                            <button
                              key={col.id}
                              type="button"
                              onClick={() => setNewSecColor(col.id)}
                              className={cn(
                                "flex size-7 items-center justify-center rounded-full border text-xs text-transparent transition-all cursor-pointer",
                                col.cssClass.split(" ")[0],
                                newSecColor === col.id
                                  ? "ring-2 ring-offset-2 ring-brand-green scale-105"
                                  : "opacity-80 hover:opacity-100"
                              )}
                              style={{ backgroundColor: col.id === "yellow" ? "#F59E0B" : col.id }}
                            >
                              •
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleAddSection}
                      disabled={!newSecName.trim()}
                      className="w-full mt-2 bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-bold border-0 rounded-lg text-xs cursor-pointer"
                    >
                      Add Custom Section
                    </Button>
                  </div>

                  {/* Defaults Visibility list */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Section Visibility & Renaming
                    </h3>
                    <div className="divide-y divide-border-light max-h-40 overflow-y-auto pr-1">
                      {structure.map((g) => (
                        <div key={g.id} className="flex items-center justify-between py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span>{g.emoji ? g.emoji : "📂"}</span>
                            <Input
                              value={g.title}
                              onChange={(e) => handleRenameSection(g.id, e.target.value)}
                              className="h-7 w-36 px-1.5 py-0.5 text-xs font-semibold rounded border border-transparent hover:border-border-light focus:border-border-light bg-transparent"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-text-secondary">
                              {g.visible ? "Visible" : "Hidden"}
                            </span>
                            <Switch
                              checked={g.visible}
                              onCheckedChange={(checked) => handleToggleVisibility(g.id, checked)}
                              className="data-state-checked:bg-brand-green"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex items-center justify-between gap-3 w-full sm:flex-row">
                  {/* Reset Defaults button */}
                  <Button
                    variant="ghost"
                    onClick={handleResetSidebar}
                    className="rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer font-bold border border-rose-500/20"
                  >
                    <RotateCcw className="size-3.5 mr-1" />
                    Reset Sidebar
                  </Button>
                  
                  <DialogClose asChild>
                    <Button variant="outline" className="rounded-lg text-xs cursor-pointer">
                      Close Settings
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Minimalist Workspace Navigation Lists with Framer Motion Drag and Drop */}
          <ScrollArea className="flex-1 py-3">
            <Reorder.Group
              axis="y"
              values={structure.filter((group) => group.visible)}
              onReorder={handleDragReorder}
              className="flex flex-col gap-5 px-3"
            >
              {structure
                .filter((group) => group.visible)
                .map((group, groupIdx) => {
                  const isExpanded = sectionsExpanded[group.id] !== false
                  const FolderIconComp = resolveIcon(group.icon || "Folder")

                  return (
                    <Reorder.Item
                      key={group.id}
                      value={group}
                      id={group.id}
                      className="flex flex-col gap-1 list-none outline-none"
                    >
                      {/* Section Folder Header Node */}
                      {!isCollapsed ? (
                        <div className="group flex items-center justify-between px-2 py-1 select-none">
                          <button
                            onClick={() => toggleSection(group.id)}
                            className={cn(
                              "flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest transition-colors text-left outline-none cursor-pointer",
                              group.color === "pink" && "text-pink-600 dark:text-pink-400",
                              group.color === "blue" && "text-blue-600 dark:text-blue-400",
                              group.color === "purple" && "text-purple-600 dark:text-purple-400",
                              group.color === "green" && "text-emerald-600 dark:text-emerald-400",
                              group.color === "orange" && "text-orange-600 dark:text-orange-400",
                              group.color === "red" && "text-rose-600 dark:text-rose-400",
                              group.color === "yellow" && "text-amber-600 dark:text-amber-400",
                              group.color === "teal" && "text-teal-600 dark:text-teal-400",
                              group.color === "indigo" && "text-indigo-600 dark:text-indigo-400"
                            )}
                          >
                            {/* Render either custom selected emoji or resolved icon */}
                            {group.emoji ? (
                              <span className="text-xs shrink-0">{group.emoji}</span>
                            ) : (
                              <FolderIconComp className="size-3.5 shrink-0" />
                            )}
                            <span className="truncate leading-none">{group.title}</span>
                            <ChevronDown
                              className={cn(
                                "size-3 text-text-muted transition-transform duration-300 shrink-0",
                                isExpanded ? "transform rotate-0" : "transform -rotate-90",
                                group.color === "pink" && "text-pink-500",
                                group.color === "blue" && "text-blue-500",
                                group.color === "purple" && "text-purple-500",
                                group.color === "green" && "text-brand-green-dark dark:text-brand-green",
                                group.color === "orange" && "text-orange-500",
                                group.color === "red" && "text-rose-500",
                                group.color === "yellow" && "text-amber-500",
                                group.color === "teal" && "text-teal-500",
                                group.color === "indigo" && "text-indigo-500"
                              )}
                            />
                          </button>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Grip drag handle icon */}
                            <GripVertical className="size-3.5 text-text-muted/70 hover:text-text-primary cursor-grab active:cursor-grabbing shrink-0" />

                            {/* Section Action Context Dropdown Options */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="hover:bg-muted p-0.5 rounded cursor-pointer outline-none border-0 select-none">
                                  <MoreHorizontal className="size-3.5 text-text-secondary" />
                                </button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent
                                align="start"
                                side="right"
                                className="w-48 p-1 rounded-xl border border-border-light shadow-md bg-card"
                              >
                                <DropdownMenuLabel className="px-2 py-1 text-[9px] uppercase tracking-wider text-text-secondary">
                                  Section Options
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-border-light/60 my-1" />
                                
                                {/* Manual Reordering */}
                                <DropdownMenuItem
                                  onClick={() => handleMoveSectionUp(groupIdx)}
                                  disabled={groupIdx === 0}
                                  className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted text-foreground cursor-pointer"
                                >
                                  <ArrowUp className="size-3.5" />
                                  <span>Move Up</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleMoveSectionDown(groupIdx)}
                                  disabled={groupIdx === structure.length - 1}
                                  className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted text-foreground cursor-pointer"
                                >
                                  <ArrowDown className="size-3.5" />
                                  <span>Move Down</span>
                                </DropdownMenuItem>

                                {/* Customize inline section colors */}
                                <DropdownMenuSeparator className="bg-border-light/60 my-1" />
                                <DropdownMenuLabel className="px-2 py-1 text-[9px] uppercase tracking-wider text-text-secondary">
                                  Change Color Theme
                                </DropdownMenuLabel>
                                <div className="grid grid-cols-5 gap-1.5 p-2">
                                  {colorOptions.map((c) => (
                                    <button
                                      key={c.id}
                                      onClick={() => handleChangeColor(group.id, c.id)}
                                      className={cn(
                                        "size-4 rounded-full border border-border-light cursor-pointer shadow-inner transition-transform hover:scale-105",
                                        group.color === c.id ? "ring-1 ring-brand-green" : ""
                                      )}
                                      style={{ backgroundColor: c.id === "yellow" ? "#F59E0B" : c.id }}
                                      title={c.name}
                                    />
                                  ))}
                                </div>

                                {/* Customize inline section icons / emojis */}
                                <DropdownMenuSeparator className="bg-border-light/60 my-1" />
                                <DropdownMenuLabel className="px-2 py-1 text-[9px] uppercase tracking-wider text-text-secondary">
                                  Change Icon / Emoji
                                </DropdownMenuLabel>
                                <div className="grid grid-cols-5 gap-1 p-2">
                                  {emojiOptions.slice(0, 5).map((em) => (
                                    <button
                                      key={em}
                                      onClick={() => handleChangeEmoji(group.id, em)}
                                      className={cn(
                                        "text-xs p-0.5 rounded hover:bg-muted cursor-pointer",
                                        group.emoji === em ? "bg-muted scale-110" : ""
                                      )}
                                    >
                                      {em}
                                    </button>
                                  ))}
                                  {iconOptions.slice(0, 5).map((ico) => {
                                    const PickerIcon = resolveIcon(ico.id)
                                    return (
                                      <button
                                        key={ico.id}
                                        onClick={() => handleChangeIcon(group.id, ico.id)}
                                        className={cn(
                                          "flex items-center justify-center p-0.5 rounded hover:bg-muted cursor-pointer text-text-secondary",
                                          group.icon === ico.id ? "bg-muted scale-110" : ""
                                        )}
                                      >
                                        <PickerIcon className="size-3.5" />
                                      </button>
                                    )
                                  })}
                                </div>

                                {/* Deletion of custom sections */}
                                {group.isCustom && (
                                  <>
                                    <DropdownMenuSeparator className="bg-border-light/60 my-1" />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteSection(group.id)}
                                      className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer rounded"
                                    >
                                      <Trash2 className="size-3.5" />
                                      <span>Delete Folder</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ) : (
                        <div className="px-2">
                          <Separator className="bg-border-light/60 dark:bg-zinc-800/40 opacity-70" />
                        </div>
                      )}

                      {/* Folder Links Tree Container */}
                      <div
                        className={cn(
                          "flex flex-col gap-0.5 overflow-hidden transition-all duration-300 ease-in-out",
                          !isCollapsed && !isExpanded ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[500px] opacity-100"
                        )}
                      >
                        {group.links.map(({ id, href, label, icon, badgeType, isAI }, linkIdx) => {
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
                                    : "gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold",
                                  active
                                    ? isAI
                                      ? "bg-violet-500/[0.08] dark:bg-violet-500/[0.06] text-violet-600 dark:text-violet-400 border border-violet-500/20 dark:border-violet-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                                      : cn(
                                          "border shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
                                          group.color === "pink" && "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 shadow-[0_0_8px_rgba(236,72,153,0.05)]",
                                          group.color === "blue" && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.05)]",
                                          group.color === "purple" && "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.05)]",
                                          group.color === "green" && "bg-brand-green/10 text-brand-green-dark dark:text-brand-green border-brand-green/20 dark:border-brand-green/10 shadow-[0_0_8px_rgba(48,252,71,0.05)]",
                                          group.color === "orange" && "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.05)]",
                                          group.color === "red" && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.05)]",
                                          group.color === "yellow" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]",
                                          group.color === "teal" && "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 shadow-[0_0_8px_rgba(20,184,166,0.05)]",
                                          group.color === "indigo" && "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.05)]"
                                        )
                                    : "text-text-secondary dark:text-muted-foreground hover:bg-muted/50 hover:text-text-primary border border-transparent"
                                )}
                              >
                                {/* Left glowing vertical bar */}
                                {active && !isCollapsed && (
                                  <div
                                    className={cn(
                                      "absolute left-0 top-1/4 h-1/2 w-0.5 rounded-r",
                                      isAI ? "bg-violet-500" :
                                      group.color === "pink" ? "bg-pink-500" :
                                      group.color === "blue" ? "bg-blue-500" :
                                      group.color === "purple" ? "bg-purple-500" :
                                      group.color === "green" ? "bg-brand-green" :
                                      group.color === "orange" ? "bg-orange-500" :
                                      group.color === "red" ? "bg-rose-500" :
                                      group.color === "yellow" ? "bg-amber-500" :
                                      group.color === "teal" ? "bg-teal-500" :
                                      group.color === "indigo" ? "bg-indigo-500" : "bg-brand-green"
                                    )}
                                  />
                                )}

                                <IconComp
                                  className={cn(
                                    "size-3.5 shrink-0 transition-transform duration-300",
                                    active
                                      ? isAI
                                        ? "text-violet-500 dark:text-violet-400 scale-105"
                                        : cn(
                                            "scale-105",
                                            group.color === "pink" && "text-pink-500",
                                            group.color === "blue" && "text-blue-500",
                                            group.color === "purple" && "text-purple-500",
                                            group.color === "green" && "text-brand-green-dark dark:text-brand-green",
                                            group.color === "orange" && "text-orange-500",
                                            group.color === "red" && "text-rose-500",
                                            group.color === "yellow" && "text-amber-500",
                                            group.color === "teal" && "text-teal-500",
                                            group.color === "indigo" && "text-indigo-500"
                                          )
                                      : "text-text-secondary/70 dark:text-muted-foreground/75",
                                    isAI && "animate-pulse"
                                  )}
                                />

                                {!isCollapsed && <span className="truncate leading-none">{label}</span>}
                                {renderBadge()}
                                {renderCollapsedIndicator()}
                              </Link>

                              {/* Hover Options trigger button for link movements */}
                              {!isCollapsed && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="opacity-0 group-hover:opacity-100 hover:bg-muted/70 p-0.5 rounded absolute right-2 top-1.5 transition-opacity cursor-pointer outline-none border-0 z-10">
                                      <MoreHorizontal className="size-3 text-text-secondary" />
                                    </button>
                                  </DropdownMenuTrigger>

                                  <DropdownMenuContent
                                    align="start"
                                    side="right"
                                    className="w-48 p-1 rounded-xl border border-border-light shadow-md bg-card"
                                  >
                                    <DropdownMenuLabel className="px-2 py-1 text-[9px] uppercase tracking-wider text-text-secondary">
                                      Reorganize Link
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-border-light/60 my-1" />
                                    
                                    {/* Link up/down manually */}
                                    <DropdownMenuItem
                                      onClick={() => handleMoveLinkUp(group.id, linkIdx)}
                                      disabled={linkIdx === 0}
                                      className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted text-foreground cursor-pointer"
                                    >
                                      <ArrowUp className="size-3" />
                                      <span>Move Up</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleMoveLinkDown(group.id, linkIdx)}
                                      disabled={linkIdx === group.links.length - 1}
                                      className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted text-foreground cursor-pointer"
                                    >
                                      <ArrowDown className="size-3" />
                                      <span>Move Down</span>
                                    </DropdownMenuItem>

                                    {/* Move to another section folder */}
                                    <DropdownMenuSeparator className="bg-border-light/60 my-1" />
                                    <DropdownMenuLabel className="px-2 py-1 text-[9px] uppercase tracking-wider text-text-secondary">
                                      Move to Folder
                                    </DropdownMenuLabel>
                                    {structure
                                      .filter((s) => s.id !== group.id && s.visible)
                                      .map((targetSec) => (
                                        <DropdownMenuItem
                                          key={targetSec.id}
                                          onClick={() => handleMoveLinkToSection(id, group.id, targetSec.id)}
                                          className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted text-foreground cursor-pointer"
                                        >
                                          <span className="text-[10px]">{targetSec.emoji ? targetSec.emoji : "📂"}</span>
                                          <span className="truncate">{targetSec.title}</span>
                                        </DropdownMenuItem>
                                      ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
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
                    </Reorder.Item>
                  )
                })}
            </Reorder.Group>
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
