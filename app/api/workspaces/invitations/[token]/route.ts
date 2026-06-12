import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/workspace"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { WorkspaceInvitation } from "@/lib/models/workspace-invitation"
import { logWorkspaceActivity } from "@/lib/workspaces"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    await connectDB()

    const invitation = await WorkspaceInvitation.findOne({ inviteToken: token })
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found or invalid" }, { status: 404 })
    }

    if (invitation.inviteExpiresAt && invitation.inviteExpiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 })
    }

    const workspace = await Workspace.findById(invitation.workspaceId)
    if (!workspace) {
      return NextResponse.json({ error: "Workspace no longer exists" }, { status: 404 })
    }

    return NextResponse.json({
      workspaceName: workspace.name,
      invitedEmail: invitation.email,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
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

    const invitation = await WorkspaceInvitation.findOne({ inviteToken: token })
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: `This invitation was sent to "${invitation.email}", but you are logged in as "${session.user.email}". Please log in with the correct email to accept` }, { status: 403 })
    }

    if (invitation.inviteExpiresAt && invitation.inviteExpiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 })
    }

    // Accept invitation: Create entry in WorkspaceMember (team_members) and delete invitation
    await WorkspaceMember.create({
      workspaceId: invitation.workspaceId,
      email: invitation.email.toLowerCase(),
      name: session.user.name || invitation.email.split("@")[0],
      avatar: session.user.image || "",
      role: invitation.role,
      status: "active",
      joinedAt: new Date(),
      lastActive: new Date(),
      customPermissions: invitation.customPermissions || [],
    })

    await WorkspaceInvitation.findByIdAndDelete(invitation._id)

    // Log Activity
    await logWorkspaceActivity(
      invitation.workspaceId,
      session.user.email,
      "accept_invite",
      `Joined workspace as "${invitation.role}"`
    )

    return NextResponse.json({ success: true, workspaceId: invitation.workspaceId })
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

    const invitation = await WorkspaceInvitation.findOne({ inviteToken: token })
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden: Email mismatch" }, { status: 403 })
    }

    // Decline invitation by deleting it
    await WorkspaceInvitation.findByIdAndDelete(invitation._id)

    return NextResponse.json({ success: true, message: "Invitation successfully declined" })
  } catch (err: any) {
    console.error("DELETE /api/workspaces/invitations/[token] error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
