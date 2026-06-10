"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  PenSquare,
  Send,
  Clock,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  CreditCard,
  Bell,
  Sun,
  HelpCircle
} from "lucide-react"
import { IconFacebook } from "@/components/social-brand-icons"
import { UpgradeModal } from "./upgrade-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { GrowWaveModal } from "@/components/growwave-modal"

interface SidebarProps {
  open?: boolean
  onClose?: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ open, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  const navigationItems = [
    { name: "Create", href: "/free-user/create", icon: PenSquare },
    { name: "Publish", href: "/free-user/publish", icon: Send },
    { name: "Scheduled", href: "/free-user/scheduled", icon: Clock },
    { name: "Calendar", href: "/free-user/calendar", icon: Calendar },
    { name: "AI Assistant", href: "/free-user/ai-assistant", icon: Sparkles },
  ]

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
        style={{ backgroundColor: '#FCFAF6', borderRight: '1px solid #EEF2F7' }}
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col transition-[width] duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/free-user/create" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--brand-primary)] shadow-xs select-none">
              <span className="text-sm font-black text-white">GW</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-black text-[#1F2937] tracking-tight">
                  GrowWave <span className="text-emerald-600 font-bold">Lite</span>
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
            className="hidden lg:flex size-6 items-center justify-center rounded-md border border-[#EEF2F7] bg-white text-slate-500 hover:text-[var(--brand-primary)] hover:scale-105 active:scale-95 transition-all"
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
              const handleClick = () => {
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
                      ? "bg-[#F0FDF4] text-[var(--brand-primary)] font-extrabold"
                      : "text-[#6B7280] hover:bg-[#F0FDF4]/50 hover:text-[var(--brand-primary)]"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4.5 transition-transform duration-300 group-hover:scale-105 shrink-0",
                      isActive ? "text-[var(--brand-primary)]" : "text-slate-400 group-hover:text-[var(--brand-primary)]"
                    )}
                  />
                  {!isCollapsed && <span>{item.name}</span>}

                  {isActive && isCollapsed && (
                    <div className="absolute right-2 size-1.5 rounded-full bg-[var(--brand-primary)]" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* User Profile Section with Dropdown */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-100 dark:hover:bg-slate-900 transition-all focus:outline-hidden">
                <Avatar className="size-9 shrink-0">
                  {session?.user?.image ? (
                    <AvatarImage src={session.user.image} alt={session.user.name ?? ""} />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#1F2937] dark:text-white truncate">
                      {session?.user?.name ?? "GrowWave User"}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {session?.user?.email ?? "free@growwave.com"}
                    </span>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="right"
              sideOffset={12}
              className="w-56 border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1 bg-background"
            >
              <div className="px-2.5 py-2 flex flex-col">
                <span className="text-xs font-bold text-[#1F2937] dark:text-white">{session?.user?.name ?? "GrowWave User"}</span>
                <span className="text-[9px] font-semibold text-[var(--brand-primary)] uppercase tracking-wider mt-0.5">Free Account</span>
              </div>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
              
              <DropdownMenuItem
                onClick={() => router.push("/free-user/settings?tab=profile")}
                className="cursor-pointer gap-2.5 px-2.5 py-2 text-xs font-bold text-slate-650 hover:bg-slate-100 dark:text-slate-300 rounded-xl"
              >
                <User className="size-4 text-slate-400" />
                My Account
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/free-user/settings?tab=accounts")}
                className="cursor-pointer gap-2.5 px-2.5 py-2 text-xs font-bold text-slate-650 hover:bg-slate-100 dark:text-slate-300 rounded-xl"
              >
                <IconFacebook className="size-4 text-slate-400" />
                Connected Facebook Page
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/free-user/settings?tab=billing")}
                className="cursor-pointer gap-2.5 px-2.5 py-2 text-xs font-bold text-slate-650 hover:bg-slate-100 dark:text-slate-300 rounded-xl"
              >
                <CreditCard className="size-4 text-slate-400" />
                Billing & Subscription
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/free-user/settings?tab=notifications")}
                className="cursor-pointer gap-2.5 px-2.5 py-2 text-xs font-bold text-slate-650 hover:bg-slate-100 dark:text-slate-300 rounded-xl"
              >
                <Bell className="size-4 text-slate-400" />
                Notifications
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/free-user/settings?tab=appearance")}
                className="cursor-pointer gap-2.5 px-2.5 py-2 text-xs font-bold text-slate-650 hover:bg-slate-100 dark:text-slate-300 rounded-xl"
              >
                <Sun className="size-4 text-slate-400" />
                Appearance
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setHelpModalOpen(true)}
                className="cursor-pointer gap-2.5 px-2.5 py-2 text-xs font-bold text-slate-650 hover:bg-slate-100 dark:text-slate-300 rounded-xl"
              >
                <HelpCircle className="size-4 text-slate-400" />
                Help Center
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />

              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="cursor-pointer gap-2.5 px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl"
              >
                <LogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <UpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      
      <GrowWaveModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title="GrowWave Support Help Center"
        message="Need assistance with your free account or publishing questions? Check out our documentation at growwave.com/docs or reach out to our support team at support@growwave.com. We are happy to help you scale!"
        confirmText="Contact Support"
        cancelText="Close"
        onConfirm={() => {
          setHelpModalOpen(false)
          router.push("/contact")
        }}
      />
    </>
  )
}
