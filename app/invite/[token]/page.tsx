"use client"

import * as React from "react"
import { useEffect, useState, useCallback } from "react"
import { useSession, signOut, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Users, ShieldCheck, XCircle, CheckCircle2, ArrowRight, LogOut, Loader2, Check, Lock, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/toast-provider"
import { Badge } from "@/components/ui/badge"

const rolePermissions: Record<string, { title: string; allowed: string[]; forbidden: string[] }> = {
  viewer: {
    title: "Viewer",
    allowed: ["Access Main Dashboard", "Read Campaign Reports", "View Workspace Updates"],
    forbidden: ["Create & Schedule Posts", "Access AI Copywriting Tools", "Manage Team Members", "Modify Workspace Settings / Billing"]
  },
  analyst: {
    title: "Analyst",
    allowed: ["Access Main Dashboard", "View Performance Analytics", "Generate & Export Reports"],
    forbidden: ["Create & Schedule Posts", "Access AI Copywriting Tools", "Manage Team Members", "Modify Workspace Settings / Billing"]
  },
  "content manager": {
    title: "Content Manager",
    allowed: ["Access Main Dashboard", "Create & Schedule Posts", "Access Media Library", "AI Assistant Copywriting Tools"],
    forbidden: ["Manage Team Members", "Modify Channels Connections", "Configure Workspace Settings / Billing"]
  },
  content_manager: {
    title: "Content Manager",
    allowed: ["Access Main Dashboard", "Create & Schedule Posts", "Access Media Library", "AI Assistant Copywriting Tools"],
    forbidden: ["Manage Team Members", "Modify Channels Connections", "Configure Workspace Settings / Billing"]
  },
  editor: {
    title: "Editor",
    allowed: ["Access Main Dashboard", "Create & Schedule Posts", "Access Media Library", "AI Assistant Tools", "Manage Inbox & Messages"],
    forbidden: ["Manage Team Members", "Modify Channels Connections", "Configure Workspace Settings / Billing"]
  },
  "workspace manager": {
    title: "Workspace Manager",
    allowed: ["Access Main Dashboard", "Create, Edit & Schedule Content", "Manage Team Members & Roles", "Configure Channels & Settings"],
    forbidden: ["Modify Subscription / Billing"]
  },
  workspace_manager: {
    title: "Workspace Manager",
    allowed: ["Access Main Dashboard", "Create, Edit & Schedule Content", "Manage Team Members & Roles", "Configure Channels & Settings"],
    forbidden: ["Modify Subscription / Billing"]
  },
  owner: {
    title: "Workspace Owner",
    allowed: ["Full Administrative Control", "Manage All Campaigns & Content", "Configure Social Channels & Integrations", "Configure Billing & Team Permissions"],
    forbidden: []
  }
}

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
    setActionLoading(true)
    try {
      if (status === "unauthenticated") {
        // Authenticate guest passwordlessly in the background
        const loginRes = await signIn("credentials", {
          email: inviteDetails?.invitedEmail,
          token: token,
          isInvite: "true",
          redirect: false,
        })
        
        if (loginRes?.error) {
          showToast(loginRes.error || "Failed to authenticate session.", "error")
          setActionLoading(false)
          return
        }
      }

      // Session is now established (or already existed). Accept invitation.
      const res = await fetch(`/api/workspaces/invitations/${token}`, {
        method: "POST",
      })

      if (res.ok) {
        const data = await res.json()
        showToast("You have successfully joined the team workspace.", "success")
        
        // Wait a small delay to ensure NextAuth session is fully synced client-side,
        // then redirect directly into the owner's workspace dashboard
        router.push(`/workspace/${inviteDetails?.workspaceId}`)
      } else {
        const err = await res.json()
        showToast(err.error || "An error occurred.", "error")
      }
    } catch (e) {
      console.error(e)
      showToast("An unexpected error occurred.", "error")
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
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background space-y-4 select-none">
        <Loader2 className="size-8 text-brand-green animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold">Validating invitation details...</p>
      </div>
    )
  }

  if (error) {
    const isExpired = error.toLowerCase().includes("expired")
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background select-none">
        <Card className="max-w-md w-full border border-border/80 rounded-2xl bg-card/60 backdrop-blur-xl text-center p-6 space-y-5 shadow-lg">
          <div className="size-14 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <XCircle className="size-6" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="font-extrabold text-foreground text-lg">
              {isExpired ? "This invitation has expired." : "Invitation Invalid"}
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary leading-normal max-w-xs mx-auto">
              {isExpired
                ? "This link is no longer valid because the 7-day acceptance window has passed. Please contact the workspace owner to request a new invitation."
                : error}
            </CardDescription>
          </div>
          <CardFooter className="p-0 flex flex-col gap-2">
            {isExpired ? (
              <Button onClick={() => router.push("/contact")} className="w-full bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-bold rounded-xl text-xs py-4 cursor-pointer border-0 shadow">
                Request New Invitation
              </Button>
            ) : (
              <Button onClick={() => router.push("/")} className="w-full bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-bold rounded-xl text-xs py-4 cursor-pointer border-0 shadow">
                Back to GrowWave Homepage
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    )
  }

  const isEmailMismatch = session && session.user?.email?.toLowerCase() !== inviteDetails?.invitedEmail?.toLowerCase()
  const roleInfo = rolePermissions[inviteDetails?.role?.toLowerCase() || "viewer"] || rolePermissions["viewer"]

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-tr from-[#FCFAF6] via-[#FAF9F5] to-[#F3F0E8] dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] select-none transition-colors duration-500">
      <Card className="max-w-lg w-full border border-border/80 rounded-3xl bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300">
        <CardHeader className="text-center pt-8 pb-4 space-y-4">
          <div className="size-16 bg-gradient-to-br from-brand-green/20 to-brand-green/5 dark:from-brand-green/30 dark:to-brand-green/10 text-brand-green rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Users className="size-7" />
          </div>
          <div className="space-y-2">
            <Badge className="bg-brand-green/10 hover:bg-brand-green/20 text-brand-green-dark dark:text-brand-green border border-brand-green/20 rounded-full font-extrabold text-[10px] tracking-widest uppercase px-3 py-1">
              Collaboration Invite
            </Badge>
            <CardTitle className="text-2xl font-black tracking-tight leading-tight text-foreground">
              Join {inviteDetails?.workspaceName}
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary max-w-sm mx-auto">
              You have been invited by <span className="font-extrabold text-foreground">{inviteDetails?.invitedBy}</span> to join their team workspace.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-8 pb-6">
          {/* Target account info banner */}
          <div className="rounded-2xl border border-border-light/60 dark:border-zinc-800/40 p-4 bg-muted/5 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-extrabold">Recipient Email</p>
              <p className="font-bold text-foreground truncate max-w-[240px]">{inviteDetails?.invitedEmail}</p>
            </div>
            <Badge className="bg-muted text-text-primary border border-border/50 rounded-lg font-bold text-[10px] px-2 py-0.5">
              Role: {roleInfo.title}
            </Badge>
          </div>

          {/* Dynamic Permissions Checklist */}
          <div className="space-y-3">
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-extrabold px-1">Permissions & Workspace Access</p>
            
            <div className="rounded-2xl border border-border-light/50 dark:border-zinc-800/30 p-4 bg-muted/10 space-y-4">
              {/* Allowed Perks */}
              {roleInfo.allowed.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-brand-green-dark dark:text-brand-green">
                    <CheckCircle2 className="size-3.5" />
                    <span>INCLUDED ACCESS</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                    {roleInfo.allowed.map((allow, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs text-text-primary">
                        <Check className="size-3.5 text-brand-green shrink-0 mt-0.5" />
                        <span className="leading-snug font-medium">{allow}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Separator if both list exist */}
              {roleInfo.allowed.length > 0 && roleInfo.forbidden.length > 0 && (
                <div className="border-t border-border-light/40 dark:border-zinc-850 my-1" />
              )}

              {/* Forbidden Perks */}
              {roleInfo.forbidden.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-text-secondary">
                    <Lock className="size-3.5" />
                    <span>RESTRICTED OPERATIONS</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                    {roleInfo.forbidden.map((forbid, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs text-text-secondary">
                        <XCircle className="size-3.5 text-text-secondary shrink-0 mt-0.5" />
                        <span className="leading-snug font-medium line-through decoration-text-secondary/40">{forbid}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Email mismatch Warning panel */}
          {isEmailMismatch && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-start gap-3 text-rose-500 text-xs">
              <ShieldCheck className="size-5 shrink-0 mt-0.5" />
              <div className="space-y-3 leading-tight flex-1">
                <div>
                  <p className="font-extrabold">Account Mismatch Detected</p>
                  <p className="text-[11px] text-rose-500/80 leading-normal mt-1">
                    You are currently logged in as <span className="font-extrabold">{session.user?.email}</span>. However, this invitation was sent to <span className="font-extrabold">{inviteDetails?.invitedEmail}</span>.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => signOut({ callbackUrl: window.location.pathname })}
                  className="h-8 text-[10px] font-black flex items-center gap-1.5 hover:bg-rose-500/10 text-rose-500 py-1 px-3 rounded-xl border border-rose-500/20 shadow-sm transition-colors"
                >
                  <LogOut className="size-3.5" />
                  Sign Out of Current Account
                </Button>
              </div>
            </div>
          )}

          {/* Passwordless Informative Disclaimer */}
          {status === "unauthenticated" && (
            <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 dark:border-blue-500/20 p-3 flex items-start gap-2 text-blue-600 dark:text-blue-400 text-[11px] leading-normal font-medium">
              <Info className="size-4 shrink-0 mt-0.5" />
              <p>
                No password required. Clicking "Accept & Collaborate" will automatically register and sign you in passwordlessly as <span className="font-extrabold">{inviteDetails?.invitedEmail}</span>.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-muted/10 dark:bg-muted/5 px-8 py-5 flex flex-col gap-3 border-t border-border/40 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            disabled={actionLoading}
            onClick={handleDeclineInvite}
            className="w-full text-xs font-bold rounded-xl text-muted-foreground hover:bg-muted py-5 cursor-pointer sm:w-auto px-5 transition-all"
          >
            Decline Invitation
          </Button>

          <Button
            disabled={actionLoading || !!isEmailMismatch}
            onClick={handleAcceptInvite}
            className="w-full bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-extrabold border-0 rounded-xl text-xs py-5 cursor-pointer shadow-md sm:w-auto px-6 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
          >
            {actionLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Accept & Collaborate</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
