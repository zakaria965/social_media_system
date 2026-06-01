"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LegacyAccountsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard/channels")
  }, [router])

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <p className="text-xs text-muted-foreground">Redirecting to Channels Hub...</p>
    </div>
  )
}
