"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ShieldAlert, LogOut, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useEffect, useState } from "react"

export default function WorkspaceSuspendedPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null)

  useEffect(() => {
    // Attempt to load workspace details to resolve owner email
    const loadOwnerEmail = async () => {
      try {
        const res = await fetch("/api/workspaces")
        if (res.ok) {
          const data = await res.json()
          const memberships = data.memberships || []
          
          // Parse active workspace ID from cookie
          const activeWorkspaceId = document.cookie
            .split("; ")
            .find((row) => row.startsWith("growwave-active-workspace-id="))
            ?.split("=")[1]
          
          if (activeWorkspaceId && data.workspaces) {
            const activeWs = data.workspaces.find((w: any) => w._id === activeWorkspaceId)
            if (activeWs) {
              setOwnerEmail(activeWs.ownerEmail)
            }
          }
        }
      } catch (e) {
        console.error("Failed to load owner email:", e)
      }
    }

    if (session) {
      loadOwnerEmail()
    }
  }, [session])

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-tr from-[#FCFAF6] via-[#FAF9F5] to-[#F3F0E8] dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] select-none transition-colors duration-500">
      <Card className="max-w-md w-full border border-border/80 rounded-3xl bg-card/60 backdrop-blur-xl text-center p-8 space-y-6 shadow-2xl">
        <div className="size-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="size-8" />
        </div>
        <div className="space-y-2">
          <CardTitle className="font-black text-foreground text-2xl tracking-tight">
            Access Suspended
          </CardTitle>
          <CardDescription className="text-xs text-text-secondary leading-relaxed max-w-xs mx-auto">
            Your workspace access has been restricted by the Workspace Owner. Please contact your Workspace Administrator for assistance.
          </CardDescription>
        </div>
        <CardFooter className="p-0 flex flex-col gap-3">
          <a
            href={ownerEmail ? `mailto:${ownerEmail}?subject=GrowWave%20Workspace%20Suspension%20Inquiry` : "mailto:support@growwave.ai"}
            className="w-full inline-flex items-center justify-center bg-[#0F172A] dark:bg-white hover:opacity-90 text-white dark:text-[#0F172A] font-bold rounded-xl text-xs py-4 cursor-pointer border-0 shadow-md transition-all hover:scale-[1.02] gap-2"
          >
            <Mail className="size-4" />
            Contact Workspace Owner
          </a>
          <Button
            onClick={() => signOut({ callbackUrl: "/" })}
            variant="ghost"
            className="w-full font-bold rounded-xl text-xs py-5 cursor-pointer text-muted-foreground hover:bg-muted border border-transparent transition-all"
          >
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
