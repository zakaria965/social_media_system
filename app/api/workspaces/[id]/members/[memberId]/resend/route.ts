import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { WorkspaceInvitation } from "@/lib/models/workspace-invitation"
import { verifyMemberPermission, logWorkspaceActivity } from "@/lib/workspaces"
import crypto from "crypto"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized. Please log in first" }, { status: 401 })
    }

    const { id: workspaceId, memberId } = await params
    await connectDB()

    // 1. Verify caller has team management permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "team")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Fetch the target invitation
    const invitation = await WorkspaceInvitation.findById(memberId)
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // 3. Generate a new token and update expiration
    const inviteToken = crypto.randomBytes(32).toString("hex")
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    invitation.inviteToken = inviteToken
    invitation.inviteExpiresAt = inviteExpiresAt
    invitation.invitedBy = session.user.email
    await invitation.save()

    // 4. Log Activity
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      "resend_invite",
      `Resent invitation to "${invitation.email}"`
    )

    return NextResponse.json({ success: true, invitation })
  } catch (err: any) {
    console.error("POST /api/workspaces/[id]/members/[memberId]/resend error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
