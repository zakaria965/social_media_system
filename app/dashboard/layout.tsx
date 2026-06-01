"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopNavbar } from "@/components/dashboard/top-navbar"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

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
          activeCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
