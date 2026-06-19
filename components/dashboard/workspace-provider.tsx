"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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
