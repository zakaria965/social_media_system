"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Plus,
  HelpCircle
} from "lucide-react"
import { UpgradeModal } from "./upgrade-modal"
import {
  IconFacebook,
  IconInstagram,
  IconLinkedin,
  IconX
} from "@/components/social-brand-icons"

interface SidebarProps {
  open?: boolean
  onClose?: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ open, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"ai_quota" | "channels_limit" | "bulk_scheduling" | "analytics_pro" | "team_feature" | "inbox_feature" | "platform_locked" | "">("")
  const [connectedCount, setConnectedCount] = useState(0)

  // Navigation Items requested in prompt: Create, Publish, Scheduled, Calendar, AI Assistant, Settings, Upgrade
  const navigationItems = [
    { name: "Create", href: "/free-user/create", icon: PenSquare },
    { name: "Publish", href: "/free-user/publish", icon: Send },
    { name: "Scheduled", href: "/free-user/scheduled", icon: Clock },
    { name: "Calendar", href: "/free-user/calendar", icon: Calendar },
    { name: "AI Assistant", href: "/free-user/ai-assistant", icon: Sparkles },
    { name: "Settings", href: "/free-user/settings", icon: Settings },
  ]

  // Mock list of channel connectivity state loaded from local storage
  const [channels, setChannels] = useState<{ name: string; connected: boolean; icon: any; color: string }[]>([])

  useEffect(() => {
    // Determine how many channels are connected based on local storage settings if any
    const savedScheduled = localStorage.getItem("growwave-lite-scheduled")
    // Simple state load for channels
    setChannels([
      { name: "Facebook", connected: true, icon: IconFacebook, color: "text-blue-600" },
      { name: "Instagram", connected: true, icon: IconInstagram, color: "text-pink-600" },
      { name: "LinkedIn", connected: true, icon: IconLinkedin, color: "text-sky-700" },
      { name: "Twitter / X", connected: false, icon: IconX, color: "text-black dark:text-white" }
    ])
    setConnectedCount(3) // Facebook, Instagram, LinkedIn are connected by default in settings page
  }, [pathname])

  const handleTriggerUpgrade = () => {
    setUpgradeReason("")
    setUpgradeModalOpen(true)
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container - Rebuilt to use white backgrounds, black typography, minimal aesthetics */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-100 bg-white transition-[width] duration-300 ease-in-out dark:border-slate-850 dark:bg-slate-950",
          isCollapsed ? "w-20" : "w-64",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-850">
          <Link href="/free-user/create" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#30FC47] shadow-xs select-none">
              <span className="text-sm font-black text-slate-900">GW</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-black text-black dark:text-white tracking-tight">
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
            className="hidden lg:flex size-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:text-black dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 hover:scale-105 active:scale-95 transition-all"
          >
            {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
          </button>
        </div>

        {/* Sidebar Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          
          {/* Quick Create + New Button - Buffer style */}
          {!isCollapsed ? (
            <Link href="/free-user/create" onClick={onClose}>
              <button className="w-full bg-[#30FC47] hover:bg-[#24D93B] text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all uppercase tracking-wider mb-4">
                <Plus className="size-4 text-slate-950" />
                <span>New Post</span>
              </button>
            </Link>
          ) : (
            <Link href="/free-user/create" onClick={onClose} className="flex justify-center mb-4">
              <button className="size-10 bg-[#30FC47] hover:bg-[#24D93B] text-slate-950 rounded-xl flex items-center justify-center shadow-xs active:scale-98 transition-all">
                <Plus className="size-5 text-slate-950" />
              </button>
            </Link>
          )}

          {/* Main Navigation Menu */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                Workspace
              </span>
            )}
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group relative",
                    isActive
                      ? "bg-[#30FC47]/15 text-black dark:text-white font-extrabold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-black dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-slate-200"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4.5 transition-transform duration-300 group-hover:scale-105 shrink-0",
                      isActive ? "text-slate-950 dark:text-[#30FC47]" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                    )}
                  />
                  {!isCollapsed && <span>{item.name}</span>}

                  {isActive && isCollapsed && (
                    <div className="absolute right-2 size-1.5 rounded-full bg-[#30FC47]" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Connected Channels status in sidebar - Premium Buffer layout style */}
          {!isCollapsed && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-850">
              <span className="px-3 text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Connect channels
              </span>
              <div className="space-y-1 px-1">
                {channels.map((chan, idx) => {
                  const ChanIcon = chan.icon
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] text-slate-500 font-semibold dark:text-slate-400"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={cn("size-4 flex items-center justify-center", chan.color)}>
                          <ChanIcon className="size-3.5" />
                        </div>
                        <span className="truncate">{chan.name}</span>
                      </div>
                      <span className={cn(
                        "size-1.5 rounded-full shrink-0",
                        chan.connected ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                      )} />
                    </div>
                  )
                })}
                <Link
                  href="/free-user/settings?tab=accounts"
                  className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-emerald-600 hover:underline font-bold"
                >
                  <Plus className="size-3" />
                  <span>More channels</span>
                </Link>
              </div>
            </div>
          )}

          {/* Upgrade Plan Promo Button in Sidebar */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-850">
            <button
              onClick={handleTriggerUpgrade}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black transition-all group relative border border-dashed border-[#30FC47]/40 bg-[#30FC47]/5 hover:bg-[#30FC47]/15 text-emerald-700 dark:text-emerald-400",
                isCollapsed && "justify-center px-0"
              )}
            >
              <Zap className="size-4.5 text-emerald-600 dark:text-emerald-400 fill-[#30FC47] shrink-0" />
              {!isCollapsed && <span>Upgrade Plan</span>}

              {!isCollapsed && (
                <span className="absolute right-3 bg-[#30FC47] text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded uppercase leading-none scale-90">
                  PRO
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Footer Profile or Promo */}
        {!isCollapsed && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="rounded-xl bg-white p-3 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 flex flex-col gap-2">
              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                Need team access?
              </span>
              <p className="text-[10px] text-slate-400 leading-normal">
                Collaboratively create content, drafts review, and shared calendars.
              </p>
              <button
                onClick={handleTriggerUpgrade}
                className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black text-[10px] py-1.5 rounded-lg uppercase transition-all tracking-wider"
              >
                Learn More
              </button>
            </div>
          </div>
        )}
      </aside>

      <UpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} reason={upgradeReason} />
    </>
  )
}
