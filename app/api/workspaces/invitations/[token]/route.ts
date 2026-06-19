import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/workspace"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { WorkspaceInvitation } from "@/lib/models/workspace-invitation"
import { logWorkspaceActivity } from "@/lib/workspaces"
import { AuditLog } from "@/lib/models/audit-log"

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

    // 1. Prevent duplicate acceptance
    const existingMember = await WorkspaceMember.findOne({
      workspaceId: invitation.workspaceId,
      email: invitation.email.toLowerCase()
    })
    if (existingMember) {
      // Clean up the invitation to prevent token reuse
      await WorkspaceInvitation.findByIdAndDelete(invitation._id)
      return NextResponse.json({ error: "You are already a member of this workspace" }, { status: 400 })
    }

    // 2. Fetch the workspace details
    const workspace = await Workspace.findById(invitation.workspaceId)
    if (!workspace) {
      return NextResponse.json({ error: "Workspace no longer exists" }, { status: 404 })
    }

    // 3. Create entry in WorkspaceMember (team_members)
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

    // 4. Delete invitation
    await WorkspaceInvitation.findByIdAndDelete(invitation._id)

    // 5. Create notification for the workspace owner
    if (workspace.ownerEmail) {
      const { Notification } = await import("@/lib/models/notification")
      const joinerName = session.user.name || invitation.email.split("@")[0]
      await Notification.create({
        userId: workspace.ownerEmail.toLowerCase(),
        title: "New Team Member Joined",
        message: `${joinerName} joined your workspace as ${invitation.role}.`,
        type: "success",
      })
    }

    // 6. Log Activity
    await logWorkspaceActivity(
      invitation.workspaceId,
      session.user.email,
      "invite_accepted",
      `Joined workspace as "${invitation.role}"`
    )

    // Log to AuditLog
    await AuditLog.create({
      action: "Invitation Accepted",
      actor: session.user.email,
      resource: "team_management",
      workspaceId: invitation.workspaceId,
      targetEmail: invitation.email.toLowerCase(),
      details: `Accepted invitation to join workspace as "${invitation.role}"`,
    })

    await AuditLog.create({
      action: "Member Joined",
      actor: session.user.email,
      resource: "team_management",
      workspaceId: invitation.workspaceId,
      targetEmail: invitation.email.toLowerCase(),
      details: `Joined workspace as "${invitation.role}"`,
    })

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

    // Log Activity
    await logWorkspaceActivity(
      invitation.workspaceId,
      session.user.email,
      "invite_declined",
      `Declined invitation to join workspace`
    )

    // Decline invitation by deleting it
    await WorkspaceInvitation.findByIdAndDelete(invitation._id)

    return NextResponse.json({ success: true, message: "Invitation successfully declined" })
  } catch (err: any) {
    console.error("DELETE /api/workspaces/invitations/[token] error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
