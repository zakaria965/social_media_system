"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardLitePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/free-user/create")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FCFAF6]">
      <p className="text-sm text-slate-500 animate-pulse">Loading workspace...</p>
    </div>
  )
}
