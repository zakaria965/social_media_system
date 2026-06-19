import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { verifyMemberPermission, getActiveWorkspaceId } from "@/lib/workspaces"

/**
 * Reusable server-side permission guard for API routes.
 * Verifies session, resolves workspace, and checks permission.
 *
 * Returns either the resolved context or a NextResponse error.
 */
export async function requirePermission(
  requiredPermission: string,
  request?: any
): Promise<
  | { session: any; workspaceId: string; member: any; role: string }
  | NextResponse
> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectDB()

  const workspaceId = await getActiveWorkspaceId(session.user.email, request)
  if (!workspaceId) {
    return NextResponse.json(
      { error: "No active workspace found" },
      { status: 400 }
    )
  }

  const check = await verifyMemberPermission(
    session.user.email,
    workspaceId,
    requiredPermission
  )

  if (!check.allowed) {
    return NextResponse.json(
      { error: check.error || `Forbidden: Insufficient permissions for "${requiredPermission}"` },
      { status: 403 }
    )
  }

  return {
    session,
    workspaceId,
    member: check.member,
    role: check.role || "viewer",
  }
}
