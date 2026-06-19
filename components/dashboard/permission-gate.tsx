"use client"

import { useWorkspace } from "@/components/dashboard/workspace-provider"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface PermissionGateProps {
  permission: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Client-side permission gate. Checks if the current user's workspace
 * permissions include the required permission. If not, renders a
 * professional "Access Denied" card or the provided fallback.
 */
export function PermissionGate({ permission, fallback, children }: PermissionGateProps) {
  const { permissions, role, activeWorkspace, isLoading } = useWorkspace()
  const router = useRouter()

  // While loading workspace context, show nothing to prevent flicker
  if (isLoading) {
    return null
  }

  // Workspace Owner always has full access
  const isOwner = ["owner", "Workspace Owner"].includes(role)
  const hasPermission = isOwner || permissions.includes(permission)

  if (hasPermission) {
    return <>{children}</>
  }

  // Render fallback or default access denied UI
  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="flex h-[70vh] flex-col items-center justify-center text-center space-y-5 select-none">
      <div className="size-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner">
        <ShieldAlert className="size-7" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg font-extrabold text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your role{" "}
          <span className="font-bold text-foreground">
            {role || "Unknown"}
          </span>{" "}
          in{" "}
          <span className="font-bold text-foreground">
            {activeWorkspace?.name || "this workspace"}
          </span>{" "}
          does not include access to this page. Contact the workspace owner to request additional permissions.
        </p>
      </div>
      <Button
        onClick={() => router.push("/dashboard")}
        variant="outline"
        className="rounded-xl text-xs font-bold py-4 px-5 gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="size-3.5" />
        Back to Dashboard
      </Button>
    </div>
  )
}
