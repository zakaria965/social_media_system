import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { verifyMemberPermission, getWorkspaceStats } from "@/lib/workspaces"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: workspaceId } = await params
    await connectDB()

    // 1. Verify caller has analytics permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "analytics")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Fetch stats
    const stats = await getWorkspaceStats(workspaceId)

    return NextResponse.json({ stats })
  } catch (err: any) {
    console.error("GET /api/workspaces/[id]/analytics error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
