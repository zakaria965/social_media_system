import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { ActivityLog } from "@/lib/models/activity"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { verifyMemberPermission } from "@/lib/workspaces"

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

    // 1. Verify dashboard or team permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "dashboard")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Fetch activity logs for this workspace
    const logs = await ActivityLog.find({ workspaceId }).sort({ createdAt: -1 }).limit(100).lean()

    // 3. Fetch workspace members to enrich activity logs with name/avatar
    const members = await WorkspaceMember.find({ workspaceId }).lean()
    const membersMap = new Map(members.map((m) => [m.email.toLowerCase(), m]))

    const enrichedLogs = logs.map((log) => {
      const member = membersMap.get(log.userId.toLowerCase())
      return {
        ...log,
        memberName: member ? member.name || member.email : log.userId,
        memberAvatar: member ? member.avatar : "",
        memberRole: member ? member.role : "member",
      }
    })

    return NextResponse.json({ logs: enrichedLogs })
  } catch (err: any) {
    console.error("GET /api/workspaces/[id]/activity error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
