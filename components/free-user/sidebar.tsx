"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  PenSquare,
  Send,
  Clock,
  Calendar,
  Sparkles,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react"
import { UpgradeModal } from "./upgrade-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SidebarProps {
  open?: boolean
  onClose?: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ open, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  const navigationItems = [
    { name: "Create", href: "/free-user/create", icon: PenSquare },
    { name: "Publish", href: "/free-user/publish", icon: Send },
    { name: "Scheduled", href: "/free-user/scheduled", icon: Clock },
    { name: "Calendar", href: "/free-user/calendar", icon: Calendar },
    { name: "AI Assistant", href: "/free-user/ai-assistant", icon: Sparkles },
    { name: "Settings", href: "/free-user/settings", icon: Settings },
    { name: "Upgrade", href: "#upgrade", icon: Zap, isUpgrade: true },
  ]

  const handleTriggerUpgrade = () => {
    setUpgradeModalOpen(true)
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
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200/50 bg-background transition-[width] duration-300 ease-in-out dark:border-slate-850 dark:bg-slate-950",
          isCollapsed ? "w-20" : "w-64",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/50 dark:border-slate-850">
          <Link href="/free-user/create" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#30FC47] shadow-xs select-none">
              <span className="text-sm font-black text-white">GW</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-black text-[#1F2937] dark:text-white tracking-tight">
                  GrowWave <span className="text-emerald-600 dark:text-[#30FC47] font-bold">Lite</span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  Free Plan
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex size-6 items-center justify-center rounded-md border border-slate-200 bg-background text-slate-500 hover:text-[#30FC47] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 hover:scale-105 active:scale-95 transition-all"
          >
            {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
          </button>
        </div>

        {/* Sidebar Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {/* Main Navigation Menu */}
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const handleClick = (e: React.MouseEvent) => {
                if (item.isUpgrade) {
                  e.preventDefault()
                  handleTriggerUpgrade()
                }
                onClose?.()
              }
              return (
                <Link
                  key={item.name}
                  href={item.href || "#"}
                  onClick={handleClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-xs font-bold transition-all group relative",
                    isActive
                      ? "bg-[#EFFFF1] text-[#30FC47] dark:bg-emerald-950/30 dark:text-[#30FC47] font-extrabold"
                      : "text-[#6B7280] hover:bg-[#EFFFF1] hover:text-[#30FC47] dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-[#30FC47]",
                    item.isUpgrade && "text-emerald-700 dark:text-emerald-400 border border-dashed border-[#30FC47]/40 bg-[#30FC47]/5 hover:bg-[#EFFFF1] hover:text-[#30FC47] font-black"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4.5 transition-transform duration-300 group-hover:scale-105 shrink-0",
                      isActive ? "text-[#30FC47]" : "text-slate-400 group-hover:text-[#30FC47] dark:group-hover:text-[#30FC47]",
                      item.isUpgrade && "text-emerald-600 dark:text-[#30FC47] fill-[#30FC47]"
                    )}
                  />
                  {!isCollapsed && <span>{item.name}</span>}

                  {isActive && isCollapsed && (
                    <div className="absolute right-2 size-1.5 rounded-full bg-[#30FC47]" />
                  )}
                  {item.isUpgrade && !isCollapsed && (
                    <span className="absolute right-3 bg-[#30FC47] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase leading-none scale-90">
                      PRO
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Minimal User Profile Section */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-850">
          <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "justify-between")}>
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-9 shrink-0">
                {session?.user?.image ? (
                  <AvatarImage src={session.user.image} alt={session.user.name ?? ""} />
                ) : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#1F2937] dark:text-white truncate">
                    {session?.user?.name ?? "GrowWave User"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {session?.user?.email ?? "free@growwave.com"}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                title="Log out"
              >
                <LogOut className="size-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      <UpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </>
  )
}
