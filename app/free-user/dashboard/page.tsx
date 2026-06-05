"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function FreeDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/free-user/create")
  }, [router])

  return (
    <div className="flex min-h-[400px] items-center justify-center bg-white dark:bg-slate-950">
      <p className="text-sm text-slate-500 animate-pulse">Redirecting to workspace...</p>
    </div>
  )
}
