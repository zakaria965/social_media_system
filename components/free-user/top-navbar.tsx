"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, Menu, Moon, Search, Sun, Zap } from "lucide-react"
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
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[#EEF2F7] bg-[#FCFAF6] px-4 md:px-6">
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
            className="h-9 rounded-full border-0 bg-[#F8FAFC] pl-9 text-sm placeholder:text-muted-foreground/60 shadow-xs focus-visible:ring-1 focus-visible:ring-[#22C55E]/40"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Upgrade Button on Navbar */}
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="hidden sm:flex items-center gap-1 bg-[var(--brand-primary)]/10 hover:bg-[var(--brand-primary)]/20 border border-[var(--brand-primary)]/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all uppercase tracking-wider scale-95"
          >
            <Zap className="size-3.5 fill-[var(--brand-primary)]" />
            Upgrade
          </button>

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
