"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopNavbar } from "@/components/dashboard/top-navbar"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      if (session?.user?.role === "ADMIN") {
        router.push("/admin")
      } else if (session?.user?.plan !== "PRO") {
        router.push("/upgrade?reason=team")
      }
    }
  }, [status, session, router])

  useEffect(() => {
    const saved = localStorage.getItem("growwave-sidebar-collapsed")
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved))
    }

    const checkResponsiveSize = () => {
      const width = window.innerWidth
      if (width >= 1024 && width < 1200) {
        setIsTablet(true)
      } else {
        setIsTablet(false)
      }
    }

    checkResponsiveSize()
    window.addEventListener("resize", checkResponsiveSize)
    return () => window.removeEventListener("resize", checkResponsiveSize)
  }, [])

  const handleToggleCollapse = () => {
    const nextValue = !isCollapsed
    setIsCollapsed(nextValue)
    localStorage.setItem("growwave-sidebar-collapsed", JSON.stringify(nextValue))
  }

  const activeCollapsed = isCollapsed || isTablet

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 dark:bg-slate-950">
        <p className="text-sm text-muted-foreground animate-pulse">Loading workspace...</p>
      </div>
    )
  }

  if (status === "unauthenticated" || session?.user?.plan !== "PRO") {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={activeCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div
        className={cn(
          "flex flex-1 flex-col transition-[padding] duration-300 ease-in-out",
          activeCollapsed ? "lg:pl-20" : "lg:pl-[260px]"
        )}
      >
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
