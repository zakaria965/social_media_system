"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ShieldAlert, LogOut, Building, ArrowRight } from "lucide-react"

interface Workspace {
  _id: string
  name: string
  ownerEmail: string
  createdAt: string
  updatedAt: string
}

interface Membership {
  workspaceId: string
  email: string
  role: string
  status: string
  customPermissions: string[]
}

interface WorkspaceContextType {
  activeWorkspace: Workspace | null
  workspaces: Workspace[]
  role: string
  permissions: string[]
  isLoading: boolean
  refetchWorkspaces: () => Promise<void>
  switchWorkspace: (id: string) => void
  createWorkspace: (name: string) => Promise<Workspace>
  deleteWorkspace: (id: string) => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

const staticPermissions: Record<string, string[]> = {
  owner: [
    "dashboard",
    "posts",
    "scheduling",
    "analytics",
    "ai-assistant",
    "media-library",
    "channels",
    "inbox",
    "team",
    "settings",
    "billing",
  ],
  admin: [
    "dashboard",
    "posts",
    "scheduling",
    "analytics",
    "ai-assistant",
    "media-library",
    "channels",
    "inbox",
    "team",
    "settings",
  ],
  editor: [
    "dashboard",
    "posts",
    "scheduling",
    "analytics",
    "ai-assistant",
    "media-library",
  ],
  viewer: [
    "dashboard",
    "analytics",
    "inbox",
  ],
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null)
  const [role, setRole] = useState<string>("viewer")
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSuspended, setIsSuspended] = useState(false)
  const [isRemoved, setIsRemoved] = useState(false)

  const fetchWorkspaces = useCallback(async () => {
    if (!session) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/workspaces")
      if (res.ok) {
        const data = await res.json()
        const wsList = data.workspaces || []
        const msList = data.memberships || []
        setWorkspaces(wsList)
        setMemberships(msList)

        if (wsList.length > 0) {
          // Check URL first, then localStorage, then fallback
          let targetId = null
          if (typeof window !== "undefined") {
            const match = window.location.pathname.match(/^\/workspace\/([a-fA-F0-9]{24})/)
            if (match) {
              targetId = match[1]
            }
          }
          if (!targetId) {
            targetId = localStorage.getItem("growwave-active-workspace-id")
          }
          const matched = wsList.find((w: Workspace) => w._id === targetId)
          const target = matched || wsList[0]
          
          setActiveWorkspace(target)
          localStorage.setItem("growwave-active-workspace-id", target._id)
          // Set cookie for API route handlers (accessible in Next.js backend)
          document.cookie = `growwave-active-workspace-id=${target._id}; path=/; max-age=31536000; SameSite=Lax`
        }
      }
    } catch (e) {
      console.error("Failed to load workspaces:", e)
    } finally {
      setIsLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (session) {
      fetchWorkspaces()
    } else {
      setWorkspaces([])
      setMemberships([])
      setActiveWorkspace(null)
      setIsLoading(false)
    }
  }, [session, fetchWorkspaces])

  // Sync permissions when activeWorkspace or memberships change
  useEffect(() => {
    if (!activeWorkspace) {
      setRole("viewer")
      setPermissions([])
      return
    }

    const membership = memberships.find((m) => m.workspaceId === activeWorkspace._id)
    if (!membership) {
      setRole("viewer")
      setPermissions([])
      return
    }

    if (membership.status === "suspended") {
      setIsSuspended(true)
    } else {
      setIsSuspended(false)
    }

    const currentRole = membership.role
    setRole(currentRole)

    // Calculate permissions matrix
    const resolvePermissions = async () => {
      let resolvedPerms: string[] = []

      if (staticPermissions[currentRole]) {
        resolvedPerms = [...staticPermissions[currentRole]]
      } else {
        // Custom Role: Fetch matrix from DB
        try {
          const res = await fetch(`/api/workspaces/${activeWorkspace._id}/custom-roles`)
          if (res.ok) {
            const data = await res.json()
            const match = data.customRoles?.find((r: any) => r.name === currentRole)
            if (match) {
              resolvedPerms = match.permissions || []
            }
          }
        } catch (e) {
          console.error("Failed to load custom role permissions:", e)
        }
      }

      // Add individual custom overrides
      if (membership.customPermissions) {
        membership.customPermissions.forEach((p) => {
          if (!resolvedPerms.includes(p)) {
            resolvedPerms.push(p)
          }
        })
      }

      setPermissions(resolvedPerms)
    }

    resolvePermissions()
  }, [activeWorkspace, memberships])

  // Establish SSE connection for real-time member & role updates
  useEffect(() => {
    if (!session?.user?.email) {
      setIsSuspended(false)
      setIsRemoved(false)
      return
    }

    const eventSource = new EventSource("/api/workspaces/sync")

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (!data || !data.event) return

        if (data.event === "member.role_changed") {
          if (activeWorkspace && data.workspaceId === activeWorkspace._id) {
            setRole(data.role)
            fetchWorkspaces()
          }
        } else if (data.event === "member.permissions_updated") {
          if (activeWorkspace && data.workspaceId === activeWorkspace._id) {
            fetchWorkspaces()
          }
        } else if (data.event === "member.suspended") {
          if (activeWorkspace && data.workspaceId === activeWorkspace._id) {
            setIsSuspended(true)
          }
        } else if (data.event === "member.activated") {
          if (activeWorkspace && data.workspaceId === activeWorkspace._id) {
            setIsSuspended(false)
          }
        } else if (data.event === "member.removed") {
          if (activeWorkspace && data.workspaceId === activeWorkspace._id) {
            setIsRemoved(true)
          }
        }
      } catch (e) {
        console.error("Error handling SSE message:", e)
      }
    }

    eventSource.onerror = (e) => {
      console.error("SSE connection error, closing.", e)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [session, activeWorkspace, fetchWorkspaces])

  const switchWorkspace = useCallback((id: string) => {
    const matched = workspaces.find((w) => w._id === id)
    if (matched) {
      setActiveWorkspace(matched)
      localStorage.setItem("growwave-active-workspace-id", id)
      document.cookie = `growwave-active-workspace-id=${id}; path=/; max-age=31536000; SameSite=Lax`
      router.push(`/workspace/${id}`)
    }
  }, [workspaces, router])

  const createWorkspace = async (name: string): Promise<Workspace> => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to create workspace")
      }
      const data = await res.json()
      await fetchWorkspaces()
      switchWorkspace(data.workspace._id)
      return data.workspace
    } catch (e: any) {
      console.error(e)
      throw e;
    } finally {
      setIsLoading(false)
    }
  }

  const deleteWorkspace = async (id: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to delete workspace")
      }
      localStorage.removeItem("growwave-active-workspace-id")
      await fetchWorkspaces()
    } catch (e: any) {
      console.error(e)
      throw e;
    } finally {
      setIsLoading(false)
    }
  }

  const refetchWorkspaces = async () => {
    await fetchWorkspaces()
  }

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        workspaces,
        role,
        permissions,
        isLoading,
        refetchWorkspaces,
        switchWorkspace,
        createWorkspace,
        deleteWorkspace,
      }}
    >
      {children}

      {isSuspended && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-md p-4 select-none animate-in fade-in duration-300">
          <div className="max-w-md w-full border border-border/80 rounded-3xl bg-card/90 dark:bg-zinc-900/90 shadow-2xl p-8 text-center space-y-6">
            <div className="size-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="size-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-black text-foreground tracking-tight">
                Access Denied
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Your access to this workspace has been suspended by the Workspace Owner.
                If you believe this is an error, please contact the Workspace Owner.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={activeWorkspace ? `mailto:${activeWorkspace.ownerEmail}?subject=GrowWave%20Workspace%20Suspension%20Inquiry` : "mailto:support@growwave.ai"}
                className="flex-1 inline-flex items-center justify-center bg-muted hover:bg-muted/80 text-text-primary font-bold rounded-xl text-xs py-4 cursor-pointer border border-border/50 shadow-sm transition-all"
              >
                Contact Owner
              </a>
              <button
                onClick={async () => {
                  await signOut({ callbackUrl: "/" })
                }}
                className="flex-1 inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs py-4 cursor-pointer border-0 shadow-md transition-all hover:scale-[1.02]"
              >
                <LogOut className="size-4 mr-1.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {isRemoved && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-md p-4 select-none animate-in fade-in duration-300">
          <div className="max-w-md w-full border border-border/80 rounded-3xl bg-card/90 dark:bg-zinc-900/90 shadow-2xl p-8 text-center space-y-6">
            <div className="size-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Building className="size-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-black text-foreground tracking-tight">
                Removed from Workspace
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                You have been removed from this workspace by the Workspace Owner.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  setIsRemoved(false)
                  router.push("/dashboard")
                }}
                className="w-full inline-flex items-center justify-center bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-extrabold rounded-xl text-xs py-4 cursor-pointer border-0 shadow-md transition-all hover:scale-[1.02]"
              >
                <span>Close & Switch Workspace</span>
                <ArrowRight className="size-4 ml-1.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}
