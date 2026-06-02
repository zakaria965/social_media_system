"use client"

import * as React from "react"
import { useEffect, useState, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Users, ShieldCheck, XCircle, CheckCircle2, ArrowRight, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/toast-provider"
import { Badge } from "@/components/ui/badge"

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()

  const [inviteDetails, setInviteDetails] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchInviteDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/invitations/${token}`)
      if (res.ok) {
        const data = await res.json()
        setInviteDetails(data)
      } else {
        const err = await res.json()
        setError(err.error || "Failed to load invitation.")
      }
    } catch (e) {
      console.error(e)
      setError("An unexpected network error occurred.")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchInviteDetails()
  }, [fetchInviteDetails])

  // Accept Invite Action
  const handleAcceptInvite = async () => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/workspaces/invitations/${token}`, {
        method: "POST",
      })

      if (res.ok) {
        const data = await res.json()
        showToast("You have successfully joined the team workspace.", "success")
        // Redirect to team page inside active workspace
        router.push("/dashboard/team")
      } else {
        const err = await res.json()
        showToast(err.error || "An error occurred.", "error")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  // Decline Invite Action
  const handleDeclineInvite = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/workspaces/invitations/${token}`, {
        method: "DELETE",
      })

      if (res.ok) {
        showToast("You have declined the team workspace invitation.", "success")
        router.push("/")
      } else {
        const err = await res.json()
        showToast(err.error || "An error occurred.", "error")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background space-y-4">
        <Loader2 className="size-8 text-brand-green animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold">Validating invitation token...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background select-none">
        <Card className="max-w-md w-full border-border/80 rounded-2xl bg-card/60 backdrop-blur-xl text-center p-6 space-y-5">
          <div className="size-14 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <XCircle className="size-6" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="font-extrabold text-foreground text-lg">Invitation Expired or Invalid</CardTitle>
            <CardDescription className="text-xs text-text-secondary leading-normal max-w-xs mx-auto">
              {error}
            </CardDescription>
          </div>
          <CardFooter className="p-0 flex flex-col gap-2">
            <Button onClick={() => router.push("/")} className="w-full bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-bold rounded-xl text-xs py-4 cursor-pointer border-0 shadow">
              Back to GrowWave Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const isEmailMismatch = session && session.user?.email?.toLowerCase() !== inviteDetails?.invitedEmail?.toLowerCase()

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background select-none">
      <Card className="max-w-md w-full border-border/80 rounded-2xl bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <CardHeader className="text-center pt-8 space-y-3">
          <div className="size-12 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Users className="size-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg font-extrabold">You're Invited to Join</CardTitle>
            <CardDescription className="text-xs text-brand-green-dark dark:text-brand-green font-extrabold tracking-tight">
              {inviteDetails?.workspaceName}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-6 pb-6">
          <div className="rounded-xl border border-border/50 p-4 bg-muted/15 space-y-3 text-xs text-text-primary">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Invited By:</span>
              <span className="font-bold">{inviteDetails?.invitedBy}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Campaign Role:</span>
              <Badge className="bg-brand-green/10 text-brand-green-dark border border-brand-green/20 rounded font-bold text-[10px] uppercase px-2 py-0.5">
                {inviteDetails?.role}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Target Account:</span>
              <span className="font-bold truncate max-w-[200px]">{inviteDetails?.invitedEmail}</span>
            </div>
          </div>

          {/* Email mismatch Warning panel */}
          {isEmailMismatch && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 flex items-start gap-2 text-rose-500 text-xs">
              <ShieldCheck className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-2 leading-none">
                <p className="font-bold">Account mismatch detected</p>
                <p className="text-[10px] text-rose-500/80 leading-normal">
                  You are currently logged in as <span className="font-bold">{session.user?.email}</span>, but this invite was issued to <span className="font-bold">{inviteDetails?.invitedEmail}</span>.
                </p>
                <Button
                  variant="ghost"
                  onClick={() => signOut({ callbackUrl: window.location.pathname })}
                  className="h-7 text-[10px] font-extrabold flex items-center gap-1 hover:bg-rose-500/10 text-rose-500 py-0.5 px-2 rounded-lg border border-rose-500/20"
                >
                  <LogOut className="size-3" />
                  Sign Out of Current Account
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-muted/10 px-6 py-4 flex flex-col gap-2 border-t border-border/40 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            disabled={actionLoading}
            onClick={handleDeclineInvite}
            className="w-full text-xs font-bold rounded-xl text-muted-foreground hover:bg-muted py-5 cursor-pointer sm:w-auto px-5"
          >
            Decline Invitation
          </Button>

          <Button
            disabled={actionLoading || !!isEmailMismatch}
            onClick={handleAcceptInvite}
            className="w-full bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-bold border-0 rounded-xl text-xs py-5 cursor-pointer shadow sm:w-auto px-6"
          >
            {actionLoading ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : status === "unauthenticated" ? (
              <>
                Log In to Accept
                <ArrowRight className="size-3.5 ml-1" />
              </>
            ) : (
              "Accept & Collaborate"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
