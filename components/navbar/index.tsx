"use client"

import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, LayoutDashboard, Menu } from "lucide-react"
import { useClickOutside } from "@/hooks/use-click-outside"
import { FeaturesMegaMenu } from "@/components/dropdowns/features-mega-menu"
import { ChannelsDropdownMenu } from "@/components/dropdowns/channels-dropdown-menu"
import { MadeForDropdown } from "@/components/dropdowns/made-for-dropdown"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type MenuKey = "features" | "channels" | "made-for" | null

export function Navbar() {
  const { data: session } = useSession()
  const rootRef = React.useRef<HTMLElement>(null)
  const [active, setActive] = React.useState<MenuKey>(null)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearClose = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const scheduleClose = React.useCallback(() => {
    clearClose()
    closeTimer.current = setTimeout(() => setActive(null), 140)
  }, [clearClose])

  const openMenu = React.useCallback(
    (key: Exclude<MenuKey, null>) => {
      clearClose()
      setActive(key)
    },
    [clearClose]
  )

  const toggleMenu = React.useCallback((key: Exclude<MenuKey, null>) => {
    clearClose()
    setActive((cur) => (cur === key ? null : key))
  }, [clearClose])

  useClickOutside(rootRef, () => setActive(null), Boolean(active))

  React.useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active])

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  return (
    <header
      ref={rootRef}
      className="fixed top-0 z-50 w-full"
      onMouseLeave={scheduleClose}
    >
      <div className="border-b border-border/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-[4.25rem] md:px-6">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-primary md:text-2xl"
            onMouseEnter={() => clearClose()}
          >
            GrowWave
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <div
              className="relative"
              onMouseEnter={() => openMenu("features")}
              onMouseLeave={scheduleClose}
            >
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  active === "features"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
                aria-expanded={active === "features"}
                onClick={() => toggleMenu("features")}
              >
                Features
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    active === "features" && "rotate-180"
                  )}
                />
              </button>
            </div>

            <div
              className="relative"
              onMouseEnter={() => openMenu("channels")}
              onMouseLeave={scheduleClose}
            >
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  active === "channels"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
                aria-expanded={active === "channels"}
                onClick={() => toggleMenu("channels")}
              >
                Channels
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    active === "channels" && "rotate-180"
                  )}
                />
              </button>
            </div>

            <div
              className="relative"
              onMouseEnter={() => openMenu("made-for")}
              onMouseLeave={scheduleClose}
            >
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  active === "made-for"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
                aria-expanded={active === "made-for"}
                onClick={() => toggleMenu("made-for")}
              >
                Made for
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    active === "made-for" && "rotate-180"
                  )}
                />
              </button>
            </div>
            <Link
              href="/contact"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              onMouseEnter={() => {
                clearClose()
                setActive(null)
              }}
            >
              Contact
            </Link>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {session?.user ? (
              <>
                <Button variant="ghost" size="sm" className="rounded-full gap-2" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </Link>
                </Button>
                <Avatar className="size-8 ring-2 ring-primary/10">
                  {session.user.image ? (
                    <AvatarImage src={session.user.image} alt={session.user.name ?? ""} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="rounded-full" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button size="sm" className="rounded-full px-4 shadow-sm shadow-primary/20" asChild>
                  <Link href="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[min(100%,420px)] flex-col gap-0 p-0">
              <SheetHeader className="border-b border-border px-6 py-5 text-left">
                <SheetTitle className="font-display text-xl">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Features
                    </p>
                    <div className="mt-3 flex flex-col gap-1">
                      <MobileLink href="/features#create" onClick={() => setMobileOpen(false)}>
                        Create
                      </MobileLink>
                      <MobileLink href="/features#analyze" onClick={() => setMobileOpen(false)}>
                        Analyze
                      </MobileLink>
                      <MobileLink href="/features#collaborate" onClick={() => setMobileOpen(false)}>
                        Collaborate
                      </MobileLink>
                      <MobileLink href="/features#ai" onClick={() => setMobileOpen(false)}>
                        AI Assistant
                      </MobileLink>
                      <MobileLink href="/features#publish" onClick={() => setMobileOpen(false)}>
                        Publish
                      </MobileLink>
                      <MobileLink href="/features#community" onClick={() => setMobileOpen(false)}>
                        Community
                      </MobileLink>
                      <MobileLink href="/features#start-page" onClick={() => setMobileOpen(false)}>
                        Start Page
                      </MobileLink>
                      <MobileLink href="/features" onClick={() => setMobileOpen(false)}>
                        All features
                      </MobileLink>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Channels
                    </p>
                    <div className="mt-3 flex flex-col gap-1">
                      <MobileLink href="/channels" onClick={() => setMobileOpen(false)}>
                        All channels
                      </MobileLink>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Made for
                    </p>
                    <div className="mt-3 flex flex-col gap-1">
                      <MobileLink href="#" onClick={() => setMobileOpen(false)}>
                        Creators
                      </MobileLink>
                      <MobileLink href="#" onClick={() => setMobileOpen(false)}>
                        Agencies
                      </MobileLink>
                      <MobileLink href="#" onClick={() => setMobileOpen(false)}>
                        Higher Education
                      </MobileLink>
                      <MobileLink href="#" onClick={() => setMobileOpen(false)}>
                        Small Business
                      </MobileLink>
                      <MobileLink href="#" onClick={() => setMobileOpen(false)}>
                        Nonprofits
                      </MobileLink>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 border-t border-border pt-4">
                    <MobileLink href="/contact" onClick={() => setMobileOpen(false)}>
                      Contact
                    </MobileLink>
                  </div>
                </div>
                <div className="mt-8 flex flex-col gap-2">
                  {session?.user ? (
                    <>
                      <Button className="w-full rounded-xl gap-2" asChild>
                        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                          <LayoutDashboard className="size-4" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full rounded-xl" asChild>
                        <Link href="/" onClick={() => setMobileOpen(false)}>
                          Home
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full rounded-xl" asChild>
                        <Link href="/login" onClick={() => setMobileOpen(false)}>
                          Log in
                        </Link>
                      </Button>
                      <Button className="w-full rounded-xl shadow-sm shadow-primary/20" asChild>
                        <Link href="/signup" onClick={() => setMobileOpen(false)}>
                          Get started
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-full flex justify-center px-0"
        onMouseEnter={clearClose}
      >
        <div className="pointer-events-auto w-full max-w-7xl px-4 pt-3 md:px-6">
          <AnimatePresence mode="wait">
            {active === "features" ? (
              <FeaturesMegaMenu key="features" onNavigate={() => setActive(null)} />
            ) : null}
            {active === "channels" ? (
              <ChannelsDropdownMenu key="channels" onNavigate={() => setActive(null)} />
            ) : null}
            {active === "made-for" ? (
              <MadeForDropdown key="made-for" onNavigate={() => setActive(null)} />
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

function MobileLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        onClick={onClick}
        className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
      >
        {children}
      </Link>
    </motion.div>
  )
}
