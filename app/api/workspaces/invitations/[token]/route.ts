import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/workspace"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { logWorkspaceActivity } from "@/lib/workspaces"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    await connectDB()

    const member = await WorkspaceMember.findOne({ inviteToken: token })
    if (!member) {
      return NextResponse.json({ error: "Invitation not found or invalid" }, { status: 404 })
    }

    if (member.inviteExpiresAt && member.inviteExpiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 })
    }

    const workspace = await Workspace.findById(member.workspaceId)
    if (!workspace) {
      return NextResponse.json({ error: "Workspace no longer exists" }, { status: 404 })
    }

    return NextResponse.json({
      workspaceName: workspace.name,
      invitedEmail: member.email,
      role: member.role,
      invitedBy: member.invitedBy,
      workspaceId: workspace._id,
    })
  } catch (err: any) {
    console.error("GET /api/workspaces/invitations/[token] error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized. Please log in first" }, { status: 401 })
    }

    const { token } = await params
    await connectDB()

    const member = await WorkspaceMember.findOne({ inviteToken: token })
    if (!member) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (member.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: `This invitation was sent to "${member.email}", but you are logged in as "${session.user.email}". Please log in with the correct email to accept` }, { status: 403 })
    }

    if (member.inviteExpiresAt && member.inviteExpiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 })
    }

    // Accept invitation
    member.status = "active"
    member.inviteToken = null // Clear invite token
    member.inviteExpiresAt = null
    member.joinedAt = new Date()
    member.lastActive = new Date()
    // Update user metadata if available
    if (session.user.name) member.name = session.user.name
    if (session.user.image) member.avatar = session.user.image
    await member.save()

    // Log Activity
    await logWorkspaceActivity(
      member.workspaceId,
      session.user.email,
      "accept_invite",
      `Joined workspace as "${member.role}"`
    )

    return NextResponse.json({ success: true, workspaceId: member.workspaceId })
  } catch (err: any) {
    console.error("POST /api/workspaces/invitations/[token] error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await params
    await connectDB()

    const member = await WorkspaceMember.findOne({ inviteToken: token })
    if (!member) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (member.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden: Email mismatch" }, { status: 403 })
    }

    // Decline invitation by marking as declined or removing entirely. Removing is cleaner.
    await WorkspaceMember.findByIdAndDelete(member._id)

    return NextResponse.json({ success: true, message: "Invitation successfully declined" })
  } catch (err: any) {
    console.error("DELETE /api/workspaces/invitations/[token] error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
