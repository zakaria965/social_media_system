import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/workspace"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { WorkspaceInvitation } from "@/lib/models/workspace-invitation"
import { verifyMemberPermission, logWorkspaceActivity } from "@/lib/workspaces"
import crypto from "crypto"

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

    // 1. Verify that the caller is a member of the workspace
    const check = await verifyMemberPermission(session.user.email, workspaceId, "team")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Fetch all active members and pending invitations
    const activeMembers = await WorkspaceMember.find({ workspaceId }).sort({ role: 1, name: 1 }).lean()
    const pendingInvites = await WorkspaceInvitation.find({ workspaceId }).sort({ createdAt: -1 }).lean()

    const members = [
      ...activeMembers.map(m => ({ ...m, status: "active" })),
      ...pendingInvites.map(i => ({
        _id: i._id.toString(),
        workspaceId: i.workspaceId.toString(),
        email: i.email,
        role: i.role,
        status: "pending",
        invitedBy: i.invitedBy,
        inviteToken: i.inviteToken,
        inviteExpiresAt: i.inviteExpiresAt,
        customPermissions: i.customPermissions,
        createdAt: i.createdAt,
        name: i.email.split("@")[0]
      }))
    ]

    return NextResponse.json({ members })
  } catch (err: any) {
    console.error("GET /api/workspaces/[id]/members error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: workspaceId } = await params
    const body = await request.json()
    const { email, role, customPermissions } = body

    if (!email?.trim() || !role?.trim()) {
      return NextResponse.json({ error: "Email and Role are required" }, { status: 400 })
    }

    await connectDB()

    // 1. Verify team-management permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "team")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Verify that the user isn't already a member of the workspace
    const existingMember = await WorkspaceMember.findOne({ workspaceId, email: email.trim().toLowerCase() })
    if (existingMember) {
      return NextResponse.json({ error: "User is already an active member of this workspace" }, { status: 400 })
    }

    const existingInvite = await WorkspaceInvitation.findOne({ workspaceId, email: email.trim().toLowerCase() })

    // 3. Generate secure invite token and details
    const inviteToken = crypto.randomBytes(32).toString("hex")
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    let member
    if (existingInvite) {
      existingInvite.role = role
      existingInvite.inviteToken = inviteToken
      existingInvite.inviteExpiresAt = inviteExpiresAt
      existingInvite.invitedBy = session.user.email
      existingInvite.customPermissions = customPermissions || []
      await existingInvite.save()
      member = existingInvite
    } else {
      member = await WorkspaceInvitation.create({
        workspaceId,
        email: email.trim().toLowerCase(),
        role,
        inviteToken,
        inviteExpiresAt,
        invitedBy: session.user.email,
        customPermissions: customPermissions || [],
      })
    }

    // 4. Log Activity
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      "invite_user",
      `Invited user "${email}" as "${role}"`
    )

    return NextResponse.json({ member }, { status: 201 })
  } catch (err: any) {
    console.error("POST /api/workspaces/[id]/members error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
